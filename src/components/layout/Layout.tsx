

import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Dashboard from '../dashboard/Dashboard';
import UserManagementPage from '../users/UserManagementPage';
import StudentManagementPage from '../students/StudentManagementPage';
import StudentProfilePage from '../students/StudentProfilePage';
import SettingsPage from '../settings/SettingsPage';
import AttendancePage from '../attendance/AttendancePage';
import FeeManagementPage from '../fees/FeeManagementPage';
import ResultsPage from '../results/ResultsPage';
import UserLogsPage from '../logs/UserLogsPage';
import SchoolManagementPage from '../schools/SchoolManagementPage';
import CalendarPage from '../calendar/CalendarPage';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import LeavingCertificatePage from '../students/LeavingCertificatePage';
import ReportsPage from '../reports/ReportsPage';
import ToastContainer from '../common/ToastContainer';
import TeacherManagementPage from '../teachers/TeacherManagementPage';
import AccountantManagementPage from '../accountants/AccountantManagementPage';
import ClassManagementPage from '../classes/ClassManagementPage';

export type ViewType = 'dashboard' | 'overview' | 'users' | 'students' | 'studentProfile' | 'teachers' | 'accountants' | 'classes' | 'schools' | 'settings' | 'results' | 'logs' | 'attendance' | 'fees' | 'calendar' | 'leavingCertificate' | 'reports' | string;

export interface ActiveView {
    view: ViewType;
    payload?: any;
}

const Layout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState<ActiveView>({ view: 'dashboard' });
    const { effectiveRole } = useAuth();

    const renderContent = () => {
        switch (activeView.view) {
            case 'schools':
                if (effectiveRole === UserRole.Owner) {
                    return <SchoolManagementPage />;
                }
                return <Dashboard setActiveView={setActiveView} />;
            case 'users':
                 if ([UserRole.Owner, UserRole.Admin].includes(effectiveRole as UserRole)) {
                    return <UserManagementPage />;
                }
                return <Dashboard setActiveView={setActiveView} />;
            case 'teachers':
                if ([UserRole.Admin].includes(effectiveRole as UserRole)) {
                    return <TeacherManagementPage />;
                }
                return <Dashboard setActiveView={setActiveView} />;
            case 'accountants':
                if ([UserRole.Admin].includes(effectiveRole as UserRole)) {
                    return <AccountantManagementPage />;
                }
                return <Dashboard setActiveView={setActiveView} />;
            case 'classes':
                if ([UserRole.Admin, UserRole.Teacher].includes(effectiveRole as UserRole)) {
                    return <ClassManagementPage />;
                }
                return <Dashboard setActiveView={setActiveView} />;
            case 'students':
                if ([UserRole.Admin, UserRole.Accountant, UserRole.Teacher].includes(effectiveRole as UserRole)) {
                     return <StudentManagementPage setActiveView={setActiveView} />;
                }
                return <Dashboard setActiveView={setActiveView} />;
            case 'studentProfile':
                if (activeView.payload?.studentId) {
                    return <StudentProfilePage studentId={activeView.payload.studentId} setActiveView={setActiveView} />;
                }
                return <StudentManagementPage setActiveView={setActiveView} />;
            case 'leavingCertificate':
                if (activeView.payload?.studentId && [UserRole.Admin, UserRole.Accountant].includes(effectiveRole as UserRole)) {
                    return <LeavingCertificatePage studentId={activeView.payload.studentId} setActiveView={setActiveView} />;
                }
                return <Dashboard setActiveView={setActiveView} />;
            case 'attendance':
                if ([UserRole.Admin, UserRole.Accountant, UserRole.Teacher, UserRole.Parent, UserRole.Student].includes(effectiveRole as UserRole)) {
                    return <AttendancePage />;
                }
                return <Dashboard setActiveView={setActiveView} />;
            case 'fees':
                if ([UserRole.Admin, UserRole.Accountant, UserRole.Parent, UserRole.Student].includes(effectiveRole as UserRole)) {
                    return <FeeManagementPage />;
                }
                return <Dashboard setActiveView={setActiveView} />;
            case 'reports':
                if ([UserRole.Admin, UserRole.Accountant].includes(effectiveRole as UserRole)) {
                    return <ReportsPage />;
                }
                return <Dashboard setActiveView={setActiveView} />;
            case 'results':
                if ([UserRole.Admin, UserRole.Teacher, UserRole.Parent, UserRole.Student].includes(effectiveRole as UserRole)) {
                    return <ResultsPage />;
                }
                return <Dashboard setActiveView={setActiveView} />;
            case 'calendar':
                 if ([UserRole.Admin, UserRole.Teacher, UserRole.Parent, UserRole.Student].includes(effectiveRole as UserRole)) {
                    return <CalendarPage />;
                }
                return <Dashboard setActiveView={setActiveView} />;
            case 'logs':
                if (effectiveRole === UserRole.Admin) {
                    return <UserLogsPage />;
                }
                return <Dashboard setActiveView={setActiveView} />;
            case 'settings':
                return <SettingsPage />;
            case 'dashboard':
            case 'overview': // Treat owner's overview as dashboard
            default:
                return <Dashboard setActiveView={setActiveView} />;
        }
    };

    return (
        <div className="flex h-screen bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200">
            <ToastContainer />
            <Sidebar 
                sidebarOpen={sidebarOpen} 
                setSidebarOpen={setSidebarOpen} 
                activeView={activeView}
                setActiveView={setActiveView}
                effectiveRole={effectiveRole as UserRole}
            />
            <div className="flex flex-col flex-1 overflow-y-auto">
                <Header setSidebarOpen={setSidebarOpen} setActiveView={setActiveView} />
                <main className="p-4 md:p-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default Layout;
