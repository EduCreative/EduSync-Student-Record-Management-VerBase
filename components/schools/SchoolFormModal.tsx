
import React, { useState, useEffect } from 'react';
import { School } from '../../types';
import Modal from '../users/Modal';
import LogoUpload from '../common/LogoUpload';

interface SchoolFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (school: School | Omit<School, 'id'>) => void;
    schoolToEdit?: School | null;
}

const SchoolFormModal: React.FC<SchoolFormModalProps> = ({ isOpen, onClose, onSave, schoolToEdit }) => {
    const [formData, setFormData] = useState({ name: '', address: '', logoUrl: null as string | null | undefined });
    const [errors, setErrors] = useState<{ name?: string; address?: string }>({});

    useEffect(() => {
        if (isOpen) {
            if (schoolToEdit) {
                setFormData({ name: schoolToEdit.name, address: schoolToEdit.address, logoUrl: schoolToEdit.logoUrl });
            } else {
                setFormData({ name: '', address: '', logoUrl: null });
            }
            setErrors({});
        }
    }, [schoolToEdit, isOpen]);

    const validate = () => {
        const newErrors: { name?: string; address?: string } = {};
        if (!formData.name.trim()) newErrors.name = 'School Name is required.';
        if (!formData.address.trim()) newErrors.address = 'Address is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };
    
    const handleLogoChange = (newLogoUrl: string | null) => {
        setFormData(prev => ({ ...prev, logoUrl: newLogoUrl }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            if (schoolToEdit) {
                onSave({ ...schoolToEdit, ...formData });
            } else {
                onSave(formData);
            }
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={schoolToEdit ? 'Edit School' : 'Add New School'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <LogoUpload logoUrl={formData.logoUrl} onChange={handleLogoChange} />
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">School Name</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full input-style" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Address</label>
                    <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="w-full input-style" />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-600 dark:hover:bg-secondary-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg">Save School</button>
                </div>
            </form>
             <style>{`
                .input-style {
                    background-color: #f9fafb;
                    border: 1px solid #d1d5db;
                    border-radius: 0.5rem;
                    display: block;
                    width: 100%;
                    padding: 0.625rem;
                }
                .dark .input-style {
                    background-color: #374151;
                    border-color: #4b5563;
                    color: white;
                }
            `}</style>
        </Modal>
    );
};

export default SchoolFormModal;