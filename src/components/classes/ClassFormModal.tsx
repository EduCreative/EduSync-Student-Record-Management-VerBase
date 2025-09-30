import React, { useState, useEffect, useMemo } from 'react';
import { Class, UserRole } from '../../types';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface ClassFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (classData: Class | Omit<Class, 'id'>) => void;
    classToEdit?: Class | null;
}

const ClassFormModal: React.FC<ClassFormModalProps> = ({ isOpen, onClose, onSave, classToEdit }) => {
    const { user: currentUser } = useAuth();
    const { users } = useData();

    const [formData, setFormData] = useState({ name: '', teacherId: '' });
    const [error, setError] = useState('');

    const schoolTeachers = useMemo(() => {
        return users.filter(u => u.schoolId === currentUser?.schoolId && u.role === UserRole.Teacher);
    }, [users, currentUser]);

    useEffect(() => {
        if (isOpen) {
            if (classToEdit) {
                setFormData({ name: classToEdit.name, teacherId: classToEdit.teacherId || '' });
            } else {
                setFormData({ name: '', teacherId: '' });
            }
            setError('');
        }
    }, [classToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Class name is required.');
            return;
        }
        
        const saveData = {
            ...formData,
            teacherId: formData.teacherId || null,
            schoolId: currentUser?.schoolId || '',
        };

        if (classToEdit) {
            onSave({ ...classToEdit, ...saveData });
        } else {
            onSave(saveData);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={classToEdit ? 'Edit Class' : 'Add New Class'}>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                    <label htmlFor="name" className="input-label">Class Name</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className="input-field" />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
                <div>
                    <label htmlFor="teacherId" className="input-label">Assign Teacher</label>
                    <select name="teacherId" id="teacherId" value={formData.teacherId} onChange={e => setFormData(p => ({...p, teacherId: e.target.value}))} className="input-field">
                        <option value="">Select a teacher (optional)</option>
                        {schoolTeachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Save Class</button>
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

export default ClassFormModal;
