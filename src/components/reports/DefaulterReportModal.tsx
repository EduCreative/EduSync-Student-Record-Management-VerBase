import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { downloadCsvString, escapeCsvCell } from '../../utils/csvHelper';
import { UserRole } from '../../types';
import { EduSyncLogo } from '../../constants';

interface DefaulterReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const availableColumns = {
    fatherName: "Father's Name",
    amountDue: "Amount Due",
    paid: "Paid"
};
type ColumnKey = keyof typeof availableColumns;

const DefaulterReportModal: React.FC<DefaulterReportModalProps> = ({ isOpen, onClose }) => {
    const { user, activeSchoolId } = useAuth();
    const { fees, students, classes, getSchoolById } = useData();
    const { showPrintPreview } = usePrint();

    const [classId, setClassId] = useState('all');
    const [selectedColumns, setSelectedColumns] = useState<Record<ColumnKey, boolean>>({
        fatherName: true,
        amountDue: true,
        paid: true,
    });

    const handleColumnToggle = (col: ColumnKey) => {
        setSelectedColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

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
        const activeColumns = Object.keys(selectedColumns).filter(k => selectedColumns[k as ColumnKey]) as ColumnKey[];
        const subtotalColspan = 3 + (activeColumns.includes('fatherName') ? 1 : 0);

        const content = (
            <div className="printable-report p-4 font-sans">
                {/* School Header */}
                <div className="flex items-center gap-4 pb-4 border-b mb-4">
                    <div className="flex-shrink-0 h-16 w-16 flex items-center justify-center">
                        {school?.logoUrl ? (
                            <img src={school.logoUrl} alt="School Logo" className="max-h-16 max-w-16 object-contain" />
                        ) : (
                            <EduSyncLogo className="h-12 w-12 text-primary-700" />
                        )}
                    </div>
                    <div className="text-left">
                        <h1 className="text-2xl font-bold">{school?.name}</h1>
                        <p className="text-sm">{school?.address}</p>
                    </div>
                </div>

                <h2 className="text-xl font-bold mb-2 text-center">Fee Defaulter Report</h2>
                <p className="text-center mb-4">For Class: {classId === 'all' ? 'All Classes' : schoolClasses.find(c => c.id === classId)?.name}</p>

                {reportData.map((classGroup) => (
                    <div key={classGroup.classId} className="mb-6" style={{ pageBreakInside: 'avoid' }}>
                        <h3 className="text-lg font-bold bg-secondary-100 p-2 my-2">{classGroup.className}</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="py-0 px-1 text-left">Sr.</th>
                                    <th className="py-0 px-1 text-left">StdID</th>
                                    <th className="py-0 px-1 text-left">Student Name</th>
                                    {activeColumns.includes('fatherName') && <th className="py-0 px-1 text-left">Father Name</th>}
                                    {activeColumns.includes('amountDue') && <th className="py-0 px-1 text-right">Amount Due</th>}
                                    {activeColumns.includes('paid') && <th className="py-0 px-1 text-right">Paid</th>}
                                    <th className="py-0 px-1 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classGroup.students.map((student, index) => (
                                    <tr key={student.studentId}>
                                        <td className="py-0 px-1">{index + 1}</td>
                                        <td className="py-0 px-1">{student.stdId}</td>
                                        <td className="py-0 px-1">{student.studentName}</td>
                                        {activeColumns.includes('fatherName') && <td className="py-0 px-1">{student.fatherName}</td>}
                                        {activeColumns.includes('amountDue') && <td className="py-0 px-1 text-right">{student.amountDue.toLocaleString()}</td>}
                                        {activeColumns.includes('paid') && <td className="py-0 px-1 text-right">{student.paid.toLocaleString()}</td>}
                                        <td className="py-0 px-1 text-right">{student.balance.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold bg-secondary-100">
                                    <td colSpan={subtotalColspan} className="py-1 px-1 text-right">Sub Total:</td>
                                    {activeColumns.includes('amountDue') && <td className="py-1 px-1 text-right">{classGroup.subtotals.amountDue.toLocaleString()}</td>}
                                    {activeColumns.includes('paid') && <td className="py-1 px-1 text-right">{classGroup.subtotals.paid.toLocaleString()}</td>}
                                    <td className="py-1 px-1 text-right">{classGroup.subtotals.balance.toLocaleString()}</td>
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
                                    <td colSpan={subtotalColspan} className="py-1 px-2 text-right">Grand Total:</td>
                                    {activeColumns.includes('amountDue') && <td className="py-1 px-2 text-right">Rs. {grandTotal.amountDue.toLocaleString()}</td>}
                                    {activeColumns.includes('paid') && <td className="py-1 px-2 text-right">Rs. {grandTotal.paid.toLocaleString()}</td>}
                                    <td className="py-1 px-2 text-right">Rs. {grandTotal.balance.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
        showPrintPreview(content, "EduSync - Fee Defaulter Report");
    };

    const handleExport = () => {
        const headers: string[] = ['Sr.', 'StdID', 'Student Name'];
        if (selectedColumns.fatherName) headers.push("Father's Name");
        if (selectedColumns.amountDue) headers.push('Amount Due');
        if (selectedColumns.paid) headers.push('Paid');
        headers.push('Balance');

        const csvRows = [headers.join(',')];
    
        reportData.forEach(classGroup => {
            csvRows.push(escapeCsvCell(`Class: ${classGroup.className}`));
            classGroup.students.forEach((student, index) => {
                const row: (string | number)[] = [index + 1, student.stdId, student.studentName];
                if (selectedColumns.fatherName) row.push(student.fatherName);
                if (selectedColumns.amountDue) row.push(student.amountDue);
                if (selectedColumns.paid) row.push(student.paid);
                row.push(student.balance);
                csvRows.push(row.map(escapeCsvCell).join(','));
            });
            const subtotalRow = Array(headers.length).fill('');
            subtotalRow[headers.indexOf('Student Name')] = 'Sub Total';
            if (headers.includes('Amount Due')) subtotalRow[headers.indexOf('Amount Due')] = classGroup.subtotals.amountDue;
            if (headers.includes('Paid')) subtotalRow[headers.indexOf('Paid')] = classGroup.subtotals.paid;
            subtotalRow[headers.indexOf('Balance')] = classGroup.subtotals.balance;
            csvRows.push(subtotalRow.join(','));
            csvRows.push('');
        });
    
        if (reportData.length > 0) {
            csvRows.push('');
            const grandTotalRow = Array(headers.length).fill('');
            grandTotalRow[headers.indexOf('Student Name')] = 'Grand Total';
            if (headers.includes('Amount Due')) grandTotalRow[headers.indexOf('Amount Due')] = grandTotal.amountDue;
            if (headers.includes('Paid')) grandTotalRow[headers.indexOf('Paid')] = grandTotal.paid;
            grandTotalRow[headers.indexOf('Balance')] = grandTotal.balance;
            csvRows.push(grandTotalRow.join(','));
        }
    
        downloadCsvString(csvRows.join('\n'), 'defaulter_report');
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
                 <div>
                    <label className="input-label">Include Columns</label>
                    <div className="grid grid-cols-2 gap-2 p-3 border rounded-md dark:border-secondary-600">
                        {Object.entries(availableColumns).map(([key, label]) => (
                            <label key={key} className="flex items-center space-x-2">
                                <input type="checkbox" checked={selectedColumns[key as ColumnKey]} onChange={() => handleColumnToggle(key as ColumnKey)} className="rounded" />
                                <span className="text-sm">{label}</span>
                            </label>
                        ))}
                    </div>
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