import React, { useState } from 'react';
import Modal from './Modal';
import { useToast } from '../../context/ToastContext';
import { parseCsv, exportToCsv } from '../../utils/csvHelper';
import { DownloadIcon } from '../../constants';

interface ImportModalProps<T> {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: T[]) => Promise<void>;
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
    const [error, setError] = useState('');
    const { showToast } = useToast();

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

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const { data: parsedData, errors: parseErrors } = parseCsv(text);

                if (parsedData.length === 0) {
                    if (parseErrors.length > 0) {
                        // If there are parsing errors but no data, it means all rows failed.
                        throw new Error(`Import failed. All data rows were invalid. First error: ${parseErrors[0]}`);
                    }
                    // This covers empty file, or file with only headers.
                    throw new Error('CSV file is empty or contains no valid data rows.');
                }
                
                // Validate headers
                const fileHeaders = Object.keys(parsedData[0]);
                const missingHeaders = requiredHeaders.filter(h => !fileHeaders.includes(h));
                if (missingHeaders.length > 0) {
                     throw new Error(`CSV is missing required headers: ${missingHeaders.join(', ')}`);
                }

                if (parseErrors.length > 0) {
                    showToast('Import Warning', `${parseErrors.length} row(s) were skipped due to formatting errors. Please check the console for details.`, 'info');
                    console.warn("CSV Import Skipped Rows:", parseErrors);
                }

                const importPromise = onImport(parsedData as T[]);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Import operation timed out after 60 seconds. Please check your network or file size.")), 60000)
                );

                await Promise.race([importPromise, timeoutPromise]);
                onClose();

            } catch (err: any) {
                setError(err.message || 'Failed to parse CSV file.');
                showToast('Import Error', err.message, 'error');
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Import ${fileName}`}>
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
                    <label htmlFor="csv-file-input" className="input-label">
                        Upload CSV File
                    </label>
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
                    <button
                        onClick={handleImportClick}
                        disabled={!file || isImporting}
                        className="btn-primary"
                    >
                        {isImporting ? 'Importing...' : 'Process Import'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ImportModal;