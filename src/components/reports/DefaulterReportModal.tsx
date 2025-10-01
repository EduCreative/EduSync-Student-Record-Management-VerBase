import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { exportToCsv } from '../../utils/csvHelper';
import { UserRole } from '../../types';
import { formatDate } from '../../constants';

interface DefaulterReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DefaulterReportModal: React.FC<DefaulterReportModalProps> = ({ isOpen, onClose }) => {
    const { user, activeSchoolId } = useAuth();
    const { fees, students, classes } = useData();
    const { showPrintPreview } = usePrint();

    const [classId, setClassId] = useState('all');

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    
    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === effectiveSchoolId), [classes, effectiveSchoolId]);

    const reportData = useMemo(() => {
        return fees.filter(fee => {
            if (fee.status === 'Paid') return false;
            const student = studentMap.get(fee.studentId);
            if (!student || student.schoolId !== effectiveSchoolId) return false;
            if (classId !== 'all' && student.classId !== classId) return false;
            return true;
        }).map(fee => {
            const student = studentMap.get(fee.studentId)!;
            const balance = fee.totalAmount - fee.discount - fee.paidAmount;
            return { ...fee, studentName: student.name, className: classes.find(c => c.id === student.classId)?.name, balance };
        }).sort((a, b) => a.className?.localeCompare(b.className || '') || a.studentName.localeCompare(b.studentName));
    }, [fees, studentMap, effectiveSchoolId, classId, classes]);

    const handleGenerate = () => {
        const content = (
            <div className="printable-report p-4">
                <h1 className="text-2xl font-bold mb-2 text-center">Fee Defaulter Report</h1>
                <p className="text-center mb-4">For Class: {classId === 'all' ? 'All Classes' : schoolClasses.find(c => c.id === classId)?.name}</p>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-secondary-200">
                            <th className="p-2 border text-left">Student</th>
                            <th className="p-2 border text-left">Class</th>
                            <th className="p-2 border text-left">Challan Month</th>
                            <th className="p-2 border text-right">Balance Due</th>
                            <th className="p-2 border text-left">Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map(item => (
                            <tr key={item.id}>
                                <td className="p-2 border">{item.studentName}</td>
                                <td className="p-2 border">{item.className}</td>
                                <td className="p-2 border">{item.month} {item.year}</td>
                                <td className="p-2 border text-right">Rs. {item.balance.toLocaleString()}</td>
                                <td className="p-2 border">{formatDate(item.dueDate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
        showPrintPreview(content, "Fee Defaulter Report");
    };

    const handleExport = () => {
        const dataToExport = reportData.map(item => ({
            studentName: item.studentName,
            className: item.className,
            challanMonth: `${item.month} ${item.year}`,
            balanceDue: item.balance,
            dueDate: item.dueDate,
        }));
        exportToCsv(dataToExport, 'defaulter_report');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Fee Defaulter Report">
            <div className="space-y-4">
                <div>
                    <label htmlFor="class-filter" className="input-label">Filter by Class</label>
                    <select id="class-filter" value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
                        <option value="all">All Classes</option>
                        {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-md text-center">
                    <p className="text-sm">Found <strong className="text-lg">{reportData.length}</strong> defaulter records for the selected class.</p>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={handleExport} className="btn-secondary" disabled={reportData.length === 0}>Export CSV</button>
                    <button onClick={handleGenerate} className="btn-primary" disabled={reportData.length === 0}>Print Preview</button>
                </div>
            </div>
        </Modal>
    );
};

export default DefaulterReportModal;
