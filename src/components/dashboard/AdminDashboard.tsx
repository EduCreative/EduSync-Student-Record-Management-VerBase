import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserRole, FeeChallan, Attendance, Student } from '../../types';
import DoughnutChart from '../charts/DoughnutChart';
import BarChart from '../charts/BarChart';
import StatCard from '../common/StatCard';
import { ActiveView } from '../layout/Layout';
import StatCardSkeleton from '../common/skeletons/StatCardSkeleton';
import ChartSkeleton from '../common/skeletons/ChartSkeleton';
import LineChart from '../charts/LineChart';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { getTodayString } from '../../utils/dateHelper';

const QuickAction: React.FC<{ title: string; icon: React.ReactElement; onClick?: () => void; }> = ({ title, icon, onClick }) => (
     <button 
        onClick={onClick} 
        disabled={!onClick}
        className="flex flex-col items-center justify-center space-y-2 p-4 bg-secondary-50 dark:bg-secondary-700 dark:bg-opacity-50 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 dark:hover:bg-opacity-50 hover:text-primary-600 transition-all text-center disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-secondary-50 dark:disabled:hover:bg-secondary-700"
    >
        {icon}
        <span className="text-sm font-medium">{title}</span>
    </button>
);

interface AdminDashboardProps {
    setActiveView: (view: ActiveView) => void;
}

const timeAgo = (timestamp?: string): string => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return `${Math.floor(seconds)} seconds ago`;
};

const getActivityIcon = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('fee') || lowerAction.includes('challan') || lowerAction.includes('payment')) {
        return <DollarSignIcon className="w-4 h-4 text-green-600 dark:text-green-300"/>;
    }
    if (lowerAction.includes('student') || lowerAction.includes('user')) {
        return <UserPlusIcon className="w-4 h-4 text-blue-600 dark:text-blue-300"/>;
    }
    if (lowerAction.includes('attendance') || lowerAction.includes('result')) {
        return <CheckCircleIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-300"/>
    }
    if (lowerAction.includes('class') || lowerAction.includes('school')) {
        return <SchoolIcon className="w-4 h-4 text-purple-600 dark:text-purple-300"/>
    }
    return <BellIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-300"/>;
};

const getIconBgColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('fee') || lowerAction.includes('challan') || lowerAction.includes('payment')) {
        return 'bg-green-100 dark:bg-green-900/50';
    }
    if (lowerAction.includes('student') || lowerAction.includes('user')) {
        return 'bg-blue-100 dark:bg-blue-900/50';
    }
    if (lowerAction.includes('attendance') || lowerAction.includes('result')) {
        return 'bg-indigo-100 dark:bg-indigo-900/50';
    }
    if (lowerAction.includes('class') || lowerAction.includes('school')) {
        return 'bg-purple-100 dark:bg-purple-900/50';
    }
    return 'bg-yellow-100 dark:bg-yellow-900/50';
};

