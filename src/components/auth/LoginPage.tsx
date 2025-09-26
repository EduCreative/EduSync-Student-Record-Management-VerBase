
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
    onSwitchToRegister: () => void;
}

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const LockIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
);

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 2.04-4.82 2.04-5.82 0-9.6-4.82-9.6-9.6s3.78-9.6 9.6-9.6c2.53 0 4.46.93 5.96 2.33l2.04-2.04C18.96 1.82 16.11 0 12.48 0 5.82 0 .06 5.82.06 12.48s5.76 12.48 12.42 12.48c3.32 0 6.02-1.12 7.99-3.1 2.08-2.08 2.84-5.04 2.84-8.32 0-.66-.07-1.32-.2-1.98z" />
    </svg>
);

const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
);

const GraduationCapIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c0 1.66 10 1.66 10 0v-5"/>
    </svg>
);


const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const { success, error: loginError } = await login(email, password);
        if (!success) {
            setError(loginError || 'Invalid email or password. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen w-full bg-white dark:bg-secondary-950 lg:grid lg:grid-cols-2">
            <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-primary-600 to-indigo-800 p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M40 0V80M0 40H80" stroke="white" strokeWidth="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/></svg>
                </div>
                <div className="relative z-10 text-center space-y-6">
                    <div className="bg-white/20 p-4 rounded-full inline-block backdrop-blur-sm">
                        <GraduationCapIcon className="h-16 w-16 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight">
                        Welcome to EduSync
                    </h2>
                    <p className="mt-4 text-lg text-primary-200 max-w-md mx-auto">
                        The all-in-one solution for modern school management.
                    </p>
                </div>
                <div className="absolute bottom-8 text-sm text-primary-300 z-10">
                    &copy; {new Date().getFullYear()} EduSync. All rights reserved.
                </div>
            </div>
            <div className="flex items-center justify-center p-6 sm:p-12 w-full lg:py-0">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white">
                            Sign In
                        </h2>
                        <p className="text-secondary-500 dark:text-secondary-400 mt-2">
                            Enter your credentials to access your account.
                        </p>
                    </div>

                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">{error}</div>}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-secondary-700 dark:text-secondary-300 text-sm font-bold mb-2" htmlFor="email">Email Address</label>
                            <div className="relative">
                                <MailIcon className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-3 text-secondary-400"/>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 appearance-none border rounded-lg w-full py-3 px-4 text-secondary-700 dark:text-secondary-200 bg-secondary-50 dark:bg-secondary-800 border-secondary-300 dark:border-secondary-600 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="you@example.com"
                                    required
                                    aria-label="Email Address"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-secondary-700 dark:text-secondary-300 text-sm font-bold mb-2" htmlFor="password">Password</label>
                            <div className="relative">
                                <LockIcon className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-3 text-secondary-400"/>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 appearance-none border rounded-lg w-full py-3 px-4 text-secondary-700 dark:text-secondary-200 bg-secondary-50 dark:bg-secondary-800 border-secondary-300 dark:border-secondary-600 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="••••••••••••"
                                    required
                                    aria-label="Password"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    {showPassword ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-secondary-600 dark:text-secondary-400 cursor-pointer">
                                <input 
                                    className="form-checkbox h-4 w-4 text-primary-600 rounded border-secondary-300 dark:border-secondary-600 focus:ring-primary-500 bg-secondary-50 dark:bg-secondary-800"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="ml-2">Remember me</span>
                            </label>
                            <a href="#" className="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-secondary-950 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? <SpinnerIcon /> : 'Sign In'}
                        </button>
                    </form>

                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-secondary-200 dark:border-secondary-700"></div>
                        <span className="flex-shrink mx-4 text-xs text-secondary-500 dark:text-secondary-400 uppercase">Or</span>
                        <div className="flex-grow border-t border-secondary-200 dark:border-secondary-700"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-secondary-300 dark:border-secondary-600 rounded-lg text-sm font-medium text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition">
                            <GoogleIcon className="w-5 h-5" /> Google
                        </button>
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-secondary-300 dark:border-secondary-600 rounded-lg text-sm font-medium text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition">
                            <PhoneIcon className="w-5 h-5" /> Phone
                        </button>
                    </div>

                    <p className="text-center text-secondary-500 dark:text-secondary-400 text-sm mt-8">
                        Don't have an account?{' '}
                        <button onClick={onSwitchToRegister} className="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                            Sign up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

const SpinnerIcon = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export default LoginPage;
