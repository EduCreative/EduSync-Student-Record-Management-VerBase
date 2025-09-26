
import React from 'react';
import { Student, Result, School, Class } from '../../types';
import { PrinterIcon, formatDate } from '../../constants';
import { usePrint } from '../../context/PrintContext';

interface ResultCardProps {
    student: Student;
    studentClass?: Class;
    school?: School;
    examName: string;
    results: Result[];
}

const ResultCard: React.FC<ResultCardProps> = (props) => {
    const { student, studentClass, school, examName, results } = props;
    const { showPrintPreview } = usePrint();
    
    const getGradeAndRemarks = (marks: number, totalMarks: number): { grade: string, remarks: string } => {
        if (totalMarks === 0) return { grade: 'N/A', remarks: 'N/A' };
        const percentage = (marks / totalMarks) * 100;
        if (percentage >= 90) return { grade: 'A+', remarks: 'Outstanding' };
        if (percentage >= 80) return { grade: 'A', remarks: 'Excellent' };
        if (percentage >= 70) return { grade: 'B', remarks: 'Good' };
        if (percentage >= 60) return { grade: 'C', remarks: 'Satisfactory' };
        if (percentage >= 50) return { grade: 'D', remarks: 'Needs Improvement' };
        return { grade: 'F', remarks: 'Unsatisfactory' };
    };

    const summary = results.reduce((acc, r) => {
        acc.obtained += r.marks;
        acc.total += r.totalMarks;
        return acc;
    }, { obtained: 0, total: 0 });

    const percentage = summary.total > 0 ? (summary.obtained / summary.total) * 100 : 0;
    const finalGrade = getGradeAndRemarks(summary.obtained, summary.total);

    const handlePrint = () => {
        // Pass a clone of this component to the preview
        showPrintPreview(<ResultCard {...props} />, `Result Card for ${student.name}`);
    };

    return (
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg printable-result-card relative">
            <button onClick={handlePrint} className="absolute top-4 right-4 no-print bg-secondary-200 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200 p-2 rounded-full hover:bg-secondary-300 dark:hover:bg-secondary-600 transition">
                <PrinterIcon className="w-5 h-5" />
            </button>

            <header className="rc-header">
                {school?.logoUrl && <img src={school.logoUrl} alt="School Logo" />}
                <h1 className="text-3xl font-bold">{school?.name}</h1>
                <p className="text-sm">{school?.address}</p>
                <h2 className="text-2xl font-semibold mt-4">Result Card</h2>
            </header>
            
            <section className="rc-student-info">
                <table>
                    <tbody>
                        <tr>
                            <td><strong>Student Name:</strong> {student.name}</td>
                            <td><strong>Father's Name:</strong> {student.fatherName}</td>
                        </tr>
                        <tr>
                            <td><strong>Class:</strong> {studentClass?.name}</td>
                            <td><strong>Roll No:</strong> {student.rollNumber}</td>
                        </tr>
                         <tr>
                            <td><strong>Exam:</strong> {examName}</td>
                            <td><strong>Session:</strong> {new Date().getFullYear()}</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <section className="rc-results-section">
                <table className="rc-results-table">
                    <thead>
                        <tr>
                            <th className="text-left">Subject</th>
                            <th>Marks Obtained</th>
                            <th>Total Marks</th>
                            <th>Percentage</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map(result => (
                            <tr key={result.id}>
                                <td className="text-left">{result.subject}</td>
                                <td>{result.marks}</td>
                                <td>{result.totalMarks}</td>
                                <td>{result.totalMarks > 0 ? ((result.marks / result.totalMarks) * 100).toFixed(1) : '0.0'}%</td>
                                <td>{getGradeAndRemarks(result.marks, result.totalMarks).grade}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td className="text-right"><strong>Total</strong></td>
                            <td><strong>{summary.obtained}</strong></td>
                            <td><strong>{summary.total}</strong></td>
                            <td><strong>{percentage.toFixed(1)}%</strong></td>
                            <td><strong>{finalGrade.grade}</strong></td>
                        </tr>
                    </tfoot>
                </table>
                 <p className="text-sm mt-2"><strong>Remarks:</strong> {finalGrade.remarks}</p>
            </section>
            
            <footer className="rc-footer">
                <div>
                    <strong>Date of Issue:</strong> {formatDate(new Date())}
                </div>
                <div>
                    <p className="rc-signature-line">Parent's Signature</p>
                </div>
                 <div>
                    <p className="rc-signature-line">Principal's Signature</p>
                </div>
            </footer>
        </div>
    );
};

export default ResultCard;
