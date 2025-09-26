
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import ResultsManager from './ResultsManager';
import ResultsViewer from './ResultsViewer';

const ResultsPage: React.FC = () => {
    const { effectiveRole } = useAuth();

    if (!effectiveRole) return null;

    const canManageResults = [UserRole.Admin, UserRole.Teacher].includes(effectiveRole);
    const canViewResults = [UserRole.Parent, UserRole.Student].includes(effectiveRole);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Results</h1>
            </div>

            {canManageResults && <ResultsManager />}
            {canViewResults && <ResultsViewer />}
        </div>
    );
};

export default ResultsPage;
