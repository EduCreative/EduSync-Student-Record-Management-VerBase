import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { UserRole } from '../../types';
import { formatDate, EduSyncLogo } from '../../constants';

interface BulkChallanReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const BulkChallanReportModal: React.FC<BulkChallanReportModalProps> = ({ isOpen, onClose }) => {
    const { user, activeSchoolId } = useAuth();
    const { fees, students, classes, getSchoolById } = useData();
    const { showPrintPreview } = usePrint();
    
    const [classId, setClassId] = useState('');
    const [month, setMonth] = useState(months[new Date().getMonth()]);
    const [year, setYear] = useState(currentYear);

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = useMemo(() => getSchoolById(effectiveSchoolId || ''), [getSchoolById, effectiveSchoolId]);
    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === effectiveSchoolId), [classes, effectiveSchoolId]);
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    const reportData = useMemo(() => {
        if (!classId) return [];
        return fees.filter(fee => {
            const student = studentMap.get(fee.studentId);
            return student?.classId === classId && fee.month === month && fee.year === year;
        });
    }, [fees, studentMap, classId, month, year]);

    const handleGenerate = () => {
        if (!school) return;
        
        const content = (
            <div className="printable-report p-4">
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
                <h1 className="text-xl font-bold mb-4 text-center">
                    Fee Challan List for {classMap.get(classId)} - {month} {year}
                </h1>
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="p-1 text-left">Sr.</th>
                            <th className="p-1 text-left">Challan #</th>
                            <th className="p-1 text-left">Student Name</th>
                            <th className="p-1 text-left">Father's Name</th>
                            <th className="p-1 text-right">Amount Due</th>
                            <th className="p-1 text-center">Status</th>
                            <th className="p-1 text-center">Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((challan, index) => {
                            const student = studentMap.get(challan.studentId);
                            if (!student) return null;
                            const amountDue = challan.totalAmount - challan.discount;
                            return (
                                <tr key={challan.id}>
                                    <td className="p-1">{index + 1}</td>
                                    <td className="p-1">{challan.challanNumber}</td>
                                    <td className="p-1">{student.name}</td>
                                    <td className="p-1">{student.fatherName}</td>
                                    <td className="p-1 text-right">Rs. {amountDue.toLocaleString()}</td>
                                    <td className="p-1 text-center">{challan.status}</td>
                                    <td className="p-1 text-center">{formatDate(challan.dueDate)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
        showPrintPreview(content, `EduSync - Fee Challans - ${classMap.get(classId)} - ${month} ${year}`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Bulk Fee Challans">
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-3">
                        <label htmlFor="class-select" className="input-label">Select Class</label>
                        <select id="class-select" value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
                            <option value="">-- Choose a class --</option>
                            {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="month-select" className="input-label">Month</label>
                        <select id="month-select" value={month} onChange={e => setMonth(e.target.value)} className="input-field">
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="year-select" className="input-label">Year</label>
                        <select id="year-select" value={year} onChange={e => setYear(Number(e.target.value))} className="input-field">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
                <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-md text-center">
                    <p className="text-sm">Found <strong className="text-lg">{reportData.length}</strong> challans for the selected criteria.</p>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={handleGenerate} className="btn-primary" disabled={reportData.length === 0}>Print Preview</button>
                </div>
            </div>
        </Modal>
    );
};

export default BulkChallanReportModal;