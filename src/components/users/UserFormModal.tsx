import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole } from '../../types';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { NAV_LINKS } from '../../constants';
import ImageUpload from '../common/ImageUpload';
import { useToast } from '../../context/ToastContext';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: User | (Omit<User, 'id' | 'lastLogin' | 'disabledNavLinks'> & { disabledNavLinks?: string[], password?: string })) => void;
    userToEdit?: User | null;
    defaultRole?: UserRole;
    lockRole?: boolean;
}

const isValidEmail = (email: string): boolean => {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, userToEdit, defaultRole, lockRole = false }) => {
    const { user: currentUser, activeSchoolId } = useAuth();
    const { schools, resetUserPassword } = useData();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: defaultRole || UserRole.Student,
        schoolId: '',
        status: 'Pending Approval' as User['status'],
        avatarUrl: null as string | null | undefined,
    });
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);
    const [disabledLinks, setDisabledLinks] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<{ name?: string; email?: string; role?: string; schoolId?: string; password?: string; }>({});

    const isOwnerGlobalView = currentUser?.role === UserRole.Owner && !activeSchoolId;
    const effectiveSchoolId = currentUser?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : currentUser?.schoolId;
    const linksForRole = NAV_LINKS[formData.role] || [];

    useEffect(() => {
        if (isOpen) {
            if (userToEdit) {
                setFormData({
                    name: userToEdit.name,
                    email: userToEdit.email,
                    role: userToEdit.role,
                    schoolId: userToEdit.schoolId,
                    status: userToEdit.status,
                    avatarUrl: userToEdit.avatarUrl,
                });
                const initialDisabled: Record<string, boolean> = {};
                if (userToEdit.disabledNavLinks) {
                    userToEdit.disabledNavLinks.forEach(path => {
                        initialDisabled[path] = true;
                    });
                }
                setDisabledLinks(initialDisabled);
            } else {
                setFormData({
                    name: '',
                    email: '',
                    role: defaultRole || UserRole.Student,
                    schoolId: effectiveSchoolId || '',
                    status: 'Pending Approval',
                    avatarUrl: null,
                });
                setDisabledLinks({});
            }
            setPassword('');
            setNewPassword('');
            setErrors({});
        }
    }, [userToEdit, isOpen, currentUser, schools, defaultRole, effectiveSchoolId]);

    const validate = () => {
        const newErrors: { name?: string; email?: string; role?: string; schoolId?: string; password?: string; } = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Full Name is required.';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Full name must be at least 3 characters.';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email Address is required.';
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = 'Email address is invalid.';
        }
        
        if (!userToEdit && password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters long.';
        }

        if (!formData.role) {
            newErrors.role = 'A user role must be selected.';
        }

        if (isOwnerGlobalView && !formData.schoolId) {
            newErrors.schoolId = 'A school must be selected.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof typeof errors];
                return newErrors;
            });
        }
    };

    const handleLinkToggle = (path: string) => {
        setDisabledLinks(prev => ({
            ...prev,
            [path]: !prev[path],
        }));
    };

    const handlePasswordReset = async () => {
        if (!userToEdit || !newPassword) {
            showToast('Info', 'Please enter a new password.', 'info');
            return;
        }
        if (newPassword.length < 6) {
            showToast('Error', 'Password must be at least 6 characters long.', 'error');
            return;
        }
        setIsPasswordSaving(true);
        try {
            await resetUserPassword(userToEdit.id, newPassword);
            setNewPassword('');
        } catch (e) {
            // Error toast is handled in context
        } finally {
            setIsPasswordSaving(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            return;
        }
        const disabledNavLinks = Object.entries(disabledLinks)
            .filter(([, isDisabled]) => isDisabled)
            .map(([path]) => path);

        if (userToEdit) {
            onSave({ ...userToEdit, ...formData, disabledNavLinks });
        } else {
            onSave({ ...formData, password, disabledNavLinks });
        }
        onClose();
    };

    const availableRoles = useMemo(() => {
        if (!currentUser) return [];

        switch (currentUser.role) {
            case UserRole.Owner:
                return Object.values(UserRole);
            
            case UserRole.Admin:
                return Object.values(UserRole).filter(role => ![UserRole.Owner, UserRole.Admin].includes(role));

            case UserRole.Teacher:
            case UserRole.Accountant:
                return [UserRole.Parent, UserRole.Student];

            default:
                return [];
        }
    }, [currentUser]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={userToEdit ? 'Edit User' : 'Add New User'}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2" noValidate>
                <ImageUpload 
                  imageUrl={formData.avatarUrl}
                  onChange={(newAvatarUrl) => setFormData(prev => ({...prev, avatarUrl: newAvatarUrl}))}
                />
                <div>
                    <label htmlFor="name" className="input-label">Full Name</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="input-field" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="email" className="input-label">Email Address</label>
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="input-field" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                {!userToEdit && (
                    <div>
                        <label htmlFor="password" className="input-label">Set Initial Password</label>
                        <input type="password" name="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-field" />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>
                )}
                <div>
                    <label htmlFor="role" className="input-label">Role</label>
                    <select name="role" id="role" value={formData.role} onChange={handleChange} required className="input-field" disabled={lockRole}>
                        {availableRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                    {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                </div>
                {isOwnerGlobalView && (
                    <div>
                        <label htmlFor="schoolId" className="input-label">School</label>
                        <select name="schoolId" id="schoolId" value={formData.schoolId} onChange={handleChange} required className="input-field">
                            <option value="">Select a school</option>
                            {schools.map(school => (
                                <option key={school.id} value={school.id}>{school.name}</option>
                            ))}
                        </select>
                        {errors.schoolId && <p className="text-red-500 text-xs mt-1">{errors.schoolId}</p>}
                    </div>
                )}
                {userToEdit && (
                     <div>
                        <label htmlFor="status" className="input-label">Status</label>
                        <select name="status" id="status" value={formData.status} onChange={handleChange} className="input-field">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Pending Approval">Pending Approval</option>
                            <option value="Suspended">Suspended</option>
                        </select>
                    </div>
                )}
                 {currentUser?.role === UserRole.Owner && userToEdit && (
                    <div className="pt-2">
                        <label className="input-label mb-2">Menu Permissions</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto p-3 bg-secondary-50 dark:bg-secondary-700 rounded-md border dark:border-secondary-600">
                             {linksForRole.map(link => (
                                <label key={link.path} className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={!disabledLinks[link.path]}
                                        onChange={() => handleLinkToggle(link.path)}
                                        className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-secondary-800 dark:text-secondary-200">{link.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Save User</button>
                </div>

                {userToEdit && (currentUser?.role === UserRole.Owner || currentUser?.role === UserRole.Admin) && (
                    <div className="border-t dark:border-secondary-700 pt-4 mt-4">
                        <label className="input-label">Reset Password</label>
                        <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-2">
                            Set a new password for {userToEdit.name}.
                        </p>
                        <div className="flex items-center space-x-2">
                            <input 
                                type="password" 
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input-field flex-grow" 
                            />
                            <button 
                                type="button" 
                                onClick={handlePasswordReset} 
                                className="btn-secondary"
                                disabled={isPasswordSaving}
                            >
                                {isPasswordSaving ? 'Saving...' : 'Reset'}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
};

export default UserFormModal;