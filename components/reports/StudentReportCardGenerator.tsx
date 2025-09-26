
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Student, Result, School, Class } from '../../types';
import ReportViewer from './ReportViewer';
import ResultCard from '../results/ResultCard';

const EXAM_TYPES = ['Mid-Term', 'Final', 'Quiz 1', 'Quiz 2'];

interface ReportData {
    student: Student;
    studentClass?: Class;
    school?: School;
    examName: string;
    results: Result[];
}

const StudentReportCardGenerator: React.FC = () => {
    const { user } = useAuth();
    const { classes, students, results, schools } = useData();

    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === user?.schoolId), [classes, user]);
    const school = useMemo(() => schools.find(s => s.id === user?.schoolId), [schools, user]);

    const [filters, setFilters] = useState({
        classId: '',
        exam: EXAM_TYPES[0],
    });
    const [reportData, setReportData] = useState<ReportData[] | null>(null);

    useEffect(() => {
        if (schoolClasses.length > 0 && !filters.classId) {
            setFilters(f => ({ ...f, classId: schoolClasses[0].id }));
        }
    }, [schoolClasses, filters.classId]);

    const handleGenerate = () => {
        if (!filters.classId || !filters.exam) {
            alert("Please select a class and an exam type.");
            return;
        }

        const studentsInClass = students.filter(s => s.classId === filters.classId);
        const studentClass = classes.find(c => c.id === filters.classId);

        const data: ReportData[] = studentsInClass.map(student => {
            const studentResults = results.filter(r => 
                r.studentId === student.id && r.exam === filters.exam
            );
            return {
                student,
                studentClass,
                school,
                examName: filters.exam,
                results: studentResults,
            };
        });
        setReportData(data);
    };
    
    const selectedClassName = useMemo(() => {
        return schoolClasses.find(c => c.id === filters.classId)?.name || 'N/A';
    }, [schoolClasses, filters.classId]);

    return (
        <div className="space-y-6">
            <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md space-y-4 no-print">
                <h2 className="text-lg font-semibold">Student Report Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="label">Class</label>
                        <select value={filters.classId} onChange={e => setFilters(f => ({ ...f, classId: e.target.value }))} className="input-field">
                            <option value="">Select Class</option>
                            {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Exam Type</label>
                        <select value={filters.exam} onChange={e => setFilters(f => ({ ...f, exam: e.target.value }))} className="input-field">
                            {EXAM_TYPES.map(exam => <option key={exam} value={exam}>{exam}</option>)}
                        </select>
                    </div>
                    <button onClick={handleGenerate} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 h-10">Generate Report Cards</button>
                </div>
            </div>

            {reportData && (
                <ReportViewer
                    title={`Report Cards for ${selectedClassName} - ${filters.exam}`}
                    onClose={() => setReportData(null)}
                >
                    <div className="space-y-8">
                        {reportData.map(data => (
                            <ResultCard
                                key={data.student.id}
                                student={data.student}
                                studentClass={data.studentClass}
                                school={data.school}
                                examName={data.examName}
                                results={data.results}
                            />
                        ))}
                         {reportData.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-secondary-500 dark:text-secondary-400">No students found in this class to generate report cards for.</p>
                            </div>
                         )}
                    </div>
                </ReportViewer>
            )}
            <style>{`.label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; } .input-field { width: 100%; padding: 0.5rem; border-radius: 0.375rem; border: 1px solid #d1d5db; } .dark .input-field { background-color: #374151; border-color: #4b5563; }`}</style>
        </div>
    );
};

export default StudentReportCardGenerator;
