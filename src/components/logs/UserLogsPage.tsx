import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatDateTime } from '../../constants';
import Avatar from '../common/Avatar';

const UserLogsPage: React.FC = () => {
    const { logs, users } = useData();
    const [currentPage, setCurrentPage] = useState(1);
    const LOGS_PER_PAGE = 15;

    const userMap = new Map(users.map(u => [u.id, u]));

    const totalPages = Math.ceil(logs.length / LOGS_PER_PAGE);
    const paginatedLogs = logs.slice((currentPage - 1) * LOGS_PER_PAGE, currentPage * LOGS_PER_PAGE);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">User Activity Logs</h1>

             <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-secondary-500 dark:text-secondary-400">
                        <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Action</th>
                                <th className="px-6 py-3">Details</th>
                                <th className="px-6 py-3">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLogs.map(log => {
                                const user = userMap.get(log.userId);
                                return (
                                <tr key={log.id} className="border-b dark:border-secondary-700">
                                    <td className="px-6 py-4">
                                         <div className="flex items-center space-x-3">
                                            <Avatar user={user} className="w-8 h-8"/>
                                            <span className="font-medium text-secondary-900 dark:text-white">{log.userName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{log.action}</td>
                                    <td className="px-6 py-4">{log.details}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
                 {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4">
                        <span className="text-sm text-secondary-700 dark:text-secondary-400">Page {currentPage} of {totalPages}</span>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="pagination-btn">Prev</button>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="pagination-btn">Next</button>
                        </div>
                    </div>
                )}
            </div>
             <style>{`.pagination-btn { @apply px-3 py-1 text-sm rounded-md border dark:border-secondary-600 disabled:opacity-50; }`}</style>
        </div>
    );
};

export default UserLogsPage;
