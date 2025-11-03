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
    const { theme, toggleTheme, increaseFontSize, decreaseFontSize, resetFontSize, highlightMissingData, toggleHighlightMissingData } = useTheme();
    const { user, effectiveRole, activeSchoolId } = useAuth();
    const { schools, backupData, restoreData, updateSchool, feeHeads, addFeeHead, updateFeeHead } = useData();
    const { showToast } = useToast();
    const { installPrompt, clearInstallPrompt } = usePWAInstall();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);

    // State for School Details
    const [isSchoolSaving, setIsSchoolSaving] = useState(false);
    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = schools.find(s => s.id === effectiveSchoolId);
    
    const [schoolDetails, setSchoolDetails] = useState({ name: '', address: '', logoUrl: null as string | null | undefined });
    const [defaultTuitionFee, setDefaultTuitionFee] = useState(0);

    // State for Class Promotion
    const [isTuitionFeeModalOpen, setIsTuitionFeeModalOpen] = useState(false);


    // Initialize forms and preferences from user data
    useEffect(() => {
        if (school) {
            setSchoolDetails({
                name: school.name,
                address: school.address,
                logoUrl: school.logoUrl,
            });
            const tuitionFeeHead = feeHeads.find(fh => fh.schoolId === effectiveSchoolId && fh.name.toLowerCase() === 'tuition fee');
            setDefaultTuitionFee(tuitionFeeHead?.defaultAmount || 0);
        }
    }, [school, feeHeads, effectiveSchoolId]);
    
    const handleSchoolUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!school || !schoolDetails.name.trim() || !effectiveSchoolId) return;

        setIsSchoolSaving(true);
        try {
            // Update school name, address, logo
            await updateSchool({
                id: school.id,
                name: schoolDetails.name,
                address: schoolDetails.address,
                logoUrl: schoolDetails.logoUrl
            });
            
            // Update or create the default tuition fee in fee_heads
            const tuitionFeeHead = feeHeads.find(fh => fh.schoolId === effectiveSchoolId && fh.name.toLowerCase() === 'tuition fee');
            if (tuitionFeeHead) {
                if (tuitionFeeHead.defaultAmount !== defaultTuitionFee) {
                    await updateFeeHead({ ...tuitionFeeHead, defaultAmount: defaultTuitionFee });
                }
            } else {
                await addFeeHead({ name: 'Tuition Fee', defaultAmount: defaultTuitionFee, schoolId: effectiveSchoolId });
            }

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
                    <div className="space-y-6">
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
                        <div className="flex items-center justify-between">
                            <div>
                                <label id="highlight-label" className="font-medium text-secondary-700 dark:text-secondary-300">Highlight Missing Data</label>
                                <p className="text-sm text-secondary-500">Visually emphasize empty fields on student profiles.</p>
                            </div>
                             <button
                                type="button"
                                role="switch"
                                aria-checked={highlightMissingData}
                                aria-labelledby="highlight-label"
                                onClick={toggleHighlightMissingData}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                                    highlightMissingData ? 'bg-primary-600' : 'bg-secondary-200 dark:bg-secondary-600'
                                }`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        highlightMissingData ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                 {effectiveRole === UserRole.Admin && (
                    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold border-b pb-3 dark:border-secondary-700 mb-6">School Details</h2>
                        <form onSubmit={handleSchoolUpdate} className="space-y-4">
                             <ImageUpload 
                                imageUrl={schoolDetails.logoUrl}
                                onChange={(newLogoUrl) => setSchoolDetails(prev => ({...prev, logoUrl: newLogoUrl}))}
                                bucketName="logos"
                                />
                            <div>
                                <label className="input-label">School Name</label>
                                <input type="text" value={schoolDetails.name} onChange={e => setSchoolDetails(p => ({...p, name: e.target.value}))} className="input-field" />
                            </div>
                             <div>
                                <label className="input-label">Address</label>
                                <textarea value={schoolDetails.address} onChange={e => setSchoolDetails(p => ({...p, address: e.target.value}))} className="input-field" rows={2}></textarea>
                            </div>
                            <div>
                                <label className="input-label">Default Monthly Tuition Fee</label>
                                <input type="number" value={defaultTuitionFee} onChange={e => setDefaultTuitionFee(Number(e.target.value))} className="input-field" />
                                <p className="text-xs text-secondary-500 mt-1">This updates the default amount on the 'Tuition Fee' head and is used for new students or CSV imports.</p>
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