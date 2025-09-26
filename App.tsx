
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
// FIX: Corrected import. DataProvider is now correctly exported from DataContext.
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import Layout from './components/layout/Layout';
import { ToastProvider } from './context/ToastContext';
import { SyncProvider } from './context/SyncContext';
import { PrintProvider, usePrint } from './context/PrintContext';
import PrintPreview from './components/common/PrintPreview';

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
            <SyncProvider>
                <ToastProvider>
                    <DataProvider>
                        <PrintProvider>
                            <AppContent />
                        </PrintProvider>
                    </DataProvider>
                </ToastProvider>
            </SyncProvider>
        </AuthProvider>
    </ThemeProvider>
  );
};

export default App;