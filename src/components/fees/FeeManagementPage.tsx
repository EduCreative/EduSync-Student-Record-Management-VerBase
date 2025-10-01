import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import FeeHeadsManagement from './FeeHeadsManagement';
import FeeCollectionPage from './FeeCollectionPage';
import ChallanGenerationPage from './ChallanGenerationPage';


const FeeManagementPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('collection');

    if (!user) return null;
    
    const tabs = [
        { id: 'collection', label: 'Fee Collection' },
        { id: 'generation', label: 'Challan Generation' },
        { id: 'heads', label: 'Fee Heads' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Fee Management</h1>
            
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                <div className="border-b border-secondary-200 dark:border-secondary-700">
                    <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
                        {tabs.map(tab => (
                             <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${
                                    activeTab === tab.id
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-secondary-400 dark:hover:text-secondary-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div>
                    {activeTab === 'collection' && <FeeCollectionPage />}
                    {activeTab === 'generation' && <ChallanGenerationPage />}
                    {activeTab === 'heads' && <FeeHeadsManagement />}
                </div>
            </div>
        </div>
    );
};

export default FeeManagementPage;