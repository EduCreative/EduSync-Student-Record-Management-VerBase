
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface RegisterPageProps {
    onSwitchToLogin: () => void;
}

const isValidEmail = (email: string): boolean => {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.Parent);
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState<{ name?: string; email?: string; password?: string }>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { register } = useAuth();

    const validate = () => {
        const newErrors: { name?: string; email?: string; password?: string } = {};
        if (!name.trim()) {
            newErrors.name = 'Full Name is required.';
        }
        if (!email.trim()) {
            newErrors.email = 'Email Address is required.';
        } else if (!isValidEmail(email)) {
            newErrors.email = 'Email address is invalid.';
        }
        if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters long.';
        }
        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!validate()) {
            return;
        }

        setLoading(true);
        const result = await register(name, email, password, role);
        if (!result.success) {
            setError(result.error || 'An error occurred during registration.');
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, field: keyof typeof formErrors) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex flex-col justify-center items-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 text-center">
                    <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Registration Successful!</h1>
                    <p className="text-secondary-600 dark:text-secondary-300 mt-4">
                        Please check your email inbox for a confirmation link to activate your account.
                    </p>
                    <button onClick={onSwitchToLogin} className="mt-6 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg">
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex flex-col justify-center items-center p-4">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-500 to-indigo-600 opacity-10 dark:opacity-20"></div>
            <div className="w-full max-w-md bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl p-6 sm:p-8 z-10">
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400">Create Account</h1>
                    <p className="text-secondary-500 dark:text-secondary-400 mt-1 sm:mt-2">Join the EduSync community.</p>
                </div>

                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">{error}</div>}

                <form onSubmit={handleRegister} noValidate>
                    <div className="mb-4">
                        <label className="block text-secondary-700 dark:text-secondary-300 text-sm font-bold mb-2" htmlFor="name">Full Name</label>
                        <input id="name" type="text" value={name} onChange={handleInputChange(setName, 'name')} className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 bg-secondary-100 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                        {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                    </div>
                    <div className="mb-4">
                        <label className="block text-secondary-700 dark:text-secondary-300 text-sm font-bold mb-2" htmlFor="email">Email</label>
                        <input id="email" type="email" value={email} onChange={handleInputChange(setEmail, 'email')} className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 bg-secondary-100 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                        {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                    </div>
                    <div className="mb-4">
                        <label className="block text-secondary-700 dark:text-secondary-300 text-sm font-bold mb-2" htmlFor="password">Password</label>
                        <input id="password" type="password" value={password} onChange={handleInputChange(setPassword, 'password')} className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 bg-secondary-100 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                         {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                    </div>
                     <div className="mb-5 sm:mb-6">
                        <label className="block text-secondary-700 dark:text-secondary-300 text-sm font-bold mb-2" htmlFor="role">I am a...</label>
                        <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 bg-secondary-100 dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value={UserRole.Parent}>Parent</option>
                            <option value={UserRole.Student}>Student</option>
                            <option value={UserRole.Teacher}>Teacher</option>
                        </select>
                    </div>
                    {role === UserRole.Parent && (
                        <div className="mb-5 sm:mb-6 p-4 bg-primary-50 dark:bg-secondary-700 rounded-lg">
                             <label className="block text-secondary-700 dark:text-secondary-300 text-sm font-bold mb-2" htmlFor="studentIds">Student ID(s)</label>
                             <input id="studentIds" type="text" placeholder="Enter your child's student ID" className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 bg-white dark:bg-secondary-600 border-secondary-300 dark:border-secondary-500 text-secondary-700 dark:text-secondary-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                             <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">Your account will be pending approval from the school admin.</p>
                        </div>
                    )}
                    <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                        {loading ? <SpinnerIcon /> : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-secondary-500 dark:text-secondary-400 text-sm mt-8">
                    Already have an account?{' '}
                    <button onClick={onSwitchToLogin} className="font-bold text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 transition">
                        Sign In
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


export default RegisterPage;
