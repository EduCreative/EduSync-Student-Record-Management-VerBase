import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';

const AccountSetupPage: React.FC = () => {
    const { user, completeProfileSetup } = useAuth();
    const [name, setName] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.Owner); // Default to Owner for first setup
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('Please enter your full name.');
            return;
        }
        setLoading(true);
        const { success, error: setupError } = await completeProfileSetup(name, role);
        if (!success) {
            setError(setupError || 'An unknown error occurred.');
        }
        // On success, the AuthProvider will update the state and the app will re-render to the dashboard.
        setLoading(false);
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-primary-700 to-indigo-900 text-white flex flex-col justify-center items-center p-4 relative">
             <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M40 0V80M0 40H80" stroke="white" strokeWidth="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/></svg>
            </div>
            <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 sm:p-10 z-10">
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">Account Setup</h1>
                    <p className="text-primary-200 mt-2">
                        Welcome, {user?.email}! Let's finish setting up your profile.
                    </p>
                </div>

                {error && <div className="bg-red-500/30 border border-red-500/50 text-white p-4 mb-6 rounded-md" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-primary-200 text-sm font-bold mb-2" htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-auth"
                            placeholder="e.g., John Doe"
                            required
                        />
                    </div>
                     <div>
                        <label className="block text-primary-200 text-sm font-bold mb-2" htmlFor="role">What is your primary role?</label>
                        <select 
                            id="role" 
                            value={role} 
                            onChange={(e) => setRole(e.target.value as UserRole)} 
                            className="input-auth"
                        >
                            <option value={UserRole.Owner}>I am the School Owner / Super Admin</option>
                            <option value={UserRole.Admin}>I am a School Administrator</option>
                            <option value={UserRole.Teacher}>I am a Teacher</option>
                            <option value={UserRole.Parent}>I am a Parent</option>
                            <option value={UserRole.Student}>I am a Student</option>
                        </select>
                    </div>
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-primary-700 font-bold py-3 px-4 rounded-lg hover:bg-primary-100 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                             {loading ? <SpinnerIcon /> : 'Complete Setup'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`.input-auth {
                @apply appearance-none border rounded-lg w-full py-3 px-4 bg-white/20 text-white placeholder-primary-200/70 border-white/30 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-400;
            }`}</style>
        </div>
    );
};

const SpinnerIcon = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default AccountSetupPage;
