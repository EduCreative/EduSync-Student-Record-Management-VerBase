
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';
import { ActiveView } from './Layout';
import Avatar from '../common/Avatar';

interface HeaderProps {
    setSidebarOpen: (open: boolean) => void;
    setActiveView: (view: ActiveView) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen, setActiveView }) => {
    const { user, logout, activeSchoolId, switchSchoolContext } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { getSchoolById } = useData();
    const [profileOpen, setProfileOpen] = useState(false);

    const displaySchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = user ? getSchoolById(displaySchoolId as string) : null;
    
    const handleReturnToOwnerView = () => {
        switchSchoolContext(null);
        setActiveView({ view: 'overview' });
    };

    return (
        <header className="sticky top-0 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 z-30 no-print">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 -mb-px">
                    {/* Header: Left side */}
                    <div className="flex items-center">
                        {/* Hamburger button */}
                        <button
                            className="text-secondary-500 hover:text-secondary-600 lg:hidden"
                            aria-controls="sidebar"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <rect x="4" y="5" width="16" height="2" />
                                <rect x="4" y="11" width="16" height="2" />
                                <rect x="4" y="17" width="16" height="2" />
                            </svg>
                        </button>
                        <div className="hidden lg:flex items-center ml-4 space-x-3">
                            {school?.logoUrl && (
                                <img src={school.logoUrl} alt={`${school.name} Logo`} className="h-9 w-auto max-w-[100px] object-contain" />
                            )}
                            <h1 className="text-xl font-semibold">{school?.name || 'EduSync'}</h1>
                            {user?.role === UserRole.Owner && activeSchoolId && (
                                <button onClick={handleReturnToOwnerView} className="text-sm text-primary-600 hover:underline">
                                    &larr; Back to Owner View
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Header: Right side */}
                    <div className="flex items-center space-x-4">
                        <button onClick={toggleTheme} className="p-2 rounded-full text-secondary-500 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700">
                           {theme === 'dark' ? <SunIcon/> : <MoonIcon/>}
                        </button>
                        
                        <div className="relative">
                             <button
                                className="flex items-center space-x-2"
                                onClick={() => setProfileOpen(!profileOpen)}
                            >
                                <Avatar user={user} className="h-9 w-9" />
                                <div className="hidden md:block text-left">
                                    <span className="font-semibold text-sm">{user?.name}</span>
                                    <span className="block text-xs text-secondary-500">{user?.role}</span>
                                </div>
                            </button>
                            {profileOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-secondary-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <a href="#" className="block px-4 py-2 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700">Profile</a>
                                    <a href="#" className="block px-4 py-2 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700">Settings</a>
                                    <button
                                        onClick={logout}
                                        className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);


export default Header;