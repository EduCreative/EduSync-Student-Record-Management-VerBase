import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { exportToCsv } from '../../utils/csvHelper';
import { UserRole } from '../../types';
import { formatDate } from '../../constants';

interface ClassListReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const availableColumns = {
    rollNumber: "Roll Number",
    fatherName: "Father's Name",
    contactNumber: "Contact Number",
    dateOfAdmission: "Admission Date",
    address: "Address",
};

type ColumnKey = keyof typeof availableColumns;

const ClassListReportModal: React.FC<ClassListReportModalProps> = ({ isOpen, onClose }) => {
    const { user, activeSchoolId } = useAuth();
    const { students, classes } = useData();
    const { showPrintPreview } = usePrint();

    const [classId, setClassId] = useState('');
    const [selectedColumns, setSelectedColumns] = useState<Record<ColumnKey, boolean>>({
        rollNumber: true,
        fatherName: true,
        contactNumber: false,
        dateOfAdmission: false,
        address: false,
    });

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === effectiveSchoolId), [classes, effectiveSchoolId]);

    const reportData = useMemo(() => {
        if (!classId) return [];
        return students.filter(s => s.classId === classId && s.status === 'Active').sort((a,b) => a.name.localeCompare(b.name));
    }, [students, classId]);
    
    const handleColumnToggle = (col: ColumnKey) => {
        setSelectedColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const handleGenerate = () => {
        const activeColumns = Object.entries(selectedColumns).filter(([,v]) => v).map(([k]) => k as ColumnKey);
        const selectedClass = schoolClasses.find(c => c.id === classId);

        const content = (
            <div className="printable-report p-4">
                <h1 className="text-2xl font-bold mb-2 text-center">Class List</h1>
                <p className="text-center mb-4">Class: {selectedClass?.name}</p>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-secondary-200">
                            <th className="p-2 border text-left">#</th>
                            <th className="p-2 border text-left">Student Name</th>
                            {activeColumns.map(key => <th key={key} className="p-2 border text-left">{availableColumns[key]}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((student, index) => (
                            <tr key={student.id}>
                                <td className="p-2 border">{index + 1}</td>
                                <td className="p-2 border">{student.name}</td>
                                {/* FIX: Removed overly broad type cast `as keyof typeof student` which caused TS to infer a type that included non-renderable values. */}
                                {activeColumns.map(key => <td key={key} className="p-2 border">{key === 'dateOfAdmission' ? formatDate(student[key]) : student[key]}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
        showPrintPreview(content, `Class List - ${selectedClass?.name}`);
    };

    const handleExport = () => {
        const activeColumns = Object.entries(selectedColumns).filter(([,v]) => v).map(([k]) => k as ColumnKey);
        const dataToExport = reportData.map((student, index) => {
            const row: Record<string, any> = { '#': index + 1, studentName: student.name };
            activeColumns.forEach(key => {
                // FIX: Removed overly broad type cast `as keyof typeof student` for type safety and consistency.
                row[availableColumns[key]] = key === 'dateOfAdmission' ? formatDate(student[key]) : student[key];
            });
            return row;
        });
        exportToCsv(dataToExport, `class_list_${schoolClasses.find(c => c.id === classId)?.name}`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Printable Class List">
            <div className="space-y-4">
                <div>
                    <label htmlFor="class-select" className="input-label">Select Class</label>
                    <select id="class-select" value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
                        <option value="">-- Choose a class --</option>
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
                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={handleExport} className="btn-secondary" disabled={!classId}>Export CSV</button>
                    <button onClick={handleGenerate} className="btn-primary" disabled={!classId}>Print Preview</button>
                </div>
            </div>
        </Modal>
    );
};

export default ClassListReportModal;