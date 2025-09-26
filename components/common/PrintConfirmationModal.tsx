import React from 'react';
import Modal from '../users/Modal';
import { PrinterIcon } from '../../constants';

interface PrintConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const PrintConfirmationModal: React.FC<PrintConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
    
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Prepare to Print">
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900">
                    <PrinterIcon className="h-6 w-6 text-primary-600 dark:text-primary-300" />
                </div>
                <h3 className="text-lg leading-6 font-medium text-secondary-900 dark:text-white mt-4">
                    Document Ready
                </h3>
                <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">
                        Your document is ready. The browser's print dialog will open next. From there, you can select your printer or choose "Save as PDF".
                    </p>
                </div>
                <div className="items-center px-4 py-3">
                    <div className="flex justify-center space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg focus:outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            id="confirm-print-button"
                            onClick={handleConfirm}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg focus:outline-none"
                        >
                            Continue to Print
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default PrintConfirmationModal;
