
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Result, UserRole, School, Class, Student } from '../../types';
import ReportViewer from '../reports/ReportViewer';
import ResultCard from './ResultCard';
import { PrinterIcon } from '../../constants';

const EXAM_TYPES = ['Mid-Term', 'Final', 'Quiz 1', 'Quiz 2'];
const SUBJECTS = ['Math', 'Science', 'English', 'History', 'Art'];

interface ReportCardData {
    student: any;
    studentClass?: Class;
    school?: School;
    examName: string;
    results: Result[];
}

const ResultsManager: React.FC = () => {
    const { user, activeSchoolId } = useAuth();
    const { classes, students, results, saveResults, schools } = useData();

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;

    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedExam, setSelectedExam] = useState<string>(EXAM_TYPES[0]);
    const [resultsData, setResultsData] = useState<Record<string, Partial<Result>>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isPrintView, setIsPrintView] = useState(false);

    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === effectiveSchoolId), [classes, effectiveSchoolId]);
    const school = useMemo(() => schools.find(s => s.id === effectiveSchoolId), [schools, effectiveSchoolId]);

    useEffect(() => {
        if (schoolClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(schoolClasses[0].id);
        } else if (schoolClasses.length === 0) {
            setSelectedClassId('');
        }
    }, [schoolClasses, selectedClassId]);

    const studentsInClass = useMemo(() => {
        if (!selectedClassId) return [];
        return students.filter(s => s.classId === selectedClassId).sort((a, b) => a.name.localeCompare(b.name));
    }, [students, selectedClassId]);

    useEffect(() => {
        const initialData: Record<string, Partial<Result>> = {};
        studentsInClass.forEach(student => {
            SUBJECTS.forEach(subject => {
                const existingResult = results.find(r =>
                    r.studentId === student.id &&
                    r.exam === selectedExam &&
                    r.subject === subject
                );
                const key = `${student.id}-${subject}`;
                initialData[key] = {
                    studentId: student.id,
                    classId: selectedClassId,
                    exam: selectedExam,
                    subject: subject,
                    marks: existingResult?.marks ?? 0,
                    totalMarks: existingResult?.totalMarks ?? 100,
                };
            });
        });
        setResultsData(initialData);
    }, [selectedClassId, selectedExam, studentsInClass, results]);

    const handleResultChange = (studentId: string, subject: string, field: 'marks' | 'totalMarks', value: number) => {
        const key = `${studentId}-${subject}`;
        setResultsData(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                studentId,
                classId: selectedClassId,
                exam: selectedExam,
                subject,
                [field]: value,
            },
        }));
    };

    const handleSaveResults = () => {
        setIsLoading(true);
        // FIX: Explicitly type `r` as Partial<Result> to fix type inference error.
        const resultsToSave = Object.values(resultsData).filter((r: Partial<Result>) => r.studentId).map(r => r as Omit<Result, 'id'>);
        setTimeout(() => {
            saveResults(resultsToSave);
            setIsLoading(false);
            // In a real app, you might use a toast notification here.
        }, 500);
    };
    
    const handlePrintReportCards = () => {
        setIsPrintView(true);
    };

    const selectedClassName = useMemo(() => {
        return schoolClasses.find(c => c.id === selectedClassId)?.name || 'N/A';
    }, [schoolClasses, selectedClassId]);
    
    const reportCardData = useMemo((): ReportCardData[] => {
        if (!isPrintView) return [];
        const studentClass = classes.find(c => c.id === selectedClassId);
        return studentsInClass.map(student => {
            // FIX: Explicitly type `r` as Partial<Result> to fix type inference error.
            const studentResults = Object.values(resultsData).filter((r: Partial<Result>) => r.studentId === student.id) as Result[];
            return {
                student,
                studentClass,
                school,
                examName: selectedExam,
                results: studentResults
            };
        });
    }, [isPrintView, studentsInClass, resultsData, selectedClassId, selectedExam, classes, school]);

    if (isPrintView) {
        return (
            <ReportViewer
                title={`Report Cards for ${selectedClassName} - ${selectedExam}`}
                onClose={() => setIsPrintView(false)}
            >
                <div className="space-y-8">
                    {reportCardData.map(data => (
                        <ResultCard
                            key={data.student.id}
                            student={data.student}
                            studentClass={data.studentClass}
                            school={data.school}
                            examName={data.examName}
                            results={data.results}
                        />
                    ))}
                    {reportCardData.length === 0 && (
                        <div className="text-center py-12">
                            <p>No results have been entered for this class and exam combination.</p>
                        </div>
                    )}
                </div>
            </ReportViewer>
        );
    }

    return (
        <div className="space-y-6">
            {/* Control Panel */}
            <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="class-select" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Select Class</label>
                        <select id="class-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full p-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600">
                            {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="exam-select" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Select Exam</label>
                        <select id="exam-select" value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="w-full p-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600">
                            {EXAM_TYPES.map(exam => <option key={exam} value={exam}>{exam}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center justify-start md:justify-end gap-2 md:col-span-2 lg:col-span-1">
                        <button
                            onClick={handlePrintReportCards}
                            disabled={studentsInClass.length === 0}
                            className="flex items-center justify-center gap-2 bg-secondary-200 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary-300 dark:hover:bg-secondary-600 transition disabled:opacity-50"
                        >
                            <PrinterIcon className="w-4 h-4" />
                            Print Reports
                        </button>
                        <button 
                            onClick={handleSaveResults} 
                            disabled={isLoading} 
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Save Results'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Entry Table */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                <div className="p-4 border-b dark:border-secondary-700">
                    <h2 className="text-lg font-semibold">Enter/Edit Marks for {selectedClassName} - <span className="font-normal">{selectedExam}</span></h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                            <tr>
                                <th className="px-4 py-3 sticky left-0 bg-secondary-50 dark:bg-secondary-700 z-10">Student</th>
                                {SUBJECTS.map(subject => (
                                    <th key={subject} className="px-4 py-3 text-center" colSpan={2}>{subject}</th>
                                ))}
                            </tr>
                            <tr>
                                <th className="px-4 py-2 sticky left-0 bg-secondary-50 dark:bg-secondary-700 z-10"></th>
                                {SUBJECTS.map(subject => (
                                    <React.Fragment key={subject}>
                                        <th className="px-2 py-2 text-center font-normal">Marks</th>
                                        <th className="px-2 py-2 text-center font-normal">Total</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {studentsInClass.map(student => (
                                <tr key={student.id} className="border-b dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                    <td className="px-4 py-2 sticky left-0 bg-white dark:bg-secondary-800 group-hover:bg-secondary-50 dark:group-hover:bg-secondary-700/50 whitespace-nowrap">
                                        <div className="font-medium text-secondary-900 dark:text-white">{student.name}</div>
                                        <div className="text-xs font-normal text-secondary-500">{student.gender === 'Male' ? 's/o' : 'd/o'} {student.fatherName}</div>
                                    </td>
                                    {SUBJECTS.map(subject => {
                                        const key = `${student.id}-${subject}`;
                                        const result = resultsData[key];
                                        return (
                                            <React.Fragment key={subject}>
                                                <td className="px-2 py-1">
                                                    <input
                                                        type="number"
                                                        value={result?.marks ?? ''}
                                                        onChange={e => handleResultChange(student.id, subject, 'marks', parseInt(e.target.value) || 0)}
                                                        className="w-16 p-1 text-center border rounded-md dark:bg-secondary-600 dark:border-secondary-500"
                                                    />
                                                </td>
                                                <td className="px-2 py-1">
                                                    <input
                                                        type="number"
                                                        value={result?.totalMarks ?? ''}
                                                        onChange={e => handleResultChange(student.id, subject, 'totalMarks', parseInt(e.target.value) || 0)}
                                                        className="w-16 p-1 text-center border rounded-md dark:bg-secondary-600 dark:border-secondary-500"
                                                    />
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
                                </tr>
                            ))}
                            {studentsInClass.length === 0 && (
                                <tr>
                                    <td colSpan={SUBJECTS.length * 2 + 1} className="text-center py-8 text-secondary-500">
                                        No students found in this class.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ResultsManager;