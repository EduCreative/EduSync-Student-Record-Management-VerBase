import React, { useState, useEffect } from 'react';
import { FeeHead } from '../../types';
import Modal from '../common/Modal';

interface FeeHeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (feeHead: Omit<FeeHead, 'id' | 'schoolId'> | FeeHead) => Promise<void>;
    feeHeadToEdit: FeeHead | null;
}

const FeeHeadFormModal: React.FC<FeeHeadFormModalProps> = ({ isOpen, onClose, onSave, feeHeadToEdit }) => {
    const getInitialState = () => ({
        name: feeHeadToEdit?.name || '',
        defaultAmount: feeHeadToEdit?.defaultAmount || 0,
    });

    const [formData, setFormData] = useState(getInitialState());
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialState());
            setError('');
        }
    }, [isOpen, feeHeadToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.name.trim()) {
            setError('Fee head name is required.');
            return;
        }
        if (formData.defaultAmount < 0) {
            setError('Default amount cannot be negative.');
            return;
        }

        setIsSaving(true);
        try {
            const saveOperation = feeHeadToEdit
                ? onSave({ ...feeHeadToEdit, ...formData })
                : onSave(formData);
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Request timed out after 15 seconds. Please try again.")), 15000)
            );

            await Promise.race([saveOperation, timeoutPromise]);
            onClose();
        } catch (error: any) {
            console.error("Failed to save fee head:", error);
            setError(error.message || 'An unknown error occurred. Please try again.');
        } finally {
            setIsSaving(false);
        }
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
                    <button type="submit" className="btn-primary" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Fee Head'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default FeeHeadFormModal;