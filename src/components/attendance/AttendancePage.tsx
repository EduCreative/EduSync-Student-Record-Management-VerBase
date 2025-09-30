
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Student, Attendance, UserRole } from '../../types.ts';
import Avatar from '../common/Avatar.tsx';

type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

const AttendancePage: React.FC = () => {
    const { user, effectiveRole } = useAuth();
    const { classes, students, attendance, setAttendance } = useData();

    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceStatus>>(new Map());

    const userClasses = useMemo(() => {
        if (!user) return [];
        if (effectiveRole === UserRole.Teacher) {
            return classes.filter(c => c.teacherId === user.id);
        }
        return classes.filter(c => c.schoolId === user.schoolId);
    }, [classes, user, effectiveRole]);

    const studentsInClass = useMemo(() => {
        if (!selectedClassId) return [];
        return students.filter(s => s.classId === selectedClassId && s.status === 'Active');
    }, [students, selectedClassId]);
    
    useEffect(() => {
        // Set a default selected class if available
        if (userClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(userClasses[0].id);
        }
    }, [userClasses, selectedClassId]);

    useEffect(() => {
        const newRecords = new Map<string, AttendanceStatus>();
        const recordsForDate = attendance.filter(a => a.date === selectedDate);
        
        studentsInClass.forEach(student => {
            const existingRecord = recordsForDate.find(a => a.studentId === student.id);
            newRecords.set(student.id, existingRecord ? existingRecord.status : 'Present');
        });
        setAttendanceRecords(newRecords);
    }, [selectedClassId, selectedDate, studentsInClass, attendance]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendanceRecords(prev => new Map(prev).set(studentId, status));
    };
    
    const markAllAs = (status: AttendanceStatus) => {
        const newRecords = new Map<string, AttendanceStatus>();
        studentsInClass.forEach(student => {
            newRecords.set(student.id, status);
        });
        setAttendanceRecords(newRecords);
    };

    const handleSaveAttendance = () => {
        const recordsToSave = Array.from(attendanceRecords.entries()).map(([studentId, status]) => ({
            studentId,
            status,
        }));
        setAttendance(selectedDate, recordsToSave);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Mark Attendance</h1>
            
            <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="class-select" className="input-label">Select Class</label>
                        <select id="class-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="input-style">
                            {userClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="date-select" className="input-label">Select Date</label>
                        <input type="date" id="date-select" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input-style" />
                    </div>
                </div>
            </div>

            {selectedClassId && (
                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                    <div className="p-4 border-b dark:border-secondary-700 flex justify-between items-center">
                        <h2 className="font-semibold">Student List ({studentsInClass.length})</h2>
                        <div className="flex space-x-2">
                            <button onClick={() => markAllAs('Present')} className="btn-secondary btn-sm">Mark All Present</button>
                            <button onClick={() => markAllAs('Absent')} className="btn-secondary btn-sm">Mark All Absent</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                                <tr>
                                    <th className="px-6 py-3">Student</th>
                                    <th className="px-6 py-3">Roll No</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentsInClass.map(student => (
                                    <tr key={student.id} className="border-b dark:border-secondary-700">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center space-x-3">
                                                <Avatar student={student} className="w-8 h-8"/>
                                                <span className="font-medium text-secondary-900 dark:text-white">{student.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">{student.rollNumber}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex justify-center space-x-1 sm:space-x-2">
                                                {(['Present', 'Absent', 'Leave'] as AttendanceStatus[]).map(status => (
                                                    <button 
                                                        key={status}
                                                        onClick={() => handleStatusChange(student.id, status)}
                                                        className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-all ${attendanceRecords.get(student.id) === status ? `btn-${status.toLowerCase()}` : 'bg-secondary-200 dark:bg-secondary-600 hover:bg-secondary-300'}`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 flex justify-end">
                        <button onClick={handleSaveAttendance} className="btn-primary">Save Attendance</button>
                    </div>
                </div>
            )}
             <style>{`
                .input-label { @apply block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1; }
                .input-style { @apply w-full p-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600; }
                .btn-primary { @apply px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg; }
                .btn-secondary { @apply px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg; }
                .btn-sm { @apply px-3 py-1 text-xs; }
                .btn-present { @apply bg-green-500 text-white; }
                .btn-absent { @apply bg-red-500 text-white; }
                .btn-leave { @apply bg-yellow-500 text-white; }
            `}</style>
        </div>
    );
};

export default AttendancePage;
