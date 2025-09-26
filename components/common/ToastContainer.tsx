
import React from 'react';
import { useToast } from '../../context/ToastContext';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed top-4 right-4 z-[100] w-full max-w-xs space-y-3">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    id={toast.id}
                    title={toast.title}
                    message={toast.message}
                    type={toast.type}
                    onClose={removeToast}
                />
            ))}
        </div>
    );
};

export default ToastContainer;
