import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ReportViewer from './ReportViewer';
import ReportHeader from './ReportHeader';
import { formatDate } from '../../constants';

const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

const ALL_FIELDS: { key: string; label: string }[] = [
    { key: 'studentName', label: 'Student Name' },
    { key: 'fatherName', label: "Father's Name" },
    { key: 'className', label: 'Class' },
    { key: 'rollNumber', label: 'Roll #' },
    { key: 'contactNumber', label: 'Contact #' },
    { key: 'totalDue', label: 'Total Due' },
    { key: 'amountPaid', label: 'Amount Paid' },
    { key: 'balance', label: 'Balance' },
    { key: 'challanNumber', label: 'Challan #' },
    { key: 'monthYear', label: 'Month/Year' },
    { key: 'dueDate', label: 'Due Date' },
];

const DEFAULT_FIELDS: string[] = ['studentName', 'fatherName', 'className', 'contactNumber', 'balance'];

const FeeDefaulterReport: React.FC = () => {
    const { user } = useAuth();
    const { fees, classes, students } = useData();

    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === user?.schoolId), [classes, user]);
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    
    const [filters, setFilters] = useState({
        tillDate: formatDateForInput(new Date()),
        classId: 'all',
    });
    const [reportData, setReportData] = useState<any[] | null>(null);
    const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>(
        ALL_FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: DEFAULT_FIELDS.includes(field.key) }), {})
    );

    const handleFieldToggle = (key: string) => {
        setSelectedFields(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleGenerate = () => {
        const till = new Date(filters.tillDate);

        const defaulters = fees.filter(fee => {
            const student = studentMap.get(fee.studentId);
            if (!student || student.schoolId !== user?.schoolId) return false;
            if (filters.classId !== 'all' && student.classId !== filters.classId) return false;
            
            const dueDate = new Date(fee.dueDate);
            const isOverdue = dueDate <= till;
            const isUnpaid = fee.status === 'Unpaid' || fee.status === 'Partial';

            return isOverdue && isUnpaid;
        });

        const data = defaulters.map(fee => {
            const student = studentMap.get(fee.studentId);
            return {
                studentName: student?.name || 'N/A',
                fatherName: student?.fatherName || 'N/A',
                className: classes.find(c => c.id === student?.classId)?.name || 'N/A',
                rollNumber: student?.rollNumber || 'N/A',
                contactNumber: student?.contactNumber || 'N/A',
                totalDue: fee.totalAmount,
                amountPaid: fee.paidAmount + fee.discount,
                balance: fee.totalAmount - (fee.paidAmount + fee.discount),
                challanNumber: fee.challanNumber,
                monthYear: `${fee.month} ${fee.year}`,
                dueDate: formatDate(fee.dueDate),
            };
        });
        setReportData(data);
    };

    const activeFields = useMemo(() => ALL_FIELDS.filter(f => selectedFields[f.key]), [selectedFields]);
    const totalBalance = useMemo(() => reportData?.reduce((sum, item) => sum + item.balance, 0) || 0, [reportData]);
    
    const exportData = useMemo(() => {
        if (!reportData) return undefined;
        const headers = activeFields.map(f => f.label);
        const rows = reportData.map(item => activeFields.map(field => item[field.key as keyof typeof item]));
        return {
            filename: `fee-defaulters-till-${filters.tillDate}.csv`,
            headers,
            rows,
        };
    }, [reportData, filters, activeFields]);

    const totalBalanceColIndex = activeFields.findIndex(f => f.key === 'balance');

    return (
        <div className="space-y-6">
            <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md space-y-4 no-print">
                <h2 className="text-lg font-semibold">Fee Defaulter Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="label">Till Date</label>
                        <input type="date" value={filters.tillDate} onChange={e => setFilters(f => ({ ...f, tillDate: e.target.value }))} className="input-field" />
                    </div>
                    <div>
                        <label className="label">Class</label>
                        <select value={filters.classId} onChange={e => setFilters(f => ({ ...f, classId: e.target.value }))} className="input-field">
                            <option value="all">All Classes</option>
                            {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <button onClick={handleGenerate} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 h-10">Generate Report</button>
                    <div className="md:col-span-3">
                        <label className="label">Fields to Include</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2 border dark:border-secondary-600 p-3 rounded-md">
                            {ALL_FIELDS.map(field => (
                                <label key={field.key} className="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!selectedFields[field.key]}
                                        onChange={() => handleFieldToggle(field.key)}
                                        className="rounded text-primary-600 focus:ring-primary-500"
                                    />
                                    <span>{field.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {reportData && (
                <ReportViewer 
                    title="Fee Defaulter Report" 
                    exportData={exportData}
                    onClose={() => setReportData(null)}
                >
                    <ReportHeader 
                        title="Fee Defaulter Report" 
                        filters={{ 
                            "Till Date": formatDate(filters.tillDate),
                            "Class": schoolClasses.find(c => c.id === filters.classId)?.name || 'All Classes'
                        }}
                    />
                    <table className="w-full text-sm">
                        <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                            <tr>
                               {activeFields.map(field => (
                                    <th key={field.key} className={`th ${['totalDue', 'amountPaid', 'balance'].includes(field.key) ? 'text-right' : ''}`}>
                                        {field.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((item, index) => (
                                <tr key={index} className="border-b dark:border-secondary-700">
                                   {activeFields.map(field => (
                                       <td key={field.key} className={`td ${['totalDue', 'amountPaid', 'balance'].includes(field.key) ? 'text-right font-mono' : ''}`}>
                                            {typeof item[field.key as keyof typeof item] === 'number'
                                                ? item[field.key as keyof typeof item].toLocaleString()
                                                : item[field.key as keyof typeof item]
                                            }
                                       </td>
                                   ))}
                                </tr>
                            ))}
                        </tbody>
                         <tfoot>
                            {totalBalance > 0 &&
                                <tr className="font-bold bg-secondary-50 dark:bg-secondary-700">
                                    {totalBalanceColIndex > 0 && <td colSpan={totalBalanceColIndex} className="td text-right">Total Balance Due</td>}
                                    {activeFields.map((field, index) => {
                                        if (index < totalBalanceColIndex) return null; // covered by colspan
                                        if (field.key === 'balance') return <td key={field.key} className="td text-right font-mono">{totalBalance.toLocaleString()}</td>;
                                        // Render an empty cell for any other columns after the total column
                                        return <td key={field.key} className="td"></td>;
                                    })}
                                </tr>
                            }
                        </tfoot>
                    </table>
                </ReportViewer>
            )}
             <style>{`.label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; } .input-field { width: 100%; padding: 0.5rem; border-radius: 0.375rem; border: 1px solid #d1d5db; } .dark .input-field { background-color: #374151; border-color: #4b5563; } .th { padding: 0.5rem 1rem; text-align: left; } .td { padding: 0.5rem 1rem; }`}</style>
        </div>
    );
};

export default FeeDefaulterReport;