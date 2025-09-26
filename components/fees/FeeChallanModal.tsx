
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { FeeChallan, Student, School, Class } from '../../types';
import { formatDate } from '../../constants';
import { usePrint } from '../../context/PrintContext';

interface FeeChallanModalProps {
    isOpen: boolean;
    onClose: () => void;
    challan: FeeChallan;
}

// Reusable component for the content of each challan copy
const ChallanContent: React.FC<{
    challan: FeeChallan;
    student?: Student;
    school?: School;
    studentClass?: Class;
    copyType: 'School Copy' | 'Parent Copy';
}> = ({ challan, student, school, studentClass, copyType }) => {
    const totalDue = challan.totalAmount - challan.paidAmount - challan.discount;

    return (
        <div className="p-4 bg-white text-black h-full flex flex-col">
            <div className="text-center mb-6 border-b pb-4 border-black">
                {school?.logoUrl && <img src={school.logoUrl} alt={`${school.name} Logo`} className="h-12 w-auto object-contain mx-auto mb-2" />}
                <h2 className="text-lg font-bold text-black">{school?.name}</h2>
                <p className="text-xs text-black">{school?.address}</p>
                <h3 className="text-base font-semibold mt-2 text-black">Fee Challan ({challan.month} {challan.year})</h3>
                <p className="text-sm font-bold mt-1 text-black">{copyType}</p>
            </div>
            {/* Increased font size for student details */}
            <div className="flex justify-between mb-4 text-base text-black">
                <div>
                    <p><strong>Student:</strong> {student?.name}</p>
                    <p><strong>Father:</strong> {student?.fatherName}</p>
                    <p><strong>Class:</strong> {studentClass?.name}</p>
                </div>
                <div>
                    <p><strong>Challan #:</strong> {challan.challanNumber}</p>
                    <p><strong>Due Date:</strong> {formatDate(challan.dueDate)}</p>
                    <p><strong>Status:</strong> <span className="font-bold text-black">{challan.status}</span></p>
                </div>
            </div>
            <table className="w-full text-sm text-left border-collapse text-black">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-1.5 border border-black">Description</th>
                        <th className="p-1.5 border border-black text-right">Amount (Rs.)</th>
                    </tr>
                </thead>
                <tbody>
                    {challan.feeItems.map((item, index) => (
                        <tr key={index}><td className="p-1.5 border border-black">{item.description}</td><td className="p-1.5 border border-black text-right">{item.amount.toLocaleString()}</td></tr>
                    ))}
                     {challan.previousBalance > 0 && (
                        <tr><td className="p-1.5 border border-black">Previous Dues</td><td className="p-1.5 border border-black text-right">{challan.previousBalance.toLocaleString()}</td></tr>
                    )}
                </tbody>
                <tfoot>
                    {/* Increased font size and contrast for key financial figures */}
                    <tr className="font-bold text-base text-black"><td className="p-1.5 border border-black text-right">Total Amount Due</td><td className="p-1.5 border border-black text-right">{challan.totalAmount.toLocaleString()}</td></tr>
                    {challan.discount > 0 && <tr><td className="p-1.5 border border-black text-right">Discount</td><td className="p-1.5 border border-black text-right">-{challan.discount.toLocaleString()}</td></tr>}
                    {challan.status !== 'Unpaid' && <tr className="font-bold text-base text-black"><td className="p-1.5 border border-black text-right">Amount Paid</td><td className="p-1.5 border border-black text-right">-{challan.paidAmount.toLocaleString()}</td></tr>}
                    <tr className="font-bold text-lg text-black"><td className="p-1.5 border border-black text-right">Balance Payable</td><td className="p-1.5 border border-black text-right">{totalDue.toLocaleString()}</td></tr>
                </tfoot>
            </table>
            <div className="mt-auto pt-6 text-xs text-center text-black">
                <p>Please pay before the due date to avoid late fees.</p>
                <div className="flex justify-between mt-8">
                    <span className="border-t border-black px-8">Parent's Signature</span>
                    <span className="border-t border-black px-8">Cashier's Signature</span>
                </div>
            </div>
        </div>
    );
};


