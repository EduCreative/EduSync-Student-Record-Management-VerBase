
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';
import { Session } from '@supabase/supabase-js';


interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    register: (name: string, email: string, pass: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
    activeSchoolId: string | null;
    switchSchoolContext: (schoolId: string | null) => void;
    effectiveRole: UserRole | null;
    profileSetupNeeded: boolean;
    completeProfileSetup: (name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);
    const [profileSetupNeeded, setProfileSetupNeeded] = useState(false);
    const [tempSession, setTempSession] = useState<Session | null>(null);

    const fetchUserProfile = async (session: Session | null) => {
        setProfileSetupNeeded(false);
        setTempSession(null);

        if (session?.user) {
            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                // The error check handles cases where .single() fails because no rows are found
                if (profile) {
                    setUser(profile as User);
                } else {
                    console.warn("User profile not found. Initiating setup.");
                    setUser({ id: session.user.id, email: session.user.email } as User); // Set a partial user for context
                    setProfileSetupNeeded(true);
                    setTempSession(session);
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                setUser(null);
            }
        } else {
            setUser(null);
        }
    };

    useEffect(() => {
        const fetchInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            await fetchUserProfile(session);
            setLoading(false);
        };

        fetchInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            await fetchUserProfile(session);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);
    
    const completeProfileSetup = async (name: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
        if (!tempSession?.user?.email) {
            return { success: false, error: 'No active session found.' };
        }
        
        const { error } = await supabase.from('profiles').insert({
            id: tempSession.user.id,
            name,
            email: tempSession.user.email,
            role,
            school_id: null,
            status: 'Active',
        });

        if (error) {
            console.error("Failed to create user profile:", error.message);
            return { success: false, error: "Could not create your user profile. Please try again or contact support." };
        }

        await fetchUserProfile(tempSession);
        return { success: true };
    };

    const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setActiveSchoolId(null);
    };

    const register = async (name: string, email: string, pass: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: pass,
        });

        if (signUpError) {
            return { success: false, error: signUpError.message };
        }

        if (authData.user) {
            // FIX: Owners are approved automatically, while other roles require admin approval.
            const userStatus = role === UserRole.Owner ? 'Active' : 'Pending Approval';
            const { error: profileError } = await supabase.from('profiles').insert({
                id: authData.user.id,
                name,
                email,
                role,
                school_id: null, // An owner will create their school later.
                status: userStatus,
            });

            if (profileError) {
                console.error("Failed to create user profile:", profileError.message);
                return { success: false, error: "Could not create your user profile. Please contact support." };
            }
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
        <AuthContext.Provider value={{ user, login, logout, register, activeSchoolId, switchSchoolContext, effectiveRole, profileSetupNeeded, completeProfileSetup }}>
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
