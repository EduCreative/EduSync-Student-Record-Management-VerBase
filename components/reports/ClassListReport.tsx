import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Student } from '../../types';
import ReportViewer from './ReportViewer';
import ReportHeader from './ReportHeader';

const ALL_FIELDS: { key: keyof Student; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'fatherName', label: "Father's Name" },
    { key: 'rollNumber', label: 'Roll Number' },
    { key: 'gender', label: 'Gender' },
    { key: 'dateOfBirth', label: 'Date of Birth' },
    { key: 'contactNumber', label: 'Contact (Primary)' },
    { key: 'secondaryContactNumber', label: 'Contact (Secondary)' },
    { key: 'address', label: 'Address' },
    { key: 'dateOfAdmission', label: 'Admission Date' },
];

const DEFAULT_FIELDS: (keyof Student)[] = ['name', 'fatherName'];

const ClassListReport: React.FC = () => {
    const { user } = useAuth();
    const { classes, students } = useData();

    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === user?.schoolId), [classes, user]);
    
    const [classId, setClassId] = useState<string>('');
    const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>(
        ALL_FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: DEFAULT_FIELDS.includes(field.key) }), {})
    );
    const [reportData, setReportData] = useState<Student[] | null>(null);

    useEffect(() => {
        if (schoolClasses.length > 0 && !classId) {
            setClassId(schoolClasses[0].id);
        }
    }, [schoolClasses, classId]);

    const handleFieldToggle = (key: string) => {
        setSelectedFields(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleGenerate = () => {
        if (!classId) {
            alert("Please select a class.");
            return;
        }
        const classStudents = students.filter(s => s.classId === classId);
        setReportData(classStudents);
    };

    const activeFields = useMemo(() => ALL_FIELDS.filter(f => selectedFields[f.key]), [selectedFields]);

    const exportData = useMemo(() => {
        if (!reportData) return undefined;
        const headers = activeFields.map(f => f.label);
        const rows = reportData.map(student => activeFields.map(field => student[field.key] as string | number));
        return {
            filename: `class-list-${classes.find(c=>c.id===classId)?.name}.csv`,
            headers,
            rows,
        };
    }, [reportData, activeFields, classId, classes]);

    return (
        <div className="space-y-6">
            <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md space-y-4 no-print">
                <h2 className="text-lg font-semibold">Class List Report</h2>
                <div className="space-y-4">
                    <div>
                        <label className="label">Class</label>
                        <select value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
                            <option value="">Select a Class</option>
                            {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Fields to Include</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {ALL_FIELDS.map(field => (
                                <label key={field.key} className="flex items-center space-x-2">
                                    <input type="checkbox" checked={selectedFields[field.key]} onChange={() => handleFieldToggle(field.key)} />
                                    <span>{field.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleGenerate} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Generate Report</button>
                </div>
            </div>

            {reportData && (
                <ReportViewer 
                    title={`Class List for ${classes.find(c => c.id === classId)?.name}`} 
                    exportData={exportData}
                    onClose={() => setReportData(null)}
                >
                    <ReportHeader 
                        title="Class List"
                        filters={{
                            "Class": classes.find(c => c.id === classId)?.name || 'N/A'
                        }}
                    />
                    <table className="w-full text-sm">
                        <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                            <tr>
                                {activeFields.map(field => <th key={field.key} className="px-4 py-2 text-left">{field.label}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map(student => (
                                <tr key={student.id} className="border-b dark:border-secondary-700">
                                    {activeFields.map(field => <td key={field.key} className="px-4 py-2">{String(student[field.key] ?? '')}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportViewer>
            )}
             <style>{`.label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; } .input-field { width: 100%; padding: 0.5rem; border-radius: 0.375rem; border: 1px solid #d1d5db; } .dark .input-field { background-color: #374151; border-color: #4b5563; }`}</style>
        </div>
    );
};

export default ClassListReport;