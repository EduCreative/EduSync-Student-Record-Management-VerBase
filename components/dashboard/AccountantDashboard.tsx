

import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

// FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactElement; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 transition-transform transform hover:scale-105">
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        <div>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">{title}</p>
            <p className="text-2xl font-bold text-secondary-800 dark:text-secondary-100">{value}</p>
        </div>
    </div>
);

// FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const QuickAction: React.FC<{ title: string; icon: React.ReactElement; }> = ({ title, icon }) => (
     <button className="flex flex-col items-center justify-center space-y-2 p-4 bg-secondary-50 dark:bg-secondary-700 dark:bg-opacity-50 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 dark:hover:bg-opacity-50 hover:text-primary-600 transition-all text-center">
        {icon}
        <span className="text-sm font-medium">{title}</span>
    </button>
);


const AccountantDashboard: React.FC = () => {
    const { user } = useAuth();
    const { getSchoolById, fees, students } = useData();

    if (!user) return null;
    const school = getSchoolById(user.schoolId);

    const stats = useMemo(() => {
        const schoolFees = fees.filter(fee => {
            const student = students.find(s => s.id === fee.studentId);
            return student?.schoolId === user.schoolId;
        });

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const collectedThisMonth = schoolFees
            .filter(f => f.paidDate && new Date(f.paidDate).getMonth() === currentMonth && new Date(f.paidDate).getFullYear() === currentYear)
            .reduce((sum, f) => sum + f.paidAmount, 0);

        const unpaidChallans = schoolFees.filter(f => f.status === 'Unpaid' || f.status === 'Partial');
        
        const overdueInvoices = unpaidChallans.filter(f => new Date(f.dueDate) < now).length;
        
        const totalStudentsInSchool = students.filter(s => s.schoolId === user.schoolId).length;

        return {
            collectedThisMonth: `Rs. ${collectedThisMonth.toLocaleString()}`,
            totalUnpaidChallans: unpaidChallans.length.toString(),
            overdueInvoices: overdueInvoices.toString(),
            totalStudentsInSchool: totalStudentsInSchool.toString(),
        };
    }, [fees, students, user.schoolId]);


    return (
        <div className="space-y-8">
             <div>
                 <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Accountant Dashboard</h1>
                 <p className="text-secondary-500 dark:text-secondary-400">Manage finances for {school?.name}.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Collected This Month" value={stats.collectedThisMonth} color="bg-green-100 dark:bg-green-900 dark:bg-opacity-50 text-green-600 dark:text-green-300" icon={<DollarSignIcon className="w-6 h-6" />} />
                <StatCard title="Total Unpaid Challans" value={stats.totalUnpaidChallans} color="bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-50 text-yellow-600 dark:text-yellow-300" icon={<FileTextIcon className="w-6 h-6" />} />
                <StatCard title="Overdue Invoices" value={stats.overdueInvoices} color="bg-red-100 dark:bg-red-900 dark:bg-opacity-50 text-red-600 dark:text-red-300" icon={<AlertCircleIcon className="w-6 h-6" />} />
                <StatCard title="Total Students" value={stats.totalStudentsInSchool} color="bg-blue-100 dark:bg-blue-900 dark:bg-opacity-50 text-blue-600 dark:text-blue-300" icon={<UsersIcon className="w-6 h-6" />} />
            </div>

            <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Financial Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickAction title="Generate Challans" icon={<FilePlusIcon className="w-8 h-8"/>} />
                    <QuickAction title="Record Payment" icon={<CreditCardIcon className="w-8 h-8"/>} />
                    <QuickAction title="Defaulters Report" icon={<BarChartIcon className="w-8 h-8"/>} />
                    <QuickAction title="Issue Certificate" icon={<AwardIcon className="w-8 h-8"/>} />
                </div>
            </div>
        </div>
    );
};

// Icons
const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const FileTextIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>;
const AlertCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const FilePlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>;
const CreditCardIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>;
const BarChartIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>;
const AwardIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 17 17 23 15.79 13.88" /></svg>;

export default AccountantDashboard;