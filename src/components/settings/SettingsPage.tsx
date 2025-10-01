import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { DownloadIcon, UploadIcon } from '../../constants';
import Modal from '../common/Modal';
import { UserRole } from '../../types';
import { useToast } from '../../context/ToastContext';

// A simple toggle switch component
const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`${
            enabled ? 'bg-primary-600' : 'bg-secondary-200 dark:bg-secondary-600'
        } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-secondary-800`}
    >
        <span
            className={`${
                enabled ? 'translate-x-6' : 'translate-x-1'
            } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
        />
    </button>
);


const SettingsPage: React.FC = () => {
    const { theme, toggleTheme, increaseFontSize, decreaseFontSize, resetFontSize } = useTheme();
    const { user, effectiveRole } = useAuth();
    const { backupData, restoreData, updateUser } = useData();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);

    // Default preferences structure
    const defaultPrefs = {
        feeDeadlines: { email: true, inApp: true },
        examResults: { email: true, inApp: true },
    };

    const [prefs, setPrefs] = useState(defaultPrefs);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize preferences from user data
    useEffect(() => {
        if (user?.notificationPreferences) {
            setPrefs({
                feeDeadlines: { ...defaultPrefs.feeDeadlines, ...user.notificationPreferences.feeDeadlines },
                examResults: { ...defaultPrefs.examResults, ...user.notificationPreferences.examResults },
            });
        } else {
            setPrefs(defaultPrefs);
        }
    }, [user]);

    const handleToggle = (category: 'feeDeadlines' | 'examResults', type: 'email' | 'inApp') => {
        setPrefs(currentPrefs => ({
            ...currentPrefs,
            [category]: {
                ...currentPrefs[category],
                [type]: !currentPrefs[category][type],
            },
        }));
    };

    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await updateUser({ ...user, notificationPreferences: prefs });
            showToast('Success', 'Notification preferences saved!', 'success');
        } catch (error) {
            showToast('Error', 'Could not save preferences.', 'error');
        } finally {
            setIsSaving(false);
        }
    };


    const handleRestoreInitiate = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setRestoreFile(event.target.files[0]);
        }
        // Reset file input value to allow re-selection of the same file
        event.target.value = '';
    };

    const handleConfirmRestore = async () => {
        if (restoreFile) {
            await restoreData(restoreFile);
            setRestoreFile(null);
        }
    };
    
    const canSeeNotifications = [UserRole.Parent, UserRole.Student].includes(effectiveRole as UserRole);

    return (
        <>
            <Modal
                isOpen={!!restoreFile}
                onClose={() => setRestoreFile(null)}
                title="Confirm Data Restore"
            >
                <div className="space-y-4">
                    <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">
                        <strong>Warning:</strong> This is a destructive action. Restoring from the file{' '}
                        <strong>{restoreFile?.name}</strong> will permanently delete all existing data for the current school and replace it. This cannot be undone.
                    </p>
                    <p>Are you absolutely sure you want to proceed?</p>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button onClick={() => setRestoreFile(null)} className="btn-secondary">Cancel</button>
                        <button onClick={handleConfirmRestore} className="btn-danger">Yes, Restore Data</button>
                    </div>
                </div>
            </Modal>
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
                            <button onClick={decreaseFontSize} className="btn-secondary px-3 py-1 text-lg font-bold">-</button>
                            <button onClick={resetFontSize} className="btn-secondary text-sm">Reset</button>
                            <button onClick={increaseFontSize} className="btn-secondary px-3 py-1 text-lg font-bold">+</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Notification Preferences (New Section) */}
                {canSeeNotifications && (
                    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold border-b pb-3 dark:border-secondary-700">Notification Preferences</h2>
                        <div className="py-4 space-y-4">
                            {/* Fee Deadlines */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <div className="md:col-span-1">
                                    <p className="font-medium">Fee Deadlines</p>
                                    <p className="text-sm text-secondary-500 dark:text-secondary-400">Reminders for upcoming fee payments.</p>
                                </div>
                                <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-x-8 gap-y-2 flex-wrap">
                                    <label className="flex items-center space-x-2">
                                        <ToggleSwitch enabled={prefs.feeDeadlines.email} onChange={() => handleToggle('feeDeadlines', 'email')} />
                                        <span>Email</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <ToggleSwitch enabled={prefs.feeDeadlines.inApp} onChange={() => handleToggle('feeDeadlines', 'inApp')} />
                                        <span>In-App</span>
                                    </label>
                                </div>
                            </div>

                            {/* Exam Results */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-4 border-t dark:border-secondary-700">
                                <div className="md:col-span-1">
                                    <p className="font-medium">Exam Results</p>
                                    <p className="text-sm text-secondary-500 dark:text-secondary-400">Alerts when new results are published.</p>
                                </div>
                                <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-x-8 gap-y-2 flex-wrap">
                                    <label className="flex items-center space-x-2">
                                        <ToggleSwitch enabled={prefs.examResults.email} onChange={() => handleToggle('examResults', 'email')} />
                                        <span>Email</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <ToggleSwitch enabled={prefs.examResults.inApp} onChange={() => handleToggle('examResults', 'inApp')} />
                                        <span>In-App</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t dark:border-secondary-700">
                            <button onClick={handleSaveChanges} disabled={isSaving} className="btn-primary">
                                {isSaving ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </div>
                    </div>
                )}

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
                            <input type="email" defaultValue={user?.email} disabled className="md:col-span-2 input-field" />
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

                {/* Data Management */}
                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold border-b pb-3 dark:border-secondary-700">Data Management</h2>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Backup Data</p>
                                <p className="text-sm text-secondary-500 dark:text-secondary-400">Download all school data (students, fees, etc.) as a single JSON file.</p>
                            </div>
                            <button onClick={backupData} className="btn-secondary">
                                <DownloadIcon className="w-4 h-4" /> Backup
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Restore Data</p>
                                <p className="text-sm text-secondary-500 dark:text-secondary-400">Restore school data from a backup file. This is a destructive action.</p>
                            </div>
                            <button onClick={() => fileInputRef.current?.click()} className="btn-danger">
                                <UploadIcon className="w-4 h-4" /> Restore
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleRestoreInitiate} className="hidden" accept=".json" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsPage;