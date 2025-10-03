import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
// FIX: Added Class and Student to imports for explicit typing.
import { UserRole, Result, Class, Student } from '../../types';
import Avatar from '../common/Avatar';
import ResultsViewer from './ResultsViewer';
import { useToast } from '../../context/ToastContext';

const ResultsEntry: React.FC = () => {
    const { user, effectiveRole, activeSchoolId } = useAuth();
    const { classes, students, results, saveResults } = useData();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [marks, setMarks] = useState<Map<string, { marks: number, totalMarks: number }>>(new Map());

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;

    const userClasses = useMemo(() => {
        if (!user) return [];
        if (effectiveRole === UserRole.Teacher) {
            // FIX: Explicitly type 'c' to ensure correct type inference.
            return classes.filter((c: Class) => c.schoolId === effectiveSchoolId && c.teacherId === user.id);
        }
        // FIX: Explicitly type 'c' to ensure correct type inference.
        return classes.filter((c: Class) => c.schoolId === effectiveSchoolId);
    }, [classes, user, effectiveRole, effectiveSchoolId]);

    const studentsInClass = useMemo(() => {
        if (!selectedClassId) return [];
        // FIX: Explicitly type 's' to ensure correct type inference.
        return students.filter((s: Student) => s.classId === selectedClassId && s.status === 'Active');
    }, [students, selectedClassId]);

    useEffect(() => {
        if (userClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(userClasses[0].id);
        }
    }, [userClasses, selectedClassId]);

    useEffect(() => {
        const newMarks = new Map<string, { marks: number, totalMarks: number }>();
        // FIX: Explicitly typed the 'r' parameter to ensure that recordsForExamAndSubject is correctly typed as Result[], preventing type errors downstream.
        const recordsForExamAndSubject = results.filter((r: Result) => r.classId === selectedClassId && r.exam === selectedExam && r.subject === selectedSubject);

        studentsInClass.forEach(student => {
            const existingRecord = recordsForExamAndSubject.find(r => r.studentId === student.id);
            newMarks.set(student.id, {
                marks: existingRecord ? existingRecord.marks : 0,
                totalMarks: existingRecord ? existingRecord.totalMarks : 100,
            });
        });
        setMarks(newMarks);
    }, [selectedClassId, selectedExam, selectedSubject, studentsInClass, results]);

    const handleMarksChange = (studentId: string, value: string, field: 'marks' | 'totalMarks') => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) return;

        setMarks(prev => {
            const newMarks = new Map(prev);
            const current = newMarks.get(studentId);
            
            const updatedEntry = {
                marks: current?.marks ?? 0,
                totalMarks: current?.totalMarks ?? 100,
            };
            updatedEntry[field] = numValue;

            newMarks.set(studentId, updatedEntry);
            return newMarks;
        });
    };
    
    const handleSaveResults = async () => {
        if (!selectedClassId || !selectedExam || !selectedSubject) {
            alert("Please select class, exam, and subject.");
            return;
        }
        setIsSaving(true);
        try {
            const resultsToSave: Omit<Result, 'id'>[] = Array.from(marks.entries())
                .map(([studentId, { marks: studentMarks, totalMarks }]) => ({
                    studentId,
                    classId: selectedClassId,
                    exam: selectedExam,
                    subject: selectedSubject,
                    marks: studentMarks,
                    totalMarks: totalMarks,
                }));
            await saveResults(resultsToSave);
        } catch (error) {
            console.error("Failed to save results:", error);
            showToast('Error', 'Could not save results. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const exams = useMemo(() => ["Quiz 1", "Mid-Term", "Quiz 2", "Final Exam", ...[...new Set(results.map(r => r.exam))] ], [results]);
    const subjects = useMemo(() => ["English", "Mathematics", "Science", "History", "Geography", "Art", ...[...new Set(results.map(r => r.subject))] ], [results]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Enter Results</h1>
            
            <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="input-field">
                        <option value="">Select Class</option>
                        {userClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="input-field">
                        <option value="">Select Exam</option>
                        {exams.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                     <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="input-field">
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {selectedClassId && selectedExam && selectedSubject && (
                 <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                                <tr>
                                    <th className="px-6 py-3 text-left">Student</th>
                                    <th className="px-6 py-3 text-left">Obtained Marks</th>
                                    <th className="px-6 py-3 text-left">Total Marks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentsInClass.map(student => (
                                    <tr key={student.id} className="border-b dark:border-secondary-700">
                                        <td className="px-6 py-3 flex items-center space-x-3">
                                            <Avatar student={student} className="w-8 h-8"/>
                                            <span className="font-medium text-secondary-900 dark:text-white">{student.name}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <input type="number" value={marks.get(student.id)?.marks || ''} onChange={(e) => handleMarksChange(student.id, e.target.value, 'marks')} className="input-field w-24" />
                                        </td>
                                        <td className="px-6 py-3">
                                            <input type="number" value={marks.get(student.id)?.totalMarks || ''} onChange={(e) => handleMarksChange(student.id, e.target.value, 'totalMarks')} className="input-field w-24" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     <div className="p-4 flex justify-end">
                        <button onClick={handleSaveResults} disabled={isSaving} className="btn-primary">
                            {isSaving ? 'Saving...' : 'Save Results'}
                        </button>
                    </div>
                 </div>
            )}
        </div>
    );
};

const ResultsPage: React.FC = () => {
    const { effectiveRole } = useAuth();
    
    const canEnterResults = effectiveRole === UserRole.Admin || effectiveRole === UserRole.Teacher;

    if (canEnterResults) {
        return <ResultsEntry />;
    } else {
        return <ResultsViewer />;
    }
};

export default ResultsPage;