const FeeChallanModal: React.FC<FeeChallanModalProps> = ({ isOpen, onClose, challan }) => {
    const { students, schools, classes } = useData();
    const { showPrintPreview } = usePrint();
    const [zoom, setZoom] = useState(1);
    
    const student = students.find(s => s.id === challan.studentId);
    const school = schools.find(s => s.id === student?.schoolId);
    const studentClass = classes.find(c => c.id === challan.classId);

    if (!isOpen || !student || !school) return null;

    const handlePrint = () => {
        const printContent = (
             <div id="printable-challan-wrapper" className="bg-white" style={{ width: '210mm', height: '105mm' }}>
                 <div className="printable-challan-instance flex flex-row h-full">
                    <div className="school-copy w-[40%]">
                        <ChallanContent challan={challan} student={student} school={school} studentClass={studentClass} copyType="School Copy" />
                    </div>
                    <div className="parent-copy w-[60%]">
                        <ChallanContent challan={challan} student={student} school={school} studentClass={studentClass} copyType="Parent Copy" />
                    </div>
                </div>
            </div>
        );
        showPrintPreview(printContent, `Challan #${challan.challanNumber}`);
    };

    // SVG Icons
    const ZoomInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>;
    const ZoomOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>;
    const PrinterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>;
    const PdfIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M10 12v6"/><path d="M14 15h-2a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2"/><path d="M10 12h1.5a1.5 1.5 0 0 1 0 3H10"/></svg>;
    const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex flex-col items-center p-4 transition-opacity">
             <div className="w-full max-w-7xl flex justify-between items-center bg-white dark:bg-secondary-800 p-3 rounded-t-lg shadow-md no-print">
                <h1 className="text-lg font-bold">Fee Challan Viewer</h1>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} title="Zoom Out" className="btn-icon"><ZoomOutIcon /></button>
                    <span className="text-sm w-12 text-center select-none cursor-pointer" title="Reset Zoom" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} title="Zoom In" className="btn-icon"><ZoomInIcon /></button>
                    <div className="h-6 border-l dark:border-secondary-600 mx-2"></div>
                    <button onClick={handlePrint} title="Save as PDF" className="btn-action"><PdfIcon /> <span>Save as PDF</span></button>
                    <button onClick={handlePrint} title="Print" className="btn-action"><PrinterIcon /></button>
                     <div className="h-6 border-l dark:border-secondary-600 mx-2"></div>
                    <button onClick={onClose} title="Close" className="btn-close"><CloseIcon /></button>
                </div>
            </div>
            <div className="w-full max-w-7xl flex-1 bg-secondary-200 dark:bg-secondary-900 p-4 overflow-auto rounded-b-lg">
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
                    <div id="printable-challan-wrapper" className="bg-white shadow-2xl mx-auto" style={{ width: '210mm', height: '105mm' }}>
                         <div className="printable-challan-instance flex flex-row h-full">
                            <div className="school-copy w-[40%]">
                                <ChallanContent challan={challan} student={student} school={school} studentClass={studentClass} copyType="School Copy" />
                            </div>
                            <div className="parent-copy w-[60%]">
                                <ChallanContent challan={challan} student={student} school={school} studentClass={studentClass} copyType="Parent Copy" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .btn-icon, .btn-action, .btn-close {
                    display: flex; align-items: center; justify-content: center;
                    padding: 0.5rem; border-radius: 0.5rem; transition: background-color 0.2s;
                    font-weight: 500;
                }
                .btn-icon { background-color: #f3f4f6; } .dark .btn-icon { background-color: #4b5563; }
                .btn-icon:hover { background-color: #e5e7eb; } .dark .btn-icon:hover { background-color: #6b7280; }
                .btn-action { gap: 0.5rem; background-color: #eef2ff; color: #4338ca; font-size: 0.875rem; padding: 0.5rem 1rem; }
                .dark .btn-action { background-color: #3730a3; color: #e0e7ff; }
                .btn-action:hover { background-color: #e0e7ff; } .dark .btn-action:hover { background-color: #4338ca; }
                .btn-close { background-color: #fee2e2; color: #b91c1c; } .dark .btn-close { background-color: #7f1d1d; color: #fecaca; }
                .btn-close:hover { background-color: #fecaca; } .dark .btn-close:hover { background-color: #991b1b; }
            `}</style>
        </div>
    );
};

export default FeeChallanModal;
