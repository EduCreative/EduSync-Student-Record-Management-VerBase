
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { FeeChallan } from '../../types';
import { formatDate } from '../../constants';
import ReportViewer from './ReportViewer';

const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const PrintChallansReport: React.FC = () => {
    const { user } = useAuth();
    const { fees, classes, students, schools } = useData();

    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === user?.schoolId), [classes, user]);
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    
    const [filters, setFilters] = useState({
        month: months[new Date().getMonth()],
        year: currentYear,
        classId: '',
    });
    const [reportData, setReportData] = useState<FeeChallan[] | null>(null);
    
    useEffect(() => {
        if(schoolClasses.length > 0 && !filters.classId) {
            setFilters(f => ({ ...f, classId: schoolClasses[0].id }));
        }
    }, [schoolClasses, filters.classId]);

    const handleGenerate = () => {
        if (!filters.classId) {
            alert("Please select a class.");
            return;
        }
        const classChallans = fees.filter(f => 
            f.classId === filters.classId && 
            f.month === filters.month && 
            f.year === filters.year
        );
        setReportData(classChallans);
    };

    const school = schools.find(s => s.id === user?.schoolId);
    
    const chunkedReportData = useMemo(() => {
        if (!reportData) return [];
        return reportData.reduce((acc, item, index) => {
            const chunkIndex = Math.floor(index / 3);
            if (!acc[chunkIndex]) {
                acc[chunkIndex] = [];
            }
            acc[chunkIndex].push(item);
            return acc;
        }, [] as FeeChallan[][]);
    }, [reportData]);

    const Challan: React.FC<{ challan: FeeChallan }> = ({ challan }) => {
        const student = studentMap.get(challan.studentId);
        const studentClass = classes.find(c => c.id === student?.classId);
        const totalDue = challan.totalAmount - challan.paidAmount - challan.discount;

        const ChallanBody: React.FC<{copyType: string}> = ({ copyType }) => (
            <div className="p-2 bg-white text-black h-full flex flex-col text-xs">
                <div className="text-center mb-2 border-b border-black pb-2">
                    {school?.logoUrl && <img src={school.logoUrl} alt="logo" className="h-8 w-auto mx-auto mb-1"/>}
                    <h4 className="font-bold text-sm">{school?.name}</h4>
                    <p>Fee Challan ({challan.month} {challan.year})</p>
                    <p className="font-semibold">{copyType}</p>
                </div>
                <div className="flex justify-between mb-2">
                    <div>
                        <p><strong>Student:</strong> {student?.name}</p>
                        <p><strong>Class:</strong> {studentClass?.name}</p>
                    </div>
                    <div>
                        <p><strong>Challan #:</strong> {challan.challanNumber}</p>
                        <p><strong>Due:</strong> {formatDate(challan.dueDate)}</p>
                    </div>
                </div>
                <table className="w-full text-left border-collapse text-[10px]">
                    <thead className="bg-gray-100">
                        <tr><th className="p-1 border border-black">Description</th><th className="p-1 border border-black text-right">Amount</th></tr>
                    </thead>
                    <tbody>
                        {challan.feeItems.map((item, i) => <tr key={i}><td className="p-1 border border-black">{item.description}</td><td className="p-1 border border-black text-right">{item.amount.toLocaleString()}</td></tr>)}
                        {challan.previousBalance > 0 && <tr><td className="p-1 border border-black">Previous Dues</td><td className="p-1 border border-black text-right">{challan.previousBalance.toLocaleString()}</td></tr>}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold"><td className="p-1 border border-black text-right">Total Due</td><td className="p-1 border border-black text-right">{challan.totalAmount.toLocaleString()}</td></tr>
                        <tr className="font-bold bg-gray-200"><td className="p-1 border border-black text-right">Payable</td><td className="p-1 border border-black text-right">{totalDue.toLocaleString()}</td></tr>
                    </tfoot>
                </table>
                <div className="mt-auto pt-4 text-center">
                    <p className="text-[8px]">Please pay before the due date.</p>
                </div>
            </div>
        );

        return (
            <div className="challan-print-instance">
                <div className="school-copy">
                    <ChallanBody copyType="School Copy" />
                </div>
                <div className="parent-copy">
                    <ChallanBody copyType="Parent Copy" />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md space-y-4 no-print">
                <h2 className="text-lg font-semibold">Print Class Challans</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                     <div>
                        <label className="label">Class</label>
                        <select value={filters.classId} onChange={e => setFilters(f => ({ ...f, classId: e.target.value }))} className="input-field">
                            <option value="">Select Class</option>
                            {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Month</label>
                        <select value={filters.month} onChange={e => setFilters(f => ({ ...f, month: e.target.value }))} className="input-field">
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Year</label>
                        <select value={filters.year} onChange={e => setFilters(f => ({ ...f, year: parseInt(e.target.value) }))} className="input-field">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <button onClick={handleGenerate} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 h-10">View Challans</button>
                </div>
            </div>

            {reportData && (
                 <ReportViewer
                    title={`Challans for ${classes.find(c => c.id === filters.classId)?.name} - ${filters.month} ${filters.year}`}
                    onClose={() => setReportData(null)}
                >
                    <div className="challan-print-container">
                        {chunkedReportData.map((chunk, pageIndex) => (
                           <div key={pageIndex} className="challan-page">
                                {chunk.map(challan => <Challan key={challan.id} challan={challan} />)}
                           </div>
                        ))}
                    </div>
                </ReportViewer>
            )}
            <style>{`.label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; } .input-field { width: 100%; padding: 0.5rem; border-radius: 0.375rem; border: 1px solid #d1d5db; } .dark .input-field { background-color: #374151; border-color: #4b5563; }`}</style>
        </div>
    );
};

export default PrintChallansReport;
