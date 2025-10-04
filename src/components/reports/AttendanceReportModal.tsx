import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { UserRole } from '../../types';
import { formatDate, EduSyncLogo } from '../../constants';

interface AttendanceReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const getFirstDayOfMonthString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}-01`;
}

const AttendanceReportModal: React.FC<AttendanceReportModalProps> = ({ isOpen, onClose }) => {
    const { user, activeSchoolId } = useAuth();
    const { students, classes, attendance, getSchoolById } = useData();
    const { showPrintPreview } = usePrint();

    const [classId, setClassId] = useState('all');
    const [startDate, setStartDate] = useState(getFirstDayOfMonthString());
    const [endDate, setEndDate] = useState(getTodayString());

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = useMemo(() => getSchoolById(effectiveSchoolId || ''), [getSchoolById, effectiveSchoolId]);
    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === effectiveSchoolId), [classes, effectiveSchoolId]);

    const datesInRange = useMemo(() => {
        const dates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) return [];
        
        while (start <= end) {
            dates.push(new Date(start).toISOString().split('T')[0]);
            start.setDate(start.getDate() + 1);
        }
        return dates;
    }, [startDate, endDate]);

    const reportData = useMemo(() => {
        const relevantStudents = students.filter(s =>
            s.schoolId === effectiveSchoolId &&
            s.status === 'Active' &&
            (classId === 'all' || s.classId === classId)
        );

        const attendanceMap = new Map<string, { [date: string]: 'Present' | 'Absent' | 'Leave' }>();
        attendance.forEach(att => {
            if (att.date >= startDate && att.date <= endDate) {
                if (!attendanceMap.has(att.studentId)) {
                    attendanceMap.set(att.studentId, {});
                }
                attendanceMap.get(att.studentId)![att.date] = att.status;
            }
        });

        return relevantStudents.map(student => {
            const studentAttendance = attendanceMap.get(student.id) || {};
            const summary = { P: 0, A: 0, L: 0 };
            datesInRange.forEach(date => {
                const status = studentAttendance[date];
                if (status === 'Present') summary.P++;
                else if (status === 'Absent') summary.A++;
                else if (status === 'Leave') summary.L++;
            });
            return { student, attendanceData: studentAttendance, summary };
        }).sort((a, b) => a.student.name.localeCompare(b.student.name));
    }, [students, attendance, classId, startDate, endDate, effectiveSchoolId, datesInRange]);

    const handleGenerate = () => {
        const selectedClass = schoolClasses.find(c => c.id === classId);
        const content = (
            <div className="printable-report p-4">
                <div className="flex items-center justify-between pb-4 border-b mb-4">
                    <div className="text-left">
                        <h1 className="text-2xl font-bold">{school?.name}</h1>
                        <p className="text-sm">{school?.address}</p>
                    </div>
                    <div className="h-16 w-16 flex items-center justify-center">
                        {school?.logoUrl ? (
                            <img src={school.logoUrl} alt="School Logo" className="max-h-16 max-w-16 object-contain report-logo" />
                        ) : (
                            <EduSyncLogo className="h-12 w-12 text-primary-700 report-logo" />
                        )}
                    </div>
                </div>

                <h1 className="text-xl font-bold mb-1 text-center">Attendance Report</h1>
                <p className="text-center">Class: {selectedClass?.name || 'All Classes'}</p>
                <p className="text-center mb-4">From: {formatDate(startDate)} To: {formatDate(endDate)}</p>
                <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
                    <thead>
                        <tr className="bg-secondary-200">
                            <th className="p-1 border text-left" style={{ width: '120px' }}>Student</th>
                            <th className="p-1 border text-left" style={{ width: '50px' }}>Roll #</th>
                            {datesInRange.map(date => (
                                <th key={date} className="p-1 border text-center align-bottom" style={{ width: '30px', height: '100px', whiteSpace: 'nowrap' }}>
                                    <span className="inline-block origin-bottom-left" style={{ transform: 'translate(10px, -5px) rotate(-75deg)' }}>{formatDate(date).slice(0,6)}</span>
                                </th>
                            ))}
                            <th className="p-1 border text-center font-bold bg-green-200">P</th>
                            <th className="p-1 border text-center font-bold bg-red-200">A</th>
                            <th className="p-1 border text-center font-bold bg-yellow-200">L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map(({ student, attendanceData, summary }) => (
                            <tr key={student.id}>
                                <td className="p-1 border whitespace-nowrap overflow-hidden text-ellipsis">{student.name}</td>
                                <td className="p-1 border text-center">{student.rollNumber}</td>
                                {datesInRange.map(date => {
                                    const status = attendanceData[date];
                                    let statusChar = '-';
                                    let bgColor = '';
                                    if (status === 'Present') { statusChar = 'P'; bgColor = 'bg-green-100'; }
                                    if (status === 'Absent') { statusChar = 'A'; bgColor = 'bg-red-100'; }
                                    if (status === 'Leave') { statusChar = 'L'; bgColor = 'bg-yellow-100'; }
                                    return <td key={date} className={`p-1 border text-center ${bgColor}`}>{statusChar}</td>;
                                })}
                                <td className="p-1 border text-center font-bold bg-green-50">{summary.P}</td>
                                <td className="p-1 border text-center font-bold bg-red-50">{summary.A}</td>
                                <td className="p-1 border text-center font-bold bg-yellow-50">{summary.L}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
        showPrintPreview(content, "Attendance Report");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Attendance Report">
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-3">
                        <label htmlFor="class-select-attendance" className="input-label">Class</label>
                        <select id="class-select-attendance" value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
                            <option value="all">All Classes</option>
                            {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="start-date-attendance" className="input-label">Start Date</label>
                        <input type="date" id="start-date-attendance" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" />
                    </div>
                    <div>
                        <label htmlFor="end-date-attendance" className="input-label">End Date</label>
                        <input type="date" id="end-date-attendance" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" />
                    </div>
                </div>
                <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-md text-center">
                    <p className="text-sm">Found attendance data for <strong className="text-lg">{reportData.length}</strong> students for the selected criteria.</p>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={handleGenerate} className="btn-primary" disabled={reportData.length === 0}>Print Preview</button>
                </div>
            </div>
        </Modal>
    );
};

export default AttendanceReportModal;