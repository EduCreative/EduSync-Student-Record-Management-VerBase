
import React, { useState, useEffect, useMemo } from 'react';
import { Student, FeeHead } from '../../types';
import Modal from '../users/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import ImageUpload from '../common/ImageUpload';

interface StudentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (student: Student | Omit<Student, 'id' | 'status'>) => void;
    studentToEdit?: Student | null;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({ isOpen, onClose, onSave, studentToEdit }) => {
    const { user: currentUser } = useAuth();
    const { classes, feeHeads } = useData();
    
    const initialFormState = useMemo(() => ({
        name: '',
        classId: '',
        rollNumber: '',
        schoolId: currentUser?.schoolId || '',
        fatherName: '',
        fatherCnic: '',
        dateOfBirth: '',
        dateOfAdmission: '',
        contactNumber: '',
        secondaryContactNumber: '',
        address: '',
        gender: 'Male' as 'Male' | 'Female',
        avatarUrl: null as string | null | undefined,
        lastSchoolAttended: '',
        admittedInClass: '',
        caste: '',
        openingBalance: 0,
        feeStructure: [] as { feeHeadId: string; amount: number }[],
    }), [currentUser]);

    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const schoolClasses = useMemo(() => {
        if (!currentUser) return [];
        return classes.filter(c => c.schoolId === currentUser.schoolId);
    }, [classes, currentUser]);
    
    const schoolFeeHeads = useMemo(() => {
        return feeHeads.filter(fh => fh.schoolId === currentUser?.schoolId);
    }, [feeHeads, currentUser]);

    useEffect(() => {
        if (isOpen) {
            if (studentToEdit) {
                setFormData({
                    ...initialFormState,
                    ...studentToEdit,
                    openingBalance: studentToEdit.openingBalance || 0,
                    feeStructure: studentToEdit.feeStructure || schoolFeeHeads.map(fh => ({ feeHeadId: fh.id, amount: fh.defaultAmount })),
                });
            } else {
                const defaultClassId = schoolClasses.length > 0 ? schoolClasses[0].id : '';
                const defaultFeeStructure = schoolFeeHeads.map(fh => ({ feeHeadId: fh.id, amount: fh.defaultAmount }));
                setFormData({ ...initialFormState, classId: defaultClassId, feeStructure: defaultFeeStructure });
            }
            setErrors({});
        }
    }, [studentToEdit, isOpen, initialFormState, schoolClasses, schoolFeeHeads]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
        const phoneRegex = /^[0-9+-\s()]{10,15}$/;

        if (!formData.name.trim()) newErrors.name = 'Full Name is required.';
        if (!formData.classId) newErrors.classId = 'A class must be selected.';
        if (!formData.rollNumber.trim()) newErrors.rollNumber = 'Roll Number is required.';
        if (!formData.fatherName.trim()) newErrors.fatherName = "Father's Name is required.";
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of Birth is required.';
        if (!formData.dateOfAdmission) newErrors.dateOfAdmission = 'Date of Admission is required.';
        if (formData.fatherCnic && !cnicRegex.test(formData.fatherCnic)) {
            newErrors.fatherCnic = "Invalid CNIC format. Use XXXXX-XXXXXXX-X.";
        }
        if (formData.contactNumber && !phoneRegex.test(formData.contactNumber)) {
            newErrors.contactNumber = 'Please enter a valid primary contact number.';
        }
        if (formData.secondaryContactNumber && !phoneRegex.test(formData.secondaryContactNumber)) {
            newErrors.secondaryContactNumber = 'Please enter a valid secondary contact number.';
        }
        if (!formData.address.trim()) newErrors.address = 'Address is required.';
        if (!formData.gender) newErrors.gender = 'Gender is required.';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'openingBalance' ? Number(value) : value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    const handleFeeStructureChange = (feeHeadId: string, amount: string) => {
        const newAmount = Number(amount) || 0;
        setFormData(prev => {
            const newStructure = [...(prev.feeStructure || [])];
            const index = newStructure.findIndex(f => f.feeHeadId === feeHeadId);
            if (index > -1) {
                newStructure[index] = { ...newStructure[index], amount: newAmount };
            } else {
                newStructure.push({ feeHeadId, amount: newAmount });
            }
            return { ...prev, feeStructure: newStructure };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        if (studentToEdit) {
            onSave({ ...studentToEdit, ...formData });
        } else {
            onSave(formData);
        }
        onClose();
    };
    
    const [isFeeSectionOpen, setIsFeeSectionOpen] = useState(false);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={studentToEdit ? 'Edit Student' : 'Add New Student'}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2" noValidate>
                <ImageUpload 
                  imageUrl={formData.avatarUrl}
                  gender={formData.gender}
                  onChange={(newAvatarUrl) => setFormData(prev => ({...prev, avatarUrl: newAvatarUrl}))}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="input-label">Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full input-style" />
                        {errors.name && <p className="error-text">{errors.name}</p>}
                    </div>
                     <div>
                        <label className="input-label">Father's Name</label>
                        <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className="w-full input-style" />
                        {errors.fatherName && <p className="error-text">{errors.fatherName}</p>}
                    </div>
                     <div>
                        <label className="input-label">Class</label>
                        <select name="classId" value={formData.classId} onChange={handleChange} className="w-full input-style">
                            <option value="">Select a class</option>
                            {schoolClasses.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                        </select>
                        {errors.classId && <p className="error-text">{errors.classId}</p>}
                    </div>
                    <div>
                        <label className="input-label">Roll Number</label>
                        <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange} className="w-full input-style" />
                        {errors.rollNumber && <p className="error-text">{errors.rollNumber}</p>}
                    </div>
                     <div>
                        <label className="input-label">Gender</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full input-style">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        {errors.gender && <p className="error-text">{errors.gender}</p>}
                    </div>
                     <div>
                        <label className="input-label">Date of Birth</label>
                        <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full input-style" />
                        {errors.dateOfBirth && <p className="error-text">{errors.dateOfBirth}</p>}
                    </div>
                     <div>
                        <label className="input-label">Date of Admission</label>
                        <input type="date" name="dateOfAdmission" value={formData.dateOfAdmission} onChange={handleChange} className="w-full input-style" />
                        {errors.dateOfAdmission && <p className="error-text">{errors.dateOfAdmission}</p>}
                    </div>
                     <div>
                        <label className="input-label">Father's CNIC</label>
                        <input type="text" name="fatherCnic" placeholder="e.g., 35202-1234567-1" value={formData.fatherCnic} onChange={handleChange} className="w-full input-style" />
                        {errors.fatherCnic && <p className="error-text">{errors.fatherCnic}</p>}
                    </div>
                     <div>
                        <label className="input-label">Contact Number (Primary)</label>
                        <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="w-full input-style" />
                        {errors.contactNumber && <p className="error-text">{errors.contactNumber}</p>}
                    </div>
                     <div>
                        <label className="input-label">Contact Number (Secondary)</label>
                        <input type="tel" name="secondaryContactNumber" value={formData.secondaryContactNumber || ''} onChange={handleChange} className="w-full input-style" />
                        {errors.secondaryContactNumber && <p className="error-text">{errors.secondaryContactNumber}</p>}
                    </div>
                     <div>
                        <label className="input-label">Opening Balance (Rs.)</label>
                        <input type="number" name="openingBalance" value={formData.openingBalance} onChange={handleChange} className="w-full input-style" />
                    </div>
                    <div>
                        <label className="input-label">Caste</label>
                        <input type="text" name="caste" value={formData.caste} onChange={handleChange} className="w-full input-style" />
                    </div>
                    <div>
                        <label className="input-label">Admitted in Class</label>
                        <input type="text" name="admittedInClass" value={formData.admittedInClass} onChange={handleChange} className="w-full input-style" />
                    </div>
                     <div className="md:col-span-2">
                        <label className="input-label">Last School Attended</label>
                        <input type="text" name="lastSchoolAttended" value={formData.lastSchoolAttended} onChange={handleChange} className="w-full input-style" />
                    </div>
                     <div className="md:col-span-2">
                        <label className="input-label">Address</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full input-style" />
                        {errors.address && <p className="error-text">{errors.address}</p>}
                    </div>
                </div>

                <div className="border-t dark:border-secondary-600 pt-4">
                    <button type="button" onClick={() => setIsFeeSectionOpen(!isFeeSectionOpen)} className="w-full flex justify-between items-center text-left font-medium">
                        Fee Structure
                        <span>{isFeeSectionOpen ? '▲' : '▼'}</span>
                    </button>
                    {isFeeSectionOpen && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                            {schoolFeeHeads.map(fh => (
                                <div key={fh.id}>
                                    <label className="input-label">{fh.name} (Rs.)</label>
                                    <input 
                                        type="number" 
                                        value={formData.feeStructure?.find(f => f.feeHeadId === fh.id)?.amount || ''} 
                                        onChange={(e) => handleFeeStructureChange(fh.id, e.target.value)}
                                        className="w-full input-style"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg">Save Student</button>
                </div>
            </form>
            <style>{`
                .input-label { display: block; text-sm; font-medium; text-secondary-700; dark:text-secondary-300; margin-bottom: 0.25rem; }
                .input-style { background-color: #f9fafb; border: 1px solid #d1d5db; color: #111827; font-size: 0.875rem; border-radius: 0.5rem; display: block; width: 100%; padding: 0.625rem; }
                .dark .input-style { background-color: #374151; border-color: #4b5563; color: white; }
                .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; --tw-ring-color: #3b82f6; box-shadow: 0 0 0 2px var(--tw-ring-color); }
                .error-text { color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; }
            `}</style>
        </Modal>
    );
};

export default StudentFormModal;
