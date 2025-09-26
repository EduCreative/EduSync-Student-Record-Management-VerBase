

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';

const ParentDashboard: React.FC = () => {
    const { user } = useAuth();
    const { students, classes } = useData();

    if (!user) return null;
    
    // Find children from the user's childStudentIds property.
    const myChildren = students.filter(s => user.childStudentIds?.includes(s.id));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Parent's Dashboard</h1>
                <p className="text-secondary-500 dark:text-secondary-400">Welcome, {user.name}. View your children's progress.</p>
            </div>

            <div className="space-y-6">
                 {myChildren.length > 0 ? (
                    myChildren.map(child => {
                        const childsClass = classes.find(c => c.id === child.classId);
                        return (
                            <div key={child.id} className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                                        <Avatar student={child} className="w-16 h-16" />
                                        <div>
                                            <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{child.name}</h2>
                                            <p className="text-secondary-500">{childsClass?.name}</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg">View Full Report</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                    <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                                        <p className="text-sm text-secondary-500 dark:text-secondary-400">Attendance</p>
                                        <p className="text-2xl font-bold text-green-600">98%</p>
                                    </div>
                                    <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                                        <p className="text-sm text-secondary-500 dark:text-secondary-400">Latest Result (Math)</p>
                                        <p className="text-2xl font-bold text-blue-600">A+</p>
                                    </div>
                                    <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                                        <p className="text-sm text-secondary-500 dark:text-secondary-400">Fee Status</p>
                                        <Badge color="green">Paid</Badge>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                 ) : (
                    <div className="bg-white dark:bg-secondary-800 p-8 rounded-xl shadow-lg text-center">
                        <h2 className="text-xl font-semibold mb-2">No Children Linked</h2>
                        <p className="text-secondary-500 dark:text-secondary-400">Please contact the school administration to link your children to your account.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParentDashboard;