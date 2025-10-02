import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NAV_LINKS, formatDateTime, EduSyncLogo } from '../../constants';
import { ActiveView } from './Layout';
import { UserRole } from '../../types';
import { version } from '../../../package.json';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    activeView: ActiveView;
    setActiveView: (view: ActiveView) => void;
    effectiveRole: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, activeView, setActiveView, effectiveRole }) => {
    const { user } = useAuth();
    const sidebar = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const clickHandler = ({ target }: MouseEvent) => {
            if (!sidebar.current || !target) return;
            if (!sidebarOpen || sidebar.current.contains(target as Node)) return;
            setSidebarOpen(false);
        };
        document.addEventListener('click', clickHandler);
        return () => document.removeEventListener('click', clickHandler);
    }, [sidebarOpen, setSidebarOpen]);

    const navLinksForRole = user ? NAV_LINKS[effectiveRole] : [];
    // Filter links based on the user's specific disabledNavLinks property
    const visibleNavLinks = navLinksForRole.filter(link => !user?.disabledNavLinks?.includes(link.path));

    const handleLinkClick = (path: string) => {
        const viewName = path.substring(1); // remove leading '/'
        setActiveView({ view: viewName });
        setSidebarOpen(false);
    };

    return (
        <div className="no-print">
            {/* Sidebar backdrop (mobile) */}
            <div className={`fixed inset-0 bg-secondary-900 bg-opacity-30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden="true"></div>

            <div
                ref={sidebar}
                className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-screen overflow-y-auto w-64 lg:w-20 lg:hover:w-64 shrink-0 bg-primary-800 dark:bg-secondary-900 p-4 transition-all duration-300 ease-in-out group ${sidebarOpen ? 'translate-x-0' : '-translate-x-64'}`}
            >
                {/* Sidebar header */}
                <div className="flex justify-between mb-10 pr-3 sm:px-2">
                     <a href="/" className="flex items-center space-x-2">
                        <EduSyncLogo className="w-8 h-8 text-white" />
                        <h1 className="text-2xl font-bold text-white lg:opacity-0 group-hover:opacity-100 transition-opacity duration-200">EduSync</h1>
                    </a>
                </div>

                {/* Links */}
                <div className="space-y-2">
                    {visibleNavLinks.map((link) => {
                        const viewName = link.path.substring(1);
                        const isActive = activeView.view === viewName;
                        return (
                            <button
                                key={link.name}
                                onClick={() => handleLinkClick(link.path)}
                                className={`w-full flex items-center p-2 rounded-lg transition-colors group ${isActive ? 'bg-primary-600 text-white dark:bg-primary-700' : 'text-secondary-200 hover:bg-primary-700 dark:hover:bg-secondary-700'}`}
                            >
                                {React.cloneElement(link.icon as React.ReactElement<any>, { className: "w-6 h-6 shrink-0" })}
                                <span className="ml-3 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-200">{link.name}</span>
                            </button>
                        );
                    })}
                </div>

                 <div className="mt-auto pt-4">
                    <div className="p-4 rounded-lg bg-primary-700 bg-opacity-50 dark:bg-secondary-800 dark:bg-opacity-50 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <p className="text-center text-xs text-secondary-400">
                            Version {version}
                        </p>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default Sidebar;