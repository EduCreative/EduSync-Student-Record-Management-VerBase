
import React from 'react';

interface BadgeProps {
    color?: 'primary' | 'secondary' | 'green' | 'red' | 'yellow' | 'blue';
    children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ color = 'secondary', children }) => {
    const colorClasses = {
        primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
        secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };

    return (
        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colorClasses[color]}`}>
            {children}
        </span>
    );
};

export default Badge;
