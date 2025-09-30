import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Class, UserRole } from '../../types';
import Modal from '../common/Modal';
import ClassFormModal from './ClassFormModal';

const ClassManagementPage: React.FC = () => {
    const { user: currentUser, activeSchoolId, effectiveRole } = useAuth();
    const { classes, users, students, addClass, updateClass, deleteClass } = useData();

    const effectiveSchoolId = currentUser?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : currentUser?.schoolId;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [classToEdit, setClassToEdit] = useState<Class | null>(null);
    const [classToDelete, setClassToDelete] = useState<Class | null>(null);

    const schoolClasses = useMemo(() => {
        if (effectiveRole === UserRole.Teacher) {
            return classes.filter(c => c.schoolId === effectiveSchoolId && c.teacherId === currentUser?.id);
        }
        return classes.filter(c => c.schoolId === effectiveSchoolId);
    }, [classes, effectiveSchoolId, effectiveRole, currentUser]);
    
    const teachers = useMemo(() => users.filter(u => u.schoolId === effectiveSchoolId && u.role === UserRole.Teacher), [users, effectiveSchoolId]);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);
    const studentCountMap = useMemo(() => {
        return schoolClasses.reduce((acc, c) => {
            acc[c.id] = students.filter(s => s.classId === c.id).length;
            return acc;
        }, {} as Record<string, number>);
    }, [students, schoolClasses]);

    const handleOpenModal = (classData: Class | null = null) => {
        setClassToEdit(classData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setClassToEdit(null);
        setIsModalOpen(false);
    };

    const handleSaveClass = (data: Class | Omit<Class, 'id'>) => {
        if ('id' in data) {
            updateClass(data);
        } else {
            addClass(data);
        }
    };
    
    const handleDeleteClass = () => {
        if (classToDelete) {
            deleteClass(classToDelete.id);
            setClassToDelete(null);
        }
    };

    const canManage = effectiveRole === UserRole.Admin || effectiveRole === UserRole.Owner;

    return (
        <>
            {canManage && (
                <ClassFormModal 
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveClass}
                    classToEdit={classToEdit}
                />
            )}
            <Modal isOpen={!!classToDelete} onClose={() => setClassToDelete(null)} title="Confirm Class Deletion">
                <div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        Are you sure you want to delete the class <strong className="text-secondary-800 dark:text-secondary-200">{classToDelete?.name}</strong>? This action cannot be undone.
                    </p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setClassToDelete(null)} className="btn-secondary">Cancel</button>
                        <button type="button" onClick={handleDeleteClass} className="btn-danger">Delete</button>
                    </div>
                </div>
            </Modal>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{canManage ? 'Class Management' : 'My Classes'}</h1>
                    {canManage && (
                        <button onClick={() => handleOpenModal()} className="btn-primary">
                            + Add Class
                        </button>
                    )}
                </div>

                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-secondary-500 dark:text-secondary-400">
                            <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Class Name</th>
                                    <th scope="col" className="px-6 py-3">Teacher</th>
                                    <th scope="col" className="px-6 py-3">No. of Students</th>
                                    {canManage && <th scope="col" className="px-6 py-3">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {schoolClasses.map(c => (
                                    <tr key={c.id} className="bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                        <td className="px-6 py-4 font-medium text-secondary-900 dark:text-white">{c.name}</td>
                                        <td className="px-6 py-4">{teacherMap.get(c.teacherId) || 'Not Assigned'}</td>
                                        <td className="px-6 py-4">{studentCountMap[c.id] || 0}</td>
                                        {canManage && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-4">
                                                    <button onClick={() => handleOpenModal(c)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Edit</button>
                                                    <button onClick={() => setClassToDelete(c)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <style>{`
                .btn-primary { @apply px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg; }
                .btn-secondary { @apply px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg; }
                .btn-danger { @apply px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg; }
            `}</style>
        </>
    );
};

export default ClassManagementPage;
