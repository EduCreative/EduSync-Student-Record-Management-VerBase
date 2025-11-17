import React, { useState, useMemo } from 'react';
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

    const canManage = hasPermission(Permission.CAN_MANAGE_FEES);
    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    
    const filteredStudents = useMemo(() => {
        if (!searchTerm) return [];
        return students.filter((s: Student) =>
            s.schoolId === effectiveSchoolId &&
            (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNumber.includes(searchTerm))
        ).slice(0, 10); // Limit results for performance
    }, [students, searchTerm, effectiveSchoolId]);

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
    
    const classMap = useMemo(() => new Map(classes.map((c: Class) => [c.id, c.name])), [classes]);

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

        const hasOutstandingChallans = fees.some(
            (f: FeeChallan) => f.studentId === student.id && (f.status === 'Unpaid' || f.status === 'Partial')
        );
        
        // If student has fees to pay, show them by default. Otherwise, show all history.
        setStatusFilter(hasOutstandingChallans ? 'outstanding' : 'all');
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2 relative">
                        <label htmlFor="student-search" className="input-label">Search Student by Name or Student ID</label>
                        <input
                            id="student-search"
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="input-field"
                            placeholder="e.g., Ali Ahmed or 101"
                        />
                        {searchTerm && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-secondary-800 border dark:border-secondary-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map(student => (
                                        <button
                                            key={student.id}
                                            onClick={() => handleSelectStudent(student)}
                                            className="w-full text-left px-4 py-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center space-x-3"
                                        >
                                            <Avatar student={student} className="w-8 h-8"/>
                                            <div>
                                                <p className="font-medium">{student.name}</p>
                                                <p className="text-xs text-secondary-500">Student ID: {student.rollNumber} - Class: {classMap.get(student.classId)}</p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <p className="p-4 text-sm text-secondary-500">No students found.</p>
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="status-filter" className="input-label">Challan Status</label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as any)}
                            className="input-field"
                        >
                            <option value="outstanding">Outstanding</option>
                            <option value="all">All</option>
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                            <option value="Partial">Partial</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
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
                        <p className="text-xs text-secondary-500 mt-1">Sets the default date for new payments in this session.</p>
                    </div>
                </div>


                {selectedStudent && (
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
                                <button onClick={() => setSelectedStudent(null)} className="text-sm text-primary-600 hover:underline">Clear Selection</button>
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
