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
                const parsedData = parseCsv(text);

                if (parsedData.length === 0) {
                    throw new Error('CSV file is empty or invalid.');
                }
                
                // Validate headers
                const fileHeaders = Object.keys(parsedData[0]);
                const missingHeaders = requiredHeaders.filter(h => !fileHeaders.includes(h));
                if (missingHeaders.length > 0) {
                     throw new Error(`CSV is missing required headers: ${missingHeaders.join(', ')}`);
                }

                await onImport(parsedData as T[]);
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
                    <label htmlFor="csv-file-input" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
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
                        className="btn-primary disabled:opacity-50"
                    >
                        {isImporting ? 'Importing...' : 'Process Import'}
                    </button>
                </div>
            </div>
            <style>{`
                .btn-primary { @apply px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg; }
                .btn-secondary { @apply px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg; }
            `}</style>
        </Modal>
    );
};

export default ImportModal;