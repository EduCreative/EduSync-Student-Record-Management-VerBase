
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Student, UserRole } from '../../types';
import Modal from '../users/Modal';
import StudentFormModal from './StudentFormModal';
import { PrinterIcon } from '../../constants';
import { ActiveView } from '../layout/Layout';
import Avatar from '../common/Avatar';
import ReportHeader from '../reports/ReportHeader';
import { usePrint } from '../../context/PrintContext';

interface StudentManagementPageProps {
    setActiveView: (view: ActiveView) => void;
}

const StudentManagementPage: React.FC<StudentManagementPageProps> = ({ setActiveView }) => {
    const { user: currentUser, activeSchoolId } = useAuth();
    const { students, classes, addStudent, updateStudent, deleteStudent, feeHeads } = useData();
    const { showPrintPreview } = usePrint();
    
    const effectiveSchoolId = currentUser?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : currentUser?.schoolId;

    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const STUDENTS_PER_PAGE = 10;

    const schoolClasses = useMemo(() => {
        return classes.filter(c => c.schoolId === effectiveSchoolId);
    }, [classes, effectiveSchoolId]);

    const schoolFeeHeads = useMemo(() => feeHeads.filter(fh => fh.schoolId === effectiveSchoolId), [feeHeads, effectiveSchoolId]);

    const filteredStudents = useMemo(() => {
        return students
            .filter(student => {
                if (student.schoolId !== effectiveSchoolId) return false;
                if (classFilter !== 'all' && student.classId !== classFilter) return false;
                if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase()) && !student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                return true;
            });
    }, [students, effectiveSchoolId, searchTerm, classFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, classFilter]);

    const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);
    const paginatedStudents = useMemo(() => {
        const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE;
        return filteredStudents.slice(startIndex, startIndex + STUDENTS_PER_PAGE);
    }, [filteredStudents, currentPage]);

    const handleOpenModal = (student: Student | null = null) => {
        setStudentToEdit(student);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setStudentToEdit(null);
        setIsModalOpen(false);
    };

    const handleSaveStudent = (studentData: Student | Omit<Student, 'id' | 'status'>) => {
        if ('id' in studentData) {
            updateStudent(studentData as Student);
        } else {
            addStudent(studentData as Omit<Student, 'id' | 'status'>);
        }
    };

    const handleDeleteStudent = () => {
        if (studentToDelete) {
            deleteStudent(studentToDelete.id);
            setStudentToDelete(null);
        }
    };

    const handleExportCsv = () => {
        const classMap = new Map(schoolClasses.map(c => [c.id, c.name]));
        const feeHeadCols = schoolFeeHeads.map(fh => fh.name);
        const feeHeadIdToNameMap = new Map(schoolFeeHeads.map(fh => [fh.id, fh.name]));

        const headers = [
            "ID", "Name", "Class", "Roll Number", "Status", "Gender", "Father's Name", "Father's CNIC",
            "Date of Birth", "Date of Admission", "Contact (Primary)", "Contact (Secondary)", "Address",
            "Opening Balance", "Last School Attended", "Admitted In Class", "Caste", ...feeHeadCols
        ];

        const rows = filteredStudents.map(student => {
            const feeAmounts = new Map(student.feeStructure?.map(f => [feeHeadIdToNameMap.get(f.feeHeadId), f.amount]));
            const feeValues = feeHeadCols.map(colName => feeAmounts.get(colName) || '');

            return [
                student.id,
                student.name,
                classMap.get(student.classId) || 'N/A',
                student.rollNumber,
                student.status,
                student.gender,
                student.fatherName,
                student.fatherCnic,
                student.dateOfBirth,
                student.dateOfAdmission,
                student.contactNumber,
                student.secondaryContactNumber || '',
                student.address,
                student.openingBalance || 0,
                student.lastSchoolAttended || '',
                student.admittedInClass || '',
                student.caste || '',
                ...feeValues
            ];
        });

        const processRow = (row: (string|number)[]) => row.map(val => {
            const strVal = String(val ?? '').replace(/"/g, '""');
            return `"${strVal}"`;
        }).join(',');

        const csvContent = [headers, ...rows].map(processRow).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `students-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        const printContent = (
             <div className="p-4 bg-white">
                <ReportHeader 
                    title="Student List" 
                    filters={{ 
                        "Class": classFilter === 'all' ? 'All Classes' : schoolClasses.find(c => c.id === classFilter)?.name || '' 
                    }} 
                />
                <table className="w-full text-sm text-left text-secondary-500 dark:text-secondary-400">
                    <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Student</th>
                            <th scope="col" className="px-6 py-3">Father's Name</th>
                            <th scope="col" className="px-6 py-3">Roll Number</th>
                            <th scope="col" className="px-6 py-3">Class</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map(student => (
                            <tr key={student.id} className="bg-white dark:bg-secondary-800 border-b dark:border-secondary-700">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <Avatar student={student} className="h-10 w-10" />
                                        <span className="font-semibold text-secondary-900 dark:text-white">{student.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{student.fatherName}</td>
                                <td className="px-6 py-4">{student.rollNumber}</td>
                                <td className="px-6 py-4">{schoolClasses.find(c => c.id === student.classId)?.name || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
        showPrintPreview(printContent, "Student List Preview");
    };
    
    const showingFrom = filteredStudents.length > 0 ? (currentPage - 1) * STUDENTS_PER_PAGE + 1 : 0;
    const showingTo = Math.min(currentPage * STUDENTS_PER_PAGE, filteredStudents.length);

    const FileDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M12 18v-6"/>
            <path d="m15 15-3 3-3-3"/>
        </svg>
    );
    
    return (
        <>
            <StudentFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveStudent} studentToEdit={studentToEdit} />
            <Modal isOpen={!!studentToDelete} onClose={() => setStudentToDelete(null)} title="Confirm Student Deletion">
                <div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        Are you sure you want to permanently delete the student{' '}
                        <strong className="text-secondary-800 dark:text-secondary-200">{studentToDelete?.name}</strong>?
                        This will remove all associated records.
                    </p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setStudentToDelete(null)} className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg">Cancel</button>
                        <button type="button" onClick={handleDeleteStudent} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg">Delete</button>
                    </div>
                </div>
            </Modal>

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Student Management</h1>
                    <div className="flex items-center gap-2">
                         <button onClick={handlePrint} className="bg-secondary-200 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary-300 dark:hover:bg-secondary-600 transition flex items-center gap-2">
                           <PrinterIcon className="w-4 h-4" /> Print List
                        </button>
                        <button onClick={handleExportCsv} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-800 transition flex items-center gap-2">
                            <FileDownIcon className="w-4 h-4" /> Export to CSV
                        </button>
                        <button onClick={() => handleOpenModal()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition">
                            + Add Student
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md no-print">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                            <label htmlFor="search-student" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Search Students</label>
                             <div className="absolute inset-y-0 left-0 top-6 flex items-center pl-3 pointer-events-none">
                                <svg className="w-5 h-5 text-secondary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input
                                id="search-student"
                                type="text"
                                placeholder="By name or roll number..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full p-2 pl-10 border rounded-md dark:bg-secondary-700 dark:border-secondary-600"
                            />
                        </div>
                        <div>
                            <label htmlFor="class-filter" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Class</label>
                            <select id="class-filter" value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full p-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600">
                                <option value="all">All Classes</option>
                                {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md printable-area">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-secondary-500 dark:text-secondary-400">
                            <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Student</th>
                                    <th scope="col" className="px-6 py-3">Father's Name</th>
                                    <th scope="col" className="px-6 py-3">Roll Number</th>
                                    <th scope="col" className="px-6 py-3">Class</th>
                                    <th scope="col" className="px-6 py-3 no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedStudents.map(student => (
                                    <tr key={student.id} className="bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <Avatar student={student} className="h-10 w-10" />
                                                <button onClick={() => setActiveView({ view: 'studentProfile', payload: { studentId: student.id } })} className="font-semibold text-secondary-900 dark:text-white hover:underline text-left">
                                                    {student.name}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{student.fatherName}</td>
                                        <td className="px-6 py-4">{student.rollNumber}</td>
                                        <td className="px-6 py-4">{schoolClasses.find(c => c.id === student.classId)?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap no-print">
                                            <div className="flex items-center space-x-4">
                                                <button onClick={() => handleOpenModal(student)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Edit</button>
                                                <button onClick={() => setStudentToDelete(student)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between items-center p-4 border-t dark:border-secondary-700 no-print">
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
                </div>
            </div>
        </>
    );
};

export default StudentManagementPage;
