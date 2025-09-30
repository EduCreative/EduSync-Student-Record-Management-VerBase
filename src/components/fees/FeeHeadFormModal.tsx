import React, { useState, useEffect } from 'react';
import { FeeHead } from '../../types';
import Modal from '../common/Modal';

interface FeeHeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (feeHead: Omit<FeeHead, 'id'> | FeeHead) => void;
    feeHeadToEdit: FeeHead | null;
}

const FeeHeadFormModal: React.FC<FeeHeadFormModalProps> = ({ isOpen, onClose, onSave, feeHeadToEdit }) => {
    const getInitialState = () => ({
        name: feeHeadToEdit?.name || '',
        defaultAmount: feeHeadToEdit?.defaultAmount || 0,
    });

    const [formData, setFormData] = useState(getInitialState());
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialState());
            setError('');
        }
    }, [isOpen, feeHeadToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Fee head name is required.');
            return;
        }
        if (formData.defaultAmount < 0) {
            setError('Default amount cannot be negative.');
            return;
        }

        if (feeHeadToEdit) {
            onSave({ ...feeHeadToEdit, ...formData });
        } else {
            onSave(formData);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={feeHeadToEdit ? 'Edit Fee Head' : 'Add New Fee Head'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="input-label">Fee Head Name</label>
                    <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        className="input-field"
                        placeholder="e.g., Tuition Fee"
                        required
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
                <div>
                    <label htmlFor="defaultAmount" className="input-label">Default Amount</label>
                    <input
                        type="number"
                        id="defaultAmount"
                        value={formData.defaultAmount}
                        onChange={e => setFormData(p => ({ ...p, defaultAmount: Number(e.target.value) }))}
                        className="input-field"
                        required
                    />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Save Fee Head</button>
                </div>
            </form>
             <style>{`
                .input-label { @apply block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1; }
                .input-field { @apply w-full p-2 border rounded-md bg-secondary-50 text-secondary-900 dark:bg-secondary-700 dark:border-secondary-600 dark:text-secondary-200 placeholder:text-secondary-400 dark:placeholder:text-secondary-500; }
                .btn-primary { @apply px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg; }
                .btn-secondary { @apply px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg; }
            `}</style>
        </Modal>
    );
};

export default FeeHeadFormModal;
