import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';
import { ActiveView } from './Layout';
import Avatar from '../common/Avatar';
import { EduSyncLogo, formatDateTime } from '../../constants';
import { useNotification } from '../../context/NotificationContext';

const BellIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;

const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const clickHandler = ({ target }: MouseEvent) => {
            if (dropdownRef.current && isOpen && !dropdownRef.current.contains(target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', clickHandler);
        return () => document.removeEventListener('click', clickHandler);
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(prev => !prev); }}
                className="relative p-2 rounded-full text-secondary-500 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700"
            >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] items-center justify-center">
                            {unreadCount}
                        </span>
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 max-h-[70vh] flex flex-col rounded-md shadow-lg bg-white dark:bg-secondary-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="flex justify-between items-center p-3 border-b dark:border-secondary-700">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        <button onClick={markAllAsRead} className="text-xs text-primary-600 hover:underline disabled:text-secondary-400" disabled={unreadCount === 0}>
                            Mark all as read
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <button
                                    key={notif.id}
                                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                                    className="w-full text-left flex items-start gap-3 px-3 py-2.5 hover:bg-secondary-50 dark:hover:bg-secondary-700/50"
                                >
                                    {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>}
                                    <div className={`flex-1 ${notif.isRead ? 'pl-5' : ''}`}>
                                        <p className={`text-sm ${notif.isRead ? 'text-secondary-500' : 'text-secondary-800 dark:text-secondary-100'}`}>{notif.message}</p>
                                        <p className="text-xs text-secondary-400 mt-1">{formatDateTime(notif.timestamp)}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-secondary-500 text-center p-8">You have no notifications.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


interface HeaderProps {
    setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveView: (view: ActiveView) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen, setActiveView }) => {
    const { user, logout, activeSchoolId, switchSchoolContext } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { schools, getSchoolById } = useData();
    const [profileOpen, setProfileOpen] = useState(false);
    const [schoolSwitcherOpen, setSchoolSwitcherOpen] = useState(false);

    const profileDropdownRef = useRef<HTMLDivElement>(null);
    const schoolSwitcherRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const clickHandler = ({ target }: MouseEvent) => {
            if (profileDropdownRef.current && profileOpen && !profileDropdownRef.current.contains(target as Node)) {
                setProfileOpen(false);
            }
            if (schoolSwitcherRef.current && schoolSwitcherOpen && !schoolSwitcherRef.current.contains(target as Node)) {
                setSchoolSwitcherOpen(false);
            }
        };
        document.addEventListener('click', clickHandler);
        return () => document.removeEventListener('click', clickHandler);
    }, [profileOpen, schoolSwitcherOpen]);

    const displaySchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
    const school = user ? getSchoolById(displaySchoolId as string) : null;
    
    const handleReturnToOwnerView = () => {
        switchSchoolContext(null);
        setActiveView({ view: 'overview' });
    };

    const handleSchoolSelect = (schoolId: string) => {
        switchSchoolContext(schoolId);
        setActiveView({ view: 'dashboard' });
        setSchoolSwitcherOpen(false);
    };

    return (
        <header className="sticky top-0 bg-white/70 dark:bg-secondary-800/70 backdrop-blur-lg border-b border-secondary-200/50 dark:border-secondary-700/50 z-30 no-print">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 -mb-px">
                    {/* Header: Left side */}
                    <div className="flex items-center">
                        {/* Hamburger button */}
                        <button
                            className="text-secondary-500 hover:text-secondary-600 lg:hidden"
                            aria-controls="sidebar"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSidebarOpen((old) => !old);
                            }}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <rect x="4" y="5" width="16" height="2" />
                                <rect x="4" y="11" width="16" height="2" />
                                <rect x="4" y="17" width="16" height="2" />
                            </svg>
                        </button>
                        <div className="hidden lg:flex items-center ml-4 space-x-3">
                           {user?.role === UserRole.Owner ? (
                                activeSchoolId ? (
                                    <>
                                        {school?.logoUrl ? (
                                            <img src={school.logoUrl} alt={`${school.name} Logo`} className="h-9 w-auto max-w-[100px] object-contain" />
                                        ) : (
                                            <EduSyncLogo className="h-8 w-auto text-primary-600 dark:text-primary-400" />
                                        )}
                                        <h1 className="text-xl font-semibold">{school?.name}</h1>
                                        <button onClick={handleReturnToOwnerView} className="text-sm text-primary-600 hover:underline">
                                            &larr; Back to Owner View
                                        </button>
                                    </>
                                ) : (
                                    <div className="relative" ref={schoolSwitcherRef}>
                                        <button 
                                            className="flex items-center space-x-2 text-xl font-semibold text-secondary-800 dark:text-secondary-200"
                                            onClick={() => setSchoolSwitcherOpen(prev => !prev)}
                                        >
                                            <span>Owner Overview</span>
                                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${schoolSwitcherOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {schoolSwitcherOpen && (
                                            <div className="origin-top-left absolute left-0 mt-2 w-64 rounded-md shadow-lg py-1 bg-white dark:bg-secondary-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                <div className="px-4 py-2 text-xs text-secondary-500 uppercase font-semibold">Switch School View</div>
                                                {schools.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => handleSchoolSelect(s.id)}
                                                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                                                    >
                                                        {s.logoUrl ? <img src={s.logoUrl} alt={`${s.name} logo`} className="w-6 h-6 object-contain rounded-sm bg-white" /> : <div className="w-6 h-6 bg-secondary-200 dark:bg-secondary-700 rounded-sm flex items-center justify-center text-xs">?</div>}
                                                        <span>{s.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            ) : (
                                <>
                                    {school?.logoUrl ? (
                                        <img src={school.logoUrl} alt={`${school.name} Logo`} className="h-9 w-auto max-w-[100px] object-contain" />
                                     ) : (
                                        <EduSyncLogo className="h-8 w-auto text-primary-600 dark:text-primary-400" />
                                    )}
                                    <h1 className="text-xl font-semibold">{school?.name || 'EduSync'}</h1>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Header: Right side */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <button onClick={toggleTheme} className="p-2 rounded-full text-secondary-500 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700">
                           {theme === 'dark' ? <SunIcon/> : <MoonIcon/>}
                        </button>
                        
                        <NotificationBell />
                        
                        <div className="relative" ref={profileDropdownRef}>
                             <button
                                className="flex items-center space-x-2"
                                onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}
                            >
                                <Avatar user={user} className="h-9 w-9" />
                                <div className="hidden md:block text-left">
                                    <span className="font-semibold text-sm">{user?.name}</span>
                                    <span className="block text-xs text-secondary-500">{user?.role}</span>
                                </div>
                            </button>
                            {profileOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-secondary-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <button
                                        onClick={() => {
                                            setActiveView({ view: 'userProfile' });
                                            setProfileOpen(false);
                                        }}
                                        className="w-full text-left block px-4 py-2 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                                    >
                                        My Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveView({ view: 'settings' });
                                            setProfileOpen(false);
                                        }}
                                        className="w-full text-left block px-4 py-2 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                                    >
                                        Settings
                                    </button>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setProfileOpen(false);
                                        }}
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

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);


export default Header;
