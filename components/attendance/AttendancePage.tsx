
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import AttendanceTaker from './AttendanceTaker';
import AttendanceViewer from './AttendanceViewer';

const AttendancePage: React.FC = () => {
    const { effectiveRole } = useAuth();

    if (!effectiveRole) return null;

    const canTakeAttendance = [UserRole.Admin, UserRole.Teacher, UserRole.Accountant].includes(effectiveRole);
    const canViewAttendance = [UserRole.Parent, UserRole.Student].includes(effectiveRole);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Attendance</h1>
            </div>

            {canTakeAttendance && <AttendanceTaker />}
            
            {canViewAttendance && <AttendanceViewer /> }
        </div>
    );
};

export default AttendancePage;
