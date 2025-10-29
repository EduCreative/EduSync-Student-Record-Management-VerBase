import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { downloadCsvString, escapeCsvCell } from '../../utils/csvHelper';
import { UserRole } from '../../types';
import { EduSyncLogo } from '../../constants';
import { formatDate, getFirstDayOfMonthString, getTodayString } from '../../utils/dateHelper';

interface FeeCollectionReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const availableColumns = {
    stdId: "Std. ID",
    fatherName: "Father's Name",
    className: "Class",
    amountDue: "Amount Due",
    discount: "Discount",
    balance: "Balance"
};
type ColumnKey = keyof typeof availableColumns;

const FeeCollectionReportModal: React.FC<FeeCollectionReportModalProps> = ({ isOpen, onClose }) => {
    const { user, activeSchoolId } = useAuth();
    const { fees, students, classes, getSchoolById } = useData();
    const { showPrintPreview } = usePrint();

    const [startDate, setStartDate] = useState(getFirstDayOfMonthString());
    const [endDate, setEndDate] = useState(getTodayString());

    const [selectedColumns, setSelectedColumns] = useState<Record<ColumnKey, boolean>>({
        stdId: true,
        fatherName: true,
        className: true,
        amountDue: true,
        discount: true,
        balance: true,
    });

    const handleColumnToggle = (col: ColumnKey) => {
        setSelectedColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = useMemo(() => getSchoolById(effectiveSchoolId || ''), [getSchoolById, effectiveSchoolId]);
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    interface Transaction {
        sr: number;
        stdId: string;
        studentName: string;
        fatherName: string;
        className: string;
        amountDue: number;
        discount: number;
        paid: number;
        balance: number;
        date: string;
    }

    interface DateGroup {
        date: string;
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

        const groupedByDate = paidFeesInRange.reduce((acc, fee) => {
            const date = fee.paidDate!;
            if (!acc[date]) {
                acc[date] = {
                    date: date,
                    transactions: [],
                    subtotals: { paid: 0 },
                };
            }
            
            const student = studentMap.get(fee.studentId);
            if (!student) return acc;

            acc[date].transactions.push({
                sr: 0, 
                stdId: student.rollNumber,
                studentName: student.name,
                fatherName: student.fatherName,
                className: classMap.get(student.classId) || 'N/A',
                amountDue: fee.totalAmount,
                discount: fee.discount,
                paid: fee.paidAmount,
                balance: fee.totalAmount - fee.discount - fee.paidAmount,
                date: fee.paidDate!,
            });

            acc[date].subtotals.paid += fee.paidAmount;

            return acc;
        }, {} as Record<string, DateGroup>);

        return Object.values(groupedByDate)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(dateGroup => {
                dateGroup.transactions.sort((a, b) => {
                    if (a.className < b.className) return -1;
                    if (a.className > b.className) return 1;
                    return a.stdId.localeCompare(b.stdId, undefined, { numeric: true });
                });
                dateGroup.transactions.forEach((t, index) => { t.sr = index + 1; });
                return dateGroup;
            });
    }, [fees, studentMap, classMap, effectiveSchoolId, startDate, endDate]);
    
    const grandTotalPaid = useMemo(() => reportData.reduce((sum, group) => sum + group.subtotals.paid, 0), [reportData]);
    const totalRecords = useMemo(() => reportData.reduce((sum, group) => sum + group.transactions.length, 0), [reportData]);

    const handleGenerate = () => {
        const activeColumns = Object.keys(selectedColumns).filter(k => selectedColumns[k as ColumnKey]) as ColumnKey[];
        const subtotalColspan = 1 + 
            (activeColumns.includes('stdId') ? 1 : 0) + 
            1 + // Student Name
            (activeColumns.includes('fatherName') ? 1 : 0) + 
            (activeColumns.includes('className') ? 1 : 0) + 
            (activeColumns.includes('amountDue') ? 1 : 0) +
            (activeColumns.includes('discount') ? 1 : 0);

        const content = (
            <div className="printable-report p-4">
                <div className="flex items-center gap-4 pb-4 border-b mb-4">
                    <div className="flex-shrink-0 h-16 w-16 flex items-center justify-center">
                        {school?.logoUrl ? (
                            <img src={school.logoUrl} alt="School Logo" className="max-h-16 max-w-16 object-contain" />
                        ) : (
                            <EduSyncLogo className="h-12 w-12 text-primary-700" />
                        )}
                    </div>
                    <div className="text-left">
                        <h1 className="text-2xl font-bold">{school?.name}</h1>
                        <p className="text-sm">{school?.address}</p>
                    </div>
                </div>

                <h1 className="text-xl font-bold mb-1 text-center">Fee Collection Report</h1>
                <p className="text-center mb-4">From: {formatDate(startDate)} To: {formatDate(endDate)}</p>
                
                {reportData.map(dateGroup => (
                    <div key={dateGroup.date} className="mb-6" style={{ pageBreakInside: 'avoid' }}>
                        <h3 className="text-lg font-bold bg-secondary-100 p-2 my-2">{formatDate(dateGroup.date)}</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="p-1 text-left">Sr.</th>
                                    {activeColumns.includes('stdId') && <th className="p-1 text-left">StdID</th>}
                                    <th className="p-1 text-left">Student Name</th>
                                    {activeColumns.includes('fatherName') && <th className="p-1 text-left">Father Name</th>}
                                    {activeColumns.includes('className') && <th className="p-1 text-left">Class</th>}
                                    {activeColumns.includes('amountDue') && <th className="p-1 text-right">Amount Due</th>}
                                    {activeColumns.includes('discount') && <th className="p-1 text-right">Discount</th>}
                                    <th className="p-1 text-right">Paid</th>
                                    {activeColumns.includes('balance') && <th className="p-1 text-right">Balance</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {dateGroup.transactions.map(t => (
                                    <tr key={t.sr}>
                                        <td className="p-1">{t.sr}</td>
                                        {activeColumns.includes('stdId') && <td className="p-1">{t.stdId}</td>}
                                        <td className="p-1">{t.studentName}</td>
                                        {activeColumns.includes('fatherName') && <td className="p-1">{t.fatherName}</td>}
                                        {activeColumns.includes('className') && <td className="p-1">{t.className}</td>}
                                        {activeColumns.includes('amountDue') && <td className="p-1 text-right">{t.amountDue.toLocaleString()}</td>}
                                        {activeColumns.includes('discount') && <td className="p-1 text-right">{t.discount.toLocaleString()}</td>}
                                        <td className="p-1 text-right">{t.paid.toLocaleString()}</td>
                                        {activeColumns.includes('balance') && <td className="p-1 text-right">{t.balance.toLocaleString()}</td>}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold bg-secondary-100">
                                    <td colSpan={subtotalColspan} className="p-1 text-right">Subtotal Paid:</td>
                                    <td className="p-1 text-right">{dateGroup.subtotals.paid.toLocaleString()}</td>
                                    {activeColumns.includes('balance') && <td className="p-1"></td>}
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
                                    <td colSpan={subtotalColspan} className="p-2 text-right">Grand Total Paid:</td>
                                    <td className="p-2 text-right">Rs. {grandTotalPaid.toLocaleString()}</td>
                                    {activeColumns.includes('balance') && <td className="p-2"></td>}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
        showPrintPreview(content, "EduSync - Fee Collection Report");
    };

    const handleExport = () => {
        const headers: string[] = ['Sr.'];
        if (selectedColumns.stdId) headers.push('StdID');
        headers.push('Student Name');
        if (selectedColumns.fatherName) headers.push("Father's Name");
        if (selectedColumns.className) headers.push("Class");
        if (selectedColumns.amountDue) headers.push('Amount Due');
        if (selectedColumns.discount) headers.push('Discount');
        headers.push('Paid');
        if (selectedColumns.balance) headers.push('Balance');

        const csvRows = [headers.join(',')];

        reportData.forEach(dateGroup => {
            csvRows.push(escapeCsvCell(`Date: ${formatDate(dateGroup.date)}`));
            dateGroup.transactions.forEach(t => {
                const row: (string | number)[] = [t.sr];
                if (selectedColumns.stdId) row.push(t.stdId);
                row.push(t.studentName);
                if (selectedColumns.fatherName) row.push(t.fatherName);
                if (selectedColumns.className) row.push(t.className);
                if (selectedColumns.amountDue) row.push(t.amountDue);
                if (selectedColumns.discount) row.push(t.discount);
                row.push(t.paid);
                if (selectedColumns.balance) row.push(t.balance);
                csvRows.push(row.map(escapeCsvCell).join(','));
            });

            const subtotalRow = Array(headers.length).fill('');
            const paidIndex = headers.indexOf('Paid');
            subtotalRow[paidIndex - 1] = 'Subtotal Paid:';
            subtotalRow[paidIndex] = dateGroup.subtotals.paid;
            csvRows.push(subtotalRow.join(','));
            csvRows.push('');
        });
    
        if (reportData.length > 0) {
            csvRows.push('');
            const grandTotalRow = Array(headers.length).fill('');
            const paidIndex = headers.indexOf('Paid');
            grandTotalRow[paidIndex - 1] = 'Grand Total Paid:';
            grandTotalRow[paidIndex] = grandTotalPaid;
            csvRows.push(grandTotalRow.join(','));
        }

        downloadCsvString(csvRows.join('\n'), 'fee_collection_report');
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
                 <div>
                    <label className="input-label">Include Columns</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-md dark:border-secondary-600">
                        {Object.entries(availableColumns).map(([key, label]) => (
                            <label key={key} className="flex items-center space-x-2">
                                <input type="checkbox" checked={selectedColumns[key as ColumnKey]} onChange={() => handleColumnToggle(key as ColumnKey)} className="rounded" />
                                <span className="text-sm">{label}</span>
                            </label>
                        ))}
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