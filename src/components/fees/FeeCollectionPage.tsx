import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Student, UserRole, FeeChallan, Class } from '../../types';
import Avatar from '../common/Avatar';
import FeePaymentModal from './FeePaymentModal';
import { formatDate } from '../../constants';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { Permission } from '../../permissions';
import SingleChallanGenerationModal from './SingleChallanGenerationModal';

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const FeeCollectionPage: React.FC = () => {
    const { user, activeSchoolId, hasPermission } = useAuth();
    const { students, fees, classes, cancelChallan } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [challanToManage, setChallanToManage] = useState<{ challan: FeeChallan, mode: 'pay' | 'edit' } | null>(null);
    const [challanToCancel, setChallanToCancel] = useState<FeeChallan | null>(null);
    const [sessionDate, setSessionDate] = useState(getTodayString());
    const [statusFilter, setStatusFilter] = useState<'outstanding' | 'all' | FeeChallan['status']>('outstanding');
    const [isSingleChallanModalOpen, setIsSingleChallanModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const STUDENTS_PER_PAGE = 15;

    const canManage = hasPermission(Permission.CAN_MANAGE_FEES);
    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;

    const classMap = useMemo(() => new Map(classes.map((c: Class) => [c.id, c.name])), [classes]);

    const studentBalanceMap = useMemo(() => {
        const balanceMap = new Map<string, number>();

        const feesByStudent = fees.reduce((acc, fee) => {
            if (fee.status !== 'Cancelled') {
                if (!acc[fee.studentId]) {
                    acc[fee.studentId] = [];
                }
                acc[fee.studentId].push(fee);
            }
            return acc;
        }, {} as Record<string, FeeChallan[]>);

        students.forEach(student => {
            if (student.schoolId !== effectiveSchoolId || student.status !== 'Active') return;

            const studentFees = feesByStudent[student.id] || [];
            
            const totalNewFees = studentFees.reduce((sum, challan) => {
                const newFee = (challan.totalAmount || 0) - (challan.previousBalance || 0);
                return sum + newFee;
            }, 0);
            
            const totalPaid = studentFees.reduce((sum, challan) => sum + (challan.paidAmount || 0), 0);
            const totalDiscount = studentFees.reduce((sum, challan) => sum + (challan.discount || 0), 0);
            const openingBalance = student.openingBalance || 0;

            const balance = openingBalance + totalNewFees - totalPaid - totalDiscount;
            
            balanceMap.set(student.id, balance);
        });
    
        return balanceMap;
    }, [students, fees, effectiveSchoolId]);

    const defaulterList = useMemo(() => {
        return students.filter(s => {
            const balance = studentBalanceMap.get(s.id);
            return s.schoolId === effectiveSchoolId && s.status === 'Active' && balance && balance > 0;
        });
    }, [students, studentBalanceMap, effectiveSchoolId]);

    const filteredDefaulters = useMemo(() => {
        let sorted = [...defaulterList];

        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            sorted = sorted.filter(s =>
                s.name.toLowerCase().includes(lowerSearchTerm) || s.rollNumber.includes(lowerSearchTerm)
            );

            // Sorting logic as requested by user
            const isNumericSearch = /^\d+$/.test(searchTerm.trim());
            if (isNumericSearch) {
                sorted.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }));
            } else {
                sorted.sort((a, b) => a.name.localeCompare(b.name));
            }
        } else {
            // Default sort when no search term
            sorted.sort((a, b) => (studentBalanceMap.get(b.id) ?? 0) - (studentBalanceMap.get(a.id) ?? 0));
        }

        return sorted;
    }, [defaulterList, searchTerm, studentBalanceMap]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredDefaulters.length / STUDENTS_PER_PAGE);
    const paginatedStudents = useMemo(() => {
        const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE;
        return filteredDefaulters.slice(startIndex, startIndex + STUDENTS_PER_PAGE);
    }, [filteredDefaulters, currentPage]);


    const studentChallans = useMemo(() => {
        if (!selectedStudent) return [];
        return fees
            .filter((f: FeeChallan) => {
                if (f.studentId !== selectedStudent.id) return false;
            
                if (statusFilter === 'outstanding') {
                    return f.status === 'Unpaid' || f.status === 'Partial';
                }
                if (statusFilter === 'all') {
                    return true;
                }
                return f.status === statusFilter;
            })
            .sort((a, b) => new Date(b.year, months.indexOf(b.month)).getTime() - new Date(a.year, months.indexOf(a.month)).getTime());
    }, [fees, selectedStudent, statusFilter]);
    
    const hasCurrentMonthChallan = useMemo(() => {
        if (!selectedStudent) return false;
        const currentMonthStr = months[new Date().getMonth()];
        const currentYearNum = new Date().getFullYear();
        return fees.some(f => 
            f.studentId === selectedStudent.id && 
            f.month === currentMonthStr && 
            f.year === currentYearNum &&
            f.status !== 'Cancelled'
        );
    }, [selectedStudent, fees]);

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        setSearchTerm('');
        setStatusFilter('outstanding');
    };
    
    const getStatusColor = (status: FeeChallan['status']) => {
        if (status === 'Paid') return 'green';
        if (status === 'Unpaid') return 'red';
        if (status === 'Cancelled') return 'secondary';
        return 'yellow'; // Partial
    }

    const handleConfirmCancel = async () => {
        if (challanToCancel) {
            await cancelChallan(challanToCancel.id);
            setChallanToCancel(null);
        }
    };
    
    const headingText = {
        'outstanding': 'Outstanding Challans for',
        'all': 'All Challans for',
        'Paid': 'Paid Challans for',
        'Unpaid': 'Unpaid Challans for',
        'Partial': 'Partially Paid Challans for',
        'Cancelled': 'Cancelled Challans for'
    }[statusFilter];

    const showingFrom = filteredDefaulters.length > 0 ? (currentPage - 1) * STUDENTS_PER_PAGE + 1 : 0;
    const showingTo = Math.min(currentPage * STUDENTS_PER_PAGE, filteredDefaulters.length);

    return (
        <>
            {challanToManage && selectedStudent && (
                <FeePaymentModal
                    isOpen={!!challanToManage}
                    onClose={() => setChallanToManage(null)}
                    challan={challanToManage.challan}
                    student={selectedStudent}
                    editMode={challanToManage.mode === 'edit'}
                    defaultDate={sessionDate}
                />
            )}
            {selectedStudent && (
                <SingleChallanGenerationModal
                    isOpen={isSingleChallanModalOpen}
                    onClose={() => setIsSingleChallanModalOpen(false)}
                    student={selectedStudent}
                />
            )}
            {challanToCancel && (
                <Modal
                    isOpen={!!challanToCancel}
                    onClose={() => setChallanToCancel(null)}
                    title="Confirm Challan Cancellation"
                >
                    <p>Are you sure you want to cancel the challan for <strong>{challanToCancel.month} {challanToCancel.year}</strong>? This action cannot be undone.</p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setChallanToCancel(null)} className="btn-secondary">Back</button>
                        <button type="button" onClick={handleConfirmCancel} className="btn-danger">Confirm Cancel</button>
                    </div>
                </Modal>
            )}
            <div className="p-4 sm:p-6 space-y-4">
                {!selectedStudent ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="student-search" className="input-label">Search Outstanding Students</label>
                                <input
                                    id="student-search"
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="input-field"
                                    placeholder="By name or student ID..."
                                />
                            </div>
                            <div>
                                <label htmlFor="session-date" className="input-label">Default Payment Date</label>
                                <input
                                    id="session-date"
                                    type="date"
                                    value={sessionDate}
                                    onChange={e => setSessionDate(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md mt-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                                        <tr>
                                            <th className="px-6 py-3">Student</th>
                                            <th className="px-6 py-3">Class</th>
                                            <th className="px-6 py-3 text-right">Outstanding Balance</th>
                                            <th className="px-6 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-secondary-700">
                                        {paginatedStudents.map(student => (
                                            <tr key={student.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar student={student} className="w-9 h-9" />
                                                        <div>
                                                            <p className="font-medium">{student.name}</p>
                                                            <p className="text-xs text-secondary-500">ID: {student.rollNumber}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">{classMap.get(student.classId)}</td>
                                                <td className="px-6 py-3 text-right font-semibold text-red-600 dark:text-red-400">
                                                    Rs. {(studentBalanceMap.get(student.id) ?? 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <button onClick={() => handleSelectStudent(student)} className="font-medium text-primary-600 hover:underline">
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 0 && (
                                <div className="flex justify-between items-center p-4 border-t dark:border-secondary-700">
                                    <span className="text-sm text-secondary-700 dark:text-secondary-400">
                                        Showing {showingFrom} - {showingTo} of {filteredDefaulters.length} students
                                    </span>
                                    {totalPages > 1 && (
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary text-sm">Prev</button>
                                            <span className="text-sm px-2">{currentPage} of {totalPages}</span>
                                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-secondary text-sm">Next</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="border-t dark:border-secondary-700 pt-4">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                             <h2 className="text-xl font-semibold">
                                {headingText} {selectedStudent.name} <span className="text-sm font-normal text-secondary-500">(ID: {selectedStudent.rollNumber})</span>
                            </h2>
                             <div className="flex items-center gap-4">
                                {!hasCurrentMonthChallan && canManage && (
                                    <button onClick={() => setIsSingleChallanModalOpen(true)} className="btn-primary text-sm">
                                        + Generate Challan for {months[new Date().getMonth()]}
                                    </button>
                                )}
                                <button onClick={() => setSelectedStudent(null)} className="text-sm text-primary-600 hover:underline">&larr; Back to List</button>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            {studentChallans.length > 0 ? (
                                studentChallans.map(challan => (
                                    <div key={challan.id} className="p-4 border dark:border-secondary-700 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold">{challan.month} {challan.year}</h3>
                                                <Badge color={getStatusColor(challan.status)}>{challan.status}</Badge>
                                            </div>
                                            <p className="text-sm text-secondary-500">Due: {formatDate(challan.dueDate)} | Total: Rs. {(challan.totalAmount - challan.discount).toLocaleString()}</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                            {canManage && (challan.status === 'Unpaid' || challan.status === 'Partial') && (
                                                <button onClick={() => setChallanToManage({ challan, mode: 'pay' })} className="btn-primary flex-grow">
                                                    Record Payment
                                                </button>
                                            )}
                                            {canManage && (challan.status === 'Paid' || challan.status === 'Partial') && (
                                                <button onClick={() => setChallanToManage({ challan, mode: 'edit' })} className="btn-secondary flex-grow">
                                                    Edit Payment
                                                </button>
                                            )}
                                            {canManage && (challan.status === 'Unpaid' || challan.status === 'Partial') && (
                                                <button onClick={() => setChallanToCancel(challan)} className="btn-danger flex-grow">
                                                    Cancel
                                                </button>
                                            )}
                                            {challan.status === 'Cancelled' && (
                                                <span className="text-sm text-secondary-500 italic">No actions available</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                                    <p>No {statusFilter !== 'all' && statusFilter !== 'outstanding' ? statusFilter.toLowerCase() : ''} fee challans found for this student.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default FeeCollectionPage;
