import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { UserRole } from '../../types';
import { formatDate, EduSyncLogo } from '../../constants';

interface ChallanRangeReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChallanRangeReportModal: React.FC<ChallanRangeReportModalProps> = ({ isOpen, onClose }) => {
    const { user, activeSchoolId } = useAuth();
    const { fees, students, classes, getSchoolById } = useData();
    const { showPrintPreview } = usePrint();

    const [startChallan, setStartChallan] = useState('');
    const [endChallan, setEndChallan] = useState('');

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = useMemo(() => getSchoolById(effectiveSchoolId || ''), [getSchoolById, effectiveSchoolId]);
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);
    
    const reportData = useMemo(() => {
        if (!startChallan && !endChallan) return [];

        const start = startChallan || '';
        const end = endChallan || '~~~~~~~~~~~~'; // A string that is likely to be "greater" than any challan number

        return fees
            .filter(fee => {
                const student = studentMap.get(fee.studentId);
                return student?.schoolId === effectiveSchoolId &&
                       fee.challanNumber >= start &&
                       fee.challanNumber <= end;
            })
            .sort((a, b) => a.challanNumber.localeCompare(b.challanNumber));
    }, [fees, studentMap, effectiveSchoolId, startChallan, endChallan]);
    
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
                    Fee Challan List by Range
                </h1>
                 <p className="text-center mb-4">From: {startChallan} To: {endChallan}</p>
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="p-1 text-left">Sr.</th>
                            <th className="p-1 text-left">Challan #</th>
                            <th className="p-1 text-left">Student Name</th>
                            <th className="p-1 text-left">Class</th>
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
                                    <td className="p-1">{classMap.get(student.classId) || 'N/A'}</td>
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
        showPrintPreview(content, `EduSync - Fee Challans - Range`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Print Fee Challans by Range">
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start-challan" className="input-label">Start Challan Number</label>
                        <input type="text" id="start-challan" value={startChallan} onChange={e => setStartChallan(e.target.value)} className="input-field" placeholder="e.g., 202407-1" />
                    </div>
                    <div>
                        <label htmlFor="end-challan" className="input-label">End Challan Number</label>
                        <input type="text" id="end-challan" value={endChallan} onChange={e => setEndChallan(e.target.value)} className="input-field" placeholder="e.g., 202407-50" />
                    </div>
                </div>
                <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-md text-center">
                    <p className="text-sm">Found <strong className="text-lg">{reportData.length}</strong> challans for the selected range.</p>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={handleGenerate} className="btn-primary" disabled={reportData.length === 0}>Print Preview</button>
                </div>
            </div>
        </Modal>
    );
};

export default ChallanRangeReportModal;