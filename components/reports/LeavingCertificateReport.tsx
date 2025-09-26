
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ActiveView } from '../layout/Layout';
import { Student } from '../../types';

const LeavingCertificateReport: React.FC<{ setActiveView: (view: ActiveView) => void; }> = ({ setActiveView }) => {
    const { user } = useAuth();
    const { students } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    
    const schoolStudents = useMemo(() => {
        if (!searchTerm) return [];
        return students.filter(s => 
            s.schoolId === user?.schoolId && 
            (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNumber.includes(searchTerm))
        ).slice(0, 5); // Limit results for performance
    }, [students, user, searchTerm]);

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        setSearchTerm(student.name);
    };
    
    const handleGenerate = () => {
        if (selectedStudent) {
            setActiveView({ view: 'leavingCertificate', payload: { studentId: selectedStudent.id } });
        } else {
            alert('Please select a student first.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md space-y-4">
                <h2 className="text-lg font-semibold">Issue Leaving Certificate</h2>
                <div className="relative">
                    <label className="label">Search for Student</label>
                    <input 
                        type="text" 
                        placeholder="By name or roll number..."
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setSelectedStudent(null);
                        }}
                        className="input-field" 
                    />
                    {searchTerm && schoolStudents.length > 0 && !selectedStudent && (
                        <div className="absolute z-10 w-full bg-white dark:bg-secondary-700 border dark:border-secondary-600 rounded-md mt-1 shadow-lg">
                            {schoolStudents.map(student => (
                                <div 
                                    key={student.id}
                                    onClick={() => handleSelectStudent(student)}
                                    className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-600 cursor-pointer"
                                >
                                    {student.name} <span className="text-secondary-500 text-xs">({student.gender === 'Male' ? 's/o' : 'd/o'} {student.fatherName})</span> - {student.rollNumber}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={handleGenerate} disabled={!selectedStudent} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                    Generate Certificate
                </button>
            </div>
             <style>{`.label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; } .input-field { width: 100%; padding: 0.5rem; border-radius: 0.375rem; border: 1px solid #d1d5db; } .dark .input-field { background-color: #374151; border-color: #4b5563; }`}</style>
        </div>
    );
};

export default LeavingCertificateReport;
