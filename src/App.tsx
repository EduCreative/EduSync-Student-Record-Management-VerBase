


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
import PrintPreview from './components/common/PrintPreview';
import { NotificationProvider } from './context/NotificationContext';
import RequestPasswordResetPage from './components/auth/RequestPasswordResetPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';

type AuthView = 'login' | 'register' | 'requestReset';

const AppContent: React.FC = () => {
    const { user, authEvent } = useAuth();
    const [authView, setAuthView] = useState<AuthView>('login');
    const { isPrinting } = usePrint();

    if (user && authEvent === 'PASSWORD_RECOVERY') {
        return <ResetPasswordPage onResetSuccess={() => setAuthView('login')} />;
    }

    if (!user) {
        switch (authView) {
            case 'login':
                return <LoginPage onSwitchToRegister={() => setAuthView('register')} onForgotPassword={() => setAuthView('requestReset')} />;
            case 'register':
                return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
            case 'requestReset':
                return <RequestPasswordResetPage onSwitchToLogin={() => setAuthView('login')} />;
            default:
                 return <LoginPage onSwitchToRegister={() => setAuthView('register')} onForgotPassword={() => setAuthView('requestReset')} />;
        }
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