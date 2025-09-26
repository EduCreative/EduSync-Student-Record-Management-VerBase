
import React from 'react';
import { UserRole } from './types';

// FIX: Converted all JSX to React.createElement calls to make the file valid TypeScript without changing its extension to .tsx. This resolves errors from attempting to parse JSX in a .ts file.

function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('rect', { width: "7", height: "9", x: "3", y: "3", rx: "1" }),
    React.createElement('rect', { width: "7", height: "5", x: "14", y: "3", rx: "1" }),
    React.createElement('rect', { width: "7", height: "9", x: "14", y: "12", rx: "1" }),
    React.createElement('rect', { width: "7", height: "5", x: "3", y: "16", rx: "1" })
  );
}

function SchoolIcon(props: React.SVGProps<SVGSVGElement>) {
  return React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('path', { d: "m4 6 8-4 8 4" }),
    React.createElement('path', { d: "m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" }),
    React.createElement('path', { d: "M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" }),
    React.createElement('path', { d: "M18 5v17" }),
    React.createElement('path', { d: "M6 5v17" }),
    React.createElement('circle', { cx: "12", cy: "9", r: "2" })
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('path', { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
    React.createElement('circle', { cx: "9", cy: "7", r: "4" }),
    React.createElement('path', { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
    React.createElement('path', { d: "M16 3.13a4 4 0 0 1 0 7.75" })
  );
}

function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
    return React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        React.createElement('path', { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }),
        React.createElement('circle', { cx: "12", cy: "12", r: "3" })
    );
}

function DollarSignIcon(props: React.SVGProps<SVGSVGElement>) {
    return React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        React.createElement('line', { x1: "12", x2: "12", y1: "2", y2: "22" }),
        React.createElement('path', { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" })
    );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
    return React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        React.createElement('path', { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
        React.createElement('polyline', { points: "22 4 12 14.01 9 11.01" })
    );
}

function BarChartIcon(props: React.SVGProps<SVGSVGElement>) {
    return React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        React.createElement('line', { x1: "12", x2: "12", y1: "20", y2: "10" }),
        React.createElement('line', { x1: "18", x2: "18", y1: "20", y2: "4" }),
        React.createElement('line', { x1: "6", x2: "6", y1: "20", y2: "16" })
    );
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
    return React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        React.createElement('path', { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }),
        React.createElement('polyline', { points: "14 2 14 8 20 8" }),
        React.createElement('line', { x1: "16", x2: "8", y1: "13", y2: "13" }),
        React.createElement('line', { x1: "16", x2: "8", y1: "17", y2: "17" }),
        React.createElement('line', { x1: "10", x2: "8", y1: "9", y2: "9" })
    );
}

function EditIcon(props: React.SVGProps<SVGSVGElement>) {
    return React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        React.createElement('path', { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }),
        React.createElement('path', { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })
    );
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
    return React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        React.createElement('path', { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }),
        React.createElement('path', { d: "M13.73 21a2 2 0 0 1-3.46 0" })
    );
}

function FileCheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        React.createElement('path', { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }),
        React.createElement('polyline', { points: "14 2 14 8 20 8" }),
        React.createElement('path', { d: "m9 15 2 2 4-4" })
    );
}

export function PrinterIcon(props: React.SVGProps<SVGSVGElement>) {
    return React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        React.createElement('polyline', { points: "6 9 6 2 18 2 18 9" }),
        React.createElement('path', { d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }),
        React.createElement('rect', { width: "12", height: "8", x: "6", y: "14" })
    );
}

