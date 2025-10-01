import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Student, UserRole, FeeChallan } from '../../types';
import Avatar from '../common/Avatar';
import FeePaymentModal from './FeePaymentModal';
import { formatDate } from '../../constants';
import Badge from '../common/Badge';

const FeeCollectionPage: React.FC = () => {
    const { user, activeSchoolId } = useAuth();
    const { students, fees, classes } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [challanToPay, setChallanToPay] = useState<FeeChallan | null>(null);

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    
    const filteredStudents = useMemo(() => {
        if (!searchTerm) return [];
        return students.filter(s =>
            s.schoolId === effectiveSchoolId &&
            (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNumber.includes(searchTerm))
        ).slice(0, 10); // Limit results for performance
    }, [students, searchTerm, effectiveSchoolId]);

    const studentChallans = useMemo(() => {
        if (!selectedStudent) return [];
        return fees
            .filter(f => f.studentId === selectedStudent.id && (f.status === 'Unpaid' || f.status === 'Partial'))
            .sort((a, b) => new Date(a.year, months.indexOf(a.month)).getTime() - new Date(b.year, months.indexOf(b.month)).getTime());
    }, [fees, selectedStudent]);
    
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        setSearchTerm('');
    };
    
    const getStatusColor = (status: FeeChallan['status']) => {
        if (status === 'Paid') return 'green';
        if (status === 'Unpaid') return 'red';
        return 'yellow';
    }

    return (
        <>
            {challanToPay && selectedStudent && (
                <FeePaymentModal
                    isOpen={!!challanToPay}
                    onClose={() => setChallanToPay(null)}
                    challan={challanToPay}
                    student={selectedStudent}
                />
            )}
            <div className="p-4 sm:p-6 space-y-4">
                <div className="relative">
                    <label htmlFor="student-search" className="input-label">Search Student by Name or Roll Number</label>
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
                                            <p className="text-xs text-secondary-500">Roll: {student.rollNumber} - Class: {classMap.get(student.classId)}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="p-4 text-sm text-secondary-500">No students found.</p>
                            )}
                        </div>
                    )}
                </div>

                {selectedStudent && (
                    <div className="border-t dark:border-secondary-700 pt-4">
                        <div className="flex justify-between items-center mb-4">
                             <h2 className="text-xl font-semibold">Outstanding Challans for {selectedStudent.name}</h2>
                             <button onClick={() => setSelectedStudent(null)} className="text-sm text-primary-600 hover:underline">Clear Selection</button>
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
                                        <button onClick={() => setChallanToPay(challan)} className="btn-primary">
                                            Record Payment
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                                    <p>No outstanding fee challans found for this student.</p>
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
