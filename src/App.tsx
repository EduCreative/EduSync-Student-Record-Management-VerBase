

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import Layout from './components/layout/Layout';
import { ToastProvider } from './context/ToastContext';
import { SyncProvider } from './context/SyncContext';
import { PrintProvider, usePrint } from './context/PrintContext';
// FIX: Import PrintPreview component to resolve 'Cannot find name' error.
import PrintPreview from './components/common/PrintPreview';
import { NotificationProvider } from './context/NotificationContext';

type AuthView = 'login' | 'register';

const AppContent: React.FC = () => {
    const { user } = useAuth();
    const [authView, setAuthView] = useState<AuthView>('login');
    const { isPrinting } = usePrint();

    if (!user) {
        if (authView === 'login') {
            return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
        }
        return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }

    return (
        <>
            {isPrinting && <PrintPreview />}
            <div className={isPrinting ? 'no-print' : ''}>
                <Layout />
            </div>
        </>
    );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
        <AuthProvider>
            <NotificationProvider>
                <SyncProvider>
                    <ToastProvider>
                        <DataProvider>
                            <PrintProvider>
                                <AppContent />
                            </PrintProvider>
                        </DataProvider>
                    </ToastProvider>
                </SyncProvider>
            </NotificationProvider>
        </AuthProvider>
    </ThemeProvider>
  );
};

export default App;