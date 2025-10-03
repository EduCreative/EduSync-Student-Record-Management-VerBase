import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Class, UserRole } from '../../types';
import Modal from '../common/Modal';
import ClassFormModal from './ClassFormModal';
import TableSkeleton from '../common/skeletons/TableSkeleton';
import { DownloadIcon, UploadIcon } from '../../constants';
import { exportToCsv } from '../../utils/csvHelper';
import ImportModal from '../common/ImportModal';
import { Permission } from '../../permissions';

const ClassManagementPage: React.FC = () => {
    const { user: currentUser, activeSchoolId, effectiveRole, hasPermission } = useAuth();
    const { classes, users, students, addClass, updateClass, deleteClass, loading, bulkAddClasses } = useData();

    const effectiveSchoolId = currentUser?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : currentUser?.schoolId;

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [classToEdit, setClassToEdit] = useState<Class | null>(null);
    const [classToDelete, setClassToDelete] = useState<Class | null>(null);
    
    const canManageClasses = hasPermission(Permission.CAN_MANAGE_CLASSES);

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
        setIsFormModalOpen(true);
    };

    const handleCloseModal = () => {
        setClassToEdit(null);
        setIsFormModalOpen(false);
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

    const handleImportClasses = async (data: any[]) => {
        // FIX: Added the required `schoolId` to each class object before passing to `bulkAddClasses`.
        // The function expects a `schoolId` on each object to satisfy its type signature.
        if (!effectiveSchoolId) {
            alert("No active school selected. Cannot import classes.");
            return;
        }
        const classesToImport = data.map(item => ({
            name: item.name,
            teacherId: item.teacherId || null,
            schoolId: effectiveSchoolId,
        }));
        await bulkAddClasses(classesToImport);
    };

    const sampleDataForImport = [{
        name: "Grade 1 - Section A",
        teacherId: teachers[0]?.id || "paste_valid_teacher_id_or_leave_blank"
    }];

    const requiredHeaders = ['name'];

    const handleExport = () => {
        const dataToExport = schoolClasses.map(c => ({
            classId: c.id,
            className: c.name,
            teacher: c.teacherId ? teacherMap.get(c.teacherId) || 'N/A' : 'N/A',
            studentCount: studentCountMap[c.id] || 0,
        }));
        exportToCsv(dataToExport, 'classes_export');
    };
    
    const tableColumns = [
        { width: '30%' }, { width: '30%' }, { width: '20%' },
    ];
    if (canManageClasses) {
        tableColumns.push({ width: '20%' });
    }

    return (
        <>
            {canManageClasses && (
                <>
                    <ClassFormModal 
                        isOpen={isFormModalOpen}
                        onClose={handleCloseModal}
                        onSave={handleSaveClass}
                        classToEdit={classToEdit}
                    />
                    <ImportModal
                        isOpen={isImportModalOpen}
                        onClose={() => setIsImportModalOpen(false)}
                        onImport={handleImportClasses}
                        sampleData={sampleDataForImport}
                        fileName="Classes"
                        requiredHeaders={requiredHeaders}
                    />
                </>
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
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{canManageClasses ? 'Class Management' : 'My Classes'}</h1>
                    <div className="flex items-center gap-2">
                         {canManageClasses && (
                             <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary">
                                <UploadIcon className="w-4 h-4" /> Import CSV
                            </button>
                         )}
                        <button onClick={handleExport} className="btn-secondary">
                           <DownloadIcon className="w-4 h-4" /> Export CSV
                        </button>
                        {canManageClasses && (
                            <button onClick={() => handleOpenModal()} className="btn-primary">
                                + Add Class
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                    {loading ? (
                        <TableSkeleton columns={tableColumns} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-secondary-500 dark:text-secondary-400">
                                <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Class Name</th>
                                        <th scope="col" className="px-6 py-3">Teacher</th>
                                        <th scope="col" className="px-6 py-3">No. of Students</th>
                                        {canManageClasses && <th scope="col" className="px-6 py-3">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {schoolClasses.map(c => (
                                        <tr key={c.id} className="bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                            <td className="px-6 py-4 font-medium text-secondary-900 dark:text-white">{c.name}</td>
                                            <td className="px-6 py-4">{c.teacherId ? teacherMap.get(c.teacherId) || 'Not Assigned' : 'Not Assigned'}</td>
                                            <td className="px-6 py-4">{studentCountMap[c.id] || 0}</td>
                                            {canManageClasses && (
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
                    )}
                </div>
            </div>
        </>
    );
};

export default ClassManagementPage;