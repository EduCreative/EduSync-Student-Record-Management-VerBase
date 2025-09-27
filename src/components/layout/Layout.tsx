import React, { useState } from 'react';
import Header from './Header.tsx';
import Sidebar from './Sidebar.tsx';
import Dashboard from '../dashboard/Dashboard.tsx';
import UserManagementPage from '../users/UserManagementPage.tsx';
import StudentManagementPage from '../students/StudentManagementPage.tsx';
import StudentProfilePage from '../students/StudentProfilePage.tsx';
import SettingsPage from '../settings/SettingsPage.tsx';
import AttendancePage from '../attendance/AttendancePage.tsx';
import FeeManagementPage from '../fees/FeeManagementPage.tsx';
import ResultsPage from '../results/ResultsPage.tsx';
import UserLogsPage from '../logs/UserLogsPage.tsx';
import SchoolManagementPage from '../schools/SchoolManagementPage.tsx';
import CalendarPage from '../calendar/CalendarPage.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';
import LeavingCertificatePage from '../students/LeavingCertificatePage.tsx';
import ReportsPage from '../reports/ReportsPage.tsx';
import ToastContainer from '../common/ToastContainer.tsx';
import TeacherManagementPage from '../teachers/TeacherManagementPage.tsx';
import AccountantManagementPage from '../accountants/AccountantManagementPage.tsx';

export type ViewType = 'dashboard' | 'overview' | 'users' | 'students' | 'studentProfile' | 'teachers' | 'accountant' | 'schools' | 'settings' | 'results' | 'logs' | 'attendance' | 'fees' | 'calendar' | 'leavingCertificate' | 'reports' | string;

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
                    return <SchoolManagementPage setActiveView={setActiveView} />;
                }
                // FIX: Passed missing 'setActiveView' prop to Dashboard component.
                return <Dashboard setActiveView={setActiveView} />;
            case 'users':
                if ([UserRole.Owner, UserRole.Admin].includes(effectiveRole as UserRole)) {
                    return <UserManagementPage />;
                }
                // FIX: Passed missing 'setActiveView' prop to Dashboard component.
                return <Dashboard setActiveView={setActiveView} />;
            case 'teachers':
                if ([UserRole.Owner, UserRole.Admin].includes(effectiveRole as UserRole)) {
                    return <TeacherManagementPage />;
                }
                // FIX: Passed missing 'setActiveView' prop to Dashboard component.
                return <Dashboard setActiveView={setActiveView} />;
            case 'accountants':
                if ([UserRole.Owner, UserRole.Admin].includes(effectiveRole as UserRole)) {
                    return <AccountantManagementPage />;
                }
                // FIX: Passed missing 'setActiveView' prop to Dashboard component.
                return <Dashboard setActiveView={setActiveView} />;
            case 'students':
                if ([UserRole.Admin, UserRole.Accountant, UserRole.Teacher].includes(effectiveRole as UserRole)) {
                     return <StudentManagementPage setActiveView={setActiveView} />;
                }
                // FIX: Passed missing 'setActiveView' prop to Dashboard component.
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
                // FIX: Passed missing 'setActiveView' prop to Dashboard component.
                return <Dashboard setActiveView={setActiveView} />;
            case 'attendance':
                if ([UserRole.Admin, UserRole.Accountant, UserRole.Teacher, UserRole.Parent, UserRole.Student].includes(effectiveRole as UserRole)) {
                    return <AttendancePage />;
                }
                // FIX: Passed missing 'setActiveView' prop to Dashboard component.
                return <Dashboard setActiveView={setActiveView} />;
            case 'fees':
                if ([UserRole.Admin, UserRole.Accountant, UserRole.Parent, UserRole.Student].includes(effectiveRole as UserRole)) {
                    return <FeeManagementPage />;
                }
                // FIX: Passed missing 'setActiveView' prop to Dashboard component.
                return <Dashboard setActiveView={setActiveView} />;
            case 'reports':
                if ([UserRole.Admin, UserRole.Accountant].includes(effectiveRole as UserRole)) {
                    return <ReportsPage setActiveView={setActiveView} />;
                }
                // FIX: Passed missing 'setActiveView' prop to Dashboard component.
                return <Dashboard setActiveView={setActiveView} />;
            case 'results':
                if ([UserRole.Admin, UserRole.Teacher, UserRole.Parent, UserRole.Student].includes(effectiveRole as UserRole)) {
                    return <ResultsPage />;
                }
                // FIX: Passed missing 'setActiveView' prop to Dashboard component.
                return <Dashboard setActiveView={setActiveView} />;
            case 'calendar':
                 if ([UserRole.Admin, UserRole.Teacher, UserRole.Parent, UserRole.Student].includes(effectiveRole as UserRole)) {
                    return <CalendarPage />;
                }
                // FIX: Passed missing 'setActiveView' prop to Dashboard component.
                return <Dashboard setActiveView={setActiveView} />;
            case 'logs':
                if (effectiveRole === UserRole.Admin) {
                    return <UserLogsPage />;
                }
                // FIX: Passed missing 'setActiveView' prop to Dashboard component.
                return <Dashboard setActiveView={setActiveView} />;
            case 'settings':
                return <SettingsPage />;
            case 'dashboard':
            case 'overview': // Treat owner's overview as dashboard
            default:
                // FIX: Passed missing 'setActiveView' prop to Dashboard component.
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