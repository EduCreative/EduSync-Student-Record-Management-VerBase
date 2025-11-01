import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useToast } from '../../context/ToastContext';
import { parseCsv, exportToCsv } from '../../utils/csvHelper';
import { DownloadIcon } from '../../constants';

interface ImportProgress {
    processed: number;
    total: number;
    errors: string[];
}

interface ImportModalProps<T> {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: T[], progressCallback: (progress: ImportProgress) => void) => Promise<void>;
    sampleData: T[];
    fileName: string;
    requiredHeaders: string[];
}

const ImportModal = <T extends Record<string, any>>({
    isOpen,
    onClose,
    onImport,
    sampleData,
    fileName,
    requiredHeaders,
}: ImportModalProps<T>) => {
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState<ImportProgress | null>(null);
    const [error, setError] = useState('');
    const { showToast } = useToast();
    
    // Reset state when modal is opened/closed
    useEffect(() => {
        if (!isOpen) {
            // Delay reset to allow for closing animation
            setTimeout(() => {
                setFile(null);
                setProgress(null);
                setError('');
                setIsImporting(false);
            }, 300);
        }
    }, [isOpen]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
        }
    };
    
    const handleDownloadSample = () => {
        exportToCsv(sampleData, `sample_${fileName}`);
    };

    const handleImportClick = async () => {
        if (!file) {
            setError('Please select a CSV file to import.');
            return;
        }

        setIsImporting(true);
        setError('');
        setProgress({ processed: 0, total: 0, errors: [] });

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const { data: parsedData, errors: parseErrors } = parseCsv(text);
                
                const combinedErrors = [...parseErrors];

                if (parsedData.length === 0 && parseErrors.length === 0) {
                    throw new Error('CSV file is empty or contains no valid data rows.');
                }
                
                const fileHeaders = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
                const missingHeaders = requiredHeaders.filter(h => !fileHeaders.includes(h));
                if (missingHeaders.length > 0) {
                     throw new Error(`CSV is missing required headers: ${missingHeaders.join(', ')}`);
                }
                
                if (parseErrors.length > 0) {
                    setProgress(p => ({...p!, errors: combinedErrors}));
                }

                await onImport(parsedData as T[], (update) => {
                    setProgress(prev => ({
                        ...prev!,
                        ...update,
                        errors: [...(prev?.errors || []), ...update.errors]
                    }));
                });

                showToast('Success', 'Import process completed.', 'success');
            } catch (err: any) {
                setError(err.message || 'Failed to process CSV file.');
                showToast('Import Error', err.message, 'error');
                setProgress(null); // Go back to upload state on critical error
            } finally {
                setIsImporting(false);
            }
        };
        reader.onerror = () => {
             setError('Failed to read the file.');
             setIsImporting(false);
        };
        reader.readAsText(file);
    };

    const renderUploadView = () => (
        <div className="space-y-4">
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Upload a CSV file to bulk-add new {fileName}. The file must match the structure of the sample template.
            </p>
            <div>
                <button 
                    onClick={handleDownloadSample}
                    className="w-full flex items-center justify-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/50 hover:bg-primary-100 dark:hover:bg-primary-900 rounded-lg p-3"
                >
                    <DownloadIcon className="w-4 h-4" />
                    Download Sample Template
                </button>
            </div>
            <div>
                <label htmlFor="csv-file-input" className="input-label">Upload CSV File</label>
                <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end space-x-3 pt-2">
                <button onClick={onClose} className="btn-secondary">Cancel</button>
                <button onClick={handleImportClick} disabled={!file || isImporting} className="btn-primary">
                    {isImporting ? 'Processing...' : 'Process Import'}
                </button>
            </div>
        </div>
    );
    
    const renderProgressView = () => {
        if (!progress) return null;
        const percentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;
        return (
            <div className="space-y-4">
                <h3 className="font-semibold">Import Progress</h3>
                <div className="w-full bg-secondary-200 rounded-full h-2.5 dark:bg-secondary-700">
                    <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" style={{width: `${percentage}%`}}></div>
                </div>
                <p className="text-sm text-center">Processed {progress.processed} of {progress.total} records.</p>
                {progress.errors.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-red-600">Errors ({progress.errors.length} skipped):</h4>
                        <ul className="text-xs text-red-500 list-disc list-inside max-h-32 overflow-y-auto bg-red-50 dark:bg-red-900/50 p-2 rounded-md">
                            {progress.errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                )}
                <div className="flex justify-end pt-2">
                    {isImporting ? (
                        <span className="text-sm italic text-secondary-500">Importing... please wait.</span>
                    ) : (
                        <button onClick={onClose} className="btn-primary">Done</button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={isImporting ? () => {} : onClose} title={progress ? 'Importing...' : `Import ${fileName}`}>
            {isImporting || progress ? renderProgressView() : renderUploadView()}
        </Modal>
    );
};

export default ImportModal;