
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../constants';
import { Student, Class, School } from '../../types';
import { ActiveView } from '../layout/Layout';
import { usePrint } from '../../context/PrintContext';

interface LeavingCertificatePageProps {
    studentId: string;
    setActiveView: (view: ActiveView) => void;
}

// --- Helper Functions for Date Formatting ---
const toWords = (s: string | number) => {
    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const num = Number(s);
    if (isNaN(num)) return '';
    if (num === 0) return 'zero';
    // Simplified converter for years and days
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + a[num % 10] : '');
    if (num < 1000) return a[Math.floor(num / 100)] + ' hundred' + (num % 100 !== 0 ? ' and ' + toWords(num % 100) : '');
    if (num < 100000) return toWords(Math.floor(num / 1000)) + ' thousand ' + toWords(num % 1000);
    return num.toString();
};

const dateToWords = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'long' });
        const year = date.getFullYear();

        const dayInWords = toWords(day).split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const yearInWords = toWords(year).split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        return `${dayInWords} ${month} ${yearInWords}`;
    } catch {
        return 'Invalid Date';
    }
};

// --- Reusable Certificate Components ---
const Field = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex items-end mt-1.5 text-xs font-serif">
        <p className="w-[120px] shrink-0 font-sans font-semibold">{label}</p>
        <div className="flex-grow border-b border-dotted border-black text-center pb-0.5 tracking-wider">
            {value || ''}
        </div>
    </div>
);

interface CertificateFieldsProps {
    student: Student;
    studentClass?: Class;
}

const CertificateFields: React.FC<CertificateFieldsProps> = ({ student, studentClass }) => (
    <div className="space-y-1">
        <Field label="Admin No." value={`ADM-${student.id.slice(-4)}`} />
        <Field label="Certificate No." value={`SLC-${student.id.slice(-4)}`} />
        <Field label="Student's Name" value={student.name} />
        <Field label="Father's Name" value={student.fatherName} />
        <Field label="Date of Birth (figure)" value={formatDate(student.dateOfBirth)} />
        <Field label="In words" value={dateToWords(student.dateOfBirth)} />
        <Field label="Date of Admission:" value={formatDate(student.dateOfAdmission)} />
        <Field label="Class in which admitted" value={student.admittedInClass} />
        <Field label="Class in which studying" value={studentClass?.name} />
        <Field label="Date of leaving school:" value={student.dateOfLeaving ? formatDate(student.dateOfLeaving) : 'N/A'} />
        <Field label="Reason for leaving:" value={student.reasonForLeaving} />
        <Field label="Religion:" value="Islam" /> {/* Placeholder */}
        <Field label="Conduct:" value={student.conduct} />
        <Field label="Progress:" value="Good" /> {/* Placeholder */}
        <Field label="Remarks:" value="None" /> {/* Placeholder */}
    </div>
);

const SignatureSection: React.FC<{ school?: School }> = ({ school }) => (
    <div className="flex justify-between items-end mt-auto pt-6 text-xs">
        <div className="text-center">
            <p className="font-semibold">Prepared & Checked by</p>
            <p className="mt-8 border-t-2 border-dotted border-black px-4">Signature</p>
        </div>
        <div className="text-center">
            <p className="font-semibold">Head Master</p>
            <p className="mt-8 border-t-2 border-dotted border-black px-4">Signature</p>
            <p>{school?.name}</p>
        </div>
    </div>
);

