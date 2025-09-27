import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
// FIX: Corrected import. DataProvider is now correctly exported from DataContext.
import { DataProvider } from './context/DataContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import LoginPage from './components/auth/LoginPage.tsx';
import RegisterPage from './components/auth/RegisterPage.tsx';
import Layout from './components/layout/Layout.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { SyncProvider } from './context/SyncContext.tsx';
import { PrintProvider, usePrint } from './context/PrintContext.tsx';
import PrintPreview from './components/common/PrintPreview.tsx';
import AccountSetupPage from './components/auth/AccountSetupPage.tsx';

type AuthView = 'login' | 'register';

const AppContent: React.FC = () => {
    const { user, profileSetupNeeded } = useAuth();
    const [authView, setAuthView] = useState<AuthView>('login');
    const { isPrinting } = usePrint();

    if (!user) {
        if (authView === 'login') {
            return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
        }
        return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }

    if (profileSetupNeeded) {
        return <AccountSetupPage />;
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
