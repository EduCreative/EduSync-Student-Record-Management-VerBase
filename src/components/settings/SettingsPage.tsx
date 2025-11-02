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

const SettingsPage: React.FC = () => {
    const { theme, toggleTheme, increaseFontSize, decreaseFontSize, resetFontSize } = useTheme();
    const { user, effectiveRole, activeSchoolId } = useAuth();
    const { schools, backupData, restoreData, updateSchool } = useData();
    const { showToast } = useToast();
    const { installPrompt, clearInstallPrompt } = usePWAInstall();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);

    // State for School Details
    const [isSchoolSaving, setIsSchoolSaving] = useState(false);
    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = schools.find(s => s.id === effectiveSchoolId);
    const [schoolData, setSchoolData] = useState({
        name: '',
        address: '',
        logoUrl: null as string | null | undefined,
        defaultTuitionFee: 0,
    });

    // State for Class Promotion
    const [isTuitionFeeModalOpen, setIsTuitionFeeModalOpen] = useState(false);


    // Initialize forms and preferences from user data
    useEffect(() => {
        if (school) {
            setSchoolData({
                name: school.name,
                address: school.address,
                logoUrl: school.logoUrl,
                defaultTuitionFee: school.defaultTuitionFee || 0,
            });
        }
    }, [school]);
    
    const handleSchoolUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!school || !schoolData.name.trim()) return;

        setIsSchoolSaving(true);
        try {
            await updateSchool({ ...school, ...schoolData });
            showToast('Success', 'School details updated!', 'success');
        } catch (error) {
            showToast('Error', 'Failed to update school details.', 'error');
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
                            <div>
                                <label className="input-label">Default Monthly Tuition Fee</label>
                                <input type="number" value={schoolData.defaultTuitionFee} onChange={e => setSchoolData(p => ({...p, defaultTuitionFee: Number(e.target.value)}))} className="input-field" />
                                <p className="text-xs text-secondary-500 mt-1">This fee will be applied to new students or during CSV import if no specific tuition fee is provided.</p>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="btn-primary" disabled={isSchoolSaving}>
                                    {isSchoolSaving ? 'Saving...' : 'Save School Details'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {effectiveRole === UserRole.Admin && (
                    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold border-b pb-3 dark:border-secondary-700 mb-6">Academic Year Management</h2>
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
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
