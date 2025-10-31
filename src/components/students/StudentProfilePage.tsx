import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../constants';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { ActiveView } from '../layout/Layout';
import StudentFeeStructure from './StudentFeeStructure';
import StudentFeeHistory from './StudentFeeHistory';
import StudentResults from './StudentResults';
import StudentAttendance from './StudentAttendance';

interface StudentProfilePageProps {
    studentId: string;
    setActiveView: (view: ActiveView) => void;
}

const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ studentId, setActiveView }) => {
    const { students, classes, fees } = useData();
    const [activeTab, setActiveTab] = useState('details');

    const student = useMemo(() => students.find(s => s.id === studentId), [students, studentId]);
    const studentClass = useMemo(() => student ? classes.find(c => c.id === student.classId) : null, [classes, student]);
    
    const feeSummary = useMemo(() => {
        const studentFees = fees.filter(f => f.studentId === studentId);
        const totalDue = studentFees.reduce((acc, f) => acc + f.totalAmount - f.discount, 0) + (student?.openingBalance || 0);
        const totalPaid = studentFees.reduce((acc, f) => acc + f.paidAmount, 0);
        return {
            totalDue,
            totalPaid,
            balance: totalDue - totalPaid,
        };
    }, [fees, studentId, student]);


    if (!student) {
        return <div className="p-8 text-center">Student not found.</div>;
    }

    const getTabClass = (tabName: string) => {
        return activeTab === tabName
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-secondary-400 dark:hover:text-secondary-300';
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
                            <button className="btn-secondary" onClick={() => setActiveView({ view: 'reports'})}>View Report Card</button>
                            <button className="btn-secondary" onClick={() => setActiveTab('feeHistory')}>View Fee History</button>
                            <button onClick={() => setActiveView({ view: 'leavingCertificate', payload: { studentId: student.id }})} className="btn-secondary">Issue Leaving Certificate</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                <div className="border-b border-secondary-200 dark:border-secondary-700">
                    <nav className="-mb-px flex space-x-6 px-6 overflow-x-auto" aria-label="Tabs">
                        <button onClick={() => setActiveTab('details')} className={`${getTabClass('details')} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Profile Details
                        </button>
                         <button onClick={() => setActiveTab('results')} className={`${getTabClass('results')} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Results Progress
                        </button>
                         <button onClick={() => setActiveTab('attendance')} className={`${getTabClass('attendance')} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Attendance Record
                        </button>
                        <button onClick={() => setActiveTab('feeStructure')} className={`${getTabClass('feeStructure')} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Fee Structure
                        </button>
                        <button onClick={() => setActiveTab('feeHistory')} className={`${getTabClass('feeHistory')} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Fee History
                        </button>
                    </nav>
                </div>
                
                <div className="p-6">
                    {activeTab === 'details' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                 <h2 className="text-xl font-semibold mb-4 text-secondary-900 dark:text-white">Personal Information</h2>
                                 <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                    <InfoItem label="Father's Name" value={student.fatherName} />
                                    <InfoItem label="Father's CNIC" value={student.fatherCnic} />
                                    <InfoItem label="Date of Birth" value={formatDate(student.dateOfBirth)} />
                                    <InfoItem label="Gender" value={student.gender} />
                                    <InfoItem label="Caste" value={student.caste} />
                                    <InfoItem label="Contact Number" value={student.contactNumber} />
                                    <InfoItem label="Secondary Contact" value={student.secondaryContactNumber} />
                                    <InfoItem label="Address" value={student.address} className="sm:col-span-2" />
                                </dl>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold mb-4 text-secondary-900 dark:text-white">Academic & Financials</h2>
                                <dl className="space-y-4">
                                    <InfoItem label="Admission Date" value={formatDate(student.dateOfAdmission)} />
                                    <InfoItem label="Admitted in Class" value={student.admittedClass} />
                                    <InfoItem label="Last School Attended" value={student.lastSchoolAttended} />
                                    <InfoItem label="Opening Balance" value={`Rs. ${student.openingBalance?.toLocaleString() || 0}`} />
                                    <InfoItem label="Current Fee Balance" value={`Rs. ${feeSummary.balance.toLocaleString()}`} bold={true} />
                                </dl>
                            </div>
                        </div>
                    )}
                    {activeTab === 'results' && <StudentResults studentId={student.id} />}
                    {activeTab === 'attendance' && <StudentAttendance studentId={student.id} />}
                    {activeTab === 'feeStructure' && <StudentFeeStructure student={student} />}
                    {activeTab === 'feeHistory' && <StudentFeeHistory studentId={student.id} />}
                </div>
            </div>
        </div>
    );
};

const InfoItem: React.FC<{ label: string; value?: string | number | null; className?: string, bold?: boolean }> = ({ label, value, className, bold }) => (
    <div className={className}>
        <dt className="text-sm font-medium text-secondary-500 dark:text-secondary-400">{label}</dt>
        <dd className={`mt-1 text-sm ${bold ? 'font-bold text-lg' : ''} text-secondary-900 dark:text-white`}>{value || 'N/A'}</dd>
    </div>
);

const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;

export default StudentProfilePage;
