import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserRole, FeeChallan, Attendance, Student } from '../../types';
import DoughnutChart from '../charts/DoughnutChart';
import BarChart, { BarChartData } from '../charts/BarChart';
import StatCard from '../common/StatCard';
import { ActiveView } from '../layout/Layout';
import StatCardSkeleton from '../common/skeletons/StatCardSkeleton';
import ChartSkeleton from '../common/skeletons/ChartSkeleton';
import LineChart from '../charts/LineChart';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { getClassLevel } from '../../utils/sorting';

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

const FeeChartHeader: React.FC<{
    title: string;
    chartType: 'line' | 'bar';
    onChartTypeChange: (type: 'line' | 'bar') => void;
    period: 'week' | '15days' | 'month' | '30days';
    onPeriodChange: (period: 'week' | '15days' | 'month' | '30days') => void;
}> = ({ title, chartType, onChartTypeChange, period, onPeriodChange }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
            <select
                value={period}
                onChange={(e) => onPeriodChange(e.target.value as 'week' | '15days' | 'month' | '30days')}
                className="input-field py-1 text-sm w-36"
            >
                <option value="week">This Week</option>
                <option value="15days">Last 15 Days</option>
                <option value="month">This Month</option>
                <option value="30days">Last 30 Days</option>
            </select>
            <div className="flex items-center space-x-1 rounded-lg bg-secondary-100 dark:bg-secondary-700 p-1">
                <button 
                    onClick={() => onChartTypeChange('line')} 
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${chartType === 'line' ? 'bg-white dark:bg-secondary-600 shadow-sm' : 'text-secondary-600 dark:text-secondary-300'}`}
                >
                    Line
                </button>
                <button 
                    onClick={() => onChartTypeChange('bar')} 
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${chartType === 'bar' ? 'bg-white dark:bg-secondary-600 shadow-sm' : 'text-secondary-600 dark:text-secondary-300'}`}
                >
                    Bar
                </button>
            </div>
        </div>
    </div>
);


