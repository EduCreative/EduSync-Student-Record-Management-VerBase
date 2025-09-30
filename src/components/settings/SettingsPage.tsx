import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const SettingsPage: React.FC = () => {
    const { theme, toggleTheme, increaseFontSize, decreaseFontSize, resetFontSize } = useTheme();
    const { user } = useAuth();

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Settings</h1>

            {/* Appearance Settings */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold border-b pb-3 dark:border-secondary-700">Appearance</h2>
                <div className="py-4 space-y-4">
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Theme</p>
                            <p className="text-sm text-secondary-500 dark:text-secondary-400">Switch between light and dark mode.</p>
                        </div>
                        <button onClick={toggleTheme} className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors bg-secondary-200 dark:bg-secondary-600">
                            <span className={`${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
                        </button>
                    </div>
                     {/* Font Size Control */}
                    <div className="flex items-center justify-between">
                         <div>
                            <p className="font-medium">Font Size</p>
                            <p className="text-sm text-secondary-500 dark:text-secondary-400">Adjust the text size for better readability.</p>
                        </div>
                        <div className="flex items-center space-x-2">
                           <button onClick={decreaseFontSize} className="btn-secondary text-lg font-bold">-</button>
                           <button onClick={resetFontSize} className="btn-secondary text-sm">Reset</button>
                           <button onClick={increaseFontSize} className="btn-secondary text-lg font-bold">+</button>
                        </div>
                    </div>
                </div>
            </div>

             {/* Account Settings */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold border-b pb-3 dark:border-secondary-700">Account</h2>
                <div className="py-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <label className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Full Name</label>
                        <input type="text" defaultValue={user?.name} className="md:col-span-2 input-field" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <label className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Email Address</label>
                        <input type="email" defaultValue={user?.email} disabled className="md:col-span-2 input-field bg-secondary-100 dark:bg-secondary-700 cursor-not-allowed" />
                    </div>
                     <div className="flex justify-end pt-2">
                        <button className="btn-primary">Update Profile</button>
                    </div>
                </div>
                <div className="border-t dark:border-secondary-700 pt-4 mt-4 space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <label className="text-sm font-medium text-secondary-600 dark:text-secondary-300">New Password</label>
                        <input type="password" placeholder="••••••••" className="md:col-span-2 input-field" />
                    </div>
                     <div className="flex justify-end">
                        <button className="btn-primary">Change Password</button>
                    </div>
                </div>
            </div>
             <style>{`
                .btn-primary { @apply px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg; }
                .btn-secondary { @apply px-3 py-1 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg; }
                .input-field { @apply w-full p-2 border rounded-md bg-secondary-50 text-secondary-900 dark:bg-secondary-700 dark:border-secondary-600 dark:text-secondary-200 placeholder:text-secondary-400 dark:placeholder:text-secondary-500; }
            `}</style>
        </div>
    );
};

export default SettingsPage;
