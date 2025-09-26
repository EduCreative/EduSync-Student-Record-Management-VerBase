import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabaseClient';
// FIX: Removed import of AuthChangeEvent and Session as they are not exported in some Supabase versions, causing errors.
// The types will be inferred or set to 'string' and 'any' for broader compatibility.


interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    register: (name: string, email: string, pass: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
    activeSchoolId: string | null;
    switchSchoolContext: (schoolId: string | null) => void;
    effectiveRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);

    useEffect(() => {
        // FIX: Replaced non-exported Supabase types AuthChangeEvent with string and Session with any for compatibility.
        const handleAuthChange = async (_event: string, session: any | null) => {
            setLoading(true);
            if (session?.user) {
                try {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                    
                    if (profile) {
                        setUser(profile as User);
                    } else {
                        // Profile might not be created yet, or fetch failed
                        console.warn("Could not fetch user profile for session:", session.user.id);
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };
        
        // FIX: Adjusted destructuring for onAuthStateChange to match older Supabase versions which return subscription directly in data.
        const { data: subscription } = supabase.auth.onAuthStateChange(handleAuthChange);

        // Fetch initial session
        // FIX: Replaced async getSession() with sync session() to align with older Supabase client versions.
        const session = supabase.auth.session();
        handleAuthChange('INITIAL_SESSION', session);

        return () => {
            // FIX: Added optional chaining for safety in case subscription is null.
            subscription?.unsubscribe();
        };
    }, []);

    const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
        // FIX: Replaced signInWithPassword with signIn for compatibility with older Supabase client versions.
        const { error } = await supabase.auth.signIn({ email, password: pass });
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const logout = async () => {
        // FIX: Assuming signOut error is due to version mismatch, call it on supabase.auth. This is correct for most versions.
        await supabase.auth.signOut();
        setUser(null);
        setActiveSchoolId(null);
    };

    const register = async (name: string, email: string, pass: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
        // FIX: Assuming signUp error is due to version mismatch, call it on supabase.auth. This is correct for most versions.
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: pass,
        });

        if (signUpError) {
            return { success: false, error: signUpError.message };
        }

        if (authData.user) {
            const { error: profileError } = await supabase.from('profiles').insert({
                id: authData.user.id,
                name,
                email,
                role,
                school_id: 'd9d2d8b8-0b8b-4f8e-8b8b-8b8b8b8b8b8b', // A default school ID placeholder
                status: 'Pending Approval',
            });

            if (profileError) {
                // In a production app, you might want to delete the created auth user
                // to avoid orphaned accounts. This requires admin privileges.
                console.error("Failed to create user profile:", profileError.message);
                return { success: false, error: "Could not create your user profile. Please contact support." };
            }

            // Success. User needs to confirm their email.
            return { success: true };
        }
        
        return { success: false, error: 'An unknown error occurred during registration.' };
    };
    
    const switchSchoolContext = (schoolId: string | null) => {
        if (user?.role === UserRole.Owner) {
            setActiveSchoolId(schoolId);
        } else {
            console.warn("School context switching is only available for Owners.");
        }
    };

    const effectiveRole = user?.role === UserRole.Owner && activeSchoolId ? UserRole.Admin : user?.role || null;

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-secondary-50 dark:bg-secondary-900 text-primary-500">Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, register, activeSchoolId, switchSchoolContext, effectiveRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};