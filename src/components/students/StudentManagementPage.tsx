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
    const { students, classes, addStudent, updateStudent, deleteStudent, loading, bulkAddStudents } = useData();

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
    
    const canManage = hasPermission(Permission.CAN_MANAGE_STUDENTS);
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
    
    const handleImportStudents = async (data: any[]) => {
        const studentsToImport = data.map(item => ({
            ...item,
            schoolId: effectiveSchoolId,
            openingBalance: Number(item.openingBalance) || 0,
        }));
        await bulkAddStudents(studentsToImport);
    };

    const sampleDataForImport = [{
        name: "Kamran Ahmed",
        rollNumber: "101",
        classId: schoolClasses[0]?.id || "paste_valid_class_id_here",
        fatherName: "Zulfiqar Ahmed",
        fatherCnic: "35202-1234567-1",
        dateOfBirth: "2010-05-15",
        dateOfAdmission: new Date().toISOString().split('T')[0],
        contactNumber: "0300-1234567",
        address: "123 School Lane, City",
        gender: "Male",
    }];

    const requiredHeaders = ['name', 'rollNumber', 'classId', 'fatherName', 'dateOfBirth', 'contactNumber'];

    const handleExport = () => {
        const dataToExport = filteredStudents.map(s => ({
            name: s.name,
            rollNumber: s.rollNumber,
            className: classMap.get(s.classId) || 'N/A',
            status: s.status,
            fatherName: s.fatherName,
            contactNumber: s.contactNumber,
            dateOfAdmission: s.dateOfAdmission,
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
                        {canManage && (
                            <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary">
                                <UploadIcon className="w-4 h-4" /> Import CSV
                            </button>
                        )}
                        <button onClick={handleExport} className="btn-secondary">
                            <DownloadIcon className="w-4 h-4" /> Export CSV
                        </button>
                        {canManage && <button onClick={() => handleOpenModal()} className="btn-primary">+ Add Student</button>}
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
                                                        {canManage && (
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
