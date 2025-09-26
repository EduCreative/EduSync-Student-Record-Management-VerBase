import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ReportViewer from './ReportViewer';
import ReportHeader from './ReportHeader';
import { formatDate } from '../../constants';

const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

const ALL_FIELDS: { key: string; label: string }[] = [
    { key: 'challanNumber', label: 'Challan #' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'fatherName', label: "Father's Name" },
    { key: 'rollNumber', label: 'Roll Number' },
    { key: 'className', label: 'Class' },
    { key: 'monthYear', label: 'Month/Year' },
    { key: 'paidDate', label: 'Paid Date' },
    { key: 'contactNumber', label: 'Contact Number' },
    { key: 'totalAmount', label: 'Total Amount' },
    { key: 'paidAmount', label: 'Paid Amount' },
    { key: 'discount', label: 'Discount' },
];

const DEFAULT_FIELDS: string[] = ['challanNumber', 'studentName', 'className', 'paidDate', 'paidAmount', 'discount'];


const FeeCollectionReport: React.FC = () => {
    const { user } = useAuth();
    const { fees, classes, students } = useData();

    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === user?.schoolId), [classes, user]);
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    
    const [filters, setFilters] = useState({
        startDate: formatDateForInput(new Date()),
        endDate: formatDateForInput(new Date()),
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
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day

        const filtered = fees.filter(fee => {
            const student = studentMap.get(fee.studentId);
            if (!student || student.schoolId !== user?.schoolId) return false;
            if (filters.classId !== 'all' && student.classId !== filters.classId) return false;
            
            if (!fee.paidDate) return false;
            const paidDate = new Date(fee.paidDate);
            return paidDate >= start && paidDate <= end;
        });

        const data = filtered.map(fee => {
            const student = studentMap.get(fee.studentId);
            const studentClass = classes.find(c => c.id === student?.classId);
            return {
                challanNumber: fee.challanNumber,
                studentName: student?.name || 'N/A',
                fatherName: student?.fatherName || 'N/A',
                className: studentClass?.name || 'N/A',
                paidDate: fee.paidDate ? formatDate(fee.paidDate) : 'N/A',
                paidAmount: fee.paidAmount,
                discount: fee.discount,
                monthYear: `${fee.month} ${fee.year}`,
                rollNumber: student?.rollNumber || 'N/A',
                contactNumber: student?.contactNumber || 'N/A',
                totalAmount: fee.totalAmount,
            };
        });
        setReportData(data);
    };

    const activeFields = useMemo(() => ALL_FIELDS.filter(f => selectedFields[f.key]), [selectedFields]);
    const totalCollection = useMemo(() => reportData?.reduce((sum, item) => sum + item.paidAmount, 0) || 0, [reportData]);
    const totalDiscount = useMemo(() => reportData?.reduce((sum, item) => sum + item.discount, 0) || 0, [reportData]);
    
    const exportData = useMemo(() => {
        if (!reportData) return undefined;
        const headers = activeFields.map(f => f.label);
        const rows = reportData.map(item => activeFields.map(field => item[field.key as keyof typeof item]));

        return {
            filename: `fee-collection-${filters.startDate}-to-${filters.endDate}.csv`,
            headers,
            rows,
        };
    }, [reportData, filters, activeFields]);
    
    const firstTotalColIndex = activeFields.findIndex(f => ['paidAmount', 'discount', 'totalAmount'].includes(f.key));

    return (
        <div className="space-y-6">
            <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md space-y-4 no-print">
                <h2 className="text-lg font-semibold">Fee Collection Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="label">From Date</label>
                        <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className="input-field" />
                    </div>
                    <div>
                        <label className="label">To Date</label>
                        <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className="input-field" />
                    </div>
                    <div>
                        <label className="label">Class</label>
                        <select value={filters.classId} onChange={e => setFilters(f => ({ ...f, classId: e.target.value }))} className="input-field">
                            <option value="all">All Classes</option>
                            {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div className="md:col-span-4">
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
                    <button onClick={handleGenerate} className="md:col-start-4 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 h-10">Generate Report</button>
                </div>
            </div>

            {reportData && (
                <ReportViewer 
                    title="Fee Collection Report" 
                    exportData={exportData}
                    onClose={() => setReportData(null)}
                >
                    <ReportHeader 
                        title="Fee Collection Report" 
                        filters={{ 
                            "Date Range": `${formatDate(filters.startDate)} to ${formatDate(filters.endDate)}`,
                            "Class": schoolClasses.find(c => c.id === filters.classId)?.name || 'All Classes'
                        }}
                    />
                    <table className="w-full text-sm">
                        <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                            <tr>
                                {activeFields.map(field => (
                                    <th key={field.key} className={`px-4 py-2 text-left ${['paidAmount', 'discount', 'totalAmount'].includes(field.key) ? 'text-right' : ''}`}>
                                        {field.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((item, index) => (
                                <tr key={index} className="border-b dark:border-secondary-700">
                                    {activeFields.map(field => (
                                        <td key={field.key} className={`px-4 py-2 ${['paidAmount', 'discount', 'totalAmount'].includes(field.key) ? 'text-right font-mono' : ''}`}>
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
                             {(totalCollection > 0 || totalDiscount > 0) &&
                                <tr className="font-bold bg-secondary-50 dark:bg-secondary-700">
                                    {firstTotalColIndex > 0 && <td colSpan={firstTotalColIndex} className="px-4 py-2 text-right">Totals</td>}
                                    {activeFields.map((field, index) => {
                                        if (index < firstTotalColIndex) return null; // covered by colspan
                                        if (field.key === 'paidAmount') return <td key={field.key} className="px-4 py-2 text-right font-mono">{totalCollection.toLocaleString()}</td>;
                                        if (field.key === 'discount') return <td key={field.key} className="px-4 py-2 text-right font-mono">{totalDiscount.toLocaleString()}</td>;
                                        return <td key={field.key} className="px-4 py-2"></td>; // empty cells
                                    })}
                                </tr>
                            }
                        </tfoot>
                    </table>
                </ReportViewer>
            )}
             <style>{`.label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; } .input-field { width: 100%; padding: 0.5rem; border-radius: 0.375rem; border: 1px solid #d1d5db; } .dark .input-field { background-color: #374151; border-color: #4b5563; }`}</style>
        </div>
    );
};

export default FeeCollectionReport;