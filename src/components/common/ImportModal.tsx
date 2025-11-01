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

interface InvalidRecord<T> {
  record: T;
  reason: string;
  rowNum: number;
}

interface ValidationResult<T> {
  validRecords: T[];
  invalidRecords: InvalidRecord<T>[];
}


interface ImportModalProps<T> {
    isOpen: boolean;
    onClose: () => void;
    onValidate: (data: T[]) => Promise<ValidationResult<T>>;
    onImport: (data: T[], progressCallback: (progress: ImportProgress) => void) => Promise<void>;
    sampleData: T[];
    fileName: string;
    requiredHeaders: string[];
}

const ImportModal = <T extends Record<string, any>>({
    isOpen,
    onClose,
    onValidate,
    onImport,
    sampleData,
    fileName,
    requiredHeaders,
}: ImportModalProps<T>) => {
    const [stage, setStage] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<ImportProgress | null>(null);
    const [previewData, setPreviewData] = useState<ValidationResult<T> | null>(null);
    const [error, setError] = useState('');
    const { showToast } = useToast();
    
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setFile(null);
                setProgress(null);
                setPreviewData(null);
                setError('');
                setIsProcessing(false);
                setStage('upload');
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

    const handleProcessClick = async () => {
        if (!file) {
            setError('Please select a CSV file to import.');
            return;
        }

        setIsProcessing(true);
        setError('');
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const { data: parsedData, errors: parseErrors } = parseCsv(text);
                
                if (parsedData.length === 0 && parseErrors.length === 0) {
                    throw new Error('CSV file is empty or contains no valid data rows.');
                }
                
                const fileHeaders = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
                const missingHeaders = requiredHeaders.filter(h => !fileHeaders.includes(h));
                if (missingHeaders.length > 0) {
                     throw new Error(`CSV is missing required headers: ${missingHeaders.join(', ')}`);
                }

                const validationResult = await onValidate(parsedData as T[]);
                
                // Add parsing errors to validation errors
                parseErrors.forEach((err, i) => {
                    validationResult.invalidRecords.push({
                        record: {} as T,
                        reason: err,
                        rowNum: i + 2,
                    });
                });

                setPreviewData(validationResult);
                setStage('preview');
            } catch (err: any) {
                setError(err.message || 'Failed to process CSV file.');
                showToast('Import Error', err.message, 'error');
            } finally {
                setIsProcessing(false);
            }
        };
        reader.onerror = () => {
             setError('Failed to read the file.');
             setIsProcessing(false);
        };
        reader.readAsText(file);
    };

    const handleConfirmImport = async () => {
        if (!previewData?.validRecords) return;

        setIsProcessing(true);
        setStage('importing');
        setProgress({ processed: 0, total: previewData.validRecords.length, errors: [] });

        try {
            await onImport(previewData.validRecords, (update) => {
                setProgress(prev => ({
                    ...prev!,
                    ...update,
                    errors: [...(prev?.errors || []), ...update.errors]
                }));
            });
            showToast('Success', 'Import process completed.', 'success');
        } catch (err: any) {
            setError(err.message);
            showToast('Import Error', err.message, 'error');
            setStage('preview'); // Go back to preview on failure
        } finally {
            setIsProcessing(false);
            setStage('complete');
        }
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
                    id="csv-file-input" type="file" accept=".csv" onChange={handleFileChange}
                    className="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end space-x-3 pt-2">
                <button onClick={onClose} className="btn-secondary">Cancel</button>
                <button onClick={handleProcessClick} disabled={!file || isProcessing} className="btn-primary">
                    {isProcessing ? 'Processing...' : 'Process & Preview'}
                </button>
            </div>
        </div>
    );

    const renderPreviewView = () => {
        if (!previewData) return null;
        const { validRecords, invalidRecords } = previewData;
        const sampleValid = validRecords.slice(0, 3);
        const headers = sampleValid.length > 0 ? Object.keys(sampleValid[0]).slice(0, 5) : [];

        return (
            <div className="space-y-4">
                <div className="p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg text-center">
                    <p className="text-lg font-semibold">
                        <span className="text-green-600">{validRecords.length}</span> valid records found.
                    </p>
                    <p className="text-sm">
                        <span className="text-red-600">{invalidRecords.length}</span> records have errors and will be skipped.
                    </p>
                </div>
                
                {sampleValid.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Data Preview (first {sampleValid.length} valid records)</h4>
                        <div className="overflow-x-auto border rounded-md dark:border-secondary-600">
                            <table className="w-full text-xs">
                                <thead className="bg-secondary-100 dark:bg-secondary-700">
                                    <tr>{headers.map(h => <th key={h} className="p-2 text-left">{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {sampleValid.map((row, i) => (
                                        <tr key={i} className="border-t dark:border-secondary-600">
                                            {headers.map(h => <td key={h} className="p-2 truncate max-w-xs">{String(row[h])}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {invalidRecords.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-red-600 text-sm mb-2">Skipped Records ({invalidRecords.length})</h4>
                        <ul className="text-xs list-disc list-inside max-h-32 overflow-y-auto bg-red-50 dark:bg-red-900/50 p-2 rounded-md space-y-1">
                            {invalidRecords.map((err, i) => <li key={i}><strong>Row {err.rowNum}:</strong> {err.reason}</li>)}
                        </ul>
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleConfirmImport} disabled={validRecords.length === 0} className="btn-primary">
                        Confirm Import ({validRecords.length})
                    </button>
                </div>
            </div>
        );
    };
    
    const renderProgressView = () => {
        if (!progress) return null;
        const percentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;
        const isComplete = !isProcessing && stage === 'complete';
        return (
            <div className="space-y-4">
                <h3 className="font-semibold">{isComplete ? 'Import Complete' : 'Importing...'}</h3>
                <div className="w-full bg-secondary-200 rounded-full h-2.5 dark:bg-secondary-700">
                    <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" style={{width: `${percentage}%`}}></div>
                </div>
                <p className="text-sm text-center">Processed {progress.processed} of {progress.total} records.</p>
                
                <div className="flex justify-end pt-2">
                    {isProcessing ? (
                        <span className="text-sm italic text-secondary-500">Please wait.</span>
                    ) : (
                        <button onClick={onClose} className="btn-primary">Done</button>
                    )}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (stage) {
            case 'upload':
                return renderUploadView();
            case 'preview':
                return renderPreviewView();
            case 'importing':
            case 'complete':
                return renderProgressView();
            default:
                return null;
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={isProcessing ? () => {} : onClose} title={`Import ${fileName}`}>
            {renderContent()}
        </Modal>
    );
};

export default ImportModal;
