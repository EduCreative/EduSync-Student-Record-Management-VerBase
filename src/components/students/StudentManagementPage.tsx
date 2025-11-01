import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Student, UserRole } from '../../types';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import StudentFormModal from './StudentFormModal';
import { ActiveView } from '../layout/Layout';
import TableSkeleton from '../common/skeletons/TableSkeleton';
import { DownloadIcon, UploadIcon } from '../../constants';
import { exportToCsv } from '../../utils/csvHelper';
import ImportModal from '../common/ImportModal';
import { Permission } from '../../permissions';

interface StudentManagementPageProps {
    setActiveView: (view: ActiveView) => void;
}

const StudentManagementPage: React.FC<StudentManagementPageProps> = ({ setActiveView }) => {
    const { user, activeSchoolId, hasPermission } = useAuth();
    // FIX: Removed `showToast` from `useData` destructuring as it is not part of the context type. Toast notifications are handled within the data context methods.
    const { students, classes, addStudent, updateStudent, deleteStudent, loading, bulkAddStudents, feeHeads, schools } = useData();

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;

    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<Student['status'] | 'all'>('all');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const STUDENTS_PER_PAGE = 10;
    
    const canEdit = hasPermission(Permission.CAN_EDIT_STUDENTS);
    const canDelete = hasPermission(Permission.CAN_DELETE_STUDENTS);

    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === effectiveSchoolId), [classes, effectiveSchoolId]);
    const classMap = useMemo(() => new Map(schoolClasses.map(c => [c.id, c.name])), [schoolClasses]);

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            if (student.schoolId !== effectiveSchoolId) return false;
            if (classFilter !== 'all' && student.classId !== classFilter) return false;
            if (statusFilter !== 'all' && student.status !== statusFilter) return false;
            if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase()) && !student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    }, [students, effectiveSchoolId, searchTerm, classFilter, statusFilter]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, classFilter, statusFilter]);

    const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);
    const paginatedStudents = useMemo(() => {
        const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE;
        const endIndex = startIndex + STUDENTS_PER_PAGE;
        return filteredStudents.slice(startIndex, endIndex);
    }, [filteredStudents, currentPage]);

    const handleOpenModal = (student: Student | null = null) => {
        setStudentToEdit(student);
        setIsFormModalOpen(true);
    };

    const handleCloseModal = () => {
        setStudentToEdit(null);
        setIsFormModalOpen(false);
    };

    const handleSaveStudent = async (studentData: Student | Omit<Student, 'id' | 'status'>) => {
        if ('id' in studentData) {
            await updateStudent(studentData);
        } else {
            await addStudent(studentData);
        }
    };

    const handleDeleteStudent = () => {
        if (studentToDelete) {
            deleteStudent(studentToDelete.id);
            setStudentToDelete(null);
        }
    };
    
    const validateStudentImport = async (data: any[]) => {
        const classNameToIdMap = new Map(schoolClasses.map(c => [c.name.toLowerCase(), c.id]));
        const validRecords: any[] = [];
        const invalidRecords: { record: any, reason: string, rowNum: number }[] = [];

        data.forEach((item, index) => {
            const rowNum = index + 2;
            const className = item.className?.trim().toLowerCase();
            const classId = className ? classNameToIdMap.get(className) : undefined;
    
            if (!classId) {
                invalidRecords.push({ record: item, reason: `Class "${item.className}" not found.`, rowNum });
            } else if (!item.name || !item.rollNumber) {
                invalidRecords.push({ record: item, reason: `Missing required field (name or rollNumber).`, rowNum });
            } else {
                validRecords.push(item);
            }
        });
        return { validRecords, invalidRecords };
    };

    const handleImportStudents = async (validData: any[], progressCallback: (progress: { processed: number; total: number; errors: string[] }) => void) => {
        if (!effectiveSchoolId) {
            throw new Error("No active school selected. Cannot import students.");
        }
        
        const CHUNK_SIZE = 50;
        const classNameToIdMap = new Map(schoolClasses.map(c => [c.name.toLowerCase(), c.id]));
        const tuitionFeeHead = feeHeads.find(fh => fh.schoolId === effectiveSchoolId && fh.name.toLowerCase() === 'tuition fee');
        const school = schools.find(s => s.id === effectiveSchoolId);
        const defaultTuitionFee = school?.defaultTuitionFee;

        let processed = 0;

        for (let i = 0; i < validData.length; i += CHUNK_SIZE) {
            const chunk = validData.slice(i, i + CHUNK_SIZE);
            const studentsToImport: Omit<Student, 'id' | 'status'>[] = [];
    
            chunk.forEach(item => {
                const classId = classNameToIdMap.get(item.className.trim().toLowerCase());
        
                const studentData: any = {
                    ...item,
                    schoolId: effectiveSchoolId,
                    classId: classId,
                    dateOfBirth: item.dateOfBirth || null,
                    dateOfAdmission: item.dateOfAdmission || null,
                    openingBalance: Number(item.openingBalance) || 0,
                    userId: item.userId || null,
                };
                
                let feeAmountToApply: number | null = null;
                const tuitionFeeFromCsv = item.monthly_tuition_fee ? Number(item.monthly_tuition_fee) : null;
            
                if (tuitionFeeFromCsv !== null && tuitionFeeFromCsv > 0) {
                    feeAmountToApply = tuitionFeeFromCsv;
                } else if (defaultTuitionFee && defaultTuitionFee > 0) {
                    feeAmountToApply = defaultTuitionFee;
                }

                if (feeAmountToApply !== null && tuitionFeeHead) {
                    studentData.feeStructure = [{ feeHeadId: tuitionFeeHead.id, amount: feeAmountToApply }];
                }
                
                delete studentData.className;
                delete studentData.monthly_tuition_fee;
                
                studentsToImport.push(studentData);
            });
    
            if (studentsToImport.length > 0) {
                await bulkAddStudents(studentsToImport);
            }

            processed += chunk.length;
            progressCallback({ processed, total: validData.length, errors: [] });
        }
    };

    const sampleDataForImport = [{
        name: "Kamran Ahmed",
        rollNumber: "101",
        className: schoolClasses[0]?.name || "Grade 5",
        fatherName: "Zulfiqar Ahmed",
        fatherCnic: "35202-1234567-1",
        dateOfBirth: "2010-05-15",
        dateOfAdmission: new Date().toISOString().split('T')[0],
        contactNumber: "0300-1234567",
        secondaryContactNumber: "0333-7654321",
        address: "123 School Lane, City",
        gender: "Male",
        admittedClass: "Grade 5",
        caste: "Arain",
        lastSchoolAttended: "Previous Public School",
        openingBalance: 0,
        userId: "",
        monthly_tuition_fee: 5000,
    }];

    const requiredHeaders = ['name', 'rollNumber', 'className', 'fatherName', 'dateOfBirth', 'contactNumber', 'admittedClass'];

    const handleExport = () => {
        const dataToExport = filteredStudents.map(s => ({
            name: s.name,
            rollNumber: s.rollNumber,
            classId: s.classId,
            fatherName: s.fatherName,
            fatherCnic: s.fatherCnic,
            dateOfBirth: s.dateOfBirth,
            dateOfAdmission: s.dateOfAdmission,
            contactNumber: s.contactNumber,
            secondaryContactNumber: s.secondaryContactNumber,
            address: s.address,
            gender: s.gender,
            admittedClass: s.admittedClass,
            caste: s.caste,
            lastSchoolAttended: s.lastSchoolAttended,
            openingBalance: s.openingBalance,
            userId: s.userId,
            className_for_reference: classMap.get(s.classId) || 'N/A',
            status: s.status,
        }));
        exportToCsv(dataToExport, 'students_export');
    };
    
    const showingFrom = filteredStudents.length > 0 ? (currentPage - 1) * STUDENTS_PER_PAGE + 1 : 0;
    const showingTo = Math.min(currentPage * STUDENTS_PER_PAGE, filteredStudents.length);

    return (
        <>
            <StudentFormModal isOpen={isFormModalOpen} onClose={handleCloseModal} onSave={handleSaveStudent} studentToEdit={studentToEdit} />
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onValidate={validateStudentImport}
                onImport={handleImportStudents}
                sampleData={sampleDataForImport}
                fileName="Students"
                requiredHeaders={requiredHeaders}
            />
            <Modal isOpen={!!studentToDelete} onClose={() => setStudentToDelete(null)} title="Confirm Student Deletion">
                <div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        Are you sure you want to delete <strong className="text-secondary-800 dark:text-secondary-200">{studentToDelete?.name}</strong>? This action cannot be undone.
                    </p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setStudentToDelete(null)} className="btn-secondary">Cancel</button>
                        <button type="button" onClick={handleDeleteStudent} className="btn-danger">Delete</button>
                    </div>
                </div>
            </Modal>

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Student Management</h1>
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary">
                                <UploadIcon className="w-4 h-4" /> Import CSV
                            </button>
                        )}
                        <button onClick={handleExport} className="btn-secondary">
                            <DownloadIcon className="w-4 h-4" /> Export CSV
                        </button>
                        {canEdit && <button onClick={() => handleOpenModal()} className="btn-primary">+ Add Student</button>}
                    </div>
                </div>

                <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <input type="text" placeholder="Search by name or roll no..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field" />
                        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input-field">
                            <option value="all">All Classes</option>
                            {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="input-field">
                            <option value="all">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Left">Left</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                    {loading ? (
                        <TableSkeleton columns={[
                            { width: '35%' }, { width: '15%' }, { width: '20%' }, { width: '15%' }, { width: '15%' }
                        ]} rows={STUDENTS_PER_PAGE} />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-secondary-500 dark:text-secondary-400">
                                    <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                                        <tr>
                                            <th className="px-6 py-3">Student</th>
                                            <th className="px-6 py-3">Roll No.</th>
                                            <th className="px-6 py-3">Class</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedStudents.map(student => (
                                            <tr key={student.id} className="bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <Avatar student={student} className="h-10 w-10" />
                                                        <div>
                                                            <div className="font-semibold text-secondary-900 dark:text-white">{student.name}</div>
                                                            <div className="text-xs text-secondary-500">{student.fatherName}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">{student.rollNumber}</td>
                                                <td className="px-6 py-4">{classMap.get(student.classId) || 'N/A'}</td>
                                                <td className="px-6 py-4"><Badge color={student.status === 'Active' ? 'green' : 'secondary'}>{student.status}</Badge></td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-4">
                                                        <button onClick={() => setActiveView({ view: 'studentProfile', payload: { studentId: student.id }})} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">View</button>
                                                        {canEdit && (
                                                            <button onClick={() => handleOpenModal(student)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Edit</button>
                                                        )}
                                                        {canDelete && (
                                                            <button onClick={() => setStudentToDelete(student)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredStudents.length > 0 && (
                                <div className="flex justify-between items-center p-4 border-t dark:border-secondary-700">
                                    <span className="text-sm text-secondary-700 dark:text-secondary-400">
                                        Showing {showingFrom} - {showingTo} of {filteredStudents.length} students
                                    </span>
                                    {totalPages > 1 && (
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1 text-sm font-medium text-secondary-600 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-sm text-secondary-700 dark:text-secondary-400">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="px-3 py-1 text-sm font-medium text-secondary-600 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default StudentManagementPage;