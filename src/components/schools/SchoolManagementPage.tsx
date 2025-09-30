
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { School } from '../../types';
import Modal from '../common/Modal';
import ImageUpload from '../common/ImageUpload';

const SchoolFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (school: School | Omit<School, 'id'>) => void;
    schoolToEdit: School | null;
}> = ({ isOpen, onClose, onSave, schoolToEdit }) => {
    
    const getInitialState = () => ({
        name: schoolToEdit?.name || '',
        address: schoolToEdit?.address || '',
        logoUrl: schoolToEdit?.logoUrl || null
    });

    const [formData, setFormData] = useState(getInitialState());
    
    React.useEffect(() => {
        if(isOpen) {
            setFormData(getInitialState());
        }
    }, [isOpen, schoolToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (schoolToEdit) {
            onSave({ ...schoolToEdit, ...formData });
        } else {
            onSave(formData);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={schoolToEdit ? 'Edit School' : 'Add New School'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <ImageUpload 
                  imageUrl={formData.logoUrl}
                  onChange={(newLogoUrl) => setFormData(prev => ({...prev, logoUrl: newLogoUrl}))}
                  bucketName="logos"
                />
                <div>
                    <label className="input-label">School Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className="input-style" required />
                </div>
                <div>
                    <label className="input-label">Address</label>
                    <textarea value={formData.address} onChange={e => setFormData(p => ({...p, address: e.target.value}))} className="input-style" rows={3} required></textarea>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Save School</button>
                </div>
            </form>
        </Modal>
    );
};


const SchoolManagementPage: React.FC = () => {
    const { schools, addSchool, updateSchool, deleteSchool } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [schoolToEdit, setSchoolToEdit] = useState<School | null>(null);
    const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);

    const handleSave = (school: School | Omit<School, 'id'>) => {
        if ('id' in school) {
            updateSchool(school);
        } else {
            addSchool(school.name, school.address, school.logoUrl);
        }
    };
    
    return (
        <>
            <SchoolFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                schoolToEdit={schoolToEdit}
            />
            <Modal isOpen={!!schoolToDelete} onClose={() => setSchoolToDelete(null)} title="Confirm Deletion">
                 <p>Are you sure you want to delete {schoolToDelete?.name}? This will affect all associated users and students.</p>
                 <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={() => setSchoolToDelete(null)} className="btn-secondary">Cancel</button>
                    <button type="button" onClick={() => { if(schoolToDelete) deleteSchool(schoolToDelete.id); setSchoolToDelete(null); }} className="btn-danger">Delete</button>
                </div>
            </Modal>

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">School Management</h1>
                    <button onClick={() => { setSchoolToEdit(null); setIsModalOpen(true); }} className="btn-primary">+ Add School</button>
                </div>
                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary-50 dark:bg-secondary-700">
                            <tr>
                                <th className="th-style">School</th>
                                <th className="th-style">Address</th>
                                <th className="th-style">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schools.map(school => (
                                <tr key={school.id} className="border-b dark:border-secondary-700">
                                    <td className="td-style font-medium">{school.name}</td>
                                    <td className="td-style">{school.address}</td>
                                    <td className="td-style space-x-2">
                                        <button onClick={() => { setSchoolToEdit(school); setIsModalOpen(true); }} className="text-primary-600 hover:underline">Edit</button>
                                        <button onClick={() => setSchoolToDelete(school)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <style>{`
                .input-label { @apply block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1; }
                .input-style { @apply w-full p-2 border rounded-md dark:bg-secondary-900 dark:border-secondary-600; }
                .btn-primary { @apply px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg; }
                .btn-secondary { @apply px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg; }
                .btn-danger { @apply px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg; }
                .th-style { @apply px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider; }
                .td-style { @apply px-6 py-4 whitespace-nowrap text-sm text-secondary-800 dark:text-secondary-200; }
            `}</style>
        </>
    );
};

export default SchoolManagementPage;