import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { UserRole, FeeChallan } from '../../types';
import PrintableChallan from './PrintableChallan';

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
        if (!startChallan || !endChallan) return [];

        return fees
            .filter(fee => {
                const student = studentMap.get(fee.studentId);
                return student?.schoolId === effectiveSchoolId &&
                       fee.challanNumber >= startChallan &&
                       fee.challanNumber <= endChallan;
            })
            .sort((a, b) => a.challanNumber.localeCompare(b.challanNumber));
    }, [fees, studentMap, effectiveSchoolId, startChallan, endChallan]);
    
    const chunk = <T,>(arr: T[], size: number): T[][] =>
        Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
            arr.slice(i * size, i * size + size)
    );

    const handleGenerate = () => {
        if (!school) return;
        const challanChunks = chunk(reportData, 3);

        const content = (
            <div className="challan-print-container">
                {challanChunks.map((chunk, pageIndex) => (
                    <div key={pageIndex} className="challan-page">
                        {chunk.map((challan: FeeChallan) => {
                            const student = studentMap.get(challan.studentId);
                            const studentClass = student ? classMap.get(student.classId) : undefined;
                            if (!student) return null;

                            return (
                                <div key={challan.id} className="challan-print-instance">
                                    <PrintableChallan challan={challan} student={student} school={school} studentClass={studentClass} />
                                </div>
                            );
                        })}
                    </div>
                ))}
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
                        <input type="text" id="start-challan" value={startChallan} onChange={e => setStartChallan(e.target.value)} className="input-field" placeholder="e.g., CHN-202407-1000" />
                    </div>
                    <div>
                        <label htmlFor="end-challan" className="input-label">End Challan Number</label>
                        <input type="text" id="end-challan" value={endChallan} onChange={e => setEndChallan(e.target.value)} className="input-field" placeholder="e.g., CHN-202407-1005" />
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