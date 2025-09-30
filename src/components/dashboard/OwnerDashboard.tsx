

import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';
import DoughnutChart from '../charts/DoughnutChart';
import BarChart from '../charts/BarChart';
import StatCard from '../common/StatCard';

const OwnerDashboard: React.FC = () => {
    const { schools, users, students, fees } = useData();

    const stats = useMemo(() => {
        const totalCollection = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
        const pendingApprovals = users.filter(u => u.status === 'Pending Approval').length;
        return { totalCollection, pendingApprovals };
    }, [fees, users]);

    const studentDistributionData = useMemo(() => {
        return schools.map(school => ({
            label: school.name.split(' ')[0], // Shorten name for chart
            value: students.filter(s => s.schoolId === school.id).length
        }));
    }, [schools, students]);

    const userRoleData = useMemo(() => {
        const roleCounts = users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {} as Record<UserRole, number>);
        
        const roleColors: Record<UserRole, string> = {
            [UserRole.Owner]: '#7c3aed',
            [UserRole.Admin]: '#2563eb',
            [UserRole.Accountant]: '#f59e0b',
            [UserRole.Teacher]: '#10b981',
            [UserRole.Parent]: '#ec4899',
            [UserRole.Student]: '#3b82f6',
        };

        return (Object.keys(roleCounts) as UserRole[]).map(role => ({
            label: role,
            value: roleCounts[role],
            color: roleColors[role as UserRole] || '#64748b'
        }));
    }, [users]);


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Owner's Overview</h1>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <StatCard title="Total Schools" value={schools.length.toString()} color="bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300" icon={<SchoolIcon />} />
                <StatCard title="Total Users" value={users.length.toString()} color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300" icon={<UserCheckIcon />} />
                <StatCard title="Total Students" value={students.length.toString()} color="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300" icon={<UsersIcon />} />
                <StatCard title="Total Fee Collection" value={`Rs. ${stats.totalCollection.toLocaleString()}`} color="bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300" icon={<CreditCardIcon />} />
                <StatCard title="Pending Approvals" value={stats.pendingApprovals.toString()} color="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300" icon={<UserPlusIcon />} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChart
                    title="Student Distribution by School"
                    data={studentDistributionData}
                    color="#3b82f6"
                />
                <DoughnutChart
                    title="User Roles Overview"
                    data={userRoleData}
                />
            </div>
        </div>
    );
};

const SchoolIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></svg>;
const UserCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>;
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9"cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const CreditCardIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>;
const UserPlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>;


export default OwnerDashboard;