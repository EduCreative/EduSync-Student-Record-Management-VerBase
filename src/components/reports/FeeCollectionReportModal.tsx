import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { exportToCsv } from '../../utils/csvHelper';
import { UserRole } from '../../types';
import { formatDate } from '../../constants';

interface FeeCollectionReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FeeCollectionReportModal: React.FC<FeeCollectionReportModalProps> = ({ isOpen, onClose }) => {
    const { user, activeSchoolId } = useAuth();
    const { fees, students, classes } = useData();
    const { showPrintPreview } = usePrint();

    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    const reportData = useMemo(() => {
        return fees.filter(fee => {
            const student = studentMap.get(fee.studentId);
            if (student?.schoolId !== effectiveSchoolId) return false;
            if (!fee.paidDate) return false;
            return fee.paidDate >= startDate && fee.paidDate <= endDate;
        }).sort((a, b) => new Date(a.paidDate!).getTime() - new Date(b.paidDate!).getTime());
    }, [fees, studentMap, effectiveSchoolId, startDate, endDate]);

    const totalCollected = useMemo(() => reportData.reduce((sum, fee) => sum + fee.paidAmount, 0), [reportData]);

    const handleGenerate = () => {
        const content = (
            <div className="printable-report p-4">
                <h1 className="text-2xl font-bold mb-2 text-center">Fee Collection Report</h1>
                <p className="text-center mb-4">From: {formatDate(startDate)} To: {formatDate(endDate)}</p>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-secondary-200">
                            <th className="p-2 border text-left">Challan #</th>
                            <th className="p-2 border text-left">Student</th>
                            <th className="p-2 border text-left">Class</th>
                            <th className="p-2 border text-right">Amount Paid</th>
                            <th className="p-2 border text-left">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map(fee => {
                            const student = studentMap.get(fee.studentId);
                            return (
                                <tr key={fee.id}>
                                    <td className="p-2 border">{fee.challanNumber}</td>
                                    <td className="p-2 border">{student?.name}</td>
                                    <td className="p-2 border">{student ? classMap.get(student.classId) : 'N/A'}</td>
                                    <td className="p-2 border text-right">Rs. {fee.paidAmount.toLocaleString()}</td>
                                    <td className="p-2 border">{formatDate(fee.paidDate)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold bg-secondary-100">
                            <td colSpan={3} className="p-2 border text-right">Total Collected:</td>
                            <td className="p-2 border text-right">Rs. {totalCollected.toLocaleString()}</td>
                            <td className="p-2 border"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        );
        showPrintPreview(content, "Fee Collection Report");
    };

    const handleExport = () => {
        const dataToExport = reportData.map(fee => {
            const student = studentMap.get(fee.studentId);
            return {
                challanNumber: fee.challanNumber,
                studentName: student?.name,
                rollNumber: student?.rollNumber,
                className: student ? classMap.get(student.classId) : 'N/A',
                amountPaid: fee.paidAmount,
                paidDate: fee.paidDate,
            };
        });
        exportToCsv(dataToExport, 'fee_collection_report');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Fee Collection Report">
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start-date" className="input-label">Start Date</label>
                        <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="input-label">End Date</label>
                        <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" />
                    </div>
                </div>
                <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-md text-center">
                    <p className="text-sm">Found <strong className="text-lg">{reportData.length}</strong> records totaling <strong className="text-lg">Rs. {totalCollected.toLocaleString()}</strong> for the selected period.</p>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={handleExport} className="btn-secondary" disabled={reportData.length === 0}>Export CSV</button>
                    <button onClick={handleGenerate} className="btn-primary" disabled={reportData.length === 0}>Print Preview</button>
                </div>
            </div>
        </Modal>
    );
};

export default FeeCollectionReportModal;
