
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PrinterIcon, formatDate } from '../../constants';
import { UserRole } from '../../types';
import Avatar from '../common/Avatar';
import ReportHeader from '../reports/ReportHeader';
import { usePrint } from '../../context/PrintContext';

const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const AttendanceTaker: React.FC = () => {
    const { user, activeSchoolId } = useAuth();
    const { classes, students, attendance, setAttendance } = useData();
    const { showPrintPreview } = usePrint();

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;

    const [selectedDate, setSelectedDate] = useState<string>(formatDateForInput(new Date()));
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [attendanceStatus, setAttendanceStatus] = useState<Record<string, 'Present' | 'Absent' | 'Leave'>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === effectiveSchoolId), [classes, effectiveSchoolId]);

    useEffect(() => {
        if (schoolClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(schoolClasses[0].id);
        } else if (schoolClasses.length === 0) {
            setSelectedClassId('');
        }
    }, [schoolClasses, selectedClassId]);

    const studentsInClass = useMemo(() => {
        if (!selectedClassId) return [];
        return students.filter(s => s.classId === selectedClassId).sort((a, b) => a.name.localeCompare(b.name));
    }, [students, selectedClassId]);

    useEffect(() => {
        const newStatus: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
        studentsInClass.forEach(student => {
            const record = attendance.find(a => a.studentId === student.id && a.date === selectedDate);
            newStatus[student.id] = record ? record.status : 'Present';
        });
        setAttendanceStatus(newStatus);
        setIsDirty(false);
    }, [selectedClassId, selectedDate, studentsInClass, attendance]);

    const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Leave') => {
        setAttendanceStatus(prev => ({ ...prev, [studentId]: status }));
        setIsDirty(true);
    };

    const handleMarkAllPresent = () => {
        const newStatus: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
        studentsInClass.forEach(student => {
            newStatus[student.id] = 'Present';
        });
        setAttendanceStatus(newStatus);
        setIsDirty(true);
    };

    const handleSaveAttendance = () => {
        setIsLoading(true);
        const attendanceData = studentsInClass.map(student => ({
            studentId: student.id,
            status: attendanceStatus[student.id] || 'Present',
        }));
        
        setTimeout(() => {
            setAttendance(selectedDate, attendanceData);
            setIsLoading(false);
            setIsDirty(false);
        }, 500);
    };

    const handlePrint = () => {
        const printContent = (
            <div className="p-4 bg-white">
                <ReportHeader 
                    title="Attendance Sheet" 
                    filters={{ 
                        "Class": schoolClasses.find(c => c.id === selectedClassId)?.name || '', 
                        "Date": formatDate(selectedDate)
                    }} 
                />
                 <table className="w-full text-sm text-left text-secondary-500 dark:text-secondary-400">
                    <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Student</th>
                            <th scope="col" className="px-6 py-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsInClass.map(student => (
                            <tr key={student.id} className="bg-white dark:bg-secondary-800 border-b dark:border-secondary-700">
                                <td className="px-6 py-4">
                                     <div className="flex items-center space-x-3">
                                        <Avatar student={student} className="h-10 w-10" />
                                        <div>
                                            <div className="font-semibold text-secondary-900 dark:text-white">{student.name}</div>
                                            <div className="text-xs text-secondary-500">{student.gender === 'Male' ? 's/o' : 'd/o'} {student.fatherName}</div>
                                            <div className="text-xs text-secondary-500">Roll #: {student.rollNumber}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center font-semibold">
                                    {attendanceStatus[student.id]}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
        showPrintPreview(printContent, "Attendance Sheet Preview");
    };

    return (
        <div className="space-y-6">
            <div className="hidden print:block">
                <ReportHeader 
                    title="Attendance Sheet" 
                    filters={{ 
                        "Class": schoolClasses.find(c => c.id === selectedClassId)?.name || '', 
                        "Date": formatDate(selectedDate)
                    }} 
                />
            </div>
            <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md no-print">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label htmlFor="class-filter" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Select Class</label>
                        <select
                            id="class-filter"
                            value={selectedClassId}
                            onChange={e => setSelectedClassId(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600"
                        >
                            {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <label htmlFor="date-picker" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Select Date</label>
                        <input
                            id="date-picker"
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600"
                        />
                    </div>
                     <div className="lg:col-span-2 flex items-center justify-end space-x-2">
                         <button onClick={handleMarkAllPresent} className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg">
                            Mark All Present
                        </button>
                         <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary-200 hover:bg-secondary-300 dark:bg-secondary-700 dark:hover:bg-secondary-600 flex items-center gap-2">
                             <PrinterIcon className="w-4 h-4" /> Print
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md printable-area">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-secondary-500 dark:text-secondary-400">
                        <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">Student</th>
                                <th scope="col" className="px-6 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentsInClass.map(student => (
                                <tr key={student.id} className="bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <Avatar student={student} className="h-10 w-10" />
                                            <div>
                                                <div className="font-semibold text-secondary-900 dark:text-white">{student.name}</div>
                                                <div className="text-xs text-secondary-500">{student.gender === 'Male' ? 's/o' : 'd/o'} {student.fatherName}</div>
                                                <div className="text-xs text-secondary-500">Roll #: {student.rollNumber}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <fieldset className="no-print">
                                            <legend className="sr-only">Attendance status for {student.name}</legend>
                                            <div className="flex justify-center items-center gap-x-4 sm:gap-x-6">
                                                {(['Present', 'Absent', 'Leave'] as const).map(status => (
                                                    <div key={status} className="flex items-center">
                                                        <input
                                                            type="radio"
                                                            id={`status-${student.id}-${status}`}
                                                            name={`status-${student.id}`}
                                                            value={status}
                                                            checked={attendanceStatus[student.id] === status}
                                                            onChange={() => handleStatusChange(student.id, status)}
                                                            className={`w-4 h-4 focus:ring-2 ${
                                                                status === 'Present' ? 'text-green-600 focus:ring-green-500' :
                                                                status === 'Absent' ? 'text-red-600 focus:ring-red-500' :
                                                                'text-yellow-600 focus:ring-yellow-500'
                                                            }`}
                                                        />
                                                        <label htmlFor={`status-${student.id}-${status}`} className="ml-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">{status}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </fieldset>
                                        <div className="hidden print:block text-center font-semibold">
                                            {attendanceStatus[student.id]}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                             {studentsInClass.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="text-center py-8 text-secondary-500 dark:text-secondary-400">
                                        No students found in this class.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
             <div className="flex justify-end no-print">
                {studentsInClass.length > 0 && (
                    <button
                        onClick={handleSaveAttendance}
                        disabled={!isDirty || isLoading}
                        className="flex items-center justify-center bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading && (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isLoading ? 'Saving...' : 'Save Attendance'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default AttendanceTaker;