const CertificateContent: React.FC<{ student: Student, studentClass?: Class, school?: School }> = ({ student, studentClass, school }) => {
    const CertificateHeader: React.FC<{ school?: School, isMain?: boolean }> = ({ school, isMain = false }) => (
        <div className="text-center mb-2 font-sans">
            <div className="flex items-center justify-center gap-2">
                {school?.logoUrl && <img src={school.logoUrl} alt="logo" className={`${isMain ? 'h-14' : 'h-12'}`} />}
                <div>
                    <h1 className={`font-extrabold text-blue-800 ${isMain ? 'text-lg' : 'text-base'}`}>
                        {school?.name || 'School Name'}
                    </h1>
                    <p className={`font-semibold text-blue-800 ${isMain ? 'text-sm' : 'text-xs'}`}>
                        {school?.address || 'School Address'}
                    </p>
                </div>
                 {school?.logoUrl && <img src={school.logoUrl} alt="logo" className={`${isMain ? 'h-14' : 'h-12'}`} />}
            </div>
            <h2 className="text-sm font-bold border-2 border-blue-800 text-blue-800 py-0.5 mt-2">
                SCHOOL LEAVING CERTIFICATE
            </h2>
        </div>
    );
    
    return (
        <div className="leaving-certificate-page bg-white text-black p-4 printable-area border-blue-800 border-2" style={{ width: '29.7cm', height: '21cm', boxSizing: 'border-box' }}>
            <div className="w-full h-full flex p-2 border-2 border-blue-800">
                {/* Left Side (School Copy) */}
                <div className="w-[30%] h-full flex flex-col px-4 border-r-2 border-dashed border-gray-400">
                    <p className="text-center font-bold text-xs mb-2">School Copy</p>
                    <CertificateHeader school={school} />
                    <CertificateFields student={student} studentClass={studentClass} />
                    <SignatureSection school={school} />
                </div>

                {/* Right Side (Parent Copy) */}
                <div className="w-[70%] h-full flex flex-col px-4 relative">
                    <p className="text-center font-bold text-xs mb-2">Parent Copy</p>
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        {school?.logoUrl && <img src={school.logoUrl} alt="watermark" className="h-48 w-48 object-contain opacity-10" />}
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                        <CertificateHeader school={school} isMain={true} />
                        <CertificateFields student={student} studentClass={studentClass} />
                        <p className="text-center text-xs font-semibold my-2">
                            Certified that the above information is in accordance with the school record
                        </p>
                        <SignatureSection school={school} />
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---
const LeavingCertificatePage: React.FC<LeavingCertificatePageProps> = ({ studentId, setActiveView }) => {
    const { students, classes, schools } = useData();
    const { showPrintPreview } = usePrint();
    const [zoom, setZoom] = useState(1);

    const student = students.find(s => s.id === studentId);
    if (!student) return <div className="text-center p-8">Student not found.</div>;
    
    const studentClass = classes.find(c => c.id === student.classId);
    const school = schools.find(s => s.id === student.schoolId);

    const handlePrint = () => {
        const printContent = <CertificateContent student={student} studentClass={studentClass} school={school} />;
        showPrintPreview(printContent, `Leaving Certificate for ${student.name}`);
    };
    
    // SVG Icons
    const ZoomInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>;
    const ZoomOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>;
    const PrinterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>;
    const PdfIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M10 12v6"/><path d="M14 15h-2a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2"/><path d="M10 12h1.5a1.5 1.5 0 0 1 0 3H10"/></svg>;
    const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

    return (
        <div className="bg-secondary-100 dark:bg-secondary-900 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                 <div className="flex justify-between items-center bg-white dark:bg-secondary-800 p-4 rounded-t-lg shadow-md no-print">
                    <h1 className="text-xl font-bold">Leaving Certificate</h1>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} title="Zoom Out" className="btn-icon"><ZoomOutIcon /></button>
                        <span className="text-sm w-12 text-center select-none cursor-pointer" title="Reset Zoom" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} title="Zoom In" className="btn-icon"><ZoomInIcon /></button>
                        <div className="h-6 border-l dark:border-secondary-600 mx-2"></div>
                        <button onClick={handlePrint} title="Save as PDF" className="btn-action"><PdfIcon /> <span>Save as PDF</span></button>
                        <button onClick={handlePrint} title="Print" className="btn-action"><PrinterIcon /></button>
                         <div className="h-6 border-l dark:border-secondary-600 mx-2"></div>
                        <button onClick={() => setActiveView({ view: 'studentProfile', payload: { studentId } })} title="Close" className="btn-close"><CloseIcon /></button>
                    </div>
                </div>

                <div className="bg-white p-4 shadow-2xl overflow-auto">
                    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
                        <CertificateContent student={student} studentClass={studentClass} school={school} />
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

export default LeavingCertificatePage;
