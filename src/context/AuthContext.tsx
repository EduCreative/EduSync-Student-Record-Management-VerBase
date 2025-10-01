import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Permission, ROLE_PERMISSIONS } from '../permissions';
import { Session } from '@supabase/supabase-js';

// Helper to convert snake_case object keys to camelCase
const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).reduce((result: { [key: string]: any }, key) => {
            const camelKey = key.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {});
    }
    return obj;
};

interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    register: (name: string, email: string, pass: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
    updateUserPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
    activeSchoolId: string | null;
    switchSchoolContext: (schoolId: string | null) => void;
    effectiveRole: UserRole | null;
    profileSetupNeeded: boolean;
    completeProfileSetup: (name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
    hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserProfile = async (session: Session | null) => {
            if (session?.user) {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    console.error('Error fetching user profile:', error);
                    setUser(null);
                } else if (profile) {
                    const userProfile = toCamelCase(profile) as User;
                    setUser(userProfile);
                    // Set initial school context for non-owners
                    if (userProfile.role !== UserRole.Owner) {
                        setActiveSchoolId(userProfile.schoolId);
                    }
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        // Check for initial session on app load
        supabase.auth.getSession().then(({ data: { session } }) => {
            fetchUserProfile(session);
        });

        // Listen for auth state changes (login, logout)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            fetchUserProfile(session);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        // The onAuthStateChange listener will handle setting the user state.
        return { success: true };
    };
    
    const logout = async () => {
        await supabase.auth.signOut();
        setActiveSchoolId(null);
        setUser(null); // Immediately clear user state
    };
    
    const register = async (name: string, email: string, pass: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
        const { error } = await supabase.auth.signUp({
            email,
            password: pass,
            options: {
                // Pass metadata to be used by the database trigger
                data: {
                    name,
                    role,
                }
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }
        
        // The DB trigger (handle_new_user) will create the profile.
        // A success message is shown to the user, who then can log in.
        return { success: true };
    };

    const updateUserPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
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

    // This is no longer needed
    const completeProfileSetup = async (): Promise<{ success: boolean; error?: string }> => {
        return { success: false, error: "This feature is deprecated." };
    }

    const effectiveRole = user?.role === UserRole.Owner && activeSchoolId ? UserRole.Admin : user?.role || null;

    const hasPermission = (permission: Permission): boolean => {
        if (!effectiveRole) return false;
        if (effectiveRole === UserRole.Owner) return true;
        
        const userPermissions = ROLE_PERMISSIONS[effectiveRole];
        return userPermissions?.includes(permission) || false;
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-secondary-50 dark:bg-secondary-900 text-primary-500">Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, register, updateUserPassword, activeSchoolId, switchSchoolContext, effectiveRole, profileSetupNeeded: false, completeProfileSetup, hasPermission }}>
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
