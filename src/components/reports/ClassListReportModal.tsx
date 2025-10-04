import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { downloadCsvString, escapeCsvCell } from '../../utils/csvHelper';
import { UserRole } from '../../types';
import { formatDate, EduSyncLogo } from '../../constants';

interface ClassListReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const availableColumns = {
    rollNumber: "Std. ID",
    fatherName: "Father's Name",
    caste: "Caste",
    contactNumber: "Contact Number",
    dateOfAdmission: "Admission Date",
    address: "Address",
};

type ColumnKey = keyof typeof availableColumns;

const ClassListReportModal: React.FC<ClassListReportModalProps> = ({ isOpen, onClose }) => {
    const { user, activeSchoolId } = useAuth();
    const { students, classes, getSchoolById } = useData();
    const { showPrintPreview } = usePrint();

    const [classId, setClassId] = useState('');
    const [selectedColumns, setSelectedColumns] = useState<Record<ColumnKey, boolean>>({
        rollNumber: true,
        fatherName: true,
        caste: false,
        contactNumber: false,
        dateOfAdmission: false,
        address: false,
    });
    const [includeBlankColumn, setIncludeBlankColumn] = useState(false);

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = useMemo(() => getSchoolById(effectiveSchoolId || ''), [getSchoolById, effectiveSchoolId]);
    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === effectiveSchoolId), [classes, effectiveSchoolId]);

    const classGroups = useMemo(() => {
        if (!classId) return [];

        if (classId === 'all') {
            return schoolClasses
                .map(c => ({
                    classId: c.id,
                    className: c.name,
                    students: students.filter(s => s.classId === c.id && s.status === 'Active').sort((a, b) => a.name.localeCompare(b.name))
                }))
                .filter(group => group.students.length > 0)
                .sort((a, b) => a.className.localeCompare(b.className));
        } else {
            const className = schoolClasses.find(c => c.id === classId)?.name || '';
            const classStudents = students.filter(s => s.classId === classId && s.status === 'Active').sort((a, b) => a.name.localeCompare(b.name));
            return classStudents.length > 0 ? [{ classId, className, students: classStudents }] : [];
        }
    }, [students, classId, schoolClasses]);

    const handleColumnToggle = (col: ColumnKey) => {
        setSelectedColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const handleGenerate = () => {
        const activeColumns = Object.entries(selectedColumns).filter(([, v]) => v).map(([k]) => k as ColumnKey);
        
        const content = (
            <div className="printable-report p-4">
                <div className="flex items-center justify-between pb-4 border-b mb-4">
                    <div className="text-left">
                        <h1 className="text-2xl font-bold">{school?.name}</h1>
                        <p className="text-sm">{school?.address}</p>
                    </div>
                    <div className="h-16 w-16 flex items-center justify-center">
                        {school?.logoUrl ? (
                            <img src={school.logoUrl} alt="School Logo" className="max-h-16 max-w-16 object-contain report-logo" />
                        ) : (
                            <EduSyncLogo className="h-12 w-12 text-primary-700 report-logo" />
                        )}
                    </div>
                </div>

                <h1 className="text-2xl font-bold mb-4 text-center">Class List</h1>

                {classGroups.map(group => (
                    <div key={group.classId} className="mb-6" style={{ pageBreakInside: 'avoid' }}>
                        <h2 className="text-lg font-bold bg-secondary-100 p-2 my-2">{group.className}</h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-secondary-200">
                                    <th className="p-2 border text-left">Sr.</th>
                                    <th className="p-2 border text-left">Student Name</th>
                                    {activeColumns.map(key => <th key={key} className="p-2 border text-left">{availableColumns[key]}</th>)}
                                    {includeBlankColumn && <th className="p-2 border text-left" style={{minWidth: '100px'}}></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {group.students.map((student, index) => (
                                    <tr key={student.id}>
                                        <td className="p-2 border">{index + 1}</td>
                                        <td className="p-2 border">{student.name}</td>
                                        {activeColumns.map(key => <td key={key} className="p-2 border">{key === 'dateOfAdmission' ? formatDate(student[key]) : student[key]}</td>)}
                                        {includeBlankColumn && <td className="p-2 border"></td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        );
        const reportTitle = classId === 'all' ? 'Class Lists' : `Class List - ${classGroups[0]?.className}`;
        showPrintPreview(content, reportTitle);
    };

    const handleExport = () => {
        const activeColumns = Object.entries(selectedColumns).filter(([, v]) => v).map(([k]) => k as ColumnKey);
        
        const headers = ['Sr.', 'Student Name', ...activeColumns.map(key => availableColumns[key])];
        if (includeBlankColumn) {
            headers.push('Notes');
        }

        const rows = [headers.join(',')];
        const escapeRow = (arr: any[]) => arr.map(v => escapeCsvCell(v)).join(',');
        
        classGroups.forEach(group => {
            rows.push(escapeRow([`Class: ${group.className}`]));
            group.students.forEach((student, index) => {
                const rowData: (string | number | undefined | null)[] = [index + 1, student.name];
                activeColumns.forEach(key => {
                    rowData.push(key === 'dateOfAdmission' ? formatDate(student[key]) : student[key]);
                });
                if (includeBlankColumn) {
                    rowData.push('');
                }
                rows.push(escapeRow(rowData));
            });
            rows.push(''); // Add a blank row between classes
        });

        const reportTitle = classId === 'all' ? 'class_lists' : `class_list_${classGroups[0]?.className.replace(/\s+/g, '_')}`;
        downloadCsvString(rows.join('\n'), reportTitle);
    };

    const totalStudents = useMemo(() => classGroups.reduce((acc, group) => acc + group.students.length, 0), [classGroups]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Printable Class List">
            <div className="space-y-4">
                <div>
                    <label htmlFor="class-select" className="input-label">Select Class</label>
                    <select id="class-select" value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
                        <option value="">-- Choose a class --</option>
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
                        <label className="flex items-center space-x-2">
                            <input type="checkbox" checked={includeBlankColumn} onChange={() => setIncludeBlankColumn(p => !p)} className="rounded" />
                            <span className="text-sm">Add Blank Column</span>
                        </label>
                    </div>
                </div>
                <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-md text-center">
                    <p className="text-sm">Found <strong className="text-lg">{totalStudents}</strong> students for the selected criteria.</p>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={handleExport} className="btn-secondary" disabled={!classId || totalStudents === 0}>Export CSV</button>
                    <button onClick={handleGenerate} className="btn-primary" disabled={!classId || totalStudents === 0}>Print Preview</button>
                </div>
            </div>
        </Modal>
    );
};

export default ClassListReportModal;