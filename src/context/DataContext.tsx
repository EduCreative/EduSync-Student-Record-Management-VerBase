import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { School, User, UserRole, Class, Student, Attendance, FeeChallan, Result, ActivityLog, FeeHead, SchoolEvent, Notification } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { supabase } from '../lib/supabaseClient';

// Helper to convert snake_case object keys to camelCase
// FIX: Made the object check more robust and typed the accumulator in reduce to prevent type inference issues.
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

// Helper to convert camelCase object keys to snake_case for Supabase
// FIX: Made the object check more robust and typed the accumulator in reduce to prevent type inference issues.
const toSnakeCase = (obj: any): any => {
     if (Array.isArray(obj)) {
        return obj.map(v => toSnakeCase(v));
    } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).reduce((result: { [key: string]: any }, key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            result[snakeKey] = toSnakeCase(obj[key]);
            return result;
        }, {});
    }
    return obj;
};

// --- CONTEXT ---
interface DataContextType {
    // Data states
    schools: School[];
    users: User[];
    classes: Class[];
    students: Student[];
    attendance: Attendance[];
    fees: FeeChallan[];
    results: Result[];
    logs: ActivityLog[];
    feeHeads: FeeHead[];
    events: SchoolEvent[];
    loading: boolean;

    // Data functions
    getSchoolById: (schoolId: string) => School | undefined;
    addUser: (userData: Omit<User, 'id'>, password?: string) => Promise<void>;
    updateUser: (updatedUser: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addStudent: (studentData: Omit<Student, 'id' | 'status'>) => Promise<void>;
    updateStudent: (updatedStudent: Student) => Promise<void>;
    deleteStudent: (studentId: string) => Promise<void>;
    addClass: (classData: Omit<Class, 'id'>) => Promise<void>;
    updateClass: (updatedClass: Class) => Promise<void>;
    deleteClass: (classId: string) => Promise<void>;
    setAttendance: (date: string, attendanceData: { studentId: string; status: 'Present' | 'Absent' | 'Leave' }[]) => Promise<void>;
    recordFeePayment: (challanId: string, amount: number, discount: number, paidDate: string) => Promise<void>;
    generateChallansForMonth: (schoolId: string, month: string, year: number, selectedFeeHeads: { feeHeadId: string, amount: number }[]) => Promise<number>;
    addFeeHead: (feeHeadData: Omit<FeeHead, 'id'>) => Promise<void>;
    updateFeeHead: (updatedFeeHead: FeeHead) => Promise<void>;
    deleteFeeHead: (feeHeadId: string) => Promise<void>;
    issueLeavingCertificate: (studentId: string, details: { dateOfLeaving: string; reasonForLeaving: string; conduct: Student['conduct'] }) => Promise<void>;
    saveResults: (resultsToSave: Omit<Result, 'id'>[]) => Promise<void>;
    addSchool: (name: string, address: string, logoUrl?: string | null) => Promise<void>;
    updateSchool: (updatedSchool: School) => Promise<void>;
    deleteSchool: (schoolId: string) => Promise<void>;
    addEvent: (eventData: Omit<SchoolEvent, 'id'>) => Promise<void>;
    updateEvent: (updatedEvent: SchoolEvent) => Promise<void>;
    deleteEvent: (eventId: string) => Promise<void>;
    bulkAddStudents: (students: Omit<Student, 'id' | 'status'>[]) => Promise<void>;
    bulkAddUsers: (users: (Omit<User, 'id'> & { password?: string })[]) => Promise<void>;
    bulkAddClasses: (classes: Omit<Class, 'id'>[]) => Promise<void>;
    backupData: () => Promise<void>;
    restoreData: (backupFile: File) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, activeSchoolId } = useAuth();
    const { showToast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [schools, setSchools] = useState<School[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendanceState] = useState<Attendance[]>([]);
    const [fees, setFees] = useState<FeeChallan[]>([]);
    const [results, setResults] = useState<Result[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
    const [events, setEvents] = useState<SchoolEvent[]>([]);
    
    const fetchData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            setSchools([]); setUsers([]); setClasses([]); setStudents([]);
            setAttendanceState([]); setFees([]); setResults([]); setLogs([]);
            setFeeHeads([]); setEvents([]);
            return;
        }

        setLoading(true);

        const effectiveSchoolId = user.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user.schoolId;

        const fetchTable = async (tableName: string, options: { order?: string, limit?: number, filterBySchool?: boolean } = {}) => {
            let query = supabase.from(tableName).select('*');
            
            if (options.filterBySchool) {
                if (effectiveSchoolId) {
                    query = query.eq('school_id', effectiveSchoolId);
                } else if (user.role !== UserRole.Owner && user.schoolId) {
                    query = query.eq('school_id', user.schoolId);
                } else if (user.role !== UserRole.Owner && !user.schoolId) {
                    return [];
                }
            }
            
            if (options.order) query = query.order(options.order, { ascending: false });
            if (options.limit) query = query.limit(options.limit);
            
            const { data, error } = await query;
            if (error) {
                console.error(`Error fetching ${tableName}:`, error);
                showToast('Data Load Error', `Could not load data for ${tableName}.`, 'error');
                return null;
            }
            return toCamelCase(data || []);
        };

        try {
            // Step 1: Fetch independent data concurrently
            const [schoolsData, usersData, classesData, feeHeadsData, eventsData, logsData] = await Promise.all([
                fetchTable('schools'),
                fetchTable('profiles', { filterBySchool: true }),
                fetchTable('classes', { filterBySchool: true }),
                fetchTable('fee_heads', { filterBySchool: true }),
                fetchTable('school_events', { filterBySchool: true }),
                fetchTable('activity_logs', { order: 'timestamp', limit: 100, filterBySchool: true }),
            ]);

            setSchools(schoolsData || []);
            setUsers(usersData || []);
            setClasses(classesData || []);
            setFeeHeads(feeHeadsData || []);
            setEvents(eventsData || []);
            setLogs(logsData || []);

            // Step 2: Fetch students
            const studentsData = await fetchTable('students', { filterBySchool: true });
            setStudents(studentsData || []);

            // Step 3: Fetch student-dependent data
            const studentIds = (studentsData || []).map((s: Student) => s.id);

            if (studentIds.length > 0) {
                const CHUNK_SIZE = 500; // Process 500 students at a time to avoid URL length limits

                const fetchDependentInChunks = async (tableName: string) => {
                    let allData: any[] = [];
                    for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
                        const chunk = studentIds.slice(i, i + CHUNK_SIZE);
                        const { data, error } = await supabase.from(tableName).select('*').in('student_id', chunk);
                        if (error) {
                            console.error(`Error fetching chunk for ${tableName}:`, error);
                            showToast('Data Load Error', `Could not load partial data for ${tableName}.`, 'error');
                        }
                        if (data) {
                            allData = allData.concat(data);
                        }
                    }
                    return toCamelCase(allData);
                };

                const [feesData, attendanceData, resultsData] = await Promise.all([
                    fetchDependentInChunks('fee_challans'),
                    fetchDependentInChunks('attendance'),
                    fetchDependentInChunks('results'),
                ]);
                setFees(feesData);
                setAttendanceState(attendanceData);
                setResults(resultsData);
            } else {
                setFees([]);
                setAttendanceState([]);
                setResults([]);
            }
            
        } catch (error) {
            console.error("A critical error occurred during data fetching:", error);
            showToast('Error', 'Failed to load essential data. Please refresh.', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, activeSchoolId, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const createNotifications = useCallback(async (
        usersToNotify: User[],
        messageTemplate: string,
        itemName: string,
        type: Notification['type'],
        relatedId?: string
    ) => {
        if (!usersToNotify || usersToNotify.length === 0) return;

        const notificationsToInsert: Omit<Notification, 'id' | 'isRead' | 'timestamp' | 'relatedId'>[] = [];
        const message = messageTemplate.replace('{itemName}', itemName);

        for (const userToNotify of usersToNotify) {
            const prefs = userToNotify.notificationPreferences;
            let shouldNotify = false;

            switch(type) {
                case 'fee':
                    shouldNotify = prefs?.feeDeadlines?.inApp ?? true;
                    break;
                case 'result':
                    shouldNotify = prefs?.examResults?.inApp ?? true;
                    break;
                case 'event':
                case 'account':
                case 'general':
                    shouldNotify = true;
                    break;
            }

            if (shouldNotify) {
                notificationsToInsert.push({
                    userId: userToNotify.id,
                    message,
                    type,
                    ...(relatedId && { relatedId }),
                });
            }
        }
        
        if (notificationsToInsert.length > 0) {
            const { error } = await supabase.from('notifications').insert(toSnakeCase(notificationsToInsert));
            if (error) {
                console.error("Failed to create notifications:", error);
            }
        }
    }, []);


    const addLog = useCallback(async (action: string, details: string) => {
        if (!user) return;

        const effectiveSchoolId = user.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user.schoolId;

        const newLog: Omit<ActivityLog, 'id'> = {
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatarUrl || '',
            schoolId: effectiveSchoolId || '',
            action,
            details,
            timestamp: new Date().toISOString(),
        };
        const { data } = await supabase.from('activity_logs').insert(toSnakeCase(newLog)).select();
        if (data && data.length > 0) {
            setLogs(prev => [toCamelCase(data[0]) as ActivityLog, ...prev]);
        }
    }, [user, activeSchoolId]);

    const getSchoolById = useCallback((schoolId: string) => schools.find(s => s.id === schoolId), [schools]);
    
    const addUser = async (userData: Omit<User, 'id'>, password?: string) => {
        // This function is largely superseded by bulkAddUsers but kept for potential direct use.
        if (!password) {
            return showToast('Error', 'A password is required to create a new user.', 'error');
        }
        
        const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', userData.email).single();
        if (existingUser) {
            return showToast('Error', 'User with this email already exists.', 'error');
        }

        const newUserId = crypto.randomUUID();
        const profileData = { ...userData, id: newUserId, password };

        const { data: profileInsertData, error: profileError } = await supabase
            .from('profiles')
            .insert(toSnakeCase(profileData))
            .select()
            .single();
        
        if (profileError) {
            console.error("Failed to create user profile:", profileError.message);
            return showToast('Error', 'Profile creation failed.', 'error');
        }
        
        if (profileInsertData) {
            const newUser = toCamelCase(profileInsertData) as User;
            setUsers(prev => [...prev, newUser]);
            addLog('User Added', `New user created: ${newUser.name}.`);
            showToast('Success', `User ${newUser.name} created.`);
        }
    };

    const updateUser = async (updatedUser: User) => {
        const oldUser = users.find(u => u.id === updatedUser.id);
        
        // Exclude password from general update unless explicitly provided
        const { password, ...restOfUser } = updatedUser;
        let updateData = toSnakeCase(restOfUser);
        if (password) {
            updateData.password = password;
        }

        const { data, error } = await supabase.from('profiles').update(updateData).eq('id', updatedUser.id).select().single();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            const updatedUserFromDB = toCamelCase(data) as User;
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUserFromDB : u));
            addLog('User Updated', `User profile updated for ${updatedUserFromDB.name}.`);
            showToast('Success', `${updatedUserFromDB.name}'s profile has been updated.`);

            if (oldUser && oldUser.status === 'Pending Approval' && updatedUserFromDB.status === 'Active') {
                createNotifications([updatedUserFromDB], "Your account has been approved by an administrator.", 'Account Approval', 'account');
            }
        }
    };

    const deleteUser = async (userId: string) => {
        // FIX: Find user before DB operation for safer type narrowing and logic.
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) {
            return console.warn(`User with ID ${userId} not found for deletion.`);
        }
    
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) return showToast('Error', error.message, 'error');
    
        setUsers(prev => prev.filter(u => u.id !== userId));
        addLog('User Deleted', `User profile deleted for ${userToDelete.name}.`);
        showToast('Success', `${userToDelete.name}'s profile has been deleted.`);
    };
    
    const addStudent = async (studentData: Omit<Student, 'id' | 'status'>) => {
        const newStudent = { ...studentData, status: 'Active' as const };
        const { data, error } = await supabase.from('students').insert(toSnakeCase(newStudent)).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            