
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Student, Attendance } from '../../types';
import { PrinterIcon } from '../../constants';
import ReportHeader from '../reports/ReportHeader';

const AttendanceViewer: React.FC = () => {
    const { user } = useAuth();
    const { students, attendance } = useData();

    const myChildren = useMemo(() => {
        if (!user) return [];
        if (user.role === 'Parent') {
            return students.filter(s => user.childStudentIds?.includes(s.id));
        }
        if (user.role === 'Student') {
            const studentProfile = students.find(s => s.userId === user.id);
            return studentProfile ? [studentProfile] : [];
        }
        return [];
    }, [user, students]);

    const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(myChildren[0]);
    const [currentDate, setCurrentDate] = useState(new Date());

    const studentAttendance = useMemo(() => {
        if (!selectedStudent) return new Map<string, Attendance['status']>();
        
        const records = attendance.filter(a => a.studentId === selectedStudent.id);
        return new Map(records.map(rec => [rec.date, rec.status]));
    }, [attendance, selectedStudent]);

    const handleMonthChange = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + offset);
            return newDate;
        });
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, currentDate.getMonth(), 1).getDay();

    const calendarDays = Array.from({ length: firstDayOfMonth }, () => null)
        .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
        
    const getStatusColor = (status?: Attendance['status']) => {
        if (!status) return 'bg-transparent';
        switch (status) {
            case 'Present': return 'bg-green-500 text-white';
            case 'Absent': return 'bg-red-500 text-white';
            case 'Leave': return 'bg-yellow-500 text-white';
            default: return 'bg-transparent';
        }
    };
    
    const attendanceSummary = useMemo(() => {
        const summary = { Present: 0, Absent: 0, Leave: 0 };
        studentAttendance.forEach((status, dateStr) => {
            const date = new Date(dateStr);
            if(date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear()){
                if (status in summary) summary[status]++;
            }
        });
        return summary;
    }, [studentAttendance, currentDate]);

    return (
        <div className="space-y-6">
            <div className="hidden print:block">
                <ReportHeader 
                    title="Attendance Report" 
                    filters={{ 
                        "Student": selectedStudent?.name || '', 
                        "Month": `${monthName} ${year}` 
                    }} 
                />
            </div>
            <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md no-print">
                 <div className="flex justify-between items-center">
                    {user?.role === 'Parent' && myChildren.length > 1 && (
                        <div>
                            <label htmlFor="student-select" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Viewing for:</label>
                            <select
                                id="student-select"
                                value={selectedStudent?.id || ''}
                                onChange={e => setSelectedStudent(myChildren.find(c => c.id === e.target.value))}
                                className="w-full max-w-xs p-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600"
                            >
                                {myChildren.map(child => <option key={child.id} value={child.id}>{child.name} ({child.gender === 'Male' ? 's/o' : 'd/o'} {child.fatherName})</option>)}
                            </select>
                        </div>
                    )}
                    <button onClick={() => window.print()} className="ml-auto bg-secondary-200 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary-300 dark:hover:bg-secondary-600 transition flex items-center gap-2">
                       <PrinterIcon className="w-4 h-4" /> Print Calendar
                    </button>
                 </div>
            </div>

            {!selectedStudent ? (
                <div className="bg-white dark:bg-secondary-800 p-8 rounded-xl shadow-lg text-center">
                    <p className="text-secondary-500 dark:text-secondary-400">Please select a student to view their attendance.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6 printable-area">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700 no-print">&lt;</button>
                        <h2 className="text-xl font-semibold">{monthName} {year}</h2>
                        <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700 no-print">&gt;</button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-sm text-secondary-500 dark:text-secondary-400 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day, index) => {
                            const dateStr = day ? `${year}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` : '';
                            const status = studentAttendance.get(dateStr);
                            return (
                                <div key={index} className={`w-full aspect-square flex items-center justify-center rounded-full ${day ? 'border dark:border-secondary-700' : ''} ${getStatusColor(status)}`}>
                                    {day}
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t dark:border-secondary-700 flex justify-center space-x-6">
                        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>Present: {attendanceSummary.Present}</div>
                        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>Absent: {attendanceSummary.Absent}</div>
                        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>Leave: {attendanceSummary.Leave}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceViewer;
