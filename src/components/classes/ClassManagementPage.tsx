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
import PromotionPreviewModal from './PromotionPreviewModal';
import { useToast } from '../../context/ToastContext';

const numberWords: { [key: string]: number } = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12
};

const getClassLevel = (name: string): number => {
    const lowerName = name.toLowerCase().trim();
    // Normalize by removing spaces and hyphens for keyword matching
    const normalizedName = lowerName.replace(/[\s-]+/g, '');

    if (normalizedName.includes('playgroup')) return -5;
    if (normalizedName.includes('nursery')) return -4;
    if (normalizedName.includes('kg')) return -3; // Covers KG, K.G., etc.
    if (normalizedName.includes('junior')) return -2;
    if (normalizedName.includes('senior')) return -1;

    let level = 1000; // Default for non-standard names to appear last

    // Check for numeric digits first (e.g., "Class 1", "Grade-8")
    const digitMatch = name.match(/\d+/);
    if (digitMatch) {
        level = parseInt(digitMatch[0], 10);
    } else {
        // If no digits, check for number words (e.g., "Class One")
        const nameParts = lowerName.split(/[\s-]/);
        for (const word in numberWords) {
            if (nameParts.includes(word)) {
                level = numberWords[word];
                break; // Found a number word, stop searching
            }
        }
    }

    // Handle modifiers like "passed" to sort them after the base class
    if (lowerName.includes('passed')) {
        return level + 0.5;
    }
    
    return level;
};

const GraduationCapIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;


