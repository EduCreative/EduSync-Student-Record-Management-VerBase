import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { exportToCsv } from '../../utils/csvHelper';
import { UserRole, FeeChallan } from '../../types';
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
    const { fees, students, getSchoolById } = useData();
    const { showPrintPreview } = usePrint();

    const [startDate, setStartDate] = useState(getFirstDayOfMonthString());
    const [endDate, setEndDate] = useState(getTodayString());

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = useMemo(() => getSchoolById(effectiveSchoolId || ''), [getSchoolById, effectiveSchoolId]);
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const reportData = useMemo(() => {
        // 1. Filter relevant transactions
        const transactions = fees.filter(fee => {
            const student = studentMap.get(fee.studentId);
            if (student?.schoolId !== effectiveSchoolId) return false;
            if (!fee.paidDate) return false; // Only include paid transactions
            return fee.paidDate >= startDate && fee.paidDate <= endDate;
        });

        // 2. Group transactions by date
        const groupedByDate = transactions.reduce((acc, fee) => {
            const date = fee.paidDate!;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(fee);
            return acc;
        }, {} as Record<string, FeeChallan[]>);

        // 3. Format into sorted array with subtotals
        return Object.entries(groupedByDate)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([date, transactions]) => {
                const subtotal = transactions.reduce((sum, fee) => sum + fee.paidAmount, 0);
                return {
                    date,
                    transactions,
                    subtotal,
                };
            });
    }, [fees, studentMap, effectiveSchoolId, startDate, endDate]);

    const grandTotal = useMemo(() => reportData.reduce((sum, group) => sum + group.subtotal, 0), [reportData]);
    const totalTransactions = useMemo(() => reportData.reduce((sum, group) => sum + group.transactions.length, 0), [reportData]);

    const handleGenerate = () => {
        const content = (
            <div className="printable-report p-4 font-sans">
                {/* School Header */}
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

                <h1 className="text-2xl font-bold mb-2 text-center">Fee Collection Report</h1>
                <p className="text-center mb-4">From: {formatDate(startDate)} To: {formatDate(endDate)}</p>
                
                {reportData.map((group) => (
                    <div key={group.date} className="mb-6" style={{ pageBreakInside: 'avoid' }}>
                        <h3 className="text-lg font-bold bg-secondary-100 p-2 my-2">Date: {formatDate(group.date)}</h3>
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
                                {group.transactions.map((fee, index) => {
                                    const student = studentMap.get(fee.studentId);
                                    const amountDue = fee.totalAmount;
                                    const discount = fee.discount;
                                    const paid = fee.paidAmount;
                                    const challanBalance = fee.totalAmount - fee.discount - fee.paidAmount;
                                    
                                    return (
                                        <tr key={fee.id}>
                                            <td className="p-1 border">{index + 1}</td>
                                            <td className="p-1 border">{student?.rollNumber}</td>
                                            <td className="p-1 border">{student?.name}</td>
                                            <td className="p-1 border">{student?.fatherName}</td>
                                            <td className="p-1 border text-right">{amountDue.toLocaleString()}</td>
                                            <td className="p-1 border text-right">{discount.toLocaleString()}</td>
                                            <td className="p-1 border text-right">{paid.toLocaleString()}</td>
                                            <td className="p-1 border text-right">{challanBalance.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold bg-secondary-100">
                                    <td colSpan={6} className="p-1 border text-right">Sub Total:</td>
                                    <td className="p-1 border text-right">Rs. {group.subtotal.toLocaleString()}</td>
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
                                    <td colSpan={6} className="p-2 border text-right">Grand Total:</td>
                                    <td className="p-2 border text-right">Rs. {grandTotal.toLocaleString()}</td>
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
        reportData.forEach(group => {
            dataToExport.push({ 'Sr.': `Date: ${formatDate(group.date)}` }); // Date header
            group.transactions.forEach((fee, index) => {
                const student = studentMap.get(fee.studentId);
                const amountDue = fee.totalAmount;
                const discount = fee.discount;
                const paid = fee.paidAmount;
                const challanBalance = fee.totalAmount - fee.discount - fee.paidAmount;

                dataToExport.push({
                    'Sr.': index + 1,
                    'StdID': student?.rollNumber,
                    'Student Name': student?.name,
                    'Father Name': student?.fatherName,
                    'Amount Due': amountDue,
                    'Discount': discount,
                    'Paid': paid,
                    'Balance': challanBalance,
                });
            });
            dataToExport.push({ 
                'Father Name': 'Sub Total', 
                'Paid': group.subtotal 
            });
            dataToExport.push({});
        });

        if (reportData.length > 0) {
            dataToExport.push({});
            dataToExport.push({ 
                'Father Name': 'Grand Total', 
                'Paid': grandTotal 
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
                    <p className="text-sm">Found <strong className="text-lg">{totalTransactions}</strong> records totaling <strong className="text-lg">Rs. {grandTotal.toLocaleString()}</strong> for the selected period.</p>
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