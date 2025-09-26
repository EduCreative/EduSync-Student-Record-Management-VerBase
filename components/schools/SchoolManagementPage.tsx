
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { School, UserRole } from '../../types';
import Modal from '../users/Modal';
import SchoolFormModal from './SchoolFormModal';
import { ActiveView } from '../layout/Layout';

interface SchoolManagementPageProps {
    setActiveView: (view: ActiveView) => void;
}

const SchoolManagementPage: React.FC<SchoolManagementPageProps> = ({ setActiveView }) => {
    const { user: currentUser, switchSchoolContext } = useAuth();
    const { schools, users, students, addSchool, updateSchool, deleteSchool } = useData();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [schoolToEdit, setSchoolToEdit] = useState<School | null>(null);
    const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);

    const handleOpenModal = (school: School | null = null) => {
        setSchoolToEdit(school);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSchoolToEdit(null);
        setIsModalOpen(false);
    };

    const handleSaveSchool = (schoolData: School | Omit<School, 'id'>) => {
        if ('id' in schoolData) {
            updateSchool(schoolData);
        } else {
            const dataWithLogo = schoolData as Omit<School, 'id'> & { logoUrl?: string | null };
            addSchool(dataWithLogo.name, dataWithLogo.address, dataWithLogo.logoUrl);
        }
    };

    const handleDeleteSchool = () => {
        if (schoolToDelete) {
            deleteSchool(schoolToDelete.id);
            setSchoolToDelete(null);
        }
    };
    
    const handleSchoolClick = (schoolId: string) => {
        switchSchoolContext(schoolId);
        setActiveView({ view: 'dashboard' });
    };

    if (currentUser?.role !== UserRole.Owner) {
        return <p>Access Denied.</p>
    }

    return (
        <>
            <SchoolFormModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={handleSaveSchool} 
                schoolToEdit={schoolToEdit} 
            />
            <Modal isOpen={!!schoolToDelete} onClose={() => setSchoolToDelete(null)} title="Confirm School Deletion">
                 <div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        Are you sure you want to delete <strong className="text-secondary-800 dark:text-secondary-200">{schoolToDelete?.name}</strong>? 
                        This will also delete all associated users, students, and records. This action is irreversible.
                    </p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setSchoolToDelete(null)} className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg">Cancel</button>
                        <button type="button" onClick={handleDeleteSchool} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg">Delete</button>
                    </div>
                </div>
            </Modal>

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">School Management</h1>
                    <button onClick={() => handleOpenModal()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition">
                        + Add School
                    </button>
                </div>

                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-secondary-500 dark:text-secondary-400">
                            <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">School Name</th>
                                    <th scope="col" className="px-6 py-3">Admin</th>
                                    <th scope="col" className="px-6 py-3">Students</th>
                                    <th scope="col" className="px-6 py-3">Teachers</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schools.map(school => {
                                    const schoolAdmin = users.find(u => u.schoolId === school.id && u.role === UserRole.Admin);
                                    const studentCount = students.filter(s => s.schoolId === school.id).length;
                                    const teacherCount = users.filter(u => u.schoolId === school.id && u.role === UserRole.Teacher).length;
                                    return (
                                        <tr key={school.id} className="bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                            <td className="px-6 py-4 font-medium text-secondary-900 dark:text-white whitespace-nowrap">
                                                <button onClick={() => handleSchoolClick(school.id)} className="hover:underline text-primary-600 dark:text-primary-400">
                                                    {school.name}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">{schoolAdmin?.name || 'Not Assigned'}</td>
                                            <td className="px-6 py-4">{studentCount}</td>
                                            <td className="px-6 py-4">{teacherCount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                 <div className="flex items-center space-x-4">
                                                    <button onClick={() => handleOpenModal(school)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Edit</button>
                                                    <button onClick={() => setSchoolToDelete(school)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SchoolManagementPage;