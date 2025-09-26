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
                return;
            };
            setLoading(true);
            try {
                const [
                    schoolsRes, usersRes, classesRes, studentsRes, 
                    attendanceRes, feesRes, resultsRes, logsRes, 
                    feeHeadsRes, eventsRes
                ] = await Promise.all([
                    supabase.from('schools').select('*'),
                    supabase.from('profiles').select('*'), // Users are in the 'profiles' table
                    supabase.from('classes').select('*'),
                    supabase.from('students').select('*'),
                    supabase.from('attendance').select('*'),
                    supabase.from('fee_challans').select('*'),
                    supabase.from('results').select('*'),
                    supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(100),
                    supabase.from('fee_heads').select('*'),
                    supabase.from('school_events').select('*'),
                ]);

                // Assuming Supabase returns snake_case, we convert to camelCase for the app
                setSchools(toCamelCase(schoolsRes.data || []));
                setUsers(toCamelCase(usersRes.data || []));
                setClasses(toCamelCase(classesRes.data || []));
                setStudents(toCamelCase(studentsRes.data || []));
                setAttendanceState(toCamelCase(attendanceRes.data || []));
                setFees(toCamelCase(feesRes.data || []));
                setResults(toCamelCase(resultsRes.data || []));
                setLogs(toCamelCase(logsRes.data || []));
                setFeeHeads(toCamelCase(feeHeadsRes.data || []));
                setEvents(toCamelCase(eventsRes.data || []));
                updateSyncTime();
                
            } catch (error) {
                console.error("Error fetching data:", error);
                showToast('Error', 'Failed to load application data.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);
    
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
