import React, { useState, useEffect, useMemo } from 'react';
import { Class, UserRole } from '../../types';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ClassFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (classData: Class | Omit<Class, 'id'>) => void;
    classToEdit?: Class | null;
}

const ClassFormModal: React.FC<ClassFormModalProps> = ({ isOpen, onClose, onSave, classToEdit }) => {
    const { user: currentUser, activeSchoolId } = useAuth();
    const { users } = useData();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({ name: '', teacherId: '' });
    const [error, setError] = useState('');

    const effectiveSchoolId = currentUser?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : currentUser?.schoolId;

    const schoolTeachers = useMemo(() => {
        return users.filter(u => u.schoolId === effectiveSchoolId && u.role === UserRole.Teacher);
    }, [users, effectiveSchoolId]);

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
        setError('');
        if (!formData.name.trim()) {
            setError('Class name is required.');
            return;
        }

        if (!effectiveSchoolId) {
            const msg = 'No active school context. Cannot save class.';
            setError(msg);
            showToast('Error', 'No active school selected. Please select a school first.', 'error');
            return;
        }
        
        const saveData = {
            ...formData,
            teacherId: formData.teacherId || null,
            schoolId: effectiveSchoolId,
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
        </Modal>
    );
};

export default ClassFormModal;