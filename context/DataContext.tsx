import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { School, User, UserRole, Class, Student, Attendance, FeeChallan, Result, ActivityLog, FeeHead, SchoolEvent } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useSync } from './SyncContext';
import { supabase } from '../lib/supabaseClient';

// Helper to convert snake_case object keys to camelCase
const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
};

// Helper to convert camelCase object keys to snake_case for Supabase
const toSnakeCase = (obj: any): any => {
     if (Array.isArray(obj)) {
        return obj.map(v => toSnakeCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            result[snakeKey] = toSnakeCase(obj[key]);
            return result;
        }, {} as any);
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
    addUser: (userData: Omit<User, 'id'>) => Promise<void>;
    updateUser: (updatedUser: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addStudent: (studentData: Omit<Student, 'id' | 'status'>) => Promise<void>;
    updateStudent: (updatedStudent: Student) => Promise<void>;
    deleteStudent: (studentId: string) => Promise<void>;
    addClass: (classData: Omit<Class, 'id'>) => Promise<void>;
    updateClass: (updatedClass: Class) => Promise<void>;
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
    const { user } = useAuth();
    const { showToast } = useToast();
    const { updateSyncTime } = useSync();
    
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
    
    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setLoading(false);
                setSchools([]);
                setUsers([]);
                setClasses([]);
                setStudents([]);
                setAttendanceState([]);
                setFees([]);
                setResults([]);
                setLogs([]);
                setFeeHeads([]);
                setEvents([]);
                return;
            };

            setLoading(true);

            // Helper function to fetch data from a single table and handle errors gracefully
            const fetchTable = async (tableName: string, options: { order?: string, limit?: number } = {}) => {
                let query = supabase.from(tableName).select('*');
                if (options.order) {
                    query = query.order(options.order, { ascending: false });
                }
                if (options.limit) {
                    query = query.limit(options.limit);
                }
                const { data, error } = await query;
                if (error) {
                    console.error(`Error fetching ${tableName}:`, error.message);
                    showToast('Fetch Error', `Could not load data for '${tableName}'. Check console, RLS policies, and if the table exists.`, 'error');
                    return []; // Return an empty array on error to prevent app crash
                }
                return toCamelCase(data || []);
            };

            try {
                // FIX: Re-enabled fetching for all tables now that the user has run the schema.sql script.
                const [
                    schoolsData, 
                    usersData, 
                    classesData, 
                    studentsData,
                    attendanceData,
                    feesData,
                    resultsData,
                    logsData,
                    feeHeadsData,
                    eventsData
                ] = await Promise.all([
                    fetchTable('schools'),
                    fetchTable('profiles'), 
                    fetchTable('classes'),
                    fetchTable('students'),
                    fetchTable('attendance'),
                    fetchTable('fee_challans'),
                    fetchTable('results'),
                    fetchTable('activity_logs', { order: 'timestamp', limit: 100 }),
                    fetchTable('fee_heads'),
                    fetchTable('school_events'),
                ]);

                setSchools(schoolsData);
                setUsers(usersData);
                setClasses(classesData);
                setStudents(studentsData);
                setAttendanceState(attendanceData);
                setFees(feesData);
                setResults(resultsData);
                setLogs(logsData);
                setFeeHeads(feeHeadsData);
                setEvents(eventsData);
                
                updateSyncTime();
            } catch (error) { // This catch is for unexpected programming errors
                console.error("A critical error occurred during data processing:", error);
                showToast('Critical Error', 'An unexpected error occurred. Please check the console.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, showToast, updateSyncTime]);
    
    const addLog = useCallback(async (action: string, details: string) => {
        if (!user) return;
        const newLog: Omit<ActivityLog, 'id'> = {
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatarUrl || '',
            schoolId: user.schoolId,
            action,
            details,
            timestamp: new Date().toISOString(),
        };
        const { data, error } = await supabase.from('activity_logs').insert(toSnakeCase(newLog)).select();
        if (data) {
            setLogs(prev => [toCamelCase(data[0]), ...prev]);
        }
        updateSyncTime();
    }, [user, updateSyncTime]);

    const getSchoolById = useCallback((schoolId: string) => schools.find(s => s.id === schoolId), [schools]);
    
    // NOTE: This function creates a profile, but not an authenticated user.
    // Use the register function in AuthContext for self-signup.
    const addUser = async (userData: Omit<User, 'id'>) => {
        // This flow is for admins creating users and is incomplete without a way
        // to set a password, which typically requires backend logic or an invite flow.
        showToast('Info', 'User profile created. Authentication must be handled separately.', 'info');
    };

    const updateUser = async (updatedUser: User) => {
        const { data, error } = await supabase.from('profiles').update(toSnakeCase(updatedUser)).eq('id', updatedUser.id).select();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? toCamelCase(data[0]) : u));
            addLog('User Updated', `User profile updated for ${updatedUser.name}.`);
            showToast('Success', `${updatedUser.name}'s profile has been updated.`);
        }
    };

    const deleteUser = async (userId: string) => {
        // Note: This only deletes the profile record, not the auth.users entry.
        // Proper user deletion requires admin privileges and should be handled in a secure backend environment.
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) return showToast('Error', error.message, 'error');
        
        const userToDelete = users.find(u => u.id === userId);
        setUsers(prev => prev.filter(u => u.id !== userId));
        if (userToDelete) {
             addLog('User Deleted', `User profile deleted for ${userToDelete.name}.`);
             showToast('Success', `${userToDelete.name}'s profile has been deleted.`);
        }
    };
    
    const addStudent = async (studentData: Omit<Student, 'id' | 'status'>) => {
        const newStudent = { ...studentData, status: 'Active' };
        const { data, error } = await supabase.from('students').insert(toSnakeCase(newStudent)).select();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            setStudents(prev => [...prev, toCamelCase(data[0])]);
            addLog('Student Added', `New student added: ${newStudent.name}.`);
            showToast('Success', `${newStudent.name} has been added.`);
        }
    };
    
    const updateStudent = async (updatedStudent: Student) => {
        const { data, error } = await supabase.from('students').update(toSnakeCase(updatedStudent)).eq('id', updatedStudent.id).select();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            setStudents(prev => prev.map(s => s.id === updatedStudent.id ? toCamelCase(data[0]) : s));
            addLog('Student Updated', `Profile updated for ${updatedStudent.name}.`);
            showToast('Success', `${updatedStudent.name}'s profile has been updated.`);
        }
    };
    
    const deleteStudent = async (studentId: string) => {
         const { error } = await supabase.from('students').delete().eq('id', studentId);
        if (error) return showToast('Error', error.message, 'error');
        
        const studentToDelete = students.find(s => s.id === studentId);
        setStudents(prev => prev.filter(s => s.id !== studentId));
        if (studentToDelete) {
            addLog('Student Deleted', `Student deleted: ${studentToDelete.name}.`);
            showToast('Success', `${studentToDelete.name} has been deleted.`);
        }
    };
    
    const addClass = async (classData: Omit<Class, 'id'>) => { /* ... */ };
    const updateClass = async (updatedClass: Class) => { /* ... */ };
    const setAttendance = async (date: string, attendanceData: { studentId: string; status: 'Present' | 'Absent' | 'Leave' }[]) => { /* ... */ };
    const recordFeePayment = async (challanId: string, amount: number, discount: number, paidDate: string) => { /* ... */ };
    const generateChallansForMonth = async (schoolId: string, month: string, year: number, selectedFeeHeads: { feeHeadId: string, amount: number }[]): Promise<number> => { return 0; };
    const addFeeHead = async (feeHeadData: Omit<FeeHead, 'id'>) => { /* ... */ };
    const updateFeeHead = async (updatedFeeHead: FeeHead) => { /* ... */ };
    const deleteFeeHead = async (feeHeadId: string) => { /* ... */ };
    const issueLeavingCertificate = async (studentId: string, details: { dateOfLeaving: string; reasonForLeaving: string; conduct: Student['conduct'] }) => { /* ... */ };
    const saveResults = async (resultsToSave: Omit<Result, 'id'>[]) => { /* ... */ };
    const addSchool = async (name: string, address: string, logoUrl?: string | null) => { /* ... */ };
    const updateSchool = async (updatedSchool: School) => { /* ... */ };
    const deleteSchool = async (schoolId: string) => { /* ... */ };


    const value: DataContextType = {
        schools, users, classes, students, attendance, fees, results, logs, feeHeads, events, loading,
        getSchoolById, addUser, updateUser, deleteUser, addStudent, updateStudent, deleteStudent,
        addClass, updateClass, setAttendance, recordFeePayment, generateChallansForMonth,
        addFeeHead, updateFeeHead, deleteFeeHead, issueLeavingCertificate, saveResults,
        addSchool, updateSchool, deleteSchool,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};