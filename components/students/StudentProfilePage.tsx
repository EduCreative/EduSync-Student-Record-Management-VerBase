
import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { Student, FeeChallan, Result, Attendance, UserRole } from '../../types';
import Badge from '../common/Badge';
import { PrinterIcon, formatDate } from '../../constants';
import { ActiveView } from '../layout/Layout';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import IssueCertificateModal from './IssueCertificateModal';
import ReportHeader from '../reports/ReportHeader';
import { usePrint } from '../../context/PrintContext';

interface StudentProfilePageProps {
    studentId: string;
    setActiveView: (view: ActiveView) => void;
}

const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ studentId, setActiveView }) => {
    const { students, classes, fees, results, attendance } = useData();
    const { user, activeSchoolId } = useAuth();
    const { showPrintPreview } = usePrint();
    const [isCertificateModalOpen, setCertificateModalOpen] = useState(false);
    
    const student = useMemo(() => students.find(s => s.id === studentId), [students, studentId]);
    const studentClass = useMemo(() => student ? classes.find(c => c.id === student.classId) : undefined, [classes, student]);
    
    const allStudentFees = useMemo(() => 
        fees.filter(f => f.studentId === studentId),
        [fees, studentId]
    );

    const recentStudentFees = useMemo(() => 
        [...allStudentFees] // Create a shallow copy before sorting to avoid mutation
            .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
            .slice(0, 5), 
        [allStudentFees]
    );

    const studentResults = useMemo(() => results.filter(r => r.studentId === studentId), [results, studentId]);
    const studentAttendance = useMemo(() => new Map(attendance.filter(a => a.studentId === studentId).map(rec => [rec.date, rec.status])), [attendance, studentId]);
    
    const effectiveRole = user?.role === UserRole.Owner && activeSchoolId ? UserRole.Admin : user?.role;
    const canIssueCertificate = [UserRole.Admin, UserRole.Accountant].includes(effectiveRole as UserRole);

    if (!student) {
        return <div className="text-center p-8">Student not found.</div>;
    }

    const handleCertificateIssued = (issuedStudentId: string) => {
        setActiveView({ view: 'leavingCertificate', payload: { studentId: issuedStudentId } });
    };

    const handlePrint = () => {
        const printContent = (
            <div className="p-4 bg-white">
                <ReportHeader title="Student Profile" filters={{ "Name": student.name, "Class": studentClass?.name || 'N/A' }} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        <InfoCard title="Personal Information" student={student} />
                        <ResultsCard results={studentResults} />
                    </div>
                    <div className="lg:col-span-2 space-y-8">
                        <FeesCard fees={recentStudentFees} />
                        <FeeHistoryChartCard fees={allStudentFees} />
                        <AttendanceHistoryCard attendance={studentAttendance} />
                    </div>
                </div>
            </div>
        );
        showPrintPreview(printContent, `Profile for ${student.name}`);
    };

    return (
        <>
            <IssueCertificateModal
                isOpen={isCertificateModalOpen}
                onClose={() => setCertificateModalOpen(false)}
                student={student}
                onCertificateIssued={handleCertificateIssued}
            />
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex items-center space-x-4">
                        <Avatar student={student} className="w-24 h-24" />
                        <div>
                            <button onClick={() => setActiveView({ view: 'students' })} className="text-sm text-primary-600 hover:underline mb-1 no-print">
                                &larr; Back to Student List
                            </button>
                            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
                                {student.name} 
                                <span className="text-xl font-normal text-secondary-500"> ({student.gender === 'Male' ? 's/o' : 'd/o'} {student.fatherName})</span>
                            </h1>
                            <p className="text-secondary-500 dark:text-secondary-400">
                                {studentClass?.name} | Roll No: {student.rollNumber} | Student ID: {student.id}
                            </p>
                            {student.status !== 'Active' && <Badge color={student.status === 'Left' ? 'blue' : 'secondary'}>{student.status}</Badge>}
                        </div>
                    </div>
                     <div className="flex items-center gap-2 no-print">
                        {canIssueCertificate && student.status === 'Active' && (
                             <button onClick={() => setCertificateModalOpen(true)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition">
                                Issue Leaving Certificate
                            </button>
                        )}
                        <button onClick={handlePrint} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition flex items-center gap-2">
                           <PrinterIcon className="w-4 h-4" /> Print Profile
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-1 space-y-8">
                        <InfoCard title="Personal Information" student={student} />
                        <ResultsCard results={studentResults} />
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <FeesCard fees={recentStudentFees} />
                        <FeeHistoryChartCard fees={allStudentFees} />
                        <AttendanceHistoryCard attendance={studentAttendance} />
                    </div>
                </div>
            </div>
        </>
    );
};

const InfoCard: React.FC<{ title: string; student: Student }> = ({ title, student }) => (
    <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg printable-area">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="space-y-2 text-sm text-secondary-700 dark:text-secondary-300">
            <InfoRow label="Father's Name" value={student.fatherName} />
            <InfoRow label="Father's CNIC" value={student.fatherCnic} />
            <InfoRow label="Gender" value={student.gender} />
            <InfoRow label="Caste" value={student.caste} />
            <InfoRow label="Date of Birth" value={formatDate(student.dateOfBirth)} />
            <InfoRow label="Date of Admission" value={formatDate(student.dateOfAdmission)} />
            <InfoRow label="Admitted in Class" value={student.admittedInClass} />
            <InfoRow label="Last School Attended" value={student.lastSchoolAttended} />
            <InfoRow label="Contact (Primary)" value={student.contactNumber} />
            <InfoRow label="Contact (Secondary)" value={student.secondaryContactNumber} />
            <InfoRow label="Address" value={student.address} />
            <InfoRow label="Opening Balance" value={`Rs. ${(student.openingBalance || 0).toLocaleString()}`} />
            
            {student.status === 'Left' && (
                <>
                    <div className="pt-4 mt-4 border-t dark:border-secondary-700">
                        <h3 className="font-semibold text-md text-secondary-800 dark:text-secondary-200">Leaving Information</h3>
                    </div>
                    <InfoRow label="Date of Leaving" value={student.dateOfLeaving ? formatDate(student.dateOfLeaving) : 'N/A'} />
                    <InfoRow label="Reason for Leaving" value={student.reasonForLeaving} />
                    <InfoRow label="Conduct" value={student.conduct} />
                </>
            )}
        </div>
    </div>
);

const InfoRow: React.FC<{label: string, value?: string}> = ({ label, value }) => (
    <div className="flex justify-between border-b dark:border-secondary-700 py-2">
        <span className="font-medium text-secondary-500 dark:text-secondary-400">{label}</span>
        <span className="text-right">{value || 'N/A'}</span>
    </div>
);

const FeeHistoryChartCard: React.FC<{ fees: FeeChallan[] }> = ({ fees }) => {
    const chartData = useMemo(() => {
        const data: { month: string; total: number; paid: number; balance: number }[] = [];
        const today = new Date();

        for (let i = 2; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = date.toLocaleString('default', { month: 'long' });
            const year = date.getFullYear();

            const challan = fees.find(f => f.month === monthName && f.year === year);

            if (challan) {
                data.push({
                    month: date.toLocaleString('default', { month: 'short' }),
                    total: challan.totalAmount,
                    paid: challan.paidAmount,
                    balance: Math.max(0, challan.totalAmount - challan.paidAmount - challan.discount),
                });
            } else {
                data.push({
                    month: date.toLocaleString('default', { month: 'short' }),
                    total: 0,
                    paid: 0,
                    balance: 0,
                });
            }
        }
        return data;
    }, [fees]);

    const maxValue = useMemo(() => {
        const allValues = chartData.flatMap(d => [d.total, d.paid, d.balance]);
        const max = Math.max(...allValues);
        return max === 0 ? 1000 : max * 1.1; // Use a default scale or add 10% padding
    }, [chartData]);

    const hasData = useMemo(() => chartData.some(d => d.total > 0), [chartData]);

    return (
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg printable-area">
            <h2 className="text-xl font-semibold mb-4">Fee Payment History (Last 3 Months)</h2>
            {hasData ? (
                <>
                    <div className="flex justify-around items-end h-48 border-b dark:border-secondary-700 pb-2">
                        {chartData.map(data => (
                            <div key={data.month} className="flex flex-col items-center w-1/3 h-full">
                                <div className="flex items-end justify-center w-full h-full space-x-1">
                                    <div title={`Total: Rs. ${data.total.toLocaleString()}`} className="w-1/4 bg-blue-500 rounded-t" style={{ height: `${(data.total / maxValue) * 100}%`, transition: 'height 0.5s' }}></div>
                                    <div title={`Paid: Rs. ${data.paid.toLocaleString()}`} className="w-1/4 bg-green-500 rounded-t" style={{ height: `${(data.paid / maxValue) * 100}%`, transition: 'height 0.5s' }}></div>
                                    <div title={`Balance: Rs. ${data.balance.toLocaleString()}`} className="w-1/4 bg-yellow-500 rounded-t" style={{ height: `${(data.balance / maxValue) * 100}%`, transition: 'height 0.5s' }}></div>
                                </div>
                                <span className="mt-2 text-xs text-secondary-500">{data.month}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center space-x-4 pt-4 text-xs">
                        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-1.5"></span>Total Due</div>
                        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-1.5"></span>Paid</div>
                        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5"></span>Balance</div>
                    </div>
                </>
            ) : (
                <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">No fee data available for the last 3 months.</p>
            )}
        </div>
    );
};

const FeesCard: React.FC<{ fees: FeeChallan[] }> = ({ fees }) => {
    const getStatusColor = (status: FeeChallan['status']) => {
        switch (status) { case 'Paid': return 'green'; case 'Unpaid': return 'red'; case 'Partial': return 'yellow'; default: return 'secondary';}
    };
    return (
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg printable-area">
            <h2 className="text-xl font-semibold mb-4">Recent Fee History</h2>
            <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="text-left text-secondary-500 dark:text-secondary-400">
                        <tr className="border-b dark:border-secondary-700">
                            <th className="pb-2 font-medium">Challan #</th>
                            <th className="pb-2 font-medium">Month</th>
                            <th className="pb-2 font-medium text-right">Total</th>
                            <th className="pb-2 font-medium text-right">Paid</th>
                            <th className="pb-2 font-medium text-right">Balance Due</th>
                            <th className="pb-2 font-medium text-center">Payment Date</th>
                            <th className="pb-2 font-medium text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fees.map(fee => {
                            const balanceDue = fee.totalAmount - fee.paidAmount - (fee.discount || 0);
                            return (
                                <tr key={fee.id} className="border-b dark:border-secondary-700">
                                    <td className="py-2 font-mono text-xs">{fee.challanNumber}</td>
                                    <td className="py-2">{fee.month} {fee.year}</td>
                                    <td className="py-2 text-right font-mono">Rs. {fee.totalAmount.toLocaleString()}</td>
                                    <td className="py-2 text-right font-mono">Rs. {fee.paidAmount.toLocaleString()}</td>
                                    <td className={`py-2 text-right font-mono font-semibold ${balanceDue > 0 ? 'text-yellow-600 dark:text-yellow-500' : ''}`}>
                                        Rs. {balanceDue.toLocaleString()}
                                    </td>
                                    <td className="py-2 text-center">
                                        {fee.paidDate ? formatDate(fee.paidDate) : 'N/A'}
                                    </td>
                                    <td className="py-2 text-center"><Badge color={getStatusColor(fee.status)}>{fee.status}</Badge></td>
                                </tr>
                            );
                        })}
                        {fees.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-4 text-secondary-500">No fee records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ResultsCard: React.FC<{ results: Result[] }> = ({ results }) => {
    // FIX: Rewrote reduce function with a more explicit loop to avoid type inference issues.
    const resultsByExam = useMemo(() => {
        const acc: Record<string, Result[]> = {};
        for (const r of results) {
            if (!acc[r.exam]) {
                acc[r.exam] = [];
            }
            acc[r.exam].push(r);
        }
        return acc;
    }, [results]);
    
    const getGrade = (marks: number, total: number) => (marks/total >= 0.9) ? 'A+' : (marks/total >= 0.8) ? 'A' : 'B';

    return (
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg printable-area">
            <h2 className="text-xl font-semibold mb-4">Exam Results</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* FIX: Replaced Object.entries with Object.keys to fix "Property 'map' does not exist on type 'unknown'" error. */}
                {Object.keys(resultsByExam).map(exam => {
                    const examResults = resultsByExam[exam];
                    return (
                        <div key={exam}>
                            <h3 className="font-semibold mb-1">{exam}</h3>
                            <div className="space-y-1 text-sm">
                                {examResults.map(r => (
                                <div key={r.id} className="flex justify-between">
                                    <span>{r.subject}</span>
                                    <span className="font-mono">{r.marks}/{r.totalMarks} <span className="font-bold ml-2">{getGrade(r.marks, r.totalMarks)}</span></span>
                                </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                 {Object.keys(resultsByExam).length === 0 && (
                    <p className="text-center text-secondary-500">No results found.</p>
                )}
            </div>
        </div>
    );
};

const AttendanceHistoryCard: React.FC<{ attendance: Map<string, Attendance['status']> }> = ({ attendance }) => {
    const currentYear = new Date().getFullYear();
    
    const yearlyAttendance = useMemo(() => {
        const records: { date: string; status: Attendance['status'] }[] = [];
        attendance.forEach((status, dateStr) => {
            if (new Date(dateStr).getFullYear() === currentYear) {
                records.push({ date: dateStr, status });
            }
        });
        // Sort by most recent date first
        return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [attendance, currentYear]);
    
    const getStatusBadge = (status: Attendance['status']) => {
        switch(status) {
            case 'Present': return <Badge color="green">Present</Badge>;
            case 'Absent': return <Badge color="red">Absent</Badge>;
            case 'Leave': return <Badge color="yellow">Leave</Badge>;
        }
    };
    
    return (
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg printable-area">
            <h2 className="text-xl font-semibold mb-4">Attendance History ({currentYear})</h2>
            <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="text-left text-secondary-500 dark:text-secondary-400">
                        <tr className="border-b dark:border-secondary-700">
                            <th className="pb-2 font-medium">Date</th>
                            <th className="pb-2 font-medium text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {yearlyAttendance.map((record) => (
                            <tr key={record.date} className="border-b dark:border-secondary-700">
                                <td className="py-2">{formatDate(record.date)}</td>
                                <td className="py-2 text-center">{getStatusBadge(record.status)}</td>
                            </tr>
                        ))}
                        {yearlyAttendance.length === 0 && (
                            <tr>
                                <td colSpan={2} className="text-center py-4 text-secondary-500">No attendance records for this year.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export default StudentProfilePage;
