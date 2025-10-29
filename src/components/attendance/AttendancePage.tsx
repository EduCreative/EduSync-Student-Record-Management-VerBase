import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
// FIX: Added Class and Student to imports for explicit typing.
import { UserRole, Attendance, Class, Student } from '../../types';
import Avatar from '../common/Avatar';
import AttendanceViewer from './AttendanceViewer';
import { useToast } from '../../context/ToastContext';
import AttendanceReportModal from '../reports/AttendanceReportModal';
import { PrinterIcon } from '../../constants';
import { getTodayString } from '../../utils/dateHelper';

type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

const AttendanceMarker: React.FC = () => {
    const { user, effectiveRole, activeSchoolId } = useAuth();
    const { classes, students, attendance, setAttendance } = useData();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedDate, setSelectedDate] = useState(getTodayString());
    const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceStatus>>(new Map());
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;

    const userClasses = useMemo(() => {
        if (!user) return [];
        if (effectiveRole === UserRole.Teacher) {
            // FIX: Explicitly type 'c' to ensure correct type inference.
            return classes.filter((c: Class) => c.schoolId === effectiveSchoolId && c.teacherId === user.id);
        }
        // FIX: Explicitly type 'c' to ensure correct type inference.
        return classes.filter((c: Class) => c.schoolId === effectiveSchoolId);
    }, [classes, user, effectiveRole, effectiveSchoolId]);

    const studentsInClass = useMemo(() => {
        if (!selectedClassId) return [];
        // FIX: Explicitly type 's' to ensure correct type inference.
        return students.filter((s: Student) => s.classId === selectedClassId && s.status === 'Active');
    }, [students, selectedClassId]);
    
    useEffect(() => {
        if (userClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(userClasses[0].id);
        }
    }, [userClasses, selectedClassId]);

    useEffect(() => {
        const newRecords = new Map<string, AttendanceStatus>();
        // FIX: Explicitly typed the 'a' parameter to ensure that recordsForDate is correctly typed as Attendance[], preventing type errors downstream.
        const recordsForDate = attendance.filter((a: Attendance) => a.date === selectedDate);
        
        studentsInClass.forEach(student => {
            const existingRecord = recordsForDate.find(a => a.studentId === student.id);
            newRecords.set(student.id, existingRecord ? existingRecord.status : 'Present');
        });
        setAttendanceRecords(newRecords);
    }, [selectedClassId, selectedDate, studentsInClass, attendance]);

    const statuses: AttendanceStatus[] = ['Present', 'Absent', 'Leave'];
    const handleStatusChange = (studentId: string, newStatus?: AttendanceStatus) => {
        // FIX: Explicitly typing `prev` prevents it from being inferred as `unknown`, resolving type errors within the callback.
        setAttendanceRecords((prev: Map<string, AttendanceStatus>) => {
            const newRecords = new Map(prev);
            if (newStatus) {
                // Direct set for mobile UI
                newRecords.set(studentId, newStatus);
            } else {
                // Cycle for desktop UI
                const currentStatus = newRecords.get(studentId);
                const currentIndex = currentStatus ? statuses.indexOf(currentStatus) : -1;
                const nextIndex = (currentIndex + 1) % statuses.length;
                newRecords.set(studentId, statuses[nextIndex] as AttendanceStatus);
            }
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

            const savePromise = setAttendance(selectedDate, recordsToSave);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Saving attendance timed out after 15 seconds.")), 15000)
            );

            await Promise.race([savePromise, timeoutPromise]);
        } catch (error: any) {
            console.error("Failed to save attendance:", error);
            showToast('Error', error.message || 'Could not save attendance. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper functions for styling
    const getStatusBtnClass = (status: AttendanceStatus | undefined) => {
        if (!status) return 'bg-secondary-200 dark:bg-secondary-600';
        return `btn-${status.toLowerCase()}`;
    };

    const getStatusRowClass = (status: AttendanceStatus | undefined) => {
        switch (status) {
            case 'Present': return 'bg-green-50 dark:bg-green-900/20';
            case 'Absent': return 'bg-red-50 dark:bg-red-900/20';
            case 'Leave': return 'bg-yellow-50 dark:bg-yellow-900/20';
            default: return 'bg-white dark:bg-secondary-800';
        }
    };

    return (
        <>
            <AttendanceReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Mark Attendance</h1>
                    <button onClick={() => setIsReportModalOpen(true)} className="btn-secondary">
                        <PrinterIcon className="w-4 h-4" />
                        Print Report
                    </button>
                </div>
                
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

                        {/* Desktop Table View */}
                        <div className="overflow-x-auto hidden md:block">
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
                                        return (
                                            <tr key={student.id} className={`border-b dark:border-secondary-700 transition-colors ${getStatusRowClass(status)}`}>
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
                                                            className={`px-3 py-1 text-sm rounded-md transition-colors w-24 text-center ${getStatusBtnClass(status)}`}
                                                            title="Click to cycle status (Present, Absent, Leave)"
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

                        {/* Mobile Card View */}
                        <div className="block md:hidden p-2 space-y-2">
                             {studentsInClass.map(student => {
                                const status = attendanceRecords.get(student.id);
                                return (
                                    <div key={student.id} className="p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg shadow-sm flex items-center justify-between">
                                        <div className="flex items-center space-x-3 overflow-hidden">
                                            <Avatar student={student} className="w-10 h-10 flex-shrink-0"/>
                                            <div className="overflow-hidden">
                                                <p className="font-medium text-secondary-900 dark:text-white truncate">{student.name}</p>
                                                <p className="text-xs text-secondary-500">Roll: {student.rollNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                                            {statuses.map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleStatusChange(student.id, s)}
                                                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full font-bold text-sm transition-all duration-150 flex items-center justify-center ${
                                                        status === s
                                                        ? `${getStatusBtnClass(s)} text-white shadow-md scale-110`
                                                        : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-secondary-300 dark:hover:bg-secondary-600'
                                                    }`}
                                                    aria-label={`Mark as ${s}`}
                                                    title={`Mark as ${s}`}
                                                >
                                                    {s[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>


                        <div className="p-4 flex justify-end border-t dark:border-secondary-700">
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
        </>
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