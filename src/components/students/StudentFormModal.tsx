import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import { Student } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import ImageUpload from '../common/ImageUpload';

interface StudentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (studentData: Student | Omit<Student, 'id'>) => void;
    studentToEdit?: Student | null;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({ isOpen, onClose, onSave, studentToEdit }) => {
    const { user, activeSchoolId } = useAuth();
    const { classes, users } = useData();

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    
    const getInitialFormData = () => ({
        name: '',
        rollNumber: '',
        classId: '',
        fatherName: '',
        fatherCnic: '',
        dateOfBirth: '',
        dateOfAdmission: new Date().toISOString().split('T')[0],
        contactNumber: '',
        address: '',
        gender: 'Male' as 'Male' | 'Female',
        avatarUrl: null as string | null | undefined,
        schoolId: effectiveSchoolId || '',
        userId: '',
        secondaryContactNumber: '',
        lastSchoolAttended: '',
        admittedInClass: '',
        caste: '',
        openingBalance: 0,
        status: 'Active' as 'Active' | 'Inactive' | 'Left',
    });

    const [formData, setFormData] = useState(getInitialFormData());
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === effectiveSchoolId), [classes, effectiveSchoolId]);
    const parentUsers = useMemo(() => users.filter(u => u.schoolId === effectiveSchoolId && u.role === UserRole.Parent), [users, effectiveSchoolId]);

    useEffect(() => {
        if (isOpen) {
            if (studentToEdit) {
                // Explicitly map properties from studentToEdit to the form state shape
                // to avoid type conflicts from spreading an object with a different structure.
                setFormData({
                    name: studentToEdit.name,
                    rollNumber: studentToEdit.rollNumber,
                    classId: studentToEdit.classId,
                    fatherName: studentToEdit.fatherName,
                    fatherCnic: studentToEdit.fatherCnic,
                    dateOfBirth: studentToEdit.dateOfBirth,
                    dateOfAdmission: studentToEdit.dateOfAdmission,
                    contactNumber: studentToEdit.contactNumber,
                    address: studentToEdit.address,
                    gender: studentToEdit.gender,
                    avatarUrl: studentToEdit.avatarUrl,
                    schoolId: studentToEdit.schoolId,
                    userId: studentToEdit.userId ?? '', // Coalesce null/undefined to empty string
                    secondaryContactNumber: studentToEdit.secondaryContactNumber || '',
                    lastSchoolAttended: studentToEdit.lastSchoolAttended || '',
                    admittedInClass: studentToEdit.admittedInClass || '',
                    caste: studentToEdit.caste || '',
                    openingBalance: studentToEdit.openingBalance || 0,
                    status: studentToEdit.status,
                });
            } else {
                setFormData(getInitialFormData());
            }
            setErrors({});
        }
    }, [studentToEdit, isOpen]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'Student name is required.';
        if (!formData.rollNumber.trim()) newErrors.rollNumber = 'Roll number is required.';
        if (!formData.classId) newErrors.classId = 'Please select a class.';
        if (!formData.fatherName.trim()) newErrors.fatherName = "Father's name is required.";
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required.';
        if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof typeof errors];
                return newErrors;
            });
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        onSave({
            ...formData,
            userId: formData.userId || null,
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={studentToEdit ? 'Edit Student' : 'Add New Student'}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2" noValidate>
                 <ImageUpload 
                  imageUrl={formData.avatarUrl}
                  onChange={(newAvatarUrl) => setFormData(prev => ({...prev, avatarUrl: newAvatarUrl}))}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="input-label">Student Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full input-field" required />
                        {errors.name && <p className="error-text">{errors.name}</p>}
                    </div>
                     <div>
                        <label htmlFor="rollNumber" className="input-label">Roll Number</label>
                        <input type="text" name="rollNumber" id="rollNumber" value={formData.rollNumber} onChange={handleChange} className="w-full input-field" required />
                        {errors.rollNumber && <p className="error-text">{errors.rollNumber}</p>}
                    </div>
                     <div>
                        <label htmlFor="classId" className="input-label">Class</label>
                        <select name="classId" id="classId" value={formData.classId} onChange={handleChange} className="w-full input-field" required>
                            <option value="">Select Class</option>
                            {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {errors.classId && <p className="error-text">{errors.classId}</p>}
                    </div>
                     <div>
                        <label htmlFor="userId" className="input-label">Link Parent Account</label>
                        <select name="userId" id="userId" value={formData.userId || ''} onChange={handleChange} className="w-full input-field">
                            <option value="">Select Parent (Optional)</option>
                            {parentUsers.map(p => <option key={p.id} value={p.id}>{p.name} - {p.email}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="fatherName" className="input-label">Father's Name</label>
                        <input type="text" name="fatherName" id="fatherName" value={formData.fatherName} onChange={handleChange} className="w-full input-field" required />
                        {errors.fatherName && <p className="error-text">{errors.fatherName}</p>}
                    </div>
                    <div>
                        <label htmlFor="fatherCnic" className="input-label">Father's CNIC</label>
                        <input type="text" name="fatherCnic" id="fatherCnic" value={formData.fatherCnic} onChange={handleChange} className="w-full input-field" />
                    </div>
                     <div>
                        <label htmlFor="gender" className="input-label">Gender</label>
                        <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="w-full input-field">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dateOfBirth" className="input-label">Date of Birth</label>
                        <input type="date" name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full input-field" required />
                        {errors.dateOfBirth && <p className="error-text">{errors.dateOfBirth}</p>}
                    </div>
                     <div>
                        <label htmlFor="dateOfAdmission" className="input-label">Date of Admission</label>
                        <input type="date" name="dateOfAdmission" id="dateOfAdmission" value={formData.dateOfAdmission} onChange={handleChange} className="w-full input-field" />
                    </div>
                    <div>
                        <label htmlFor="contactNumber" className="input-label">Contact Number</label>
                        <input type="tel" name="contactNumber" id="contactNumber" value={formData.contactNumber} onChange={handleChange} className="w-full input-field" required />
                        {errors.contactNumber && <p className="error-text">{errors.contactNumber}</p>}
                    </div>
                    <div>
                        <label htmlFor="secondaryContactNumber" className="input-label">Secondary Contact</label>
                        <input type="tel" name="secondaryContactNumber" id="secondaryContactNumber" value={formData.secondaryContactNumber} onChange={handleChange} className="w-full input-field" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="address" className="input-label">Address</label>
                        <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows={3} className="w-full input-field"></textarea>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Save Student</button>
                </div>
            </form>
            <style>{`
                .input-label { @apply block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1; }
                .input-field { @apply w-full p-2 border rounded-md bg-secondary-50 text-secondary-900 dark:bg-secondary-700 dark:border-secondary-600 dark:text-secondary-200 placeholder:text-secondary-400 dark:placeholder:text-secondary-500; }
                .error-text { @apply text-red-500 text-xs mt-1; }
                .btn-primary { @apply px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg; }
                .btn-secondary { @apply px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg; }
            `}</style>
        </Modal>
    );
};

export default StudentFormModal;