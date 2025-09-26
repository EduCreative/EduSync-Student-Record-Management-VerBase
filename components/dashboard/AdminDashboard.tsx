
import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserRole, FeeChallan, Attendance, User } from '../../types';
import Badge from '../common/Badge';
import DoughnutChart from '../charts/DoughnutChart';
import BarChart from '../charts/BarChart';
import Avatar from '../common/Avatar';

// FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactElement; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 transition-transform transform hover:scale-105">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
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

const AdminDashboard: React.FC = () => {
    const { user, activeSchoolId } = useAuth();
    const { users, students, getSchoolById, fees, attendance } = useData();
    
    if (!user) return null;
    
    const effectiveSchoolId = user.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user.schoolId;
    const school = getSchoolById(effectiveSchoolId);
    
    const schoolStudents = useMemo(() => students.filter(s => s.schoolId === effectiveSchoolId), [students, effectiveSchoolId]);
    const schoolTeachers = useMemo(() => users.filter(u => u.schoolId === effectiveSchoolId && u.role === UserRole.Teacher), [users, effectiveSchoolId]);
    const schoolUsers = useMemo(() => users.filter(u => u.schoolId === effectiveSchoolId && u.id !== user.id), [users, effectiveSchoolId, user.id]);

    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const feesCollectedToday = fees
            .filter(f => f.paidDate === todayStr && students.find(s => s.id === f.studentId)?.schoolId === effectiveSchoolId)
            .reduce((sum, f) => sum + f.paidAmount, 0);
            
        const pendingApprovals = schoolUsers.filter(u => u.status === 'Pending Approval').length;
        
        return {
            feesCollectedToday: `Rs. ${feesCollectedToday.toLocaleString()}`,
            pendingApprovals: pendingApprovals.toString(),
        };
    }, [fees, students, schoolUsers, effectiveSchoolId]);


    const feeStatusData = useMemo(() => {
        const schoolFees = fees.filter(fee => {
            const student = students.find(s => s.id === fee.studentId);
            return student?.schoolId === effectiveSchoolId;
        });

        const statusCounts = schoolFees.reduce((acc, fee) => {
            acc[fee.status] = (acc[fee.status] || 0) + 1;
            return acc;
        }, {} as Record<FeeChallan['status'], number>);
        
        const statusColors: Record<FeeChallan['status'], string> = {
            Paid: '#10b981',
            Unpaid: '#ef4444',
            Partial: '#f59e0b',
        };

        return (['Paid', 'Unpaid', 'Partial'] as const).map(status => ({
            label: status,
            value: statusCounts[status] || 0,
            color: statusColors[status]
        }));

    }, [fees, students, effectiveSchoolId]);

    const attendanceData = useMemo(() => {
        // Find the most recent date with attendance records for a realistic snapshot
        const latestDate = attendance.reduce((latest, a) => a.date > latest ? a.date : latest, '');

        const schoolStudentIds = new Set(schoolStudents.map(s => s.id));
        
        const todaysAttendance = attendance.filter(a => 
            a.date === latestDate && schoolStudentIds.has(a.studentId)
        );

        const statusCounts = todaysAttendance.reduce((acc, att) => {
            acc[att.status] = (acc[att.status] || 0) + 1;
            return acc;
        }, {} as Record<Attendance['status'], number>);

        return [
            { label: 'Present', value: statusCounts.Present || 0 },
            { label: 'Absent', value: statusCounts.Absent || 0 },
            { label: 'Leave', value: statusCounts.Leave || 0 },
        ];
    }, [attendance, schoolStudents]);

    return (
        <div className="space-y-8">
            <div>
                 <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Admin Dashboard</h1>
                 <p className="text-secondary-500 dark:text-secondary-400">Welcome back, {user.name}. Here's what's happening at {school?.name}.</p>
            </div>
           
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Students" value={schoolStudents.length.toString()} color="bg-primary-100 dark:bg-primary-900 dark:bg-opacity-50 text-primary-600 dark:text-primary-300" icon={<UsersIcon className="w-6 h-6" />} />
                <StatCard title="Total Teachers" value={schoolTeachers.length.toString()} color="bg-green-100 dark:bg-green-900 dark:bg-opacity-50 text-green-600 dark:text-green-300" icon={<BriefcaseIcon className="w-6 h-6" />} />
                <StatCard title="Fees Collected Today" value={stats.feesCollectedToday} color="bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-50 text-yellow-600 dark:text-yellow-300" icon={<DollarSignIcon className="w-6 h-6" />} />
                <StatCard title="Pending Approvals" value={stats.pendingApprovals} color="bg-indigo-100 dark:bg-indigo-900 dark:bg-opacity-50 text-indigo-600 dark:text-indigo-300" icon={<UserCheckIcon className="w-6 h-6" />} />
            </div>
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <DoughnutChart
                    title="Fee Collection Status"
                    data={feeStatusData}
                />
                <BarChart
                    title="Today's Attendance Snapshot"
                    data={attendanceData}
                    color="#6366f1"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="lg:col-span-1 bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <QuickAction title="Add Student" icon={<UserPlusIcon className="w-8 h-8"/>} />
                        <QuickAction title="Collect Fees" icon={<DollarSignIcon className="w-8 h-8"/>} />
                        <QuickAction title="Mark Attendance" icon={<CheckCircleIcon className="w-8 h-8"/>} />
                        <QuickAction title="Send Notification" icon={<BellIcon className="w-8 h-8"/>} />
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                    <ul className="space-y-4">
                        <li className="flex items-start space-x-3">
                            <div className="bg-green-100 dark:bg-green-900 dark:bg-opacity-50 p-2 rounded-full"><DollarSignIcon className="w-4 h-4 text-green-600"/></div>
                            <div>
                                <p className="text-sm font-medium">Fee payment of Rs. 25,000 received from Ali Raza.</p>
                                <p className="text-xs text-secondary-500">2 minutes ago by Fatima Ahmed</p>
                            </div>
                        </li>
                         <li className="flex items-start space-x-3">
                            <div className="bg-blue-100 dark:bg-blue-900 dark:bg-opacity-50 p-2 rounded-full"><UserPlusIcon className="w-4 h-4 text-blue-600"/></div>
                            <div>
                                <p className="text-sm font-medium">New student 'Sana Fatima d/o Ahmed Fatima' was added to Grade 10 - Section A.</p>
                                <p className="text-xs text-secondary-500">1 hour ago by Bilal Hassan</p>
                            </div>
                        </li>
                        <li className="flex items-start space-x-3">
                            <div className="bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-50 p-2 rounded-full"><BellIcon className="w-4 h-4 text-yellow-600"/></div>
                            <div>
                                <p className="text-sm font-medium">Announcement posted: "Parent-Teacher Meeting on Friday".</p>
                                <p className="text-xs text-secondary-500">3 hours ago by You</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

             {/* Manage School Users */}
            <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Manage School Users</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-secondary-500 dark:text-secondary-400">
                        <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                            <tr>
                                <th scope="col" className="px-4 py-3">User</th>
                                <th scope="col" className="px-4 py-3">Role</th>
                                <th scope="col" className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schoolUsers.map(schoolUser => (
                                <tr key={schoolUser.id} className="bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center space-x-3">
                                            <Avatar user={schoolUser} className="h-10 w-10" />
                                            <div>
                                                <div className="font-semibold text-secondary-900 dark:text-white">{schoolUser.name}</div>
                                                <div className="text-xs text-secondary-500">{schoolUser.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4"><Badge>{schoolUser.role}</Badge></td>
                                    <td className="px-4 py-4">
                                        <Badge color={
                                            schoolUser.status === 'Active' ? 'green' : 
                                            schoolUser.status === 'Pending Approval' ? 'yellow' : 
                                            schoolUser.status === 'Suspended' ? 'red' : 'secondary'
                                        }>
                                            {schoolUser.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Icons
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9"cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const BriefcaseIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const UserCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>;
const UserPlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const BellIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;


export default AdminDashboard;