// FIX: Export as a named component to align with import in Dashboard.tsx
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setActiveView }) => {
    const { user, activeSchoolId } = useAuth();
    const { users, students, getSchoolById, fees, attendance, loading, logs, classes } = useData();
    
    const [modalDetails, setModalDetails] = useState<{ title: string; items: { id: string; avatar: React.ReactNode; primary: string; secondary: string }[] } | null>(null);
    const [feeChartType, setFeeChartType] = useState<'line' | 'bar'>('line');
    const [feePeriod, setFeePeriod] = useState<'week' | '15days' | 'month' | '30days'>('week');

    if (!user) return null;
    
    const effectiveSchoolId = user.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user.schoolId;
    const school = effectiveSchoolId != null ? getSchoolById(effectiveSchoolId) : null;
    
    const schoolStudents = useMemo(() => students.filter(s => s.schoolId === effectiveSchoolId && s.status === 'Active'), [students, effectiveSchoolId]);
    const schoolTeachers = useMemo(() => users.filter(u => u.schoolId === effectiveSchoolId && u.role === UserRole.Teacher), [users, effectiveSchoolId]);
    const schoolUsers = useMemo(() => users.filter(u => u.schoolId === effectiveSchoolId && u.id !== user.id), [users, effectiveSchoolId, user.id]);

    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const studentIds = new Set(schoolStudents.map(s => s.id));
        
        const todayAttendanceRecords = attendance.filter(a => a.date === todayStr && studentIds.has(a.studentId));
        const presentToday = todayAttendanceRecords.filter(a => a.status === 'Present').length;
        const absentToday = todayAttendanceRecords.filter(a => a.status === 'Absent').length;
        const leaveToday = todayAttendanceRecords.filter(a => a.status === 'Leave').length;

        const collectedThisMonth = fees
            .filter(f => {
                if (!f.paidDate || !studentIds.has(f.studentId)) return false;
                const paidDate = new Date(f.paidDate);
                return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
            })
            .reduce((sum, f) => sum + f.paidAmount, 0);
        
        const pendingUsers = users.filter(u => u.schoolId === effectiveSchoolId && u.status === 'Pending Approval').length;

        return {
            totalStudents: schoolStudents.length,
            totalTeachers: schoolTeachers.length,
            pendingUsers,
            collectedThisMonth: `Rs. ${collectedThisMonth.toLocaleString()}`,
            presentToday,
            absentToday,
            leaveToday,
            attendanceNotMarked: schoolStudents.length - todayAttendanceRecords.length,
        };
    }, [schoolStudents, schoolTeachers, users, attendance, fees, effectiveSchoolId]);

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const feeStatusData = useMemo(() => {
        const schoolFees = fees.filter(f => studentMap.get(f.studentId)?.schoolId === effectiveSchoolId);
        const paid = schoolFees.filter(f => f.status === 'Paid').length;
        const unpaid = schoolFees.filter(f => f.status === 'Unpaid').length;
        const partial = schoolFees.filter(f => f.status === 'Partial').length;
        return [
            { label: 'Paid', value: paid, color: '#10b981' },
            { label: 'Unpaid', value: unpaid, color: '#ef4444' },
            { label: 'Partial', value: partial, color: '#f59e0b' },
        ];
    }, [fees, studentMap, effectiveSchoolId]);
    
    const todayAttendanceData = useMemo(() => {
        return [
            { id: 'Present', label: 'Present', value: stats.presentToday, color: '#10b981' },
            { id: 'Absent', label: 'Absent', value: stats.absentToday, color: '#ef4444' },
            { id: 'Leave', label: 'On Leave', value: stats.leaveToday, color: '#f59e0b' },
            { id: 'Pending', label: 'Pending', value: stats.attendanceNotMarked, color: '#64748b' },
        ];
    }, [stats]);

    const feeCollectionData = useMemo(() => {
        const schoolFees = fees.filter(f => studentMap.get(f.studentId)?.schoolId === effectiveSchoolId && f.paidDate);
        const dataMap = new Map<string, number>();
        const now = new Date();
        
        let days = 7;
        if (feePeriod === '15days') days = 15;
        if (feePeriod === '30days') days = 30;
        
        const generateDates = (period: typeof feePeriod) => {
            const dates: Date[] = [];
            const today = new Date();
            if (period === 'month') {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                for (let d = new Date(firstDay); d <= today; d.setDate(d.getDate() + 1)) {
                    dates.push(new Date(d));
                }
            } else {
                for (let i = days - 1; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(now.getDate() - i);
                    dates.push(d);
                }
            }
            return dates;
        }

        const dates = generateDates(feePeriod);

        dates.forEach(date => {
            dataMap.set(date.toISOString().split('T')[0], 0);
        });

        schoolFees.forEach(fee => {
            const dateStr = fee.paidDate!;
            if (dataMap.has(dateStr)) {
                dataMap.set(dateStr, (dataMap.get(dateStr) || 0) + fee.paidAmount);
            }
        });
        
        return Array.from(dataMap.entries()).map(([date, value]) => ({
            label: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            value
        }));
    }, [fees, studentMap, effectiveSchoolId, feePeriod]);
    
    const handleFeeStatusClick = (item: { label: string }) => {
        const status = item.label as FeeChallan['status'];
        const relevantFees = fees.filter(f => {
            const student = studentMap.get(f.studentId);
            return student?.schoolId === effectiveSchoolId && f.status === status;
        });

        const items = relevantFees.map(f => {
            const student = studentMap.get(f.studentId)!;
            return {
                id: f.id,
                avatar: <Avatar student={student} className="w-8 h-8"/>,
                primary: student.name,
                secondary: `Challan #${f.challanNumber} - Rs. ${(f.totalAmount - f.discount - f.paidAmount).toLocaleString()}`
            }
        });
        setModalDetails({ title: `${status} Fee Challans`, items });
    };

    const handleAttendanceClick = (item: BarChartData) => {
        const status = item.id as Attendance['status'] | 'Pending';
        let studentList: Student[] = [];

        if (status === 'Pending') {
             const todayStr = new Date().toISOString().split('T')[0];
             const attendedStudentIds = new Set(attendance.filter(a => a.date === todayStr).map(a => a.studentId));
             studentList = schoolStudents.filter(s => !attendedStudentIds.has(s.id));
        } else {
            const todayStr = new Date().toISOString().split('T')[0];
            const studentIdsWithStatus = new Set(attendance.filter(a => a.date === todayStr && a.status === status).map(a => a.studentId));
            studentList = schoolStudents.filter(s => studentIdsWithStatus.has(s.id));
        }

        const items = studentList.map(s => ({
            id: s.id,
            avatar: <Avatar student={s} className="w-8 h-8"/>,
            primary: s.name,
            secondary: `Roll #: ${s.rollNumber}`
        }));

        setModalDetails({ title: `${status} Students Today`, items });
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
                <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                    <div className="skeleton-bg h-6 w-48 mb-4 rounded"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="skeleton-bg h-24 rounded-lg"></div>
                        <div className="skeleton-bg h-24 rounded-lg"></div>
                        <div className="skeleton-bg h-24 rounded-lg"></div>
                        <div className="skeleton-bg h-24 rounded-lg"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartSkeleton />
                    <ChartSkeleton />
                </div>
            </div>
        );
    }
    
    return (
        <>
            <Modal isOpen={!!modalDetails} onClose={() => setModalDetails(null)} title={modalDetails?.title || 'Details'}>
                <div className="max-h-[60vh] overflow-y-auto">
                    <ul className="divide-y dark:divide-secondary-700">
                        {modalDetails?.items.length ? modalDetails.items.map(item => (
                             <li key={item.id} className="py-3 flex items-center space-x-4">
                                {item.avatar}
                                <div>
                                    <p className="font-medium text-secondary-800 dark:text-secondary-100">{item.primary}</p>
                                    <p className="text-sm text-secondary-500">{item.secondary}</p>
                                </div>
                            </li>
                        )) : <p className="text-secondary-500 text-center py-4">No records found.</p>}
                    </ul>
                </div>
            </Modal>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-secondary-500 dark:text-secondary-400">Welcome back, {user.name}. Here's what's happening at {school?.name}.</p>
                </div>
    
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Students" value={stats.totalStudents.toString()} color="bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300" icon={<UsersIcon />} />
                    <StatCard title="Total Teachers" value={stats.totalTeachers.toString()} color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300" icon={<BriefcaseIcon />} />
                    <StatCard title="Collected This Month" value={stats.collectedThisMonth} color="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300" icon={<DollarSignIcon />} />
                    <StatCard title="Pending Users" value={stats.pendingUsers.toString()} color="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300" icon={<UserPlusIcon />} />
                </div>
    
                {/* Quick Actions */}
                <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <QuickAction title="Add Student" icon={<UserPlusIcon className="w-8 h-8"/>} onClick={() => setActiveView({ view: 'students' })}/>
                        <QuickAction title="Mark Attendance" icon={<CheckCircleIcon className="w-8 h-8"/>} onClick={() => setActiveView({ view: 'attendance' })}/>
                        <QuickAction title="Collect Fees" icon={<DollarSignIcon className="w-8 h-8"/>} onClick={() => setActiveView({ view: 'fees' })}/>
                        <QuickAction title="Enter Results" icon={<BarChartIcon className="w-8 h-8"/>} onClick={() => setActiveView({ view: 'results' })}/>
                        <QuickAction title="Generate Reports" icon={<FileTextIcon className="w-8 h-8"/>} onClick={() => setActiveView({ view: 'reports' })}/>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <DoughnutChart title="Fee Status Overview" data={feeStatusData} onClick={handleFeeStatusClick}/>
                     <BarChart title="Today's Attendance Snapshot" data={todayAttendanceData} multiColor={true} showValuesOnBottom={true} onClick={handleAttendanceClick} />
                </div>
    
                {/* Fee Collection Chart */}
                 <div>
                    {feeChartType === 'line' ? (
                        <LineChart
                            title={<FeeChartHeader title="Fee Collection" chartType={feeChartType} onChartTypeChange={setFeeChartType} period={feePeriod} onPeriodChange={setFeePeriod} />}
                            data={feeCollectionData}
                            color="#3b82f6"
                        />
                    ) : (
                        <BarChart
                            title={<FeeChartHeader title="Fee Collection" chartType={feeChartType} onChartTypeChange={setFeeChartType} period={feePeriod} onPeriodChange={setFeePeriod} />}
                            data={feeCollectionData}
                            color="#3b82f6"
                            showValuesOnTop={true}
                        />
                    )}
                </div>
    
                {/* Recent Activity */}
                <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                     <ul className="divide-y dark:divide-secondary-700">
                        {logs.slice(0, 5).map(log => (
                            <li key={log.id} className="py-3 flex items-center space-x-4">
                                <span className={`flex items-center justify-center h-8 w-8 rounded-full ${getIconBgColor(log.action)}`}>
                                    {getActivityIcon(log.action)}
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-secondary-800 dark:text-secondary-100">
                                        <span className="font-bold">{log.userName}</span> {log.action}
                                    </p>
                                    <p className="text-xs text-secondary-500">{log.details}</p>
                                </div>
                                <span className="text-xs text-secondary-400">{timeAgo(log.timestamp)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
};

// Icons
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const BriefcaseIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const UserPlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const BarChartIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>;
const FileTextIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>;
const SchoolIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></svg>;
const BellIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
