import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactElement;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
    <div className="glass-card p-6 flex items-center space-x-4 transition-all duration-300 hover:shadow-xl hover:border-white/40 dark:hover:border-secondary-600/60 hover:-translate-y-1">
        <div className={`p-3 rounded-full ${color}`}>
            {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}
        </div>
        <div>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">{title}</p>
            <p className="text-2xl font-bold text-secondary-800 dark:text-secondary-100">{value}</p>
        </div>
    </div>
);

export default StatCard;
