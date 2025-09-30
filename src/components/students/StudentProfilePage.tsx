import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../constants';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { ActiveView } from '../layout/Layout';

interface StudentProfilePageProps {
    studentId: string;
    setActiveView: (view: ActiveView) => void;
}

const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ studentId, setActiveView }) => {
    const { students, classes, fees } = useData();

    const student = useMemo(() => students.find(s => s.id === studentId), [students, studentId]);
    const studentClass = useMemo(() => student ? classes.find(c => c.id === student.classId) : null, [classes, student]);
    const studentFees = useMemo(() => fees.filter(f => f.studentId === studentId), [fees, studentId]);

    if (!student) {
        return <div className="p-8 text-center">Student not found.</div>;
    }
    
    const totalDue = studentFees.reduce((acc, f) => acc + f.totalAmount - f.discount, 0);
    const totalPaid = studentFees.reduce((acc, f) => acc + f.paidAmount, 0);
    const feeSummary = {
        totalDue,
        totalPaid,
        balance: totalDue - totalPaid,
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <button onClick={() => setActiveView({ view: 'students' })} className="flex items-center text-sm font-medium text-secondary-600 hover:text-primary-600 dark:text-secondary-400">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Back to Student List
                </button>
            </div>
            
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <Avatar student={student} className="w-24 h-24 md:w-32 md:h-32 shrink-0" />
                    <div className="flex-1">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{student.name}</h1>
                            <Badge color={student.status === 'Active' ? 'green' : 'secondary'}>{student.status}</Badge>
                        </div>
                        <p className="text-secondary-500 dark:text-secondary-400 mt-1">
                            {studentClass?.name || 'N/A'} | Roll No: {student.rollNumber}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-4">
                            <button className="btn-primary">View Report Card</button>
                             <button className="btn-secondary">View Fee History</button>
                            <button onClick={() => setActiveView({ view: 'leavingCertificate', payload: { studentId: student.id }})} className="btn-secondary">Issue Leaving Certificate</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                     <h2 className="text-xl font-semibold mb-4 text-secondary-900 dark:text-white">Personal Information</h2>
                     <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                        <InfoItem label="Father's Name" value={student.fatherName} />
                        <InfoItem label="Father's CNIC" value={student.fatherCnic} />
                        <InfoItem label="Date of Birth" value={formatDate(student.dateOfBirth)} />
                        <InfoItem label="Gender" value={student.gender} />
                        <InfoItem label="Contact Number" value={student.contactNumber} />
                        <InfoItem label="Secondary Contact" value={student.secondaryContactNumber} />
                        <InfoItem label="Address" value={student.address} className="sm:col-span-2" />
                    </dl>
                </div>
                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-secondary-900 dark:text-white">Academic & Financials</h2>
                    <dl className="space-y-4">
                        <InfoItem label="Admission Date" value={formatDate(student.dateOfAdmission)} />
                        <InfoItem label="Admitted in Class" value={student.admittedInClass} />
                        <InfoItem label="Caste" value={student.caste} />
                        <InfoItem label="Previous School" value={student.lastSchoolAttended} />
                        <InfoItem label="Opening Balance" value={`Rs. ${student.openingBalance?.toLocaleString() || 0}`} />
                        <InfoItem label="Fee Balance" value={`Rs. ${feeSummary.balance.toLocaleString()}`} />
                    </dl>
                </div>
            </div>
            <style>{`
                .btn-primary { @apply px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg; }
                .btn-secondary { @apply px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg; }
            `}</style>
        </div>
    );
};

const InfoItem: React.FC<{ label: string; value?: string | number | null; className?: string }> = ({ label, value, className }) => (
    <div className={className}>
        <dt className="text-sm font-medium text-secondary-500 dark:text-secondary-400">{label}</dt>
        <dd className="mt-1 text-sm text-secondary-900 dark:text-white">{value || 'N/A'}</dd>
    </div>
);

const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;

export default StudentProfilePage;
