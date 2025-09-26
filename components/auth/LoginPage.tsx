import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';

interface LoginPageProps {
    onSwitchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    // State to track the "Remember me" checkbox
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        // Supabase client handles session persistence by default via localStorage.
        // The rememberMe checkbox is now for UI purposes only.
        const { success, error: loginError } = await login(email, password);
        if (!success) {
            setError(loginError || 'Invalid email or password. Please try again.');
        }
        // On success, the AuthProvider will automatically handle the redirect.
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex flex-col justify-center items-center p-4">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-500 to-indigo-600 opacity-10 dark:opacity-20"></div>
            <div className="w-full max-w-md bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 transform transition-all hover:scale-[1.01]">
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400">EduSync</h1>
                    <p className="text-secondary-500 dark:text-secondary-400 mt-1 sm:mt-2">Welcome Back! Manage your school effortlessly.</p>
                </div>

                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="mb-4 relative">
                        <label className="block text-secondary-700 dark:text-secondary-300 text-sm font-bold mb-2" htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-secondary-700 dark:text-secondary-200 bg-secondary-100 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className="mb-5 sm:mb-6 relative">
                         <label className="block text-secondary-700 dark:text-secondary-300 text-sm font-bold mb-2" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-secondary-700 dark:text-secondary-200 bg-secondary-100 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="••••••••••••"
                            required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-sm leading-5">
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                     <div className="flex items-center justify-between mb-5 sm:mb-6 text-sm">
                        <label className="flex items-center text-secondary-600 dark:text-secondary-400">
                            <input 
                                className="form-checkbox h-4 w-4 text-primary-600 rounded" 
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span className="ml-2">Remember me</span>
                        </label>
                        <a href="#" className="font-bold text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 transition">Lost Password?</a>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                         {loading ? <SpinnerIcon /> : 'Sign In'}
                    </button>
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-secondary-300 dark:border-secondary-600"></div>
                    <span className="flex-shrink mx-4 text-secondary-500 dark:text-secondary-400">Or continue with</span>
                    <div className="flex-grow border-t border-secondary-300 dark:border-secondary-600"></div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button className="w-full flex items-center justify-center py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition">Google</button>
                    <button className="w-full flex items-center justify-center py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition">Phone</button>
                </div>

                <p className="text-center text-secondary-500 dark:text-secondary-400 text-sm mt-8">
                    Don't have an account?{' '}
                    <button onClick={onSwitchToRegister} className="font-bold text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 transition">
                        Register Now
                    </button>
                </p>
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