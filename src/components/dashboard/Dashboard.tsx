import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';
import OwnerDashboard from './OwnerDashboard.tsx';
import AdminDashboard from './AdminDashboard.tsx';
import AccountantDashboard from './AccountantDashboard.tsx';
import TeacherDashboard from './TeacherDashboard.tsx';
import ParentDashboard from './ParentDashboard.tsx';
import StudentDashboard from './StudentDashboard.tsx';
import { ActiveView } from '../layout/Layout.tsx';

interface DashboardProps {
    setActiveView: (view: ActiveView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
    const { user, activeSchoolId } = useAuth();

    if (!user) {
        return <div className="text-center p-8">Loading user data...</div>;
    }

    // When an Owner selects a school, they should see the Admin dashboard for that school.
    const effectiveRole = user.role === UserRole.Owner && activeSchoolId ? UserRole.Admin : user.role;

    switch (effectiveRole) {
        case UserRole.Owner:
            return <OwnerDashboard />;
        case UserRole.Admin:
            return <AdminDashboard setActiveView={setActiveView} />;
        case UserRole.Accountant:
            return <AccountantDashboard />;
        case UserRole.Teacher:
            return <TeacherDashboard />;
        case UserRole.Parent:
            return <ParentDashboard />;
        case UserRole.Student:
            return <StudentDashboard />;
        default:
            return <div className="text-center p-8">Invalid user role. Please contact support.</div>;
    }
};

export default Dashboard;