const ClassManagementPage: React.FC = () => {
    const { user: currentUser, activeSchoolId, effectiveRole, hasPermission } = useAuth();
    const { classes, users, students, addClass, updateClass, deleteClass, loading, bulkAddClasses, promoteAllStudents } = useData();
    const { showToast } = useToast();

    const effectiveSchoolId = currentUser?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : currentUser?.schoolId;

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [promotionPlan, setPromotionPlan] = useState<any[]>([]);
    const [isPromoting, setIsPromoting] = useState(false);
    const [classToEdit, setClassToEdit] = useState<Class | null>(null);
    const [classToDelete, setClassToDelete] = useState<Class | null>(null);
    
    const canEditClasses = hasPermission(Permission.CAN_EDIT_CLASSES);
    const canDeleteClasses = hasPermission(Permission.CAN_DELETE_CLASSES);
    const canPromote = hasPermission(Permission.CAN_PROMOTE_STUDENTS);
    const canPerformActions = canEditClasses || canDeleteClasses;

    const schoolClasses = useMemo(() => {
        let filteredClasses: Class[];
        if (effectiveRole === UserRole.Teacher) {
            filteredClasses = classes.filter(c => c.schoolId === effectiveSchoolId && c.teacherId === currentUser?.id);
        } else {
            filteredClasses = classes.filter(c => c.schoolId === effectiveSchoolId);
        }
        return [...filteredClasses].sort((a, b) => getClassLevel(a.name) - getClassLevel(b.name));
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

    const handleSaveClass = async (data: Class | Omit<Class, 'id'>) => {
        if ('id' in data) {
            await updateClass(data);
        } else {
            await addClass(data);
        }
    };
    
    const handleDeleteClass = () => {
        if (classToDelete) {
            deleteClass(classToDelete.id);
            setClassToDelete(null);
        }
    };

    const validateClassImport = async (data: any[]) => {
        const validRecords: any[] = [];
        const invalidRecords: { record: any, reason: string, rowNum: number }[] = [];

        data.forEach((item, index) => {
            if (!item.name || !item.name.trim()) {
                invalidRecords.push({ record: item, reason: 'Class name is required.', rowNum: index + 2 });
            } else {
                validRecords.push(item);
            }
        });
        return { validRecords, invalidRecords };
    };

    const handleImportClasses = async (validData: any[], progressCallback: (progress: { processed: number; total: number; errors: string[] }) => void) => {
        if (!effectiveSchoolId) {
            throw new Error("No active school selected. Cannot import classes.");
        }
        
        const CHUNK_SIZE = 50;
        let processed = 0;

        for (let i = 0; i < validData.length; i += CHUNK_SIZE) {
            const chunk = validData.slice(i, i + CHUNK_SIZE);
            const classesToImport = chunk.map(item => ({
                name: item.name,
                teacherId: item.teacherId || null,
                schoolId: effectiveSchoolId,
            }));

            if (classesToImport.length > 0) {
                await bulkAddClasses(classesToImport);
            }
            
            processed += chunk.length;
            progressCallback({ processed, total: validData.length, errors: [] });
        }
    };

    const sampleDataForImport = [{
        name: "Grade 1 - Section A",
        teacherId: teachers[0]?.id || "paste_valid_teacher_id_or_leave_blank"
    }];

    const requiredHeaders = ['name'];

    const handleExport = () => {
        const dataToExport = schoolClasses.map(c => ({
            name: c.name,
            teacherId: c.teacherId || '',
            teacherName_for_reference: c.teacherId ? teacherMap.get(c.teacherId) || 'N/A' : 'N/A',
            studentCount_for_reference: studentCountMap[c.id] || 0,
        }));
        exportToCsv(dataToExport, 'classes_export');
    };
    
    const handleCalculateAndShowPreview = () => {
        const sortedClasses = [...schoolClasses].sort((a, b) => getClassLevel(a.name) - getClassLevel(b.name));
    
        if (sortedClasses.length < 1) {
            showToast('Info', 'At least one class is required to perform promotion.', 'info');
            return;
        }
    
        const plan = [];
        for (let i = 0; i < sortedClasses.length; i++) {
            const fromClass = sortedClasses[i];
            const totalStudentCount = students.filter(s => s.classId === fromClass.id && s.status === 'Active').length;
    
            if (i < sortedClasses.length - 1) {
                const toClass = sortedClasses[i + 1];
                plan.push({
                    from: fromClass,
                    to: toClass,
                    totalStudentCount: totalStudentCount,
                    type: 'promote'
                });
            } else {
                plan.push({
                    from: fromClass,
                    to: null,
                    totalStudentCount: totalStudentCount,
                    type: 'graduate'
                });
            }
        }
        setPromotionPlan(plan);
        setIsPromoteModalOpen(true);
    };

    const handleConfirmPromotion = async (exemptedStudentIds: string[]) => {
        setIsPromoting(true);
        try {
            await promoteAllStudents(exemptedStudentIds);
        } catch (error) {
            console.error("Promotion failed:", error);
        } finally {
            setIsPromoting(false);
            setIsPromoteModalOpen(false);
        }
    };

    const tableColumns = [
        { width: '10%' }, // ID
        { width: canPerformActions ? '25%' : '40%' }, // Name
        { width: canPerformActions ? '25%' : '30%' }, // Teacher
        { width: '20%' }, // Students
    ];
    if (canPerformActions) {
        tableColumns.push({ width: '20%' }); // Actions
    }


    return (
        <>
            {canEditClasses && (
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
                        onValidate={validateClassImport}
                        onImport={handleImportClasses}
                        sampleData={sampleDataForImport}
                        fileName="Classes"
                        requiredHeaders={requiredHeaders}
                    />
                </>
            )}
            {canPromote && (
                <PromotionPreviewModal
                    isOpen={isPromoteModalOpen}
                    onClose={() => setIsPromoteModalOpen(false)}
                    onConfirm={handleConfirmPromotion}
                    promotionPlan={promotionPlan}
                    isPromoting={isPromoting}
                    allStudents={students}
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
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{canEditClasses ? 'Class Management' : 'My Classes'}</h1>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                         {canEditClasses && (
                             <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary">
                                <UploadIcon className="w-4 h-4" /> Import CSV
                            </button>
                         )}
                        <button onClick={handleExport} className="btn-secondary">
                           <DownloadIcon className="w-4 h-4" /> Export CSV
                        </button>
                        {canPromote && (
                            <button onClick={handleCalculateAndShowPreview} className="btn-danger flex items-center gap-2">
                                <GraduationCapIcon className="w-4 h-4" /> 
                                Promote All Students
                            </button>
                        )}
                        {canEditClasses && (
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
                                        <th scope="col" className="px-6 py-3">ID</th>
                                        <th scope="col" className="px-6 py-3">Class Name</th>
                                        <th scope="col" className="px-6 py-3">Teacher</th>
                                        <th scope="col" className="px-6 py-3">No. of Students</th>
                                        {canPerformActions && <th scope="col" className="px-6 py-3">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {schoolClasses.map((c, index) => (
                                        <tr key={c.id} className="bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                            <td className="px-6 py-4">{index + 1}</td>
                                            <td className="px-6 py-4 font-medium text-secondary-900 dark:text-white">{c.name}</td>
                                            <td className="px-6 py-4">{c.teacherId ? teacherMap.get(c.teacherId) || 'Not Assigned' : 'Not Assigned'}</td>
                                            <td className="px-6 py-4">{studentCountMap[c.id] || 0}</td>
                                            {canPerformActions && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-4">
                                                        {canEditClasses && <button onClick={() => handleOpenModal(c)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Edit</button>}
                                                        {canDeleteClasses && <button onClick={() => setClassToDelete(c)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>}
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
