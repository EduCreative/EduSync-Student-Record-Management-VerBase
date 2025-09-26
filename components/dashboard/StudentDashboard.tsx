

import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Avatar from '../common/Avatar';

// FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactElement; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-center space-y-2 transition-transform transform hover:scale-105">
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        <div>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">{title}</p>
            <p className="text-2xl font-bold text-secondary-800 dark:text-secondary-100">{value}</p>
        </div>
    </div>
);

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const { students, classes } = useData();

    // Find the student profile that matches the logged-in user.
    const studentProfile = useMemo(() => {
        if (!user) return undefined;
        // In a real app, the user object for a student would have a direct link.
        // We find the student profile linked by our new userId field.
        return students.find(s => s.userId === user.id);
    }, [students, user]);
    
    const studentClass = studentProfile ? classes.find(c => c.id === studentProfile.classId) : null;

    if (!user || !studentProfile) return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-4">
                 <Avatar student={studentProfile} className="w-20 h-20" />
                 <div>
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Welcome, {user.name}!</h1>
                    <p className="text-secondary-500 dark:text-secondary-400">
                        {studentClass?.name} | Roll No: {studentProfile.rollNumber}
                    </p>
                 </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard title="My Attendance" value="98%" color="bg-green-100 dark:bg-green-900 dark:bg-opacity-50 text-green-600 dark:text-green-300" icon={<CheckCircleIcon className="w-8 h-8" />} />
                 <StatCard title="Overall Grade" value="A+" color="bg-blue-100 dark:bg-blue-900 dark:bg-opacity-50 text-blue-600 dark:text-blue-300" icon={<AwardIcon className="w-8 h-8" />} />
                 <StatCard title="Fee Status" value="Paid" color="bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-50 text-yellow-600 dark:text-yellow-300" icon={<DollarSignIcon className="w-8 h-8" />} />
                 <StatCard title="Upcoming Exams" value="2" color="bg-red-100 dark:bg-red-900 dark:bg-opacity-50 text-red-600 dark:text-red-300" icon={<EditIcon className="w-8 h-8" />} />
            </div>

            <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                 <h2 className="text-xl font-semibold mb-4">Announcements</h2>
                 <ul className="space-y-3 list-disc list-inside text-secondary-600 dark:text-secondary-400">
                    <li>Parent-Teacher Meeting scheduled for next Friday.</li>
                    <li>Science fair submissions are due by the end of the month.</li>
                    <li>School will be closed for the national holiday on Monday.</li>
                 </ul>
            </div>
        </div>
    );
};

// Icons
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const AwardIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 17 17 23 15.79 13.88" /></svg>;
const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;


export default StudentDashboard;