export function BookKeyIcon(props: React.SVGProps<SVGSVGElement>) {
    return React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"},
        React.createElement('path', { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" }),
        React.createElement('circle', { cx: "12", cy: "12", r: "2" }),
        React.createElement('path', { d: "m14 12-2 2" }),
        React.createElement('path', { d: "m12 10 2 2" })
    );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
    return React.createElement('svg', { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        React.createElement('rect', { width: "18", height: "18", x: "3", y: "4", rx: "2", ry: "2" }),
        React.createElement('line', { x1: "16", x2: "16", y1: "2", y2: "6" }),
        React.createElement('line', { x1: "8", x2: "8", y1: "2", y2: "6" }),
        React.createElement('line', { x1: "3", x2: "21", y1: "10", y2: "10" })
    );
}

// FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error in a .ts file.
export const NAV_LINKS: Record<UserRole, { name: string; path: string; icon: React.ReactElement }[]> = {
    [UserRole.Owner]: [
        { name: 'Overview', path: '/overview', icon: React.createElement(DashboardIcon) },
        { name: 'Schools', path: '/schools', icon: React.createElement(SchoolIcon) },
        { name: 'Users', path: '/users', icon: React.createElement(UsersIcon) },
        { name: 'Settings', path: '/settings', icon: React.createElement(SettingsIcon) },
    ],
    [UserRole.Admin]: [
        { name: 'Dashboard', path: '/dashboard', icon: React.createElement(DashboardIcon) },
        { name: 'Students', path: '/students', icon: React.createElement(UsersIcon) },
        { name: 'Users', path: '/users', icon: React.createElement(UsersIcon) },
        { name: 'Fee Management', path: '/fees', icon: React.createElement(DollarSignIcon) },
        { name: 'Reports', path: '/reports', icon: React.createElement(BarChartIcon) },
        { name: 'Attendance', path: '/attendance', icon: React.createElement(CheckCircleIcon) },
        { name: 'Results', path: '/results', icon: React.createElement(BarChartIcon) },
        { name: 'Calendar', path: '/calendar', icon: React.createElement(CalendarIcon) },
        { name: 'User Logs', path: '/logs', icon: React.createElement(FileCheckIcon) },
        { name: 'Settings', path: '/settings', icon: React.createElement(SettingsIcon) },
    ],
    [UserRole.Accountant]: [
        { name: 'Dashboard', path: '/dashboard', icon: React.createElement(DashboardIcon) },
        { name: 'Fee Management', path: '/fees', icon: React.createElement(DollarSignIcon) },
        { name: 'Reports', path: '/reports', icon: React.createElement(BarChartIcon) },
        { name: 'Students', path: '/students', icon: React.createElement(UsersIcon) },
    ],
    [UserRole.Teacher]: [
        { name: 'Dashboard', path: '/dashboard', icon: React.createElement(DashboardIcon) },
        { name: 'My Classes', path: '/classes', icon: React.createElement(SchoolIcon) },
        { name: 'Attendance', path: '/attendance', icon: React.createElement(CheckCircleIcon) },
        { name: 'Enter Results', path: '/results', icon: React.createElement(EditIcon) },
        { name: 'Students', path: '/students', icon: React.createElement(UsersIcon) },
        { name: 'Calendar', path: '/calendar', icon: React.createElement(CalendarIcon) },
    ],
    [UserRole.Parent]: [
        { name: 'My Children', path: '/children', icon: React.createElement(UsersIcon) },
        { name: 'Fee Status', path: '/fees', icon: React.createElement(DollarSignIcon) },
        { name: 'Attendance', path: '/attendance', icon: React.createElement(CheckCircleIcon) },
        { name: 'Results', path: '/results', icon: React.createElement(BarChartIcon) },
        { name: 'Calendar', path: '/calendar', icon: React.createElement(CalendarIcon) },
        { name: 'Announcements', path: '/announcements', icon: React.createElement(BellIcon) },
    ],
    [UserRole.Student]: [
        { name: 'Dashboard', path: '/dashboard', icon: React.createElement(DashboardIcon) },
        { name: 'My Attendance', path: '/attendance', icon: React.createElement(CheckCircleIcon) },
        { name: 'My Results', path: '/results', icon: React.createElement(BarChartIcon) },
        { name: 'Fee Status', path: '/fees', icon: React.createElement(DollarSignIcon) },
        { name: 'Calendar', path: '/calendar', icon: React.createElement(CalendarIcon) },
    ],
};

export const formatDate = (dateString?: string | Date): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options).replace(/ /g, '-');
    } catch (error) {
        return 'Invalid Date';
    }
};

export const formatDateTime = (isoString?: string): string => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        const datePart = formatDate(date);
        const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return `${datePart}, ${time}`;
    } catch (error) {
        return 'Invalid Date';
    }
};