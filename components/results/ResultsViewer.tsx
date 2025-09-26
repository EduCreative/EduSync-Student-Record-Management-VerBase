
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Student, Result } from '../../types';
import ResultCard from './ResultCard';


const ResultsViewer: React.FC = () => {
    const { user } = useAuth();
    const { students, results, schools, classes } = useData();

    const myChildren = useMemo(() => {
        if (!user) return [];
        if (user.role === 'Parent') {
            return students.filter(s => user.childStudentIds?.includes(s.id));
        }
        if (user.role === 'Student') {
            const studentProfile = students.find(s => s.userId === user.id);
            return studentProfile ? [studentProfile] : [];
        }
        return [];
    }, [user, students]);

    const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(myChildren[0]);

    const studentResults = useMemo(() => {
        if (!selectedStudent) return [];
        return results.filter(r => r.studentId === selectedStudent.id);
    }, [results, selectedStudent]);
    
    const resultsByExam = useMemo(() => {
        return studentResults.reduce((acc, result) => {
            if (!acc[result.exam]) {
                acc[result.exam] = [];
            }
            acc[result.exam].push(result);
            return acc;
        }, {} as Record<string, Result[]>);
    }, [studentResults]);

    const school = useMemo(() => {
        if (!selectedStudent) return undefined;
        return schools.find(s => s.id === selectedStudent.schoolId);
    }, [schools, selectedStudent]);

    const studentClass = useMemo(() => {
        if (!selectedStudent) return undefined;
        return classes.find(c => c.id === selectedStudent.classId);
    }, [classes, selectedStudent]);
    

    return (
        <div className="space-y-6">
            <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md no-print">
                <div className="flex justify-between items-center">
                    {user?.role === 'Parent' && myChildren.length > 1 && (
                        <div>
                            <label htmlFor="student-select" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Viewing results for:</label>
                            <select
                                id="student-select"
                                value={selectedStudent?.id || ''}
                                onChange={e => setSelectedStudent(myChildren.find(c => c.id === e.target.value))}
                                className="w-full max-w-xs p-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600"
                            >
                                {myChildren.map(child => <option key={child.id} value={child.id}>{child.name}</option>)}
                            </select>
                        </div>
                    )}
                 </div>
            </div>


            {!selectedStudent ? (
                <div className="bg-white dark:bg-secondary-800 p-8 rounded-xl shadow-lg text-center no-print">
                    <p className="text-secondary-500 dark:text-secondary-400">Please select a student to view their results.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(resultsByExam).map(([exam, examResults]) => (
                        <ResultCard 
                            key={exam}
                            student={selectedStudent}
                            studentClass={studentClass}
                            school={school}
                            examName={exam}
                            results={examResults}
                        />
                    ))}
                    {Object.keys(resultsByExam).length === 0 && (
                        <div className="bg-white dark:bg-secondary-800 p-8 rounded-xl shadow-lg text-center no-print">
                            <p className="text-secondary-500 dark:text-secondary-400">No results found for {selectedStudent.name}.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResultsViewer;
