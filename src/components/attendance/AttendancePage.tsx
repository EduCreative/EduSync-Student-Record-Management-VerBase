import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import Avatar from '../common/Avatar';
import AttendanceViewer from './AttendanceViewer';

type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

const AttendanceMarker: React.FC = () => {
    const { user, effectiveRole, activeSchoolId } = useAuth();
    const { classes, students, attendance, setAttendance } = useData();
    const [isSaving, setIsSaving] = useState(false);

    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceStatus>>(new Map());

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;

    const userClasses = useMemo(() => {
        if (!user) return [];
        if (effectiveRole === UserRole.Teacher) {
            return classes.filter(c => c.schoolId === effectiveSchoolId && c.teacherId === user.id);
        }
        return classes.filter(c => c.schoolId === effectiveSchoolId);
    }, [classes, user, effectiveRole, effectiveSchoolId]);

    const studentsInClass = useMemo(() => {
        if (!selectedClassId) return [];
        return students.filter(s => s.classId === selectedClassId && s.status === 'Active');
    }, [students, selectedClassId]);
    
    useEffect(() => {
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

    const statuses: AttendanceStatus[] = ['Present', 'Absent', 'Leave'];
    const handleStatusChange = (studentId: string) => {
        setAttendanceRecords(prev => {
            const newRecords = new Map(prev);
            const currentStatus = newRecords.get(studentId);
            const currentIndex = currentStatus ? statuses.indexOf(currentStatus) : -1;
            const nextIndex = (currentIndex + 1) % statuses.length;
            newRecords.set(studentId, statuses[nextIndex]);
            return newRecords;
        });
    };
    
    const markAllAs = (status: AttendanceStatus) => {
        const newRecords = new Map<string, AttendanceStatus>();
        studentsInClass.forEach(student => {
            newRecords.set(student.id, status);
        });
        setAttendanceRecords(newRecords);
    };

    const handleSaveAttendance = async () => {
        setIsSaving(true);
        try {
            const recordsToSave = Array.from(attendanceRecords.entries()).map(([studentId, status]) => ({
                studentId,
                status,
            }));
            await setAttendance(selectedDate, recordsToSave);
        } catch (error) {
            console.error("Failed to save attendance:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Mark Attendance</h1>
            
            <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="class-select" className="input-label">Select Class</label>
                        <select id="class-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="input-field">
                            <option value="">-- Choose a class --</option>
                            {userClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="date-select" className="input-label">Select Date</label>
                        <input type="date" id="date-select" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input-field" />
                    </div>
                </div>
            </div>

            {selectedClassId && (
                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                    <div className="p-4 border-b dark:border-secondary-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <h2 className="font-semibold">Student List ({studentsInClass.length})</h2>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => markAllAs('Present')} className="btn-secondary px-3 py-1 text-xs">Mark All Present</button>
                            <button onClick={() => markAllAs('Absent')} className="btn-secondary px-3 py-1 text-xs">Mark All Absent</button>
                            <button onClick={() => markAllAs('Leave')} className="btn-secondary px-3 py-1 text-xs">Mark All Leave</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                                <tr>
                                    <th className="px-6 py-3 text-left">Student</th>
                                    <th className="px-6 py-3 text-left">Roll No</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentsInClass.map(student => {
                                    const status = attendanceRecords.get(student.id);
                                    const statusClass = status ? `btn-${status.toLowerCase()}` : 'bg-secondary-200 dark:bg-secondary-600';
                                    return (
                                        <tr key={student.id} className="border-b dark:border-secondary-700">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center space-x-3">
                                                    <Avatar student={student} className="w-8 h-8"/>
                                                    <span className="font-medium text-secondary-900 dark:text-white">{student.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">{student.rollNumber}</td>
                                            <td className="px-6 py-3">
                                                <div className="flex justify-center">
                                                    <button 
                                                        onClick={() => handleStatusChange(student.id)}
                                                        className={`px-3 py-1 text-sm rounded-md transition-colors w-24 text-center ${statusClass}`}
                                                    >
                                                        {status || '...'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 flex justify-end">
                        <button onClick={handleSaveAttendance} disabled={isSaving} className="btn-primary">
                            {isSaving ? 'Saving...' : 'Save Attendance'}
                        </button>
                    </div>
                </div>
            )}
             <style>{`
                .btn-present { @apply bg-green-500 text-white hover:bg-green-600; }
                .btn-absent { @apply bg-red-500 text-white hover:bg-red-600; }
                .btn-leave { @apply bg-yellow-500 text-white hover:bg-yellow-600; }
            `}</style>
        </div>
    );
};


const AttendancePage: React.FC = () => {
    const { effectiveRole } = useAuth();
    
    const isMarker = effectiveRole === UserRole.Admin || effectiveRole === UserRole.Teacher;

    if (isMarker) {
        return <AttendanceMarker />;
    } else {
        return <AttendanceViewer />;
    }
};

export default AttendancePage;