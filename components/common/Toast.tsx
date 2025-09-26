
import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../../context/ToastContext';

interface ToastProps extends ToastMessage {
    onClose: (id: number) => void;
}

const SuccessIcon = () => (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
        <svg className="w-5 h-5 text-green-600 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    </div>
);
// Could add more icons for error, info

const Toast: React.FC<ToastProps> = ({ id, title, message, type, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            const exitTimer = setTimeout(() => onClose(id), 300); // Match animation duration
            return () => clearTimeout(exitTimer);
        }, 5000); // Auto-close after 5 seconds

        return () => clearTimeout(timer);
    }, [id, onClose]);
    
    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300);
    };

    return (
        <div 
            role="alert"
            className={`
                w-full p-4 flex items-start space-x-3 bg-white dark:bg-secondary-800 rounded-lg shadow-2xl ring-1 ring-black ring-opacity-5
                transition-all duration-300 ease-in-out
                ${isExiting ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'}
            `}
        >
            <SuccessIcon />
            <div className="flex-1">
                <p className="font-semibold text-secondary-900 dark:text-white">{title}</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">{message}</p>
            </div>
            <button onClick={handleClose} className="p-1 rounded-full text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default Toast;
