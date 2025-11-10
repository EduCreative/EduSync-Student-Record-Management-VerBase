import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Permission, ROLE_PERMISSIONS } from '../permissions';
import { toCamelCase } from '../utils/caseConverter';
// FIX: AuthChangeEvent is not available in the assumed Supabase JS version.
// import type { AuthChangeEvent } from '@supabase/supabase-js';

// FIX: Removed local toCamelCase function to resolve conflict with the one imported from utils/caseConverter.

interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    register: (name: string, email: string, pass: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
    updateUserPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
    sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
    activeSchoolId: string | null;
    switchSchoolContext: (schoolId: string | null) => void;
    effectiveRole: UserRole | null;
    hasPermission: (permission: Permission) => boolean;
    // FIX: AuthChangeEvent is not available in the assumed Supabase JS version, using string instead.
    authEvent: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);
    // FIX: AuthChangeEvent is not available in the assumed Supabase JS version, using string instead.
    const [authEvent, setAuthEvent] = useState<string | null>(null);

    useEffect(() => {
        // This self-contained async function runs once to check the initial session state.
        // It's designed to be robust, using a try/catch/finally block to ensure
        // the loading state is always resolved.
        const checkInitialSession = async () => {
            try {
                // FIX: Cast to any to bypass type error for getSession.
                const { data: { session }, error: sessionError } = await (supabase.auth as any).getSession();
                if (sessionError) throw sessionError;

                // If there's no active session, we can stop here.
                if (!session?.user) {
                    setUser(null);
                    setActiveSchoolId(null);
                    return;
                }
                
                // If a session exists, fetch the user's profile.
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                // If fetching the profile fails or no profile is found, treat as logged out.
                if (profileError || !profile) {
                    console.error('Failed to fetch profile or profile not found:', profileError);
                    setUser(null);
                    setActiveSchoolId(null);
                    return;
                }

                // Happy path: Both session and profile are valid.
                const userProfile = toCamelCase(profile) as User;
                setUser(userProfile);
                if (userProfile.role !== UserRole.Owner) {
                    setActiveSchoolId(userProfile.schoolId);
                }
            } catch (error) {
                console.error("A critical error occurred during the initial auth check:", error);
                setUser(null);
                setActiveSchoolId(null);
            } finally {
                // CRITICAL: This block guarantees the loading state is set to false,
                // preventing the app from getting stuck on the "Loading..." screen.
                setLoading(false);
            }
        };
        
        checkInitialSession();

        // Set up a listener for real-time authentication state changes (e.g., login, logout).
        // FIX: Cast to any to bypass type error for onAuthStateChange.
        const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(async (event: string, session: any) => {
            setAuthEvent(event);
            if (event === 'SIGNED_IN' && session?.user) {
                 // On sign-in, re-fetch profile to ensure data is fresh.
                 const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                 if (profile) {
                    const userProfile = toCamelCase(profile) as User;
                    setUser(userProfile);
                    if (userProfile.role !== UserRole.Owner) {
                        setActiveSchoolId(userProfile.schoolId);
                    }
                 }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setActiveSchoolId(null);
            }
        });

        // Clean up the subscription when the component unmounts.
        return () => {
            subscription?.unsubscribe();
        };
    }, []);


    const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
        // FIX: Cast to any to bypass type error for signInWithPassword.
        const { data: signInData, error: signInError } = await (supabase.auth as any).signInWithPassword({
            email,
            password: pass,
        });
    
        if (signInError) {
            return { success: false, error: signInError.message };
        }
        
        if (signInData.user) {
            // After successful sign-in, check the profile status.
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('status')
                .eq('id', signInData.user.id)
                .single();
    
            if (profileError || !profile) {
                // FIX: Cast to any to bypass type error for signOut.
                await (supabase.auth as any).signOut();
                return { success: false, error: 'Could not find user profile. Please contact support.' };
            }
    
            if (profile.status === 'Pending Approval') {
                // FIX: Cast to any to bypass type error for signOut.
                await (supabase.auth as any).signOut();
                return { success: false, error: 'Your account is pending approval from an administrator.' };
            }
            
            if (profile.status === 'Suspended' || profile.status === 'Inactive') {
                // FIX: Cast to any to bypass type error for signOut.
                await (supabase.auth as any).signOut();
                return { success: false, error: 'Your account is inactive or has been suspended.' };
            }
        }
    
        // The onAuthStateChange listener will handle setting the user state for a valid user.
        return { success: true };
    };
    
    const logout = async () => {
        // FIX: Cast to any to bypass type error for signOut.
        await (supabase.auth as any).signOut();
        // A full page reload is the most robust way to ensure all states are cleared
        // and the user is redirected to the login page.
        window.location.reload();
    };
    
    const register = async (name: string, email: string, pass: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
        // A public sign-up should not interfere with any existing (e.g. admin) session,
        // but signUp itself logs the new user in. So we must sign them out after.
        // FIX: Cast to any to bypass type error for signUp.
        const { data: signUpData, error: signUpError } = await (supabase.auth as any).signUp({
            email,
            password: pass,
        });
    
        if (signUpError) {
            return { success: false, error: signUpError.message };
        }
    
        if (!signUpData.user) {
            return { success: false, error: "Registration failed: could not create user." };
        }
    
        // Manually insert into the profiles table, bypassing the potentially failing DB trigger.
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: signUpData.user.id,
                name: name,
                email: email,
                role: role,
                status: 'Pending Approval', // All new public registrations are pending approval
            });
    
        if (profileError) {
            // This is a problematic state: auth user exists but profile doesn't.
            console.error("CRITICAL: Auth user created but profile insertion failed.", profileError);
            // Ideally, clean up the created auth user here.
            return { success: false, error: "Your account was created but profile setup failed. Please contact support." };
        }
        
        // After successful sign-up and profile creation, sign the user out immediately.
        // They cannot use the app until an admin approves their account.
        // FIX: Cast to any to bypass type error for signOut.
        await (supabase.auth as any).signOut();
    
        return { success: true };
    };
    
    const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
        // FIX: Cast to any to bypass type error for resetPasswordForEmail.
        const { error } = await (supabase.auth as any).resetPasswordForEmail(email, {
            redirectTo: window.location.origin, // Redirects user back to the app
        });

        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const updateUserPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
        // FIX: Cast to any to bypass type error for updateUser.
        const { error } = await (supabase.auth as any).updateUser({ password: newPassword });
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const switchSchoolContext = (schoolId: string | null) => {
        if (user?.role === UserRole.Owner) {
            setActiveSchoolId(schoolId);
        } else {
            console.warn("School context switching is only available for Owners.");
        }
    };

    const effectiveRole = user?.role === UserRole.Owner && activeSchoolId ? UserRole.Admin : user?.role || null;

    const hasPermission = (permission: Permission): boolean => {
        if (!effectiveRole) return false;
        
        // Owner has all permissions, always.
        if (user?.role === UserRole.Owner) return true;

        // Check for a user-specific override first.
        if (user?.permissionsOverrides && user.permissionsOverrides[permission] !== undefined) {
            return user.permissionsOverrides[permission] as boolean;
        }
        
        // If no override, fall back to the default role-based permissions.
        const userPermissions = ROLE_PERMISSIONS[effectiveRole];
        return userPermissions?.includes(permission) || false;
    };


    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-secondary-50 dark:bg-secondary-900 text-primary-500">Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, register, updateUserPassword, sendPasswordResetEmail, activeSchoolId, switchSchoolContext, effectiveRole, hasPermission, authEvent }}>
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