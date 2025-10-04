import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { exportToCsv } from '../../utils/csvHelper';
import { UserRole } from '../../types';
import { formatDate, EduSyncLogo } from '../../constants';

interface DefaulterReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DefaulterReportModal: React.FC<DefaulterReportModalProps> = ({ isOpen, onClose }) => {
    const { user, activeSchoolId } = useAuth();
    const { fees, students, classes, getSchoolById } = useData();
    const { showPrintPreview } = usePrint();

    const [classId, setClassId] = useState('all');

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = useMemo(() => getSchoolById(effectiveSchoolId || ''), [getSchoolById, effectiveSchoolId]);
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === effectiveSchoolId), [classes, effectiveSchoolId]);

    const reportData = useMemo(() => {
        // FIX: Define interfaces for student and class group summaries to ensure type safety in reduce and map operations.
        interface StudentDefaulterSummary {
            studentId: string;
            stdId: string;
            studentName: string;
            fatherName: string;
            classId: string;
            className: string;
            amountDue: number;
            paid: number;
            balance: number;
        }

        interface ClassDefaulterGroup {
            classId: string;
            className: string;
            students: StudentDefaulterSummary[];
            subtotals: {
                amountDue: number;
                paid: number;
                balance: number;
            };
        }

        // 1. Filter challans for defaulters in the relevant school/class
        const defaulterChallans = fees.filter(fee => {
            if (fee.status === 'Paid') return false;
            const student = studentMap.get(fee.studentId);
            if (!student || student.schoolId !== effectiveSchoolId || student.status !== 'Active') return false;
            if (classId !== 'all' && student.classId !== classId) return false;
            return true;
        });

        // 2. Group challans by student and aggregate their due amounts
        const studentDefaulterSummary = defaulterChallans.reduce((acc, challan) => {
            const studentId = challan.studentId;
            if (!acc[studentId]) {
                const student = studentMap.get(studentId);
                if (!student) return acc;
                acc[studentId] = {
                    studentId: student.id,
                    stdId: student.rollNumber,
                    studentName: student.name,
                    fatherName: student.fatherName,
                    classId: student.classId,
                    className: classMap.get(student.classId) || 'N/A',
                    amountDue: 0,
                    paid: 0,
                    balance: 0,
                };
            }
            const totalDue = challan.totalAmount - challan.discount;
            acc[studentId].amountDue += totalDue;
            acc[studentId].paid += challan.paidAmount;
            acc[studentId].balance += totalDue - challan.paidAmount;
            return acc;
        }, {} as Record<string, StudentDefaulterSummary>);

        // 3. Group the aggregated student summaries by class
        const groupedByClass = Object.values(studentDefaulterSummary).reduce((acc, studentSummary) => {
            const cid = studentSummary.classId;
            if (!acc[cid]) {
                acc[cid] = {
                    classId: cid,
                    className: studentSummary.className,
                    students: [],
                    subtotals: { amountDue: 0, paid: 0, balance: 0 },
                };
            }
            acc[cid].students.push(studentSummary);
            acc[cid].subtotals.amountDue += studentSummary.amountDue;
            acc[cid].subtotals.paid += studentSummary.paid;
            acc[cid].subtotals.balance += studentSummary.balance;
            return acc;
        }, {} as Record<string, ClassDefaulterGroup>);

        // 4. Sort classes and students within each class
        return Object.values(groupedByClass)
            .sort((a, b) => a.className.localeCompare(b.className))
            .map(classGroup => {
                classGroup.students.sort((a, b) => a.studentName.localeCompare(b.studentName));
                return classGroup;
            });
    }, [fees, students, classes, classMap, studentMap, effectiveSchoolId, classId]);
    
    const grandTotal = useMemo(() => {
        return reportData.reduce((acc, classGroup) => {
            acc.amountDue += classGroup.subtotals.amountDue;
            acc.paid += classGroup.subtotals.paid;
            acc.balance += classGroup.subtotals.balance;
            return acc;
        }, { amountDue: 0, paid: 0, balance: 0 });
    }, [reportData]);


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

                <h2 className="text-xl font-bold mb-2 text-center">Fee Defaulter Report</h2>
                <p className="text-center mb-4">For Class: {classId === 'all' ? 'All Classes' : schoolClasses.find(c => c.id === classId)?.name}</p>

                {reportData.map((classGroup) => (
                    <div key={classGroup.classId} className="mb-6" style={{ pageBreakInside: 'avoid' }}>
                        <h3 className="text-lg font-bold bg-secondary-100 p-2 my-2">{classGroup.className}</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-secondary-200">
                                    <th className="p-1 border text-left">Sr.</th>
                                    <th className="p-1 border text-left">StdID</th>
                                    <th className="p-1 border text-left">Student Name</th>
                                    <th className="p-1 border text-left">Father Name</th>
                                    <th className="p-1 border text-right">Amount Due</th>
                                    <th className="p-1 border text-right">Paid</th>
                                    <th className="p-1 border text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classGroup.students.map((student, index) => (
                                    <tr key={student.studentId}>
                                        <td className="p-1 border">{index + 1}</td>
                                        <td className="p-1 border">{student.stdId}</td>
                                        <td className="p-1 border">{student.studentName}</td>
                                        <td className="p-1 border">{student.fatherName}</td>
                                        <td className="p-1 border text-right">{student.amountDue.toLocaleString()}</td>
                                        <td className="p-1 border text-right">{student.paid.toLocaleString()}</td>
                                        <td className="p-1 border text-right">{student.balance.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold bg-secondary-100">
                                    <td colSpan={4} className="p-1 border text-right">Sub Total:</td>
                                    <td className="p-1 border text-right">{classGroup.subtotals.amountDue.toLocaleString()}</td>
                                    <td className="p-1 border text-right">{classGroup.subtotals.paid.toLocaleString()}</td>
                                    <td className="p-1 border text-right">{classGroup.subtotals.balance.toLocaleString()}</td>
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
                                    <td colSpan={4} className="p-2 border text-right">Grand Total:</td>
                                    <td className="p-2 border text-right">Rs. {grandTotal.amountDue.toLocaleString()}</td>
                                    <td className="p-2 border text-right">Rs. {grandTotal.paid.toLocaleString()}</td>
                                    <td className="p-2 border text-right">Rs. {grandTotal.balance.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
        showPrintPreview(content, "Fee Defaulter Report");
    };

    const handleExport = () => {
        const dataToExport: any[] = [];
    
        reportData.forEach(classGroup => {
            dataToExport.push({ 'Sr.': `CLASS: ${classGroup.className}` });
            classGroup.students.forEach((student, index) => {
                dataToExport.push({
                    'Sr.': index + 1,
                    'StdID': student.stdId,
                    'Student Name': student.studentName,
                    'Father Name': student.fatherName,
                    'Amount Due': student.amountDue,
                    'Paid': student.paid,
                    'Balance': student.balance,
                });
            });
            dataToExport.push({
                'Father Name': 'Sub Total',
                'Amount Due': classGroup.subtotals.amountDue,
                'Paid': classGroup.subtotals.paid,
                'Balance': classGroup.subtotals.balance,
            });
            dataToExport.push({}); // Spacer
        });
    
        if (reportData.length > 0) {
            dataToExport.push({});
            dataToExport.push({
                'Father Name': 'Grand Total',
                'Amount Due': grandTotal.amountDue,
                'Paid': grandTotal.paid,
                'Balance': grandTotal.balance,
            });
        }
    
        exportToCsv(dataToExport, 'defaulter_report');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Fee Defaulter Report">
            <div className="space-y-4">
                <div>
                    <label htmlFor="class-filter" className="input-label">Filter by Class</label>
                    <select id="class-filter" value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
                        <option value="all">All Classes</option>
                        {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-md text-center">
                    <p className="text-sm">Found <strong className="text-lg">{reportData.reduce((sum, g) => sum + g.students.length, 0)}</strong> defaulter records for the selected class(es).</p>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={handleExport} className="btn-secondary" disabled={reportData.length === 0}>Export CSV</button>
                    <button onClick={handleGenerate} className="btn-primary" disabled={reportData.length === 0}>Print Preview</button>
                </div>
            </div>
        </Modal>
    );
};

export default DefaulterReportModal;