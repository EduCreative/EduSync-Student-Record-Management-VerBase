
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../constants';

interface ReportHeaderProps {
    title: string;
    filters: Record<string, string>;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({ title, filters }) => {
    const { user } = useAuth();
    const { schools } = useData();
    const school = schools.find(s => s.id === user?.schoolId);
    
    return (
        <div className="mb-4 pb-4 border-b dark:border-secondary-600">
            <div className="flex items-center space-x-4">
                {school?.logoUrl && <img src={school.logoUrl} alt="logo" className="h-16 w-auto max-w-[150px] object-contain"/>}
                <div>
                    <h1 className="text-2xl font-bold text-black">{school?.name}</h1>
                    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
                <p><strong>Date Generated:</strong> {formatDate(new Date())}</p>
                <div className="flex space-x-4">
                    {Object.entries(filters).map(([key, value]) => (
                        <p key={key}><strong>{key}:</strong> {value}</p>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReportHeader;
