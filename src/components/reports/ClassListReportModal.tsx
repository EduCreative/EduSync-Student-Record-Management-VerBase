import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { usePrint } from '../../context/PrintContext';
import { exportToCsv } from '../../utils/csvHelper';
import { UserRole, Student } from '../../types';
import { formatDate, EduSyncLogo } from '../../constants';

interface ClassListReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const availableColumns = {
    rollNumber: "Student ID",
    fatherName: "Father's Name",
    caste: "Caste",
    contactNumber: "Contact Number",
    dateOfAdmission: "Admission Date",
    address: "Address",
    blankColumn: "Blank Column",
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
        contactNumber: true,
        dateOfAdmission: false,
        address: false,
        blankColumn: false,
    });

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = useMemo(() => getSchoolById(effectiveSchoolId || ''), [getSchoolById, effectiveSchoolId]);
    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === effectiveSchoolId), [classes, effectiveSchoolId]);
    const classMap = useMemo(() => new Map(schoolClasses.map(c => [c.id, c.name])), [schoolClasses]);

    const reportData = useMemo(() => {
        const activeStudentsInSchool = students.filter(s => s.schoolId === effectiveSchoolId && s.status === 'Active');

        if (classId === 'all') {
            const groupedByClass = activeStudentsInSchool.reduce((acc, student) => {
                const className = classMap.get(student.classId) || 'Unassigned';
                if (!acc[className]) {
                    acc[className] = [];
                }
                acc[className].push(student);
                return acc;
            }, {} as Record<string, Student[]>);

            return Object.entries(groupedByClass)
                .sort(([classNameA], [classNameB]) => classNameA.localeCompare(classNameB))
                .map(([className, classStudents]) => ({
                    className,
                    students: classStudents.sort((a, b) => a.name.localeCompare(b.name)),
                }));
        }

        if (!classId) return [];

        return students.filter(s => s.classId === classId && s.status === 'Active').sort((a,b) => a.name.localeCompare(b.name));
    }, [students, classId, effectiveSchoolId, classMap]);
    
    const handleColumnToggle = (col: ColumnKey) => {
        setSelectedColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const handleGenerate = () => {
        const activeColumns = Object.entries(selectedColumns).filter(([,v]) => v).map(([k]) => k as ColumnKey);
        const selectedClass = schoolClasses.find(c => c.id === classId);
        const isGrouped = classId === 'all';

        const renderTable = (studentList: Student[], title?: string) => (
            <div key={title || 'single-class'} className="mb-8" style={{ pageBreakInside: 'avoid' }}>
                {title && <h2 className="text-xl font-bold mb-2 text-center">{title}</h2>}
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-secondary-200">
                            <th className="p-2 border text-left">Sr.</th>
                            <th className="p-2 border text-left">Student Name</th>
                            {activeColumns.map(key => <th key={key} className="p-2 border text-left">{availableColumns[key]}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {studentList.map((student, index) => (
                            <tr key={student.id}>
                                <td className="p-2 border">{index + 1}</td>
                                <td className="p-2 border">{student.name}</td>
                                {activeColumns.map(key => {
                                    if (key === 'blankColumn') return <td key={key} className="p-2 border"></td>;
                                    const value = (student as any)[key];
                                    return <td key={key} className="p-2 border">{key === 'dateOfAdmission' ? formatDate(value) : value || ''}</td>;
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );

        const content = (
            <div className="printable-report p-4 font-sans">
                <div className="flex items-center justify-between pb-4 border-b mb-6">
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

                <h1 className="text-2xl font-bold mb-2 text-center">Class List</h1>
                {!isGrouped && <p className="text-center mb-4">Class: {selectedClass?.name}</p>}

                {isGrouped 
                    ? (reportData as { className: string; students: Student[] }[]).map(group => renderTable(group.students, group.className))
                    : renderTable(reportData as Student[])
                }
            </div>
        );
        showPrintPreview(content, `Class List - ${isGrouped ? 'All Classes' : selectedClass?.name}`);
    };

    const handleExport = () => {
        const isGrouped = classId === 'all';
        const activeColumns = Object.entries(selectedColumns).filter(([,v]) => v).map(([k]) => k as ColumnKey);
        
        const dataToExport: any[] = [];
        
        const processStudents = (studentsToProcess: Student[]) => {
            studentsToProcess.forEach((student, index) => {
                const row: Record<string, any> = { 'Sr.': index + 1, 'Student Name': student.name };
                activeColumns.forEach(key => {
                    if (key === 'blankColumn') {
                        row[availableColumns[key]] = '';
                    } else {
                        const value = (student as any)[key];
                        row[availableColumns[key]] = key === 'dateOfAdmission' ? formatDate(value) : (value || '');
                    }
                });
                dataToExport.push(row);
            });
        };

        if (isGrouped) {
            (reportData as { className: string, students: Student[] }[]).forEach(group => {
                dataToExport.push({ 'Sr.': `CLASS: ${group.className}` });
                processStudents(group.students);
                dataToExport.push({}); // Add a spacer row
            });
        } else {
            processStudents(reportData as Student[]);
        }
        
        exportToCsv(dataToExport, `class_list_${isGrouped ? 'all_classes' : schoolClasses.find(c => c.id === classId)?.name}`);
    };

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
