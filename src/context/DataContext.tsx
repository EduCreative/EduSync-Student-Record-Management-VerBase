
// ... (imports remain the same)
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { School, User, UserRole, Class, Student, Attendance, FeeChallan, Result, ActivityLog, FeeHead, SchoolEvent, Subject, Exam } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { supabase } from '../lib/supabaseClient';
import { db, deleteDatabase } from '../lib/db';
import { toCamelCase, toSnakeCase } from '../utils/caseConverter';
import type { Table } from 'dexie';
import { useTheme } from './ThemeContext';

// ... (Components AlertTriangleIcon and UnrecoverableErrorScreen remain the same)
const AlertTriangleIcon: React.FC<{className?: string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

const UnrecoverableErrorScreen: React.FC<{
    error: string;
    onRetry: () => void;
    onHardReset: () => void;
}> = ({ error, onRetry, onHardReset }) => (
    <div className="fixed inset-0 bg-secondary-100 dark:bg-secondary-900 z-[9999] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-secondary-800 rounded-lg shadow-2xl p-8 text-center">
            <AlertTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Data Synchronization Failed</h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-2">
                The application could not load the necessary data. This might be due to a network issue or corrupted local data.
            </p>
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-md text-left text-xs text-red-700 dark:text-red-300">
                <p><strong>Error Details:</strong> {error}</p>
            </div>
            <div className="mt-6 space-y-3 sm:space-y-0 sm:flex sm:gap-3 sm:justify-center">
                <button onClick={onRetry} className="w-full sm:w-auto btn-secondary">
                    Retry Connection
                </button>
                <button onClick={onHardReset} className="w-full sm:w-auto btn-danger">
                    Hard Reset & Re-sync
                </button>
            </div>
            <p className="text-xs text-secondary-500 mt-4">
                A hard reset will clear all local data and re-download it from the server. This is the recommended fix for persistent sync issues.
            </p>
        </div>
    </div>
);

// ... (DataContextType interface)
interface DataContextType {
    schools: School[];
    users: User[];
    classes: Class[];
    subjects: Subject[];
    exams: Exam[];
    students: Student[];
    attendance: Attendance[];
    fees: FeeChallan[];
    results: Result[];
    logs: ActivityLog[];
    feeHeads: FeeHead[];
    events: SchoolEvent[];
    loading: boolean;
    isInitialLoad: boolean;
    lastSyncTime: Date | null;
    syncError: string | null;

    fetchData: () => Promise<void>;
    getSchoolById: (schoolId: string) => School | undefined;
    updateUser: (updatedUser: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addUserByAdmin: (userData: (Omit<User, 'id'> & { password?: string })) => Promise<void>;
    addStudent: (studentData: Omit<Student, 'id' | 'status'>) => Promise<void>;
    updateStudent: (updatedStudent: Student) => Promise<void>;
    deleteStudent: (studentId: string) => Promise<void>;
    addClass: (classData: Omit<Class, 'id'>) => Promise<void>;
    updateClass: (updatedClass: Class) => Promise<void>;
    deleteClass: (classId: string) => Promise<void>;
    addSubject: (subjectData: Omit<Subject, 'id'>) => Promise<void>;
    updateSubject: (updatedSubject: Subject) => Promise<void>;
    deleteSubject: (subjectId: string) => Promise<void>;
    addExam: (examData: Omit<Exam, 'id'>) => Promise<void>;
    updateExam: (updatedExam: Exam) => Promise<void>;
    deleteExam: (examId: string) => Promise<void>;
    setAttendance: (date: string, attendanceData: { studentId: string; status: 'Present' | 'Absent' | 'Leave' }[]) => Promise<void>;
    recordFeePayment: (challanId: string, amount: number, discount: number, paidDate: string) => Promise<void>;
    updateFeePayment: (challanId: string, paidAmount: number, discount: number, paidDate: string) => Promise<void>;
    cancelChallan: (challanId: string) => Promise<void>;
    generateChallansForMonth: (month: string, year: number, selectedFeeHeads: { feeHeadId: string, amount: number }[], studentIds: string[], dueDate?: string) => Promise<number>;
    addFeeHead: (feeHeadData: Omit<FeeHead, 'id'>) => Promise<void>;
    updateFeeHead: (updatedFeeHead: FeeHead) => Promise<void>;
    deleteFeeHead: (feeHeadId: string) => Promise<void>;
    issueLeavingCertificate: (studentId: string, details: { dateOfLeaving: string; reasonForLeaving: string; conduct: Student['conduct']; progress?: string; placeOfBirth?: string; }) => Promise<void>;
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
    promoteAllStudents: (mappings: Record<string, string | 'graduate'>, exemptedStudentIds: string[]) => Promise<void>;
    increaseTuitionFees: (studentIds: string[], increaseAmount: number) => Promise<void>;
    sendFeeReminders: (challanIds: string[]) => Promise<void>;
    bulkUpdateClassOrder: (classes: { id: string; sortOrder: number }[]) => Promise<void>;
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
    // ... (State and effects remain the same)
    const { user, activeSchoolId } = useAuth();
    const { showToast } = useToast();
    const { syncMode } = useTheme();
    
    const [loading, setLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [unrecoverableError, setUnrecoverableError] = useState<string | null>(null);
    const [schools, setSchools] = useState<School[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendanceState] = useState<Attendance[]>([]);
    const [fees, setFees] = useState<FeeChallan[]>([]);
    const [results, setResults] = useState<Result[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
    const [events, setEvents] = useState<SchoolEvent[]>([]);

    // ... (fetchData function remains the same)
    const fetchData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            setSchools([]); setUsers([]); setClasses([]); setSubjects([]); setExams([]); setStudents([]);
            setAttendanceState([]); setFees([]); setResults([]); setLogs([]);
            setFeeHeads([]); setEvents([]);
            setIsInitialLoad(true);
            setLastSyncTime(null);
            await Promise.all(db.tables.map((table: Table) => table.clear()));
            return;
        }

        setLoading(true);
        setUnrecoverableError(null);

        // Safety timeout: If fetching takes > 45s, stop loading to unfreeze UI
        const safetyTimeout = setTimeout(() => {
            if (loading) {
                console.warn("Fetch data safety timeout triggered.");
                setLoading(false);
                setIsInitialLoad(false);
            }
        }, 45000);

        try {
            const effectiveSchoolId = user.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user.schoolId;

            const fetchTable = async (tableName: string, options: { order?: string, limit?: number, filterBySchool?: boolean } = {}) => {
                let query = supabase.from(tableName).select('*');
                
                if (options.filterBySchool) {
                    const isAdminManagingUsers = (tableName === 'profiles' && (user.role === UserRole.Admin || (user.role === UserRole.Owner && activeSchoolId)));
            
                    if (effectiveSchoolId) {
                        if (isAdminManagingUsers) {
                            query = query.or(`school_id.eq.${effectiveSchoolId},school_id.is.null`);
                        } else {
                            query = query.eq('school_id', effectiveSchoolId);
                        }
                    } else if (user.role === UserRole.Owner) {
                        // No filter for Owner in global view.
                    } else if (user.schoolId) {
                        query = query.eq('school_id', user.schoolId);
                    } else {
                        return [];
                    }
                }
                
                if (options.order) query = query.order(options.order, { ascending: false });
                if (options.limit) query = query.limit(options.limit);
                
                const { data, error } = await query;
                if (error) throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
                return toCamelCase(data || []);
            };
            
            const fetchDependentInChunks = async (tableName: string, studentIds: string[]) => {
                if (studentIds.length === 0) return [];

                const CHUNK_SIZE = 100; // Smaller, safer chunk size
                const MAX_CONCURRENT_REQUESTS = 4; // Keep concurrency low
                const MAX_RETRIES = 3; // Retry failed chunks

                // Create a mutable copy of chunks to be used as a queue
                const chunks: string[][] = [];
                for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
                    chunks.push(studentIds.slice(i, i + CHUNK_SIZE));
                }
                const chunkQueue = [...chunks];

                let allData: any[] = [];

                const fetchChunkWithRetry = async (chunk: string[]) => {
                    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                        try {
                            const { data, error } = await supabase.from(tableName).select('*').in('student_id', chunk);
                            if (error) throw error;
                            return data || [];
                        } catch (error) {
                            if (attempt === MAX_RETRIES) {
                                throw new Error(`Failed to fetch a chunk from ${tableName} after ${MAX_RETRIES} attempts: ${(error as Error).message}`);
                            }
                            await new Promise(res => setTimeout(res, 1000 * attempt));
                        }
                    }
                    return []; // Should be unreachable
                };
                
                const worker = async () => {
                    while (chunkQueue.length > 0) {
                        const chunk = chunkQueue.shift();
                        if (!chunk) continue;

                        const data = await fetchChunkWithRetry(chunk);
                        allData.push(...data);
                    }
                };
                
                const workers = Array(MAX_CONCURRENT_REQUESTS).fill(null).map(() => worker());
                await Promise.all(workers);
                
                return toCamelCase(allData);
            };

            // --- FETCH ALL DATA FROM SUPABASE ---
            const [
                schoolsData, usersData, classesData, subjectsData, examsData, feeHeadsData, eventsData, logsData, studentsData
            ] = await Promise.all([
                fetchTable('schools'),
                fetchTable('profiles', { filterBySchool: true }),
                fetchTable('classes', { filterBySchool: true }),
                fetchTable('subjects', { filterBySchool: true }),
                fetchTable('exams', { filterBySchool: true }),
                fetchTable('fee_heads', { filterBySchool: true }),
                fetchTable('school_events', { filterBySchool: true }),
                fetchTable('activity_logs', { order: 'timestamp', limit: 100, filterBySchool: true }),
                fetchTable('students', { filterBySchool: true })
            ]);

            const studentIds = (studentsData || []).map((s: Student) => s.id);
            const [feesData, attendanceData, resultsData] = await Promise.all([
                fetchDependentInChunks('fee_challans', studentIds),
                fetchDependentInChunks('attendance', studentIds),
                fetchDependentInChunks('results', studentIds),
            ]);

            // --- HANDLE DATA BASED ON SYNC MODE ---
            if (syncMode === 'online') {
                // Set React state directly, bypass Dexie
                console.log("Running in Online-Only mode. Bypassing local DB.");
                setSchools(schoolsData);
                setUsers(usersData);
                setClasses(classesData);
                setSubjects(subjectsData);
                setExams(examsData);
                setFeeHeads(feeHeadsData);
                setEvents(eventsData);
                setLogs(logsData);
                setStudents(studentsData);
                setFees(feesData);
                setAttendanceState(attendanceData);
                setResults(resultsData);
            } else { // 'offline' mode
                // Attempt to load from cache for instant UI if it's the first load
                if (isInitialLoad) {
                    const cachedStudentCount = await db.students.count();
                    if (cachedStudentCount > 0) {
                        setSchools(await db.schools.toArray());
                        setUsers(await db.users.toArray());
                        setClasses(await db.classes.toArray());
                        setSubjects(await db.subjects.toArray());
                        setExams(await db.exams.toArray());
                        setStudents(await db.students.toArray());
                        setAttendanceState(await db.attendance.toArray());
                        setFees(await db.fees.toArray());
                        setResults(await db.results.toArray());
                        setLogs(await db.logs.toArray());
                        setFeeHeads(await db.feeHeads.toArray());
                        setEvents(await db.events.toArray());
                    }
                }

                // --- ATOMIC DATABASE WRITE ---
                // CRITICAL FIX: Removed table clearing to prevent database lock during sync.
                // bulkPut will upsert (update or insert) which is non-blocking for reads.
                await db.transaction('rw', db.tables, async () => {
                    const allPuts = [
                        db.schools.bulkPut(schoolsData),
                        db.users.bulkPut(usersData),
                        db.classes.bulkPut(classesData),
                        db.subjects.bulkPut(subjectsData),
                        db.exams.bulkPut(examsData),
                        db.feeHeads.bulkPut(feeHeadsData),
                        db.events.bulkPut(eventsData),
                        db.logs.bulkPut(logsData),
                        db.students.bulkPut(studentsData),
                        db.fees.bulkPut(feesData),
                        db.attendance.bulkPut(attendanceData),
                        db.results.bulkPut(resultsData),
                    ];
                    await Promise.all(allPuts);
                });
                
                // --- UPDATE REACT STATE FROM DEXIE (Single Source of Truth) ---
                setSchools(await db.schools.toArray());
                setUsers(await db.users.toArray());
                setClasses(await db.classes.toArray());
                setSubjects(await db.subjects.toArray());
                setExams(await db.exams.toArray());
                setStudents(await db.students.toArray());
                setAttendanceState(await db.attendance.toArray());
                setFees(await db.fees.toArray());
                setResults(await db.results.toArray());
                setLogs(await db.logs.toArray());
                setFeeHeads(await db.feeHeads.toArray());
                setEvents(await db.events.toArray());
            }

            setLastSyncTime(new Date());
        } catch (error: any) {
            console.error("A critical error occurred during data fetching:", error);
            setUnrecoverableError(error.message || 'An unknown error occurred during sync.');
        } finally {
            clearTimeout(safetyTimeout);
            setLoading(false);
            if (isInitialLoad) setIsInitialLoad(false);
        }
    }, [user, activeSchoolId, isInitialLoad, syncMode]);

    // ... (rest of the code, useEffects, etc.)
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    // ... (other methods)

    const handleHardReset = async () => {
        showToast('Resetting...', 'Clearing local data and preparing to re-sync.', 'info');
        try {
            await deleteDatabase();
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error('Failed to delete database:', error);
            showToast('Reset Failed', 'Could not clear local data. Please try clearing your browser cache manually.', 'error');
        }
    };

    // ... addLog, getSchoolById, updateUser, deleteUser, addUserByAdmin, addStudent, updateStudent, deleteStudent ...
    // ... (These methods remain unchanged, just hidden for brevity)

    // ... (Rest of the methods like addClass, updateClass, deleteClass, etc. remain unchanged)
    
    // ... (recordFeePayment, updateFeePayment, cancelChallan, generateChallansForMonth)
    
    // ... (addFeeHead, updateFeeHead, deleteFeeHead)

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

    const updateUser = async (updatedUser: User) => {
        const { password, ...restOfUser } = updatedUser;
        let updateData = toSnakeCase(restOfUser);
        if (password) {
            updateData.password = password;
        }

        const { data, error } = await supabase.from('profiles').update(updateData).eq('id', updatedUser.id).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            await fetchData();
            addLog('User Updated', `User profile updated for ${updatedUser.name}.`);
            showToast('Success', `${updatedUser.name}'s profile has been updated.`);
        }
    };

    const deleteUser = async (userId: string) => {
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) {
            console.warn(`User with ID ${userId} not found for deletion.`);
            return;
        }
    
        const { error } = await supabase.from('profiles').update({ status: 'Inactive' }).eq('id', userId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
    
        await fetchData();
        addLog('User Deactivated', `User profile for ${userToDelete.name} has been set to Inactive.`);
        showToast('Success', `${userToDelete.name}'s profile has been deactivated.`);
    };
    
    const addUserByAdmin = async (userData: (Omit<User, 'id'> & { password?: string })) => {
        const { data: { session: adminSession } } = await (supabase.auth as any).getSession();
        if (!adminSession) {
            showToast('Error', 'Your session has expired. Please log in again.', 'error');
            throw new Error("Admin session not found.");
        }
    
        const { name, email, password, role, schoolId, status, avatarUrl } = userData;
        const { data: signUpData, error: signUpError } = await (supabase.auth as any).signUp({
            email: email!,
            password: password!,
        });
    
        const { error: setSessionError } = await (supabase.auth as any).setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
        });
        
        if (setSessionError) {
            showToast('Critical Error', 'Could not restore your session. Please log in again.', 'error');
            window.location.reload();
            throw setSessionError;
        }
    
        if (signUpError) {
            showToast('Error Creating User', signUpError.message, 'error');
            throw signUpError;
        }
    
        if (!signUpData || !signUpData.user) {
            throw new Error("User creation failed unexpectedly.");
        }
        
        const { error: profileError } = await supabase.from('profiles').insert(toSnakeCase({
            id: signUpData.user.id,
            name,
            email,
            role,
            schoolId,
            status: status || 'Pending Approval',
            avatarUrl
        }));
    
        if (profileError) {
            showToast('Error Creating Profile', `User authenticated, but profile creation failed: ${profileError.message}`, 'error');
            throw profileError;
        }
    
        await fetchData();
        addLog('User Added', `New user created: ${name}.`);
        showToast('Success', `User ${name} created successfully.`, 'success');
    };

    const addStudent = async (studentData: Omit<Student, 'id' | 'status'>) => {
        const newStudent = { ...studentData, status: 'Active' as const };
        const { data, error } = await supabase.from('students').insert(toSnakeCase(newStudent)).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            await fetchData();
            addLog('Student Added', `New student added: ${studentData.name}.`);
            showToast('Success', `Student ${studentData.name} has been added.`);
        }
    };

    const updateStudent = async (updatedStudent: Student) => {
        const { data, error } = await supabase.from('students').update(toSnakeCase(updatedStudent)).eq('id', updatedStudent.id).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            await fetchData();
            addLog('Student Updated', `Student profile updated for ${updatedStudent.name}.`);
            showToast('Success', `${updatedStudent.name}'s profile has been updated.`);
        }
    };

    const deleteStudent = async (studentId: string) => {
        const studentToDelete = students.find(s => s.id === studentId);
        if (!studentToDelete) return;

        const { error } = await supabase.from('students').update({ status: 'Deleted' }).eq('id', studentId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        
        await fetchData();
        addLog('Student Deleted', `Student profile deleted for ${studentToDelete.name}.`);
        showToast('Success', `${studentToDelete.name}'s profile has been deleted.`);
    };

    const addClass = async (classData: Omit<Class, 'id'>) => {
        const { data: schoolClassesData } = await supabase.from('classes').select('sort_order').eq('school_id', classData.schoolId);
        
        const maxSortOrder = schoolClassesData && schoolClassesData.length > 0 
            ? Math.max(...schoolClassesData.map(c => c.sort_order || 0)) 
            : 0;
    
        const newClassData = { ...classData, sortOrder: maxSortOrder + 1 };
    
        const { data, error } = await supabase.from('classes').insert(toSnakeCase(newClassData)).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            await fetchData();
            addLog('Class Added', `New class created: ${classData.name}.`);
            showToast('Success', `Class ${classData.name} created.`);
        }
    };
    
    const updateClass = async (updatedClass: Class) => {
        const { data, error } = await supabase.from('classes').update(toSnakeCase(updatedClass)).eq('id', updatedClass.id).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            await fetchData();
            addLog('Class Updated', `Class details updated for ${updatedClass.name}.`);
            showToast('Success', `${updatedClass.name}'s details have been updated.`);
        }
    };

    const deleteClass = async (classId: string) => {
        const classToDelete = classes.find(c => c.id === classId);
        if (!classToDelete) return;

        const { error } = await supabase.from('classes').delete().eq('id', classId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        
        await fetchData();
        addLog('Class Deleted', `Class deleted: ${classToDelete.name}.`);
        showToast('Success', `Class ${classToDelete.name} has been deleted.`);
    };

    const addSubject = async (subjectData: Omit<Subject, 'id'>) => {
        const { error } = await supabase.from('subjects').insert(toSnakeCase(subjectData)).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Subject Added', `New subject created: ${subjectData.name}.`);
        showToast('Success', `Subject ${subjectData.name} created.`);
    };

    const updateSubject = async (updatedSubject: Subject) => {
        const { error } = await supabase.from('subjects').update(toSnakeCase(updatedSubject)).eq('id', updatedSubject.id).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Subject Updated', `Subject updated for ${updatedSubject.name}.`);
        showToast('Success', `${updatedSubject.name}'s details have been updated.`);
    };

    const deleteSubject = async (subjectId: string) => {
        const subjectToDelete = subjects.find(s => s.id === subjectId);
        if (!subjectToDelete) return;

        const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        
        await fetchData();
        addLog('Subject Deleted', `Subject deleted: ${subjectToDelete.name}.`);
        showToast('Success', `Subject ${subjectToDelete.name} has been deleted.`);
    };

    const addExam = async (examData: Omit<Exam, 'id'>) => {
        const { error } = await supabase.from('exams').insert(toSnakeCase(examData)).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Exam Added', `New exam created: ${examData.name}.`);
        showToast('Success', `Exam ${examData.name} created.`);
    };

    const updateExam = async (updatedExam: Exam) => {
        const { error } = await supabase.from('exams').update(toSnakeCase(updatedExam)).eq('id', updatedExam.id).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Exam Updated', `Exam updated for ${updatedExam.name}.`);
        showToast('Success', `${updatedExam.name}'s details have been updated.`);
    };

    const deleteExam = async (examId: string) => {
        const examToDelete = exams.find(s => s.id === examId);
        if (!examToDelete) return;

        const { error } = await supabase.from('exams').delete().eq('id', examId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        
        await fetchData();
        addLog('Exam Deleted', `Exam deleted: ${examToDelete.name}.`);
        showToast('Success', `Exam ${examToDelete.name} has been deleted.`);
    };

    const setAttendance = async (date: string, attendanceData: { studentId: string; status: 'Present' | 'Absent' | 'Leave' }[]) => {
        const { error } = await supabase.from('attendance').upsert(toSnakeCase(attendanceData.map(d => ({...d, date}))), { onConflict: 'student_id, date' }).select();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Attendance Marked', `Attendance marked for ${attendanceData.length} students on ${date}.`);
        showToast('Success', `Attendance for ${date} has been saved.`);
    };
    
    const recordFeePayment = async (challanId: string, amount: number, discount: number, paidDate: string) => {
        const challan = fees.find(f => f.id === challanId);
        if (!challan) throw new Error('Challan not found.');

        const newPaidAmount = challan.paidAmount + amount;
        const totalPayable = challan.totalAmount - discount;
        const newStatus: FeeChallan['status'] = newPaidAmount >= totalPayable ? 'Paid' : 'Partial';

        const { data, error } = await supabase.from('fee_challans')
            .update({ paid_amount: newPaidAmount, discount, status: newStatus, paid_date: paidDate })
            .eq('id', challanId)
            .select()
            .single();

        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }

        // Optimized: Update local state and Dexie instead of full refetch
        const updatedChallan = toCamelCase(data) as FeeChallan;
        
        // Update React State
        setFees(prevFees => prevFees.map(f => f.id === challanId ? updatedChallan : f));
        
        // Update Dexie (if in offline mode or generally to keep sync)
        if (syncMode === 'offline') {
            await db.fees.put(updatedChallan);
        }

        addLog('Fee Payment', `Payment of Rs. ${amount} recorded for challan ${challan.challanNumber}.`);
        showToast('Success', 'Payment recorded successfully.');
    };

    const updateFeePayment = async (challanId: string, paidAmount: number, discount: number, paidDate: string) => {
        const challan = fees.find(f => f.id === challanId);
        if (!challan) throw new Error('Challan not found for update.');

        const totalAmountDue = challan.totalAmount;
        let newStatus: FeeChallan['status'] = 'Unpaid';
        if (paidAmount >= totalAmountDue - discount) {
            newStatus = 'Paid';
        } else if (paidAmount > 0) {
            newStatus = 'Partial';
        }

        const { data, error } = await supabase.from('fee_challans')
            .update({
                paid_amount: paidAmount,
                discount: discount,
                paid_date: paidDate,
                status: newStatus,
            })
            .eq('id', challanId)
            .select()
            .single();

        if (error) {
            showToast('Error', `Failed to update payment: ${error.message}`, 'error');
            throw error;
        }

        // Optimized: Update local state and Dexie instead of full refetch
        const updatedChallan = toCamelCase(data) as FeeChallan;
        
        // Update React State
        setFees(prevFees => prevFees.map(f => f.id === challanId ? updatedChallan : f));
        
        // Update Dexie
        if (syncMode === 'offline') {
            await db.fees.put(updatedChallan);
        }

        const student = students.find(s => s.id === challan.studentId);
        addLog('Payment Edited', `Payment edited for challan #${challan.challanNumber} for student ${student?.name}.`);
        showToast('Success', 'Payment updated successfully.');
    };
    
    const cancelChallan = async (challanId: string) => {
        const challan = fees.find(f => f.id === challanId);
        if (!challan) throw new Error('Challan not found.');
        if (challan.status === 'Paid') {
            const msg = 'Cannot cancel a challan that has already been paid.';
            showToast('Error', msg, 'error');
            throw new Error(msg);
        }

        const { data, error } = await supabase.from('fee_challans')
            .update({ status: 'Cancelled' })
            .eq('id', challanId)
            .select()
            .single();

        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }

        // Optimized: Update local state and Dexie instead of full refetch
        const updatedChallan = toCamelCase(data) as FeeChallan;
        
        // Update React State
        setFees(prevFees => prevFees.map(f => f.id === challanId ? updatedChallan : f));
        
        // Update Dexie
        if (syncMode === 'offline') {
            await db.fees.put(updatedChallan);
        }

        addLog('Challan Cancelled', `Challan ${challan.challanNumber} was cancelled.`);
        showToast('Success', 'Challan has been cancelled.');
    };

    const generateChallansForMonth = async (month: string, year: number, selectedFeeHeads: { feeHeadId: string, amount: number }[], studentIds: string[], dueDateOverride?: string) => {
        if (studentIds.length === 0) {
            showToast('Info', 'No students selected for challan generation.', 'info');
            return 0;
        }

        try {
            const studentMap = new Map<string, Student>(students.map((s: Student) => [s.id, s]));
            const feeHeadMap = new Map<string, string>(feeHeads.map((fh: FeeHead) => [fh.id, fh.name]));
            const challansToCreate: Omit<FeeChallan, 'id'>[] = [];
            const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
            const tuitionFeeHead = feeHeads.find(fh => fh.schoolId === effectiveSchoolId && fh.name.toLowerCase() === 'tuition fee');

            const monthIndex = new Date(Date.parse(month +" 1, 2012")).getMonth();
            const defaultDueDate = new Date(year, monthIndex, 10).toISOString().split('T')[0];
            const dueDate = dueDateOverride || defaultDueDate;

            for (const studentId of studentIds) {
                const student = studentMap.get(studentId);
                if (!student) continue;

                const alreadyExists = fees.some(f => f.studentId === studentId && f.month === month && f.year === year && f.status !== 'Cancelled');
                if (alreadyExists) continue;

                let previousBalance = student.openingBalance || 0;
                fees.forEach(f => {
                    if (f.studentId === studentId && (f.status === 'Unpaid' || f.status === 'Partial')) {
                        previousBalance += (f.totalAmount - f.discount - f.paidAmount);
                    }
                });

                const studentFeeStructureMap = new Map((student.feeStructure || []).map(item => [item.feeHeadId, item.amount]));

                const feeItems = selectedFeeHeads.map(({ feeHeadId, amount }) => {
                    let finalAmount = amount;
                    // If this is the tuition fee head, prioritize the student's specific fee
                    if (tuitionFeeHead && feeHeadId === tuitionFeeHead.id) {
                        finalAmount = studentFeeStructureMap.get(feeHeadId) ?? amount; // Fallback to default if not set for student
                    }
                    return {
                        description: feeHeadMap.get(feeHeadId) || 'Unknown Fee',
                        amount: finalAmount,
                    };
                });

                const currentMonthTotal = feeItems.reduce((sum, item) => sum + item.amount, 0);
                const totalAmount = currentMonthTotal + previousBalance;
                
                const monthNum = (monthIndex + 1).toString().padStart(2, '0');
                const challanNumber = `${year}${monthNum}-${student.rollNumber}`;
                
                challansToCreate.push({
                    challanNumber,
                    studentId,
                    classId: student.classId,
                    month,
                    year,
                    dueDate,
                    status: 'Unpaid',
                    feeItems,
                    previousBalance,
                    totalAmount,
                    discount: 0,
                    paidAmount: 0,
                });
            }

            if (challansToCreate.length > 0) {
                const { data, error } = await supabase.from('fee_challans').insert(toSnakeCase(challansToCreate)).select();
                if (error) {
                    throw new Error(error.message);
                }
                const newChallans = toCamelCase(data) as FeeChallan[];
                const count = newChallans.length;

                // Optimized: Update local state and Dexie instead of full refetch
                setFees(prevFees => [...prevFees, ...newChallans]);
                
                if (syncMode === 'offline') {
                   await db.fees.bulkPut(newChallans);
                }

                showToast('Success', `${count} new challans were generated for ${month}, ${year}.`, 'success');
                addLog('Challans Generated', `${count} challans generated for ${month}, ${year}.`);
                return count;
            } else {
                showToast('Info', 'No new challans needed for the selected students.', 'info');
                return 0;
            }

        } catch (error: any) {
            showToast('Error', error.message, 'error');
            throw error;
        }
    };
    
    const addFeeHead = async (feeHeadData: Omit<FeeHead, 'id'>) => {
        const { error } = await supabase.from('fee_heads').insert(toSnakeCase(feeHeadData)).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Fee Head Added', `New fee head created: ${feeHeadData.name}.`);
    };

    const updateFeeHead = async (updatedFeeHead: FeeHead) => {
        const { error } = await supabase.from('fee_heads').update(toSnakeCase(updatedFeeHead)).eq('id', updatedFeeHead.id).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Fee Head Updated', `Fee head updated: ${updatedFeeHead.name}.`);
    };
    
    const deleteFeeHead = async (feeHeadId: string) => {
        const feeHeadToDelete = feeHeads.find(fh => fh.id === feeHeadId);
        if (!feeHeadToDelete) return;

        const { error } = await supabase.from('fee_heads').delete().eq('id', feeHeadId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Fee Head Deleted', `Fee head deleted: ${feeHeadToDelete.name}.`);
    };

    const issueLeavingCertificate = async (studentId: string, details: { dateOfLeaving: string; reasonForLeaving: string; conduct: Student['conduct']; progress?: string; placeOfBirth?: string; }) => {
        const { dateOfLeaving, reasonForLeaving, conduct, progress, placeOfBirth } = details;
        
        const fullUpdateData = toSnakeCase({
            dateOfLeaving,
            reasonForLeaving,
            conduct,
            progress,
            placeOfBirth,
            status: 'Left'
        });

        let { data, error } = await supabase.from('students')
            .update(fullUpdateData)
            .eq('id', studentId)
            .select()
            .single();

        // Fallback: If columns missing (code 42703 is undefined_column, or check message), just update status
        if (error && (error.code === '42703' || error.message.includes('Could not find the') || error.message.includes('column'))) {
             console.warn("Extended student columns missing in DB. Falling back to status update only.");
             const { data: fallbackData, error: fallbackError } = await supabase.from('students')
                .update({ status: 'Left' })
                .eq('id', studentId)
                .select()
                .single();
             
             if (!fallbackError) {
                 error = null; 
                 data = fallbackData;
                 showToast('Warning', 'Certificate issued but extended details were not saved due to database schema limitations. Please contact admin to update schema.', 'info');
             } else {
                 error = fallbackError;
             }
        }

        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        
        // Optimized: Update local state and Dexie
        if (data) {
             const updatedStudent = toCamelCase(data) as Student;
             setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));
             if (syncMode === 'offline') {
                 await db.students.put(updatedStudent);
             }
        }

        const student = students.find(s=>s.id === studentId);
        addLog('Certificate Issued', `Leaving Certificate issued for ${student?.name}.`);
        if (!error) {
             showToast('Success', 'Leaving Certificate issued.');
        }
    };

    const saveResults = async (resultsToSave: Omit<Result, 'id'>[]) => {
        if (resultsToSave.length === 0) {
            return; // Nothing to save
        }
        
        const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
        if (!effectiveSchoolId) {
            showToast('Error', 'No school context available.', 'error');
            throw new Error('No school context available.');
        }

        const { classId, exam, subject } = resultsToSave[0];
        
        // Note: New exam/subject creation still requires a refetch or manual list update, 
        // keeping full flow for simplicity here as it's rare.
        const examExists = exams.some(e => e.name.toLowerCase() === exam.toLowerCase() && e.schoolId === effectiveSchoolId);
        if (!examExists) {
            const { error: examInsertError } = await supabase.from('exams').insert({
                name: exam,
                school_id: effectiveSchoolId
            });
            if (examInsertError) {
                showToast('Error', `Failed to create new exam: ${examInsertError.message}`, 'error');
                throw new Error(examInsertError.message);
            }
        }

        const subjectExists = subjects.some(s => s.name.toLowerCase() === subject.toLowerCase() && s.schoolId === effectiveSchoolId);
        if (!subjectExists) {
            const { error: subjectInsertError } = await supabase.from('subjects').insert({
                name: subject,
                school_id: effectiveSchoolId
            });
            if (subjectInsertError) {
                showToast('Error', `Failed to create new subject: ${subjectInsertError.message}`, 'error');
                throw new Error(subjectInsertError.message);
            }
        }

        const studentIds = resultsToSave.map(r => r.studentId);
        const { error: deleteError } = await supabase
            .from('results')
            .delete()
            .eq('class_id', classId)
            .eq('exam', exam)
            .eq('subject', subject)
            .in('student_id', studentIds);

        if (deleteError) {
            showToast('Error', `Failed to clear previous results: ${deleteError.message}`, 'error');
            throw new Error(deleteError.message);
        }

        const resultsWithSchoolId = resultsToSave.map(r => ({ ...r, schoolId: effectiveSchoolId }));
        const { error: insertError } = await supabase.from('results').insert(toSnakeCase(resultsWithSchoolId));

        if (insertError) {
            showToast('Error', `Failed to save new results: ${insertError.message}`, 'error');
            throw new Error(insertError.message);
        }

        await fetchData();
        addLog('Results Saved', `${resultsToSave.length} results saved for exam: ${exam}.`);
        showToast('Success', 'Results have been saved successfully.');
    };
    
    // ... (addSchool, updateSchool, deleteSchool, addEvent... remaining functions)
    const addSchool = async (name: string, address: string, logoUrl?: string | null) => {
        const { error } = await supabase.from('schools').insert({ name, address, logo_url: logoUrl });
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('School Added', `New school created: ${name}.`);
    };

    const updateSchool = async (updatedSchool: School) => {
        const { error } = await supabase.from('schools').update(toSnakeCase(updatedSchool)).eq('id', updatedSchool.id);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('School Updated', `School details updated for ${updatedSchool.name}.`);
    };
    
    const deleteSchool = async (schoolId: string) => {
        const schoolToDelete = schools.find(s => s.id === schoolId);
        if (!schoolToDelete) return;
        const { error } = await supabase.from('schools').delete().eq('id', schoolId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('School Deleted', `School deleted: ${schoolToDelete.name}.`);
    };

    const addEvent = async (eventData: Omit<SchoolEvent, 'id'>) => {
        const { error } = await supabase.from('school_events').insert(toSnakeCase(eventData));
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Event Added', `New event created: ${eventData.title}.`);
    };
    
    const updateEvent = async (updatedEvent: SchoolEvent) => {
        const { error } = await supabase.from('school_events').update(toSnakeCase(updatedEvent)).eq('id', updatedEvent.id);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Event Updated', `Event updated: ${updatedEvent.title}.`);
    };
    
    const deleteEvent = async (eventId: string) => {
        const eventToDelete = events.find(e => e.id === eventId);
        if (!eventToDelete) return;
        const { error } = await supabase.from('school_events').delete().eq('id', eventId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Event Deleted', `Event deleted: ${eventToDelete.title}.`);
    };
    
    const bulkAddStudents = async (studentsToAdd: Omit<Student, 'id' | 'status'>[]) => {
        const newStudents = studentsToAdd.map(s => ({ ...s, status: 'Active' as const }));
        const { error } = await supabase.from('students').insert(toSnakeCase(newStudents));
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Bulk Add Students', `Added ${newStudents.length} new students.`);
        showToast('Success', `${newStudents.length} students imported successfully.`);
    };
    
    const bulkAddUsers = async (usersToAdd: (Omit<User, 'id'> & { password?: string })[]) => {
        const { error } = await supabase.rpc('bulk_create_users', { users_data: usersToAdd });
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Bulk Add Users', `Added ${usersToAdd.length} new users.`);
        showToast('Success', `${usersToAdd.length} users imported successfully.`);
    };
    
    const bulkAddClasses = async (classesToAdd: Omit<Class, 'id'>[]) => {
        const { error } = await supabase.from('classes').insert(toSnakeCase(classesToAdd));
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Bulk Add Classes', `Added ${classesToAdd.length} new classes.`);
        showToast('Success', `${classesToAdd.length} classes imported successfully.`);
    };
    
    const backupData = async () => {
        const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
        if (!effectiveSchoolId) {
            showToast('Error', 'No school context selected for backup.', 'error');
            return;
        }
        
        const { data, error } = await supabase.rpc('backup_school_data', { p_school_id: effectiveSchoolId });

        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const schoolName = schools.find(s => s.id === effectiveSchoolId)?.name.replace(/\s+/g, '_') || 'school';
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `edusync_backup_${schoolName}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
        
        showToast('Success', 'Backup file downloaded.', 'success');
    };

    const restoreData = async (backupFile: File) => {
        const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
        if (!effectiveSchoolId) {
            showToast('Error', 'No school context selected for restore.', 'error');
            return;
        }
        
        const fileContent = await backupFile.text();
        
        try {
            const backupJson = JSON.parse(fileContent);
            const { error } = await supabase.rpc('restore_school_data', { 
                p_school_id: effectiveSchoolId, 
                p_backup_data: backupJson 
            });

            if (error) throw error;
            
            showToast('Success', 'Data restored successfully. Refreshing...', 'success');
            setTimeout(() => window.location.reload(), 2000);
            
        } catch (err: any) {
            showToast('Restore Error', err.message || 'Invalid backup file format.', 'error');
            throw new Error(err.message || 'Invalid backup file format.');
        }
    };

    const promoteAllStudents = useCallback(async (mappings: Record<string, string | 'graduate'>, exemptedStudentIds: string[]) => {
        const exemptedSet = new Set(exemptedStudentIds);
        const updates: { id: string, class_id?: string, status?: string }[] = [];
    
        for (const fromClassId in mappings) {
            const toClassIdOrAction = mappings[fromClassId];
            const studentsToProcess = students.filter(s => s.classId === fromClassId && s.status === 'Active' && !exemptedSet.has(s.id));
    
            studentsToProcess.forEach(student => {
                if (toClassIdOrAction === 'graduate') {
                    const fromClass = classes.find(c => c.id === fromClassId);
                    updates.push({ id: student.id, status: `Passed ${fromClass?.name || ''}`.trim() });
                } else {
                    updates.push({ id: student.id, class_id: toClassIdOrAction });
                }
            });
        }
        
        if (updates.length > 0) {
            const { error } = await supabase.from('students').upsert(updates);
            if (error) {
                showToast('Error', `Failed to promote students.`, 'error');
                throw error;
            }
        }
        
        addLog('Students Promoted', `Promoted/Graduated ${updates.length} students.`);
        showToast('Success', 'All selected students have been promoted successfully.', 'success');
        await fetchData();

    }, [user, activeSchoolId, classes, students, showToast, addLog, fetchData]);

    const increaseTuitionFees = useCallback(async (studentIds: string[], increaseAmount: number) => {
        const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
        if (!effectiveSchoolId) {
            const msg = 'No school context selected.';
            showToast('Error', msg, 'error');
            throw new Error(msg);
        }

        const tuitionFeeHead = feeHeads.find(fh => fh.schoolId === effectiveSchoolId && fh.name.toLowerCase() === 'tuition fee');
        if (!tuitionFeeHead) {
            const msg = "'Tuition Fee' head not found. Please create a fee head named 'Tuition Fee'.";
            showToast('Error', msg, 'error');
            throw new Error(msg);
        }

        const studentsToUpdate = students.filter(s => studentIds.includes(s.id));
        
        const updatePromises = studentsToUpdate.map(student => {
            const currentFeeStructure = student.feeStructure || [];
            const tuitionFeeIndex = currentFeeStructure.findIndex(item => item.feeHeadId === tuitionFeeHead.id);
            
            let newFeeStructure;

            if (tuitionFeeIndex > -1) {
                newFeeStructure = [...currentFeeStructure];
                newFeeStructure[tuitionFeeIndex] = {
                    ...newFeeStructure[tuitionFeeIndex],
                    amount: newFeeStructure[tuitionFeeIndex].amount + increaseAmount,
                };
            } else {
                newFeeStructure = [
                    ...currentFeeStructure,
                    {
                        feeHeadId: tuitionFeeHead.id,
                        amount: tuitionFeeHead.defaultAmount + increaseAmount,
                    },
                ];
            }
            
            return supabase
                .from('students')
                .update({ fee_structure: newFeeStructure })
                .eq('id', student.id);
        });

        const results = await Promise.allSettled(updatePromises);
        
        const failedUpdates = results.filter(r => r.status === 'rejected');
        if (failedUpdates.length > 0) {
            console.error('Some student fee updates failed:', failedUpdates);
            const msg = `${failedUpdates.length} out of ${studentsToUpdate.length} fee updates failed. Please check the console.`;
            showToast('Partial Failure', msg, 'error');
            throw new Error(msg);
        }

        addLog('Tuition Fees Increased', `Increased tuition fee by Rs. ${increaseAmount} for ${studentsToUpdate.length} students.`);
        showToast('Success', `Tuition fees increased for ${studentsToUpdate.length} students.`, 'success');
        await fetchData();

    }, [user, activeSchoolId, students, feeHeads, showToast, addLog, fetchData]);

    const sendFeeReminders = useCallback(async (challanIds: string[]) => {
        if (!user) return;
        showToast('Success', `Simulated sending ${challanIds.length} fee reminders.`, 'success');
        addLog('Fee Reminders Sent', `Sent ${challanIds.length} fee reminders.`);
    }, [user, showToast, addLog]);

    const bulkUpdateClassOrder = async (classesToUpdate: { id: string; sortOrder: number }[]) => {
        const updates = classesToUpdate.map(c => ({ id: c.id, sort_order: c.sortOrder }));
        const { error } = await supabase.from('classes').upsert(updates);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Class Order Updated', `Reordered ${classesToUpdate.length} classes.`);
        showToast('Success', 'Class order saved successfully.');
    };

    const value: DataContextType = {
        schools, users, classes, subjects, exams, students, attendance, fees, results, logs, feeHeads, events, loading, isInitialLoad, lastSyncTime, syncError: unrecoverableError, fetchData,
        getSchoolById, updateUser, deleteUser, addStudent, updateStudent, deleteStudent,
        addClass, updateClass, deleteClass, addSubject, updateSubject, deleteSubject,
        addExam, updateExam, deleteExam, setAttendance, recordFeePayment, updateFeePayment, cancelChallan, generateChallansForMonth,
        addFeeHead, updateFeeHead, deleteFeeHead, issueLeavingCertificate, saveResults, addSchool,
        updateSchool, deleteSchool, addEvent, updateEvent, deleteEvent, bulkAddStudents, bulkAddUsers,
        bulkAddClasses, backupData, restoreData, addUserByAdmin, promoteAllStudents, increaseTuitionFees,
        sendFeeReminders, bulkUpdateClassOrder,
    };

    return (
        <DataContext.Provider value={value}>
            {unrecoverableError && schools.length === 0 ? (
                <UnrecoverableErrorScreen
                    error={unrecoverableError}
                    onRetry={() => {
                        setUnrecoverableError(null);
                        fetchData();
                    }}
                    onHardReset={handleHardReset}
                />
            ) : (
                children
            )}
        </DataContext.Provider>
    );
};
