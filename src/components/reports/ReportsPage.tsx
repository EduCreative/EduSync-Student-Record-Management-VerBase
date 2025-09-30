


import React from 'react';
import { usePrint } from '../../context/PrintContext';
import { useData } from '../../context/DataContext';

interface ReportsPageProps {}

const ReportCard: React.FC<{ title: string; description: string; icon: React.ReactElement; onGenerate: () => void; }> = ({ title, description, icon, onGenerate }) => (
    <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700">
        <div className="flex items-start space-x-4">
            <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{description}</p>
                 <button onClick={onGenerate} className="mt-4 text-sm font-medium text-primary-600 hover:underline">
                    Generate Report &rarr;
                </button>
            </div>
        </div>
    </div>
);


const ReportsPage: React.FC<ReportsPageProps> = () => {
    const { showPrintPreview } = usePrint();
    const { fees, students } = useData();
    
    const generateFeeCollectionReport = () => {
        const content = (
            <div className="printable-report">
                <h1 className="text-2xl font-bold mb-4">Fee Collection Report (Sample)</h1>
                <table className="w-full">
                    <thead>
                        <tr><th>Challan #</th><th>Student</th><th>Amount Paid</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                    {fees.filter(f => f.status === 'Paid').slice(0, 20).map(fee => {
                        const student = students.find(s => s.id === fee.studentId);
                        return <tr key={fee.id}><td>{fee.challanNumber}</td><td>{student?.name}</td><td>{fee.paidAmount}</td><td>{fee.paidDate}</td></tr>
                    })}
                    </tbody>
                </table>
            </div>
        );
        showPrintPreview(content, "Fee Collection Report");
    };
    
    const generateDefaulterReport = () => {
        const content = (
            <div className="printable-report">
                <h1 className="text-2xl font-bold mb-4">Fee Defaulter Report (Sample)</h1>
                 <table className="w-full">
                    <thead>
                        <tr><th>Student</th><th>Class</th><th>Amount Due</th><th>Due Date</th></tr>
                    </thead>
                    <tbody>
                     {fees.filter(f => f.status === 'Unpaid').slice(0, 20).map(fee => {
                        const student = students.find(s => s.id === fee.studentId);
                        return <tr key={fee.id}><td>{student?.name}</td><td>Class</td><td>{fee.totalAmount}</td><td>{fee.dueDate}</td></tr>
                    })}
                    </tbody>
                </table>
            </div>
        );
        showPrintPreview(content, "Fee Defaulter Report");
    };

    const reports = [
        { 
            title: "Fee Collection Report", 
            description: "View total fees collected within a specific date range.", 
            icon: <DollarSignIcon />,
            onGenerate: generateFeeCollectionReport,
        },
        { 
            title: "Fee Defaulter Report", 
            description: "List all students with unpaid or partially paid fees.", 
            icon: <AlertTriangleIcon />,
            onGenerate: generateDefaulterReport,
        },
        { 
            title: "Printable Class Lists", 
            description: "Generate and print lists of students for any class.", 
            icon: <UsersIcon />,
            onGenerate: () => alert('Class List generation coming soon!'),
        },
         { 
            title: "Bulk Fee Challans", 
            description: "Print three-part fee challans for an entire class.", 
            icon: <FileTextIcon />,
            onGenerate: () => alert('Bulk challan printing coming soon!'),
        },
         { 
            title: "Student Report Cards", 
            description: "Generate and print detailed report cards for students.", 
            icon: <AwardIcon />,
            onGenerate: () => alert('Report card generation coming soon!'),
        },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Reports Center</h1>
            <p className="text-secondary-600 dark:text-secondary-400">
                Generate, view, and print important school documents from one place.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map(report => (
                    <ReportCard key={report.title} {...report} />
                ))}
            </div>
        </div>
    );
};

// Icons
const DollarSignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const AlertTriangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const FileTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>;
const AwardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 17 17 23 15.79 13.88"/></svg>;


export default ReportsPage;
