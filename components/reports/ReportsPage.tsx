

import React, { useState } from 'react';
import { ActiveView } from '../layout/Layout';
import FeeCollectionReport from './FeeCollectionReport';
import FeeDefaulterReport from './FeeDefaulterReport';
import ClassListReport from './ClassListReport';
import PrintChallansReport from './PrintChallansReport';
import LeavingCertificateReport from './LeavingCertificateReport';
import StudentReportCardGenerator from './StudentReportCardGenerator';

type ReportType = 'collection' | 'defaulters' | 'classLists' | 'printChallans' | 'leavingCertificate' | 'studentReportCards';

// FIX: Moved icon components before their usage in `reportTypes` to resolve declaration errors.
// FIX: Changed props type to React.SVGProps<SVGSVGElement> for better type safety with spread props.
const CollectionIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
const ListIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>;
const PrinterIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>;
const AwardIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 17 17 23 15.79 13.88"/></svg>;
const FileTextIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>;

// FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const reportTypes: { id: ReportType, name: string, icon: React.ReactElement }[] = [
    { id: 'collection', name: 'Fee Collection', icon: <CollectionIcon /> },
    { id: 'defaulters', name: 'Fee Defaulters', icon: <AlertTriangleIcon /> },
    { id: 'classLists', name: 'Class Lists', icon: <ListIcon /> },
    { id: 'printChallans', name: 'Print Challans', icon: <PrinterIcon /> },
    { id: 'studentReportCards', name: 'Student Report Cards', icon: <FileTextIcon /> },
    { id: 'leavingCertificate', name: 'Leaving Certificate', icon: <AwardIcon /> },
];

const ReportsPage: React.FC<{ setActiveView: (view: ActiveView) => void; }> = ({ setActiveView }) => {
    const [activeReport, setActiveReport] = useState<ReportType>('collection');

    const renderReport = () => {
        switch(activeReport) {
            case 'collection': return <FeeCollectionReport />;
            case 'defaulters': return <FeeDefaulterReport />;
            case 'classLists': return <ClassListReport />;
            case 'printChallans': return <PrintChallansReport />;
            case 'leavingCertificate': return <LeavingCertificateReport setActiveView={setActiveView} />;
            case 'studentReportCards': return <StudentReportCardGenerator />;
            default: return <div>Select a report to view.</div>;
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Reports</h1>
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-1/4 lg:w-1/5 no-print">
                    <nav className="space-y-2">
                        {reportTypes.map(report => {
                            return (
                                <button
                                    key={report.id}
                                    onClick={() => setActiveReport(report.id)}
                                    className={`w-full flex items-center p-3 text-sm font-medium rounded-lg transition-colors ${
                                        activeReport === report.id
                                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                                            : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700'
                                    }`}
                                >
                                    {/* FIX: Cast element to a type that accepts className to resolve TS inference issue. */}
                                    {React.cloneElement(report.icon as React.ReactElement<any>, { className: "w-5 h-5 mr-3" })}
                                    <span>{report.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>
                <main className="flex-1">
                    {renderReport()}
                </main>
            </div>
        </div>
    )
}

export default ReportsPage;