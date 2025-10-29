import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { DownloadIcon, UploadIcon } from '../../constants';
import Modal from '../common/Modal';
import { UserRole } from '../../types';
import { useToast } from '../../context/ToastContext';
import ImageUpload from '../common/ImageUpload';
import { usePWAInstall } from '../../context/PWAInstallContext';
import IncreaseTuitionFeeModal from './IncreaseTuitionFeeModal';

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
    const { user, effectiveRole, activeSchoolId } = useAuth();
    const { schools, backupData, restoreData, updateUser, updateSchool, promoteAllStudents } = useData();
    const { showToast } = useToast();
    const { installPrompt, clearInstallPrompt } = usePWAInstall();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);

    // Default preferences structure
    const defaultPrefs = {
        feeDeadlines: { email: true, inApp: true },
        examResults: { email: true, inApp: true },
    };

    const [prefs, setPrefs] = useState(defaultPrefs);
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);

    // State for School Details
    const [isSchoolSaving, setIsSchoolSaving] = useState(false);
    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = schools.find(s => s.id === effectiveSchoolId);
    const [schoolData, setSchoolData] = useState({
        name: '',
        address: '',
        logoUrl: null as string | null | undefined,
    });

    // State for Class Promotion
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [isPromoting, setIsPromoting] = useState(false);
    const [isTuitionFeeModalOpen, setIsTuitionFeeModalOpen] = useState(false);
    const [promotionError, setPromotionError] = useState('');


    // Initialize forms and preferences from user data
    useEffect(() => {
        if (user) {
            if (user.notificationPreferences) {
                setPrefs({
                    feeDeadlines: { ...defaultPrefs.feeDeadlines, ...user.notificationPreferences.feeDeadlines },
                    examResults: { ...defaultPrefs.examResults, ...user.notificationPreferences.examResults },
                });
            } else {
                setPrefs(defaultPrefs);
            }
        }
        if (school) {
            setSchoolData({
                name: school.name,
                address: school.address,
                logoUrl: school.logoUrl
            });
        }
    }, [user, school]);

    const handleToggle = (category: 'feeDeadlines' | 'examResults', type: 'email' | 'inApp') => {
        setPrefs(currentPrefs => ({
            ...currentPrefs,
            [category]: {
                ...currentPrefs[category],
                [type]: !currentPrefs[category][type],
            },
        }));
    };

    const handleSavePrefs = async () => {
        if (!user) return;
        setIsSavingPrefs(true);
        try {
            const updatePromise = updateUser({ ...user, notificationPreferences: prefs });
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Saving preferences timed out.")), 15000)
            );
            await Promise.race([updatePromise, timeoutPromise]);
            showToast('Success', 'Notification preferences saved!', 'success');
        } catch (error: any) {
            showToast('Error', error.message || 'Could not save preferences.', 'error');
        } finally {
            setIsSavingPrefs(false);
        }
    };
    
    const handleSchoolUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!school || !schoolData.name.trim()) return;

        setIsSchoolSaving(true);
        try {
            const updatePromise = updateSchool({ ...school, ...schoolData });
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Updating school details timed out.")), 15000)
            );
            await Promise.race([updatePromise, timeoutPromise]);
            showToast('Success', 'School details updated!', 'success');
        } catch (error: any) {
            showToast('Error', error.message || 'Failed to update school details.', 'error');
        } finally {
            setIsSchoolSaving(false);
        }
    };

    const handleRestoreInitiate = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setRestoreFile(event.target.files[0]);
        }
        event.target.value = ''; // Allow re-selecting the same file
    };

    const handleConfirmRestore = async () => {
        if (restoreFile) {
            await restoreData(restoreFile);
            setRestoreFile(null);
        }
    };

    const handlePromoteStudents = async () => {
        setIsPromoting(true);
        setPromotionError('');
        try {
            const promotionPromise = promoteAllStudents();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Promotion timed out after 30 seconds.")), 30000)
            );
            await Promise.race([promotionPromise, timeoutPromise]);
            setIsPromoteModalOpen(false); // Close on success
        } catch (error: any) {
            console.error("Promotion failed:", error);
            setPromotionError(error.message || "An unknown error occurred during promotion.");
            // Error toast is handled in DataContext, but we set local error to display in modal
        } finally {
            setIsPromoting(false);
        }
    };

    const handleInstallPWA = async () => {
        if (!installPrompt) return;
        try {
            await installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') {
                showToast('Success', 'App installed successfully!', 'success');
            } else {
                showToast('Info', 'Installation was dismissed.', 'info');
            }
        } catch (e) {
            showToast('Error', 'App installation failed.', 'error');
        } finally {
            clearInstallPrompt();
        }
    };
    
    return (
        <>
            <Modal isOpen={!!restoreFile} onClose={() => setRestoreFile(null)} title="Confirm Data Restore">
                <p>Are you sure you want to restore data from <strong>{restoreFile?.name}</strong>? This will overwrite all existing data for the current school. This action cannot be undone.</p>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={() => setRestoreFile(null)} className="btn-secondary">Cancel</button>
                    <button type="button" onClick={handleConfirmRestore} className="btn-danger">Confirm Restore</button>
                </div>
            </Modal>
            <Modal isOpen={isPromoteModalOpen} onClose={() => setIsPromoteModalOpen(false)} title="Confirm Student Promotion">
                <div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        Are you sure you want to promote all students? This will update the class for every active student and graduate the final year.
                        <br />
                        <strong>This action is irreversible.</strong>
                    </p>
                    {promotionError && (
                        <p className="text-sm text-red-600 mt-3 p-2 bg-red-50 dark:bg-red-900/50 rounded-md">{promotionError}</p>
                    )}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsPromoteModalOpen(false)} className="btn-secondary" disabled={isPromoting}>Cancel</button>
                        <button type="button" onClick={handlePromoteStudents} className="btn-danger" disabled={isPromoting}>
                            {isPromoting ? 'Promoting...' : 'Yes, Promote All'}
                        </button>
                    </div>
                </div>
            </Modal>
            <IncreaseTuitionFeeModal
                isOpen={isTuitionFeeModalOpen}
                onClose={() => setIsTuitionFeeModalOpen(false)}
            />
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Settings</h1>

                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold border-b pb-3 dark:border-secondary-700 mb-6">Appearance</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="font-medium text-secondary-700 dark:text-secondary-300">Theme</label>
                            <button onClick={toggleTheme} className="btn-secondary">
                                Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
                            </button>
                        </div>
                         <div className="flex items-center justify-between">
                            <label className="font-medium text-secondary-700 dark:text-secondary-300">Font Size</label>
                            <div className="flex items-center space-x-2">
                                <button onClick={decreaseFontSize} className="btn-secondary px-3">-</button>
                                <button onClick={resetFontSize} className="btn-secondary">Default</button>
                                <button onClick={increaseFontSize} className="btn-secondary px-3">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                 {effectiveRole === UserRole.Admin && (
                    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold border-b pb-3 dark:border-secondary-700 mb-6">School Details</h2>
                        <form onSubmit={handleSchoolUpdate} className="space-y-4">
                             <ImageUpload 
                                imageUrl={schoolData.logoUrl}
                                onChange={(newLogoUrl) => setSchoolData(prev => ({...prev, logoUrl: newLogoUrl}))}
                                bucketName="logos"
                                />
                            <div>
                                <label className="input-label">School Name</label>
                                <input type="text" value={schoolData.name} onChange={e => setSchoolData(p => ({...p, name: e.target.value}))} className="input-field" />
                            </div>
                             <div>
                                <label className="input-label">Address</label>
                                <textarea value={schoolData.address} onChange={e => setSchoolData(p => ({...p, address: e.target.value}))} className="input-field" rows={2}></textarea>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="btn-primary" disabled={isSchoolSaving}>
                                    {isSchoolSaving ? 'Saving...' : 'Save School Details'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                 <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold border-b pb-3 dark:border-secondary-700 mb-6">Notification Preferences</h2>
                    <div className="space-y-4">
                        <div className="p-3 rounded-lg border dark:border-secondary-700">
                             <h3 className="font-medium mb-2 text-secondary-800 dark:text-secondary-200">Fee Deadlines & Reminders</h3>
                             <div className="flex items-center justify-between py-1">
                                <label className="text-sm text-secondary-600 dark:text-secondary-400">In-App Notifications</label>
                                <ToggleSwitch enabled={prefs.feeDeadlines.inApp} onChange={_ => handleToggle('feeDeadlines', 'inApp')} />
                             </div>
                             <div className="flex items-center justify-between py-1">
                                <label className="text-sm text-secondary-600 dark:text-secondary-400">Email Notifications</label>
                                <ToggleSwitch enabled={prefs.feeDeadlines.email} onChange={_ => handleToggle('feeDeadlines', 'email')} />
                            </div>
                        </div>
                        <div className="p-3 rounded-lg border dark:border-secondary-700">
                            <h3 className="font-medium mb-2 text-secondary-800 dark:text-secondary-200">Exam Results Published</h3>
                             <div className="flex items-center justify-between py-1">
                                <label className="text-sm text-secondary-600 dark:text-secondary-400">In-App Notifications</label>
                                <ToggleSwitch enabled={prefs.examResults.inApp} onChange={_ => handleToggle('examResults', 'inApp')} />
                             </div>
                             <div className="flex items-center justify-between py-1">
                                <label className="text-sm text-secondary-600 dark:text-secondary-400">Email Notifications</label>
                                <ToggleSwitch enabled={prefs.examResults.email} onChange={_ => handleToggle('examResults', 'email')} />
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-end pt-6 border-t dark:border-secondary-700 mt-6">
                        <button onClick={handleSavePrefs} className="btn-primary" disabled={isSavingPrefs}>
                            {isSavingPrefs ? 'Saving...' : 'Save Preferences'}
                        </button>
                    </div>
                </div>

                {effectiveRole === UserRole.Admin && (
                    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold border-b pb-3 dark:border-secondary-700 mb-6">Academic Year Management</h2>
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-medium text-secondary-900 dark:text-white">Promote All Students</h3>
                                    <p className="text-sm text-secondary-500 mt-1 max-w-xl">
                                        This will advance all 'Active' students to the next class level for the new academic year. 
                                        Students in the highest class will be marked as having passed. This action cannot be undone.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setIsPromoteModalOpen(true)}
                                    className="btn-danger flex-shrink-0"
                                >
                                    Promote Students
                                </button>
                            </div>
                            <div className="flex items-start justify-between pt-4 border-t dark:border-secondary-700">
                                <div>
                                    <h3 className="font-medium text-secondary-900 dark:text-white">Increase Tuition Fees</h3>
                                    <p className="text-sm text-secondary-500 mt-1 max-w-xl">
                                        Apply a fixed amount increase to the 'Tuition Fee' for selected students. This is typically done at the start of a new academic year.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setIsTuitionFeeModalOpen(true)}
                                    className="btn-primary flex-shrink-0"
                                >
                                    Increase Fees
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {effectiveRole === UserRole.Admin && (
                    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold border-b pb-3 dark:border-secondary-700 mb-6">Data Management</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="font-medium">Backup Data</p>
                                <button onClick={backupData} className="btn-secondary"><DownloadIcon className="w-4 h-4 mr-2" /> Download Backup</button>
                            </div>
                             <div className="flex items-center justify-between">
                                <p className="font-medium">Restore Data</p>
                                <input ref={fileInputRef} type="file" accept=".json" onChange={handleRestoreInitiate} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="btn-secondary"><UploadIcon className="w-4 h-4 mr-2"/> Upload & Restore</button>
                            </div>
                        </div>
                    </div>
                )}
                {installPrompt && (
                    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold border-b pb-3 dark:border-secondary-700 mb-6">Install App</h2>
                        <div className="flex items-center justify-between">
                            <p className="font-medium">Install EduSync on your device for a better experience.</p>
                            <button onClick={handleInstallPWA} className="btn-primary">Install</button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default SettingsPage;