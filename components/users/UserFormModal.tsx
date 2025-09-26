
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole } from '../../types';
import Modal from './Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { NAV_LINKS } from '../../constants';
import ImageUpload from '../common/ImageUpload';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: User | Omit<User, 'id' | 'lastLogin' | 'disabledNavLinks'> & { disabledNavLinks?: string[] }) => void;
    userToEdit?: User | null;
    defaultRole?: UserRole;
    lockRole?: boolean;
}

/**
 * Validates if the given string is in a valid email format.
 * @param email The email string to validate.
 * @returns True if the email format is valid, otherwise false.
 */
const isValidEmail = (email: string): boolean => {
    if (!email) return false;
    // A more robust regex for email format validation.
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, userToEdit, defaultRole, lockRole = false }) => {
    const { user: currentUser } = useAuth();
    const { schools } = useData();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: defaultRole || UserRole.Student,
        schoolId: currentUser?.schoolId || schools[0]?.id || '',
        status: 'Pending Approval' as User['status'],
        avatarUrl: null as string | null | undefined,
    });
    const [disabledLinks, setDisabledLinks] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<{ name?: string; email?: string; role?: string; schoolId?: string }>({});

    const isOwnerView = currentUser?.role === UserRole.Owner;
    const linksForRole = NAV_LINKS[formData.role] || [];

    useEffect(() => {
        // Ensure form and errors are reset when modal opens
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
                    schoolId: currentUser?.schoolId || schools[0]?.id || '',
                    status: 'Pending Approval',
                    avatarUrl: null,
                });
                setDisabledLinks({});
            }
            setErrors({}); // Reset errors on open
        }
    }, [userToEdit, isOpen, currentUser, schools, defaultRole]);

    const validate = () => {
        const newErrors: { name?: string; email?: string; role?: string; schoolId?: string } = {};
        
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

        if (!formData.role) {
            newErrors.role = 'A user role must be selected.';
        }

        if (isOwnerView && !formData.schoolId) {
            newErrors.schoolId = 'A school must be selected.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear validation error when user starts typing
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            return; // Stop submission if validation fails
        }
        const disabledNavLinks = Object.entries(disabledLinks)
            .filter(([, isDisabled]) => isDisabled)
            .map(([path]) => path);

        if (userToEdit) {
            onSave({ ...userToEdit, ...formData, disabledNavLinks });
        } else {
            onSave({ ...formData, disabledNavLinks });
        }
        onClose();
    };

    const availableRoles = useMemo(() => {
        if (!currentUser) return [];

        switch (currentUser.role) {
            case UserRole.Owner:
                return Object.values(UserRole);
            
            case UserRole.Admin:
                return Object.values(UserRole).filter(role => role !== UserRole.Owner);

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
                    <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Full Name</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full input-style" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Email Address</label>
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="w-full input-style" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Role</label>
                    <select name="role" id="role" value={formData.role} onChange={handleChange} required className="w-full input-style" disabled={lockRole}>
                        {availableRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                    {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                </div>
                {isOwnerView && (
                    <div>
                        <label htmlFor="schoolId" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">School</label>
                        <select name="schoolId" id="schoolId" value={formData.schoolId} onChange={handleChange} required className="w-full input-style">
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
                        <label htmlFor="status" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Status</label>
                        <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full input-style">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Pending Approval">Pending Approval</option>
                            <option value="Suspended">Suspended</option>
                        </select>
                    </div>
                )}
                 {isOwnerView && userToEdit && (
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Menu Permissions</label>
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
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg">Save User</button>
                </div>
            </form>
             <style>{`
                .input-style {
                    background-color: #f9fafb;
                    border: 1px solid #d1d5db;
                    color: #111827;
                    font-size: 0.875rem;
                    border-radius: 0.5rem;
                    display: block;
                    width: 100%;
                    padding: 0.625rem;
                }
                .dark .input-style {
                    background-color: #374151;
                    border-color: #4b5563;
                    color: white;
                }
                .input-style:focus {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    --tw-ring-color: #3b82f6;
                    box-shadow: 0 0 0 2px var(--tw-ring-color);
                }
            `}</style>
        </Modal>
    );
};

export default UserFormModal;