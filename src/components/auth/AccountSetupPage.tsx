

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

const AccountSetupPage: React.FC = () => {
    const { user, completeProfileSetup } = useAuth();
    const [name, setName] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.Owner); // Default to Owner for first setup
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('Please enter your full name.');
            return;
        }
        setLoading(true);
        const { success, error: setupError } = await completeProfileSetup(name, role);
        if (!success) {
            setError(setupError || 'An unknown error occurred.');
        }
        // On success, the AuthProvider will update the state and the app will re-render to the dashboard.
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl p-6 sm:p-8 z-10">
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400">Account Setup</h1>
                    <p className="text-secondary-500 dark:text-secondary-400 mt-1 sm:mt-2">
                        Welcome, {user?.email}! Let's finish setting up your account.
                    </p>
                </div>

                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-secondary-700 dark:text-secondary-300 text-sm font-bold mb-2" htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-secondary-700 dark:text-secondary-200 bg-secondary-100 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g., John Doe"
                            required
                        />
                    </div>
                     <div className="mb-5 sm:mb-6">
                        <label className="block text-secondary-700 dark:text-secondary-300 text-sm font-bold mb-2" htmlFor="role">What is your primary role?</label>
                        <select 
                            id="role" 
                            value={role} 
                            onChange={(e) => setRole(e.target.value as UserRole)} 
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 bg-secondary-100 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value={UserRole.Owner}>I am the School Owner / Super Admin</option>
                            <option value={UserRole.Admin}>I am a School Administrator</option>
                            <option value={UserRole.Teacher}>I am a Teacher</option>
                            <option value={UserRole.Parent}>I am a Parent</option>
                            <option value={UserRole.Student}>I am a Student</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                         {loading ? <SpinnerIcon /> : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const SpinnerIcon = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default AccountSetupPage;
