import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole, Result } from '../../types';
import Avatar from '../common/Avatar';

const ResultsPage: React.FC = () => {
    const { user, effectiveRole } = useAuth();
    const { classes, students, results, saveResults } = useData();

    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [marks, setMarks] = useState<Map<string, { marks: number, totalMarks: number }>>(new Map());

    const userClasses = useMemo(() => {
        if (!user) return [];
        if (effectiveRole === UserRole.Teacher) {
            return classes.filter(c => c.teacherId === user.id);
        }
        return classes.filter(c => c.schoolId === user.schoolId);
    }, [classes, user, effectiveRole]);

    const studentsInClass = useMemo(() => {
        if (!selectedClassId) return [];
        return students.filter(s => s.classId === selectedClassId && s.status === 'Active');
    }, [students, selectedClassId]);

    useEffect(() => {
        if (userClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(userClasses[0].id);
        }
    }, [userClasses, selectedClassId]);

    useEffect(() => {
        const newMarks = new Map<string, { marks: number, totalMarks: number }>();
        const recordsForExamAndSubject = results.filter(r => r.classId === selectedClassId && r.exam === selectedExam && r.subject === selectedSubject);

        studentsInClass.forEach(student => {
            const existingRecord = recordsForExamAndSubject.find(r => r.studentId === student.id);
            newMarks.set(student.id, {
                marks: existingRecord?.marks || 0,
                totalMarks: existingRecord?.totalMarks || 100,
            });
        });
        setMarks(newMarks);
    }, [selectedClassId, selectedExam, selectedSubject, studentsInClass, results]);

    const handleMarksChange = (studentId: string, value: string, field: 'marks' | 'totalMarks') => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) return;

        setMarks(prev => {
            const newMarks = new Map(prev);
            // FIX: Explicitly cast the result of `get` to ensure TS knows the type.
            const current = newMarks.get(studentId) as { marks: number, totalMarks: number } | undefined;
            
            // FIX: Spread types may only be created from object types.
            // Create a new entry safely by checking for an existing record and providing defaults,
            // which avoids spreading a potentially non-object type.
            const updatedEntry = {
                marks: current?.marks ?? 0,
                totalMarks: current?.totalMarks ?? 100,
            };
            updatedEntry[field] = numValue;

            newMarks.set(studentId, updatedEntry);
            return newMarks;
        });
    };
    
    const handleSaveResults = () => {
        if (!selectedClassId || !selectedExam || !selectedSubject) {
            alert("Please select class, exam, and subject.");
            return;
        }

        const resultsToSave: Omit<Result, 'id'>[] = Array.from(marks.entries())
            .map(([studentId, { marks: studentMarks, totalMarks }]) => ({
                studentId,
                classId: selectedClassId,
                exam: selectedExam,
                subject: selectedSubject,
                marks: studentMarks,
                totalMarks: totalMarks,
            }));
        saveResults(resultsToSave);
    };

    const exams = ["Quiz 1", "Mid-Term", "Quiz 2", "Final Exam"];
    const subjects = ["English", "Mathematics", "Science", "History", "Geography", "Art"];

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
                                    <th className="px-6 py-3">Student</th>
                                    <th className="px-6 py-3">Obtained Marks</th>
                                    <th className="px-6 py-3">Total Marks</th>
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
                        <button onClick={handleSaveResults} className="btn-primary">Save Results</button>
                    </div>
                 </div>
            )}
             <style>{`
                .input-field { @apply p-2 border rounded-md bg-secondary-50 text-secondary-900 dark:bg-secondary-700 dark:border-secondary-600 dark:text-secondary-200 placeholder:text-secondary-400 dark:placeholder:text-secondary-500; }
                .btn-primary { @apply px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg; }
            `}</style>
        </div>
    );
};

export default ResultsPage;