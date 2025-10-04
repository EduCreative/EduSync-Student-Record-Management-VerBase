import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { UserRole } from '../../types';
import PrintableIdCard from './PrintableIdCard';

interface StudentIdCardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const StudentIdCardModal: React.FC<StudentIdCardModalProps> = ({ isOpen, onClose }) => {
    const { user, activeSchoolId } = useAuth();
    const { students, classes, getSchoolById } = useData();
    const { showPrintPreview } = usePrint();
    
    const [classId, setClassId] = useState('');
    
    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = useMemo(() => getSchoolById(effectiveSchoolId || ''), [getSchoolById, effectiveSchoolId]);
    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === effectiveSchoolId), [classes, effectiveSchoolId]);
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    const reportData = useMemo(() => {
        if (!classId) return [];
        return students.filter(s => s.classId === classId && s.status === 'Active');
    }, [students, classId]);

    const handleGenerate = () => {
        if (!school) return;
        
        const content = (
            <div className="printable-id-card-container">
                {reportData.map(student => (
                    <PrintableIdCard 
                        key={student.id}
                        student={student}
                        studentClass={classMap.get(student.classId)}
                        school={school}
                    />
                ))}
            </div>
        );
        showPrintPreview(content, `ID Cards - ${classMap.get(classId)}`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Student ID Cards">
            <div className="space-y-4">
                <div>
                    <label htmlFor="class-select-id-card" className="input-label">Select Class</label>
                    <select id="class-select-id-card" value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
                        <option value="">-- Choose a class --</option>
                        {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-md text-center">
                    <p className="text-sm">Found <strong className="text-lg">{reportData.length}</strong> students in the selected class.</p>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={handleGenerate} className="btn-primary" disabled={reportData.length === 0}>Print Preview</button>
                </div>
            </div>
        </Modal>
    );
};

export default StudentIdCardModal;