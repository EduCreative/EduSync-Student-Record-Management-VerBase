import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EduSyncLogo } from '../../constants';

interface RequestPasswordResetPageProps {
    onSwitchToLogin: () => void;
}

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const RequestPasswordResetPage: React.FC<RequestPasswordResetPageProps> = ({ onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { sendPasswordResetEmail } = useAuth();

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { success: reqSuccess, error: reqError } = await sendPasswordResetEmail(email);
        if (reqSuccess) {
            setSuccess(true);
        } else {
            setError(reqError || 'Failed to send reset email. Please try again.');
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-screen w-full auth-gradient-bg flex items-center justify-center p-4 text-white">
                <div className="w-full max-w-md bg-black/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 sm:p-10 text-center animate-in">
                    <h1 className="text-2xl font-bold">Check your inbox</h1>
                    <p className="text-primary-200 mt-4">
                        We have sent password recovery instructions to your email: <strong>{email}</strong>
                    </p>
                    <button onClick={onSwitchToLogin} className="mt-6 w-full bg-white text-primary-800 font-bold py-3 px-4 rounded-lg hover:bg-primary-100 transition-colors active:scale-95">
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen w-full auth-gradient-bg flex items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-md bg-black/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 sm:p-10 animate-in">
                <div className="mb-8 text-center">
                    <EduSyncLogo className="h-12 w-12 text-white mx-auto mb-4" />
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Forgot Password?
                    </h2>
                    <p className="text-primary-200 mt-2">
                        Enter your email and we'll send you instructions to reset your password.
                    </p>
                </div>

                {error && <div className="bg-red-500/30 border border-red-500/50 text-white p-4 mb-6 rounded-md" role="alert">{error}</div>}

                <form onSubmit={handleRequestReset} className="space-y-6">
                    <div>
                        <label className="block text-primary-200 text-sm font-bold mb-2" htmlFor="email">Email Address</label>
                        <div className="relative">
                            <MailIcon className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-3 text-primary-200/80"/>
                            <input
                                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="input-auth"
                                placeholder="you@example.com" required
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-white text-primary-800 font-bold py-3 px-4 rounded-lg hover:bg-primary-100 transition-colors duration-300 disabled:opacity-50 active:scale-95">
                        {loading ? 'Sending...' : 'Send Reset Instructions'}
                    </button>
                </form>
                <p className="text-center text-primary-200 text-sm mt-8">
                    Remember your password?{' '}
                    <button onClick={onSwitchToLogin} className="font-semibold text-white hover:underline">
                        Sign In
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RequestPasswordResetPage;