import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { downloadCsvString, escapeCsvCell } from '../../utils/csvHelper';
import { UserRole, Student } from '../../types';
import { EduSyncLogo } from '../../constants';
import { formatDate } from '../../utils/dateHelper';

interface ClassListReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const availableColumns = {
    rollNumber: "Std. ID",
    grNumber: "GR No.",
    fatherName: "Father's Name",
    fatherCnic: "Father's CNIC",
    gender: "Gender",
    dateOfBirth: "Date of Birth",
    caste: "Caste",
    religion: "Religion",
    contactNumber: "Contact Number",
    secondaryContactNumber: "Secondary Contact",
    dateOfAdmission: "Admission Date",
    address: "Address",
};

type ColumnKey = keyof typeof availableColumns;

const ClassListReportModal: React.FC<ClassListReportModalProps> = ({ isOpen, onClose }) => {
    const { user, activeSchoolId } = useAuth();
    const { students, classes, getSchoolById } = useData();
    const { showPrintPreview } = usePrint();

    const [classId, setClassId] = useState('all');
    const [selectedColumns, setSelectedColumns] = useState<Record<ColumnKey, boolean>>({
        rollNumber: true,
        grNumber: true,
        fatherName: true,
        fatherCnic: false,
        gender: false,
        dateOfBirth: false,
        caste: false,
        religion: false,
        contactNumber: true,
        secondaryContactNumber: false,
        dateOfAdmission: false,
        address: false,
    });

    const handleColumnToggle = (col: ColumnKey) => {
        setSelectedColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = useMemo(() => getSchoolById(effectiveSchoolId || ''), [getSchoolById, effectiveSchoolId]);
    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === effectiveSchoolId), [classes, effectiveSchoolId]);

    const reportData = useMemo(() => {
        return students
            .filter((s: Student) =>
                s.schoolId === effectiveSchoolId &&
                (classId === 'all' || s.classId === classId) &&
                s.status === 'Active'
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [students, classId, effectiveSchoolId]);

    const handleGenerate = () => {
        const activeColumns = Object.keys(selectedColumns).filter(k => selectedColumns[k as ColumnKey]) as ColumnKey[];
        
        const content = (
            <div className="printable-report p-4 font-sans">
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
                <h2 className="text-xl font-bold mb-2 text-center">Class List</h2>
                <p className="text-center mb-4">Class: {classId === 'all' ? 'All Classes' : schoolClasses.find(c => c.id === classId)?.name}</p>
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="p-1 text-left">Sr.</th>
                            <th className="p-1 text-left">Student Name</th>
                            {activeColumns.map(col => <th key={col} className="p-1 text-left">{availableColumns[col]}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((student, index) => (
                            <tr key={student.id}>
                                <td className="p-1">{index + 1}</td>
                                <td className="p-1">{student.name}</td>
                                {activeColumns.map(col => (
                                    <td key={col} className="p-1">
                                        {col === 'dateOfAdmission' || col === 'dateOfBirth' ? formatDate(student[col]) : (student as any)[col] || 'N/A'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
        showPrintPreview(content, `EduSync - Class List - ${schoolClasses.find(c => c.id === classId)?.name || 'All Classes'}`);
    };
    
    const handleExport = () => {
        const headers = ["Sr.", "Student Name", ...Object.keys(selectedColumns).filter(k => selectedColumns[k as ColumnKey]).map(k => availableColumns[k as ColumnKey])];
        
        const csvRows = [headers.join(',')];
        
        reportData.forEach((student, index) => {
            const row = [
                index + 1,
                student.name,
                ...Object.keys(selectedColumns)
                    .filter(k => selectedColumns[k as ColumnKey])
                    .map(col => {
                        const key = col as ColumnKey;
                        const value = (student as any)[key];
                        return key === 'dateOfAdmission' || key === 'dateOfBirth' ? formatDate(value) : value;
                    })
            ];
            csvRows.push(row.map(escapeCsvCell).join(','));
        });
        
        downloadCsvString(csvRows.join('\n'), 'class_list_report');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Printable Class List">
            <div className="space-y-4">
                <div>
                    <label htmlFor="class-filter-list" className="input-label">Select Class</label>
                    <select id="class-filter-list" value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
                        <option value="all">All Classes</option>
                        {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="input-label">Include Columns</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-md dark:border-secondary-600">
                        {Object.entries(availableColumns).map(([key, label]) => (
                            <label key={key} className="flex items-center space-x-2">
                                <input type="checkbox" checked={selectedColumns[key as ColumnKey]} onChange={() => handleColumnToggle(key as ColumnKey)} className="rounded" />
                                <span className="text-sm">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                 <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-md text-center">
                    <p className="text-sm">Found <strong className="text-lg">{reportData.length}</strong> students for the selected class(es).</p>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={handleExport} className="btn-secondary" disabled={reportData.length === 0}>Export CSV</button>
                    <button onClick={handleGenerate} className="btn-primary" disabled={reportData.length === 0}>Print Preview</button>
                </div>
            </div>
        </Modal>
    );
};

export default ClassListReportModal;