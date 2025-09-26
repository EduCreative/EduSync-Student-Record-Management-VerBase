
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

interface SyncContextType {
    lastSyncTime: string | null;
    updateSyncTime: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

    useEffect(() => {
        const storedTime = localStorage.getItem('lastSyncTime');
        if (storedTime) {
            setLastSyncTime(storedTime);
        }
    }, []);

    const updateSyncTime = useCallback(() => {
        const newSyncTime = new Date().toISOString();
        setLastSyncTime(newSyncTime);
        localStorage.setItem('lastSyncTime', newSyncTime);
    }, []);

    return (
        <SyncContext.Provider value={{ lastSyncTime, updateSyncTime }}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = (): SyncContextType => {
    const context = useContext(SyncContext);
    if (!context) {
        throw new Error('useSync must be used within a SyncProvider');
    }
    return context;
};