const ChartHeaderWithToggle: React.FC<{ title: string; selected: 'line' | 'bar'; onChange: (type: 'line' | 'bar') => void; }> = ({ title, selected, onChange }) => (
    <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center space-x-1 rounded-lg bg-secondary-100 dark:bg-secondary-700 p-1">
            <button 
                onClick={() => onChange('line')} 
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${selected === 'line' ? 'bg-white dark:bg-secondary-600 shadow-sm' : 'text-secondary-600 dark:text-secondary-300'}`}
            >
                Line
            </button>
            <button 
                onClick={() => onChange('bar')} 
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${selected === 'bar' ? 'bg-white dark:bg-secondary-600 shadow-sm' : 'text-secondary-600 dark:text-secondary-300'}`}
            >
                Bar
            </button>
        </div>
    </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ setActiveView }) => {
    const { user, activeSchoolId } = useAuth();
    const { users, students, getSchoolById, fees, attendance, loading, logs, classes } = useData();
    
    const [modalDetails, setModalDetails] = useState<{ title: string; items: { id: string; avatar: React.ReactNode; primary: string; secondary: string }[] } | null>(null);
    const [feeChartType, setFeeChartType] = useState<'line' | 'bar'>('line');

    if (!user) return null;
    
    const effectiveSchoolId = user.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user.schoolId;
    const school = effectiveSchoolId != null ? getSchoolById(effectiveSchoolId) : null;
    
    const schoolStudents = useMemo(() => students.filter(s => s.schoolId === effectiveSchoolId && s.status === 'Active'), [students, effectiveSchoolId]);
    const schoolTeachers = useMemo(() => users.filter(u => u.schoolId === effectiveSchoolId && u.role === UserRole.Teacher), [users, effectiveSchoolId]);
    const schoolUsers = useMemo(() => users.filter(u => u.schoolId === effectiveSchoolId && u.id !== user.id), [users, effectiveSchoolId, user.id]);

    const stats = useMemo(() => {
        const todayStr = getTodayString();

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
        const todayStr = getTodayString();
        const todaysAttendance = attendance.filter(a => a.date === todayStr);
        const attendanceMap = new Map(todaysAttendance.map(a => [a.studentId, a.status]));
    
        const statusCounts = { Present: 0, Absent: 0, Leave: 0, Pending: 0 };
        schoolStudents.forEach(student => {
            const status = attendanceMap.get(student.id);
            if (status) {
                statusCounts[status]++;
            } else {
                statusCounts.Pending++;
            }
        });
    
        return [
            { label: 'Present', value: statusCounts.Present, color: '#10b981' },
            { label: 'Absent', value: statusCounts.Absent, color: '#ef4444' },
            { label: 'Leave', value: statusCounts.Leave, color: '#f59e0b' },
            { label: 'Pending', value: statusCounts.Pending, color: '#64748b' },
        ];
    }, [attendance, schoolStudents]);

    const feeCollectionData = useMemo(() => {
        const last30Days = [...Array(30)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();
    
        const schoolFees = fees.filter(fee => students.find(s => s.id === fee.studentId)?.schoolId === effectiveSchoolId);
    
        const collectionsByDay: Record<string, number> = {};
        schoolFees.forEach(fee => {
            if (fee.paidDate && fee.paidDate >= last30Days[0]) {
                collectionsByDay[fee.paidDate] = (collectionsByDay[fee.paidDate] || 0) + fee.paidAmount;
            }
        });
    
        return last30Days.map(date => ({
            label: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            value: collectionsByDay[date] || 0
        }));
    }, [fees, students, effectiveSchoolId]);

    const recentLogs = useMemo(() => {
        return logs.slice(0, 5);
    }, [logs]);

    const genderDistributionData = useMemo(() => {
        const counts = { Male: 0, Female: 0 };
        schoolStudents.forEach(student => {
            if (student.gender === 'Male') counts.Male++;
            else if (student.gender === 'Female') counts.Female++;
        });
        return [
            { label: 'Male', value: counts.Male, color: '#3b82f6' },
            { label: 'Female', value: counts.Female, color: '#ec4899' },
        ];
    }, [schoolStudents]);
    
    const classStrengthData = useMemo(() => {
        const schoolClasses = classes.filter(c => c.schoolId === effectiveSchoolId);
        return schoolClasses.map(c => ({
            id: c.id,
            label: c.name,
            value: schoolStudents.filter(s => s.classId === c.id).length
        })).sort((a, b) => b.value - a.value);
    }, [schoolStudents, classes, effectiveSchoolId]);

    const handleFeeStatusClick = (item: { label: string }) => {
        const status = item.label as FeeChallan['status'];
        const relevantChallans = fees.filter(f => {
            const student = students.find(s => s.id === f.studentId);
            return student?.schoolId === effectiveSchoolId && f.status === status;
        });

        const items = relevantChallans.map(c => {
            const student = students.find(s => s.id === c.studentId);
            return {
                id: c.id,
                avatar: <Avatar student={student} className="w-9 h-9" />,
                primary: student?.name || 'Unknown Student',
                secondary: `${c.month} ${c.year} - Balance: Rs. ${(c.totalAmount - c.discount - c.paidAmount).toLocaleString()}`,
            };
        });

        setModalDetails({ title: `${status} Challans`, items });
    };

    const handleAttendanceClick = (item: { label: string }) => {
        const status = item.label;
        const todayStr = getTodayString();
        const todaysAttendanceRecords = attendance.filter(a => a.date === todayStr);
        const todaysAttendanceMap = new Map(todaysAttendanceRecords.map(a => [a.studentId, a.status]));

        let relevantStudents: Student[] = [];
        if (status === 'Pending') {
            relevantStudents = schoolStudents.filter(s => !todaysAttendanceMap.has(s.id));
        } else {
            relevantStudents = schoolStudents.filter(s => todaysAttendanceMap.get(s.id) === (status as Attendance['status']));
        }

        const items = relevantStudents.map(s => ({
            id: s.id,
            avatar: <Avatar student={s} className="w-9 h-9" />,
            primary: s.name,
            secondary: `Roll No: ${s.rollNumber}`,
        }));

        setModalDetails({ title: `Students: ${status}`, items });
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <div>
                    <div className="skeleton-bg h-9 w-64 mb-2 rounded"></div>
                    <div className="skeleton-bg h-5 w-80 rounded"></div>
                </div>
               
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ChartSkeleton />
                    <ChartSkeleton />
                </div>
    
                <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                    <div className="skeleton-bg h-6 w-48 mb-4 rounded"></div>
                    <div className="skeleton-bg h-48 w-full rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Modal isOpen={!!modalDetails} onClose={() => setModalDetails(null)} title={modalDetails?.title || ''}>
                <div className="max-h-[60vh] overflow-y-auto">
                    <ul className="divide-y dark:divide-secondary-700">
                        {modalDetails?.items.map(item => (
                            <li key={item.id} className="py-3 flex items-center space-x-4">
                                {item.avatar}
                                <div>
                                    <p className="font-medium text-secondary-800 dark:text-secondary-100">{item.primary}</p>
                                    <p className="text-sm text-secondary-500">{item.secondary}</p>
                                </div>
                            </li>
                        ))}
                        {modalDetails?.items.length === 0 && (
                            <p className="text-secondary-500 text-center py-4">No records found.</p>
                        )}
                    </ul>
                </div>
            </Modal>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-secondary-500 dark:text-secondary-400">Welcome back, {user.name}. Here's what's happening at {school?.name}.</p>
                </div>
            
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Students" value={schoolStudents.length.toString()} color="bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300" icon={<UsersIcon />} />
                    <StatCard title="Total Teachers" value={schoolTeachers.length.toString()} color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300" icon={<BriefcaseIcon />} />
                    <StatCard title="Fees Collected Today" value={stats.feesCollectedToday} color="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300" icon={<DollarSignIcon />} />
                    <StatCard title="Pending Approvals" value={stats.pendingApprovals} color="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300" icon={<UserCheckIcon />} />
                </div>

                <div className="lg:col-span-2">
                    {feeChartType === 'line' ? (
                        <LineChart
                            title={<ChartHeaderWithToggle title="Fee Collection (Last 30 Days)" selected={feeChartType} onChange={setFeeChartType} />}
                            data={feeCollectionData}
                            color="#f59e0b"
                        />
                    ) : (
                        <BarChart
                            title={<ChartHeaderWithToggle title="Fee Collection (Last 30 Days)" selected={feeChartType} onChange={setFeeChartType} />}
                            data={feeCollectionData}
                            color="#f59e0b"
                        />
                    )}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <DoughnutChart title="Fee Collection Status" data={feeStatusData} onClick={handleFeeStatusClick} />
                    <BarChart title="Today's Attendance Snapshot" data={attendanceData} onClick={handleAttendanceClick} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <DoughnutChart title="Student Gender Ratio" data={genderDistributionData} />
                    <BarChart title="Student Distribution by Class" data={classStrengthData} color="#8b5cf6" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <QuickAction title="Add Student" icon={<UserPlusIcon className="w-8 h-8"/>} onClick={() => setActiveView({ view: 'students' })} />
                            <QuickAction title="Collect Fees" icon={<DollarSignIcon className="w-8 h-8"/>} onClick={() => setActiveView({ view: 'fees' })} />
                            <QuickAction title="Mark Attendance" icon={<CheckCircleIcon className="w-8 h-8"/>} onClick={() => setActiveView({ view: 'attendance' })} />
                            <QuickAction title="Manage Classes" icon={<SchoolIcon className="w-8 h-8"/>} onClick={() => setActiveView({ view: 'classes' })} />
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                        {recentLogs.length > 0 ? (
                            <ul className="space-y-4">
                                {recentLogs.map(log => (
                                    <li key={log.id} className="flex items-start space-x-3">
                                        <div className={`${getIconBgColor(log.action)} p-2 rounded-full`}>
                                            {getActivityIcon(log.action)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-secondary-800 dark:text-secondary-100">{log.details}</p>
                                            <p className="text-xs text-secondary-500">
                                                {timeAgo(log.timestamp)} by {log.userName}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-center text-secondary-500 py-8">No recent activity to display.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9"cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const BriefcaseIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const UserCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>;
const UserPlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const BellIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const SchoolIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></svg>;

export default AdminDashboard;