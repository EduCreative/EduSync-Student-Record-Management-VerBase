import React, { useState, useEffect } from 'react';
import { FeeHead } from '../../types';
import Modal from '../users/Modal';
import { useAuth } from '../../context/AuthContext';

interface FeeHeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: FeeHead | Omit<FeeHead, 'id'>) => void;
    feeHeadToEdit?: FeeHead | null;
}

const FeeHeadFormModal: React.FC<FeeHeadFormModalProps> = ({ isOpen, onClose, onSave, feeHeadToEdit }) => {
    const { user: currentUser } = useAuth();
    const [formData, setFormData] = useState({ name: '', defaultAmount: '' });
    const [errors, setErrors] = useState<{ name?: string; defaultAmount?: string }>({});
    
    useEffect(() => {
        if (isOpen) {
            if (feeHeadToEdit) {
                setFormData({ name: feeHeadToEdit.name, defaultAmount: String(feeHeadToEdit.defaultAmount) });
            } else {
                setFormData({ name: '', defaultAmount: '' });
            }
            setErrors({});
        }
    }, [feeHeadToEdit, isOpen]);

    const validate = () => {
        const newErrors: { name?: string; defaultAmount?: string } = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Fee head name is required.';
        }
        
        const amount = Number(formData.defaultAmount);
        if (formData.defaultAmount.trim() === '') {
             newErrors.defaultAmount = 'Default amount is required.';
        } else if (isNaN(amount) || amount < 0) {
            newErrors.defaultAmount = 'Please enter a valid, non-negative amount.';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof typeof errors];
                return newErrors;
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate() || !currentUser) return;
        
        const saveData = {
            name: formData.name,
            defaultAmount: Number(formData.defaultAmount),
            schoolId: currentUser.schoolId,
        };

        if (feeHeadToEdit) {
            onSave({ ...feeHeadToEdit, ...saveData });
        } else {
            onSave(saveData);
        }
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={feeHeadToEdit ? 'Edit Fee Head' : 'Add Fee Head'}>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Name</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full input-style mt-1" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="defaultAmount" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Default Amount (Rs.)</label>
                    <input type="number" name="defaultAmount" id="defaultAmount" value={formData.defaultAmount} onChange={handleChange} className="w-full input-style mt-1" />
                    {errors.defaultAmount && <p className="text-red-500 text-xs mt-1">{errors.defaultAmount}</p>}
                </div>
                 <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg">Save</button>
                </div>
            </form>
             <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid #d1d5db; padding: .5rem .75rem; background-color: #f9fafb; } .dark .input-style { background-color: #374151; border-color: #4b5563; color: white; }`}</style>
        </Modal>
    );
};

export default FeeHeadFormModal;