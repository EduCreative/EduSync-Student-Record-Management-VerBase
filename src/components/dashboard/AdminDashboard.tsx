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
        const currentMonthName = now.toLocaleString('default', { month: 'long' });

        const