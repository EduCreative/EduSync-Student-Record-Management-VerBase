import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { User, UserRole } from '../../types';
import Badge from '../common/Badge';
import UserFormModal from './UserFormModal';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { formatDateTime } from '../../constants';

const UserManagementPage: React.FC = () => {
    const { user: currentUser, activeSchoolId } = useAuth();
    const { users, schools, getSchoolById, addUser, updateUser, deleteUser } = useData();
    
    const effectiveSchoolId = currentUser?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : currentUser?.schoolId;

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [schoolFilter, setSchoolFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<User['status'] | 'all'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const USERS_PER_PAGE = 10;

    const creatableRoles = useMemo(() => {
        if (!currentUser) return [];

        switch (currentUser.role) {
            case UserRole.Owner:
                return Object.values(UserRole);
            case UserRole.Admin:
                return Object.values(UserRole).filter(role => ![UserRole.Owner, UserRole.Admin].includes(role));
            default:
                return [];
        }
    }, [currentUser]);

    const filteredUsers = useMemo(() => {
        return users
            .filter(user => {
                const isAdminView = currentUser?.role === UserRole.Admin || (currentUser?.role === UserRole.Owner && activeSchoolId);
                if (isAdminView && user.schoolId !== effectiveSchoolId) {
                    return false;
                }
                if (currentUser?.role === UserRole.Owner && schoolFilter !== 'all' && user.schoolId !== schoolFilter) {
                    return false;
                }
                if (roleFilter !== 'all' && user.role !== roleFilter) {
                    return false;
                }
                if (statusFilter !== 'all' && user.status !== statusFilter) {
                    return false;
                }
                if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase()) && !user.email.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return false;
                }
                // Admin should not see other Admins or Owners
                if (currentUser?.role === UserRole.Admin && (user.role === UserRole.Admin || user.role === UserRole.Owner)) {
                    return false;
                }
                return true;
            });
    }, [users, currentUser, searchTerm, roleFilter, schoolFilter, statusFilter, activeSchoolId, effectiveSchoolId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter, schoolFilter, statusFilter]);

    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * USERS_PER_PAGE;
        const endIndex = startIndex + USERS_PER_PAGE;
        return filteredUsers.slice(startIndex, endIndex);
    }, [filteredUsers, currentPage]);


    const handleOpenModal = (user: User | null = null) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setUserToEdit(null);
        setIsModalOpen(false);
    };

    const handleSaveUser = (userData: User | (Omit<User, 'id'> & { password?: string })) => {
        if ('id' in userData) {
            updateUser(userData as User);
        } else {
            const { password, ...profileData } = userData;
            addUser(profileData as Omit<User, 'id'>, password);
        }
    };

    const handleDeleteUser = () => {
        if (userToDelete) {
            deleteUser(userToDelete.id);
            setUserToDelete(null); 
        }
    };
    
    const showingFrom = filteredUsers.length > 0 ? (currentPage - 1) * USERS_PER_PAGE + 1 : 0;
    const showingTo = Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length);

    const getStatusBadgeColor = (status: User['status']) => {
        switch (status) {
            case 'Active': return 'green';
            case 'Inactive': return 'secondary';
            case 'Suspended': return 'red';
            case 'Pending Approval': return 'yellow';
            default: return 'secondary';
        }
    };

    return (
        <>
            <UserFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveUser} userToEdit={userToEdit} />
            <Modal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                title="Confirm User Deletion"
            >
                <div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        Are you sure you want to permanently delete the user{' '}
                        <strong className="text-secondary-800 dark:text-secondary-200">{userToDelete?.name}</strong>?
                        <br />
                        This action cannot be undone.
                    </p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setUserToDelete(null)}
                            className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteUser}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">User Management</h1>
                    <button onClick={() => handleOpenModal()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition">
                        + Add User
                    </button>
                </div>

                <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                         <div className={currentUser?.role === UserRole.Owner ? 'sm:col-span-2 lg:col-span-1' : 'sm:col-span-2'}>
                            <label htmlFor="search-user" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Search Users</label>
                            <input
                                id="search-user"
                                type="text"
                                placeholder="By name or email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full p-2 border rounded-md bg-secondary-50 text-secondary-900 dark:bg-secondary-700 dark:border-secondary-600 dark:text-secondary-200 placeholder:text-secondary-400 dark:placeholder:text-secondary-500"
                            />
                        </div>

                        {currentUser?.role === UserRole.Owner && !activeSchoolId && (
                            <div>
                                <label htmlFor="school-filter" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">School</label>
                                <select id="school-filter" value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)} className="w-full p-2 border rounded-md bg-secondary-50 text-secondary-900 dark:bg-secondary-700 dark:border-secondary-600 dark:text-secondary-200 placeholder:text-secondary-400 dark:placeholder:text-secondary-500">
                                    <option value="all">All Schools</option>
                                    {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
                                </select>
                            </div>
                        )}
                        
                        <div>
                             <label htmlFor="role-filter" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Role</label>
                             <select id="role-filter" value={roleFilter} onChange={e => setRoleFilter(e.target.value as UserRole | 'all')} className="w-full p-2 border rounded-md bg-secondary-50 text-secondary-900 dark:bg-secondary-700 dark:border-secondary-600 dark:text-secondary-200 placeholder:text-secondary-400 dark:placeholder:text-secondary-500">
                                <option value="all">All Roles</option>
                                {creatableRoles.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                       
                        <div>
                            <label htmlFor="status-filter" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Status</label>
                            <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value as User['status'] | 'all')} className="w-full p-2 border rounded-md bg-secondary-50 text-secondary-900 dark:bg-secondary-700 dark:border-secondary-600 dark:text-secondary-200 placeholder:text-secondary-400 dark:placeholder:text-secondary-500">
                                <option value="all">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Pending Approval">Pending Approval</option>
                                <option value="Suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-secondary-500 dark:text-secondary-400">
                            <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">User</th>
                                    <th scope="col" className="px-6 py-3">Role</th>
                                    {currentUser?.role === UserRole.Owner && !activeSchoolId && <th scope="col" className="px-6 py-3">School</th>}
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3">Last Login</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map(user => {
                                    const canPerformActions = (() => {
                                        if (!currentUser || currentUser.id === user.id) return false;
                                        if (user.role === UserRole.Owner) return false;
                                        if (currentUser.role === UserRole.Admin && user.role === UserRole.Admin) return false;
                                        return true;
                                    })();

                                    return (
                                        <tr key={user.id} className="bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <Avatar user={user} className="h-10 w-10" />
                                                    <div>
                                                        <div className="font-semibold text-secondary-900 dark:text-white">{user.name}</div>
                                                        <div className="text-xs text-secondary-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><Badge>{user.role}</Badge></td>
                                            {currentUser?.role === UserRole.Owner && !activeSchoolId && <td className="px-6 py-4">{getSchoolById(user.schoolId)?.name || 'N/A'}</td>}
                                            <td className="px-6 py-4">
                                                <Badge color={getStatusBadgeColor(user.status)}>
                                                    {user.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">{formatDateTime(user.lastLogin)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-4">
                                                    <button 
                                                        onClick={() => handleOpenModal(user)} 
                                                        className="font-medium text-primary-600 dark:text-primary-500 hover:underline disabled:text-secondary-400 disabled:no-underline disabled:cursor-not-allowed"
                                                        disabled={!canPerformActions}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => setUserToDelete(user)} 
                                                        className="font-medium text-red-600 dark:text-red-500 hover:underline disabled:text-secondary-400 disabled:no-underline disabled:cursor-not-allowed"
                                                        disabled={!canPerformActions}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 0 && (
                         <div className="flex justify-between items-center p-4 border-t dark:border-secondary-700">
                            <span className="text-sm text-secondary-700 dark:text-secondary-400">
                                Showing {showingFrom} - {showingTo} of {filteredUsers.length} users
                            </span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm font-medium text-secondary-600 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-secondary-700 dark:text-secondary-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm font-medium text-secondary-600 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </>
    );
};

export default UserManagementPage;
