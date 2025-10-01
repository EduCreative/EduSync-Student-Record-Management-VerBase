import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Permission, ROLE_PERMISSIONS } from '../permissions';

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
    // This is no longer needed as profile is created on register
    profileSetupNeeded: boolean; 
    completeProfileSetup: (name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
    hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);

    // Rehydrate session from localStorage
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('edusync_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('edusync_user');
        }
        setLoading(false);
    }, []);
    
    // Dummy function to satisfy type, logic is removed
    const completeProfileSetup = async (_name: string, _role: UserRole): Promise<{ success: boolean; error?: string }> => {
        console.warn("completeProfileSetup is deprecated.");
        return { success: false, error: 'This feature is no longer available.'};
    };

    const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
        // Special handling for the owner account to ensure access and creation.
        if (email.toLowerCase() === 'kmasroor50@gmail.com') {
            const { data: existingOwner, error: findError } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();
    
            // Handle unexpected database errors, but ignore "row not found" which is expected.
            if (findError && findError.code !== 'PGRST116') {
                return { success: false, error: findError.message };
            }
    
            let userProfile: User;
    
            if (existingOwner) {
                // Case 1: Owner account exists. Validate the password.
                if (existingOwner.password !== pass) {
                    return { success: false, error: 'Invalid password for owner account.' };
                }
                userProfile = toCamelCase(existingOwner) as User;
    
            } else {
                // Case 2: Owner account does not exist. Create it only if the correct initial password is used.
                if (pass !== 'password') {
                    return { success: false, error: 'Invalid credentials to create owner account.' };
                }
                
                console.warn("Owner profile not found for kmasroor50@gmail.com. Creating a new one with the default password.");
                const newOwnerData = {
                    id: crypto.randomUUID(),
                    name: 'Khurram Masroor (Owner)',
                    email: email.toLowerCase(),
                    role: UserRole.Owner,
                    school_id: null,
                    status: 'Active' as const,
                    password: 'password' // Set the specified default password
                };
    
                const { error: createError } = await supabase
                    .from('profiles')
                    .insert(newOwnerData);
    
                if (createError) {
                    console.error("Error creating owner profile:", createError);
                    return { success: false, error: "Failed to automatically create owner profile. Please contact support." };
                }
                userProfile = toCamelCase(newOwnerData) as User;
            }
            
            // If we reach here, authentication/creation was successful.
            setUser(userProfile);
            localStorage.setItem('edusync_user', JSON.stringify(userProfile));
            
            await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', userProfile.id);
            
            return { success: true };
        }
    
        // Original login logic for all other users
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .eq('password', pass)
            .single();
    
        if (error || !data) {
            return { success: false, error: 'Invalid email or password.' };
        }
        
        const userProfileData = toCamelCase(data) as User;
        setUser(userProfileData);
        localStorage.setItem('edusync_user', JSON.stringify(userProfileData));
        
        await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', userProfileData.id);
    
        return { success: true };
    };

    const logout = async () => {
        setUser(null);
        setActiveSchoolId(null);
        localStorage.removeItem('edusync_user');
    };

    const register = async (name: string, email: string, pass: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
        // Check if user already exists
        const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).single();

        if (existingUser) {
            return { success: false, error: 'A user with this email address already exists.' };
        }

        // Owners are approved automatically, others require admin approval.
        const userStatus = role === UserRole.Owner ? 'Active' : 'Pending Approval';
        const newUserId = crypto.randomUUID();

        const { error: profileError } = await supabase.from('profiles').insert({
            id: newUserId,
            name,
            email,
            role,
            password: pass, // Storing plain text password
            school_id: null,
            status: userStatus,
        });

        if (profileError) {
            console.error("Failed to create user profile:", profileError.message);
            return { success: false, error: "Could not create your user profile. Please contact support." };
        }
        
        return { success: true };
    };

    const updateUserPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'No user is logged in.' };

        const { error } = await supabase
            .from('profiles')
            .update({ password: newPassword })
            .eq('id', user.id);
            
        if (error) {
            return { success: false, error: error.message };
        }
        
        // Update password in local state/storage
        const updatedUser = { ...user, password: newPassword };
        setUser(updatedUser);
        localStorage.setItem('edusync_user', JSON.stringify(updatedUser));
        
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
        // Owner in global view (effectiveRole is Owner) has all permissions
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