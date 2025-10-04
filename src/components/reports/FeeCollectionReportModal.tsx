import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { exportToCsv } from '../../utils/csvHelper';
import { UserRole } from '../../types';
import { formatDate, EduSyncLogo } from '../../constants';

interface FeeCollectionReportModalProps {
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

const FeeCollectionReportModal: React.FC<FeeCollectionReportModalProps> = ({ isOpen, onClose }) => {
    const { user, activeSchoolId } = useAuth();
    const { fees, students, classes, getSchoolById } = useData();
    const { showPrintPreview } = usePrint();

    const [startDate, setStartDate] = useState(getFirstDayOfMonthString());
    const [endDate, setEndDate] = useState(getTodayString());

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = useMemo(() => getSchoolById(effectiveSchoolId || ''), [getSchoolById, effectiveSchoolId]);
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    interface Transaction {
        sr: number;
        stdId: string;
        studentName: string;
        fatherName: string;
        amountDue: number;
        discount: number;
        paid: number;
        balance: number;
        date: string;
    }

    interface ClassGroup {
        classId: string;
        className: string;
        transactions: Transaction[];
        subtotals: {
            paid: number;
        };
    }

    const reportData = useMemo(() => {
        const paidFeesInRange = fees.filter(fee => {
            const student = studentMap.get(fee.studentId);
            if (student?.schoolId !== effectiveSchoolId) return false;
            if (!fee.paidDate) return false; // Ensure there's a payment
            return fee.paidDate >= startDate && fee.paidDate <= endDate;
        });

        const groupedByClass = paidFeesInRange.reduce((acc, fee) => {
            const student = studentMap.get(fee.studentId);
            if (!student) return acc;

            const classId = student.classId;
            if (!acc[classId]) {
                acc[classId] = {
                    classId: classId,
                    className: classMap.get(classId) || 'Unknown Class',
                    transactions: [],
                    subtotals: { paid: 0 },
                };
            }

            acc[classId].transactions.push({
                sr: 0, // Serial number will be added later
                stdId: student.rollNumber,
                studentName: student.name,
                fatherName: student.fatherName,
                amountDue: fee.totalAmount,
                discount: fee.discount,
                paid: fee.paidAmount,
                balance: fee.totalAmount - fee.discount - fee.paidAmount,
                date: fee.paidDate!,
            });

            acc[classId].subtotals.paid += fee.paidAmount;

            return acc;
        }, {} as Record<string, ClassGroup>);

        return Object.values(groupedByClass)
            .sort((a, b) => a.className.localeCompare(b.className))
            .map(classGroup => {
                classGroup.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                classGroup.transactions.forEach((t, index) => { t.sr = index + 1; });
                return classGroup;
            });
    }, [fees, studentMap, classMap, effectiveSchoolId, startDate, endDate]);
    
    const grandTotalPaid = useMemo(() => reportData.reduce((sum, group) => sum + group.subtotals.paid, 0), [reportData]);
    const totalRecords = useMemo(() => reportData.reduce((sum, group) => sum + group.transactions.length, 0), [reportData]);

    const handleGenerate = () => {
        const content = (
            <div className="printable-report p-4">
                <div className="flex items-center justify-between pb-4 border-b mb-4">
                    <div className="text-left">
                        <h1 className="text-2xl font-bold">{school?.name}</h1>
                        <p className="text-sm">{school?.address}</p>
                    </div>
                    <div className="h-16 w-16 flex items-center justify-center">
                        {school?.logoUrl ? (
                            <img src={school.logoUrl} alt="School Logo" className="max-h-16 max-w-16 object-contain" />
                        ) : (
                            <EduSyncLogo className="h-12 w-12 text-primary-700" />
                        )}
                    </div>
                </div>

                <h1 className="text-xl font-bold mb-1 text-center">Fee Collection Report</h1>
                <p className="text-center mb-4">From: {formatDate(startDate)} To: {formatDate(endDate)}</p>
                
                {reportData.map(classGroup => (
                    <div key={classGroup.classId} className="mb-6" style={{ pageBreakInside: 'avoid' }}>
                        <h3 className="text-lg font-bold bg-secondary-100 p-2 my-2">{classGroup.className}</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-secondary-200">
                                    <th className="p-1 border text-left">Sr.</th>
                                    <th className="p-1 border text-left">StdID</th>
                                    <th className="p-1 border text-left">Student Name</th>
                                    <th className="p-1 border text-left">Father Name</th>
                                    <th className="p-1 border text-right">Amount Due</th>
                                    <th className="p-1 border text-right">Discount</th>
                                    <th className="p-1 border text-right">Paid</th>
                                    <th className="p-1 border text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classGroup.transactions.map(t => (
                                    <tr key={t.sr}>
                                        <td className="p-1 border">{t.sr}</td>
                                        <td className="p-1 border">{t.stdId}</td>
                                        <td className="p-1 border">{t.studentName}</td>
                                        <td className="p-1 border">{t.fatherName}</td>
                                        <td className="p-1 border text-right">{t.amountDue.toLocaleString()}</td>
                                        <td className="p-1 border text-right">{t.discount.toLocaleString()}</td>
                                        <td className="p-1 border text-right">{t.paid.toLocaleString()}</td>
                                        <td className="p-1 border text-right">{t.balance.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold bg-secondary-100">
                                    <td colSpan={6} className="p-1 border text-right">Subtotal Paid:</td>
                                    <td className="p-1 border text-right">{classGroup.subtotals.paid.toLocaleString()}</td>
                                    <td className="p-1 border"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ))}
                
                {reportData.length > 0 && (
                     <div className="mt-8 pt-4 border-t-2 border-black">
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="font-bold text-lg bg-secondary-200">
                                    <td colSpan={6} className="p-2 border text-right">Grand Total Paid:</td>
                                    <td className="p-2 border text-right">Rs. {grandTotalPaid.toLocaleString()}</td>
                                    <td className="p-2 border"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
        showPrintPreview(content, "Fee Collection Report");
    };

    const handleExport = () => {
        const dataToExport: any[] = [];
        reportData.forEach(classGroup => {
            dataToExport.push({ 'Sr.': `CLASS: ${classGroup.className}` });
            classGroup.transactions.forEach(t => {
                dataToExport.push({
                    'Sr.': t.sr,
                    'StdID': t.stdId,
                    'Student Name': t.studentName,
                    'Father Name': t.fatherName,
                    'Amount Due': t.amountDue,
                    'Discount': t.discount,
                    'Paid': t.paid,
                    'Balance': t.balance,
                });
            });
            dataToExport.push({
                'Father Name': 'Subtotal Paid',
                'Paid': classGroup.subtotals.paid,
            });
            dataToExport.push({}); // Spacer row
        });
    
        if (reportData.length > 0) {
            dataToExport.push({});
            dataToExport.push({
                'Father Name': 'Grand Total Paid',
                'Paid': grandTotalPaid,
            });
        }
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
                    <p className="text-sm">Found <strong className="text-lg">{totalRecords}</strong> records totaling <strong className="text-lg">Rs. {grandTotalPaid.toLocaleString()}</strong> for the selected period.</p>
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
