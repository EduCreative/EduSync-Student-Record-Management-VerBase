import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { School, User, UserRole, Class, Student, Attendance, FeeChallan, Result, ActivityLog, FeeHead, SchoolEvent, Notification } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { supabase } from '../lib/supabaseClient';
import { db } from '../lib/db';
// FIX: Import the `Table` type from Dexie to be used for strong typing.
import type { Table } from 'dexie';
import { toCamelCase, toSnakeCase } from '../utils/caseConverter';
import { formatDate } from '../constants';

const numberWords: { [key: string]: number } = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12
};

const getClassLevel = (name: string): number => {
    const lowerName = name.toLowerCase().trim();
    // Normalize by removing spaces and hyphens for keyword matching
    const normalizedName = lowerName.replace(/[\s-]+/g, '');

    if (normalizedName.includes('playgroup')) return -5;
    if (normalizedName.includes('nursery')) return -4;
    if (normalizedName.includes('kg')) return -3; // Covers KG, K.G., etc.
    if (normalizedName.includes('junior')) return -2;
    if (normalizedName.includes('senior')) return -1;

    let level = 1000; // Default for non-standard names to appear last

    // Check for numeric digits first (e.g., "Class 1", "Grade-8")
    const digitMatch = name.match(/\d+/);
    if (digitMatch) {
        level = parseInt(digitMatch[0], 10);
    } else {
        // If no digits, check for number words (e.g., "Class One")
        const nameParts = lowerName.split(/[\s-]/);
        for (const word in numberWords) {
            if (nameParts.includes(word)) {
                level = numberWords[word];
                break; // Found a number word, stop searching
            }
        }
    }

    // Handle modifiers like "passed" to sort them after the base class
    if (lowerName.includes('passed')) {
        return level + 0.5;
    }
    
    return level;
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
    isInitialLoad: boolean;
    lastSyncTime: Date | null;

    // Data functions
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
    promoteAllStudents: (exemptedStudentIds: string[]) => Promise<void>;
    increaseTuitionFees: (studentIds: string[], increaseAmount: number) => Promise<void>;
    sendFeeReminders: (challanIds: string[]) => Promise<void>;
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
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
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
            setIsInitialLoad(true);
            setLastSyncTime(null);
            // FIX: `db.tables` is the correct API to get all tables. The previous code was using `Object.values` incorrectly.
            // This resolves the errors "Property 'tables' does not exist" and "Property 'clear' does not exist on type 'unknown'".
            await Promise.all(db.tables.map(table => table.clear()));
            return;
        }

        // Phase 1: Try to load from cache for instant UI
        if (isInitialLoad) {
            const cachedStudentCount = await db.students.count();
            if (cachedStudentCount > 0) {
                setLoading(true);
                console.log("Loading data from offline cache...");
                setSchools(await db.schools.toArray());
                setUsers(await db.users.toArray());
                setClasses(await db.classes.toArray());
                setStudents(await db.students.toArray());
                setAttendanceState(await db.attendance.toArray());
                setFees(await db.fees.toArray());
                setResults(await db.results.toArray());
                setLogs(await db.logs.toArray());
                setFeeHeads(await db.feeHeads.toArray());
                setEvents(await db.events.toArray());
                setLoading(false); // UI is now populated and responsive
            }
        }
        
        // Phase 2: Fetch fresh data from network
        if (isInitialLoad && (await db.students.count()) === 0) {
            setLoading(true);
        } else if (!isInitialLoad) {
            setLoading(true);
        }

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
                } else if (user.schoolId) {
                    query = query.eq('school_id', user.schoolId);
                } else {
                    return [];
                }
            }
            
            if (options.order) query = query.order(options.order, { ascending: false });
            if (options.limit) query = query.limit(options.limit);
            
            const { data, error } = await query;
            if (error) {
                console.error(`Error fetching ${tableName}:`, error);
                showToast('Data Sync Error', `Could not load latest data for ${tableName}.`, 'error');
                return null;
            }
            return toCamelCase(data || []);
        };

        try {
            const [schoolsData, usersData, classesData, feeHeadsData, eventsData, logsData] = await Promise.all([
                fetchTable('schools'),
                fetchTable('profiles', { filterBySchool: true }),
                fetchTable('classes', { filterBySchool: true }),
                fetchTable('fee_heads', { filterBySchool: true }),
                fetchTable('school_events', { filterBySchool: true }),
                fetchTable('activity_logs', { order: 'timestamp', limit: 100, filterBySchool: true }),
            ]);

            if (schoolsData) { await db.schools.bulkPut(schoolsData); setSchools(schoolsData); }
            if (usersData) { await db.users.bulkPut(usersData); setUsers(usersData); }
            if (classesData) { await db.classes.bulkPut(classesData); setClasses(classesData); }
            if (feeHeadsData) { await db.feeHeads.bulkPut(feeHeadsData); setFeeHeads(feeHeadsData); }
            if (eventsData) { await db.events.bulkPut(eventsData); setEvents(eventsData); }
            if (logsData) { await db.logs.bulkPut(logsData); setLogs(logsData); }

            const studentsData = await fetchTable('students', { filterBySchool: true });
            if (studentsData) { await db.students.bulkPut(studentsData); setStudents(studentsData); }

            const studentIds = (studentsData || []).map((s: Student) => s.id);

            if (studentIds.length > 0) {
                const CHUNK_SIZE = 500;
                // FIX: Changed type from `Dexie.Table` to `Table` and imported it, fixing the namespace error.
                const fetchDependentInChunks = async (tableName: string, dbTable: Table) => {
                    let allData: any[] = [];
                    for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
                        const chunk = studentIds.slice(i, i + CHUNK_SIZE);
                        const { data, error } = await supabase.from(tableName).select('*').in('student_id', chunk);
                        if (error) {
                            console.error(`Error fetching chunk for ${tableName}:`, error);
                            showToast('Data Sync Error', `Could not load partial data for ${tableName}.`, 'error');
                        }
                        if (data) {
                            allData = allData.concat(data);
                        }
                    }
                    const camelData = toCamelCase(allData);
                    await dbTable.bulkPut(camelData);
                    return camelData;
                };

                const [feesData, attendanceData, resultsData] = await Promise.all([
                    fetchDependentInChunks('fee_challans', db.fees),
                    fetchDependentInChunks('attendance', db.attendance),
                    fetchDependentInChunks('results', db.results),
                ]);
                if(feesData) setFees(feesData);
                if(attendanceData) setAttendanceState(attendanceData);
                if(resultsData) setResults(resultsData);
            } else {
                await Promise.all([db.fees.clear(), db.attendance.clear(), db.results.clear()]);
                setFees([]); setAttendanceState([]); setResults([]);
            }

            setLastSyncTime(new Date());
            
        } catch (error) {
            console.error("A critical error occurred during data fetching:", error);
            showToast('Error', 'Failed to load latest data. Displaying cached data.', 'error');
        } finally {
            setLoading(false);
            if(isInitialLoad) setIsInitialLoad(false);
        }
    }, [user, activeSchoolId, showToast, isInitialLoad]);

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
    
    const updateUser = async (updatedUser: User) => {
        const oldUser = users.find(u => u.id === updatedUser.id);
        
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
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) {
            console.warn(`User with ID ${userId} not found for deletion.`);
            return;
        }
    
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
    
        setUsers(prev => prev.filter(u => u.id !== userId));
        addLog('User Deleted', `User profile deleted for ${userToDelete.name}.`);
        showToast('Success', `${userToDelete.name}'s profile has been deleted.`);
    };
    
    const addUserByAdmin = async (userData: (Omit<User, 'id'> & { password?: string })) => {
        // 1. Preserve admin session
        // FIX: Cast to any to bypass type error for getSession.
        const { data: { session: adminSession } } = await (supabase.auth as any).getSession();
        if (!adminSession) {
            showToast('Error', 'Your session has expired. Please log in again.', 'error');
            throw new Error("Admin session not found.");
        }
    
        // 2. Sign up the new user
        const { name, email, password, role, schoolId, status, avatarUrl } = userData;
        // FIX: Cast to any to bypass type error for signUp.
        const { data: signUpData, error: signUpError } = await (supabase.auth as any).signUp({
            email: email!,
            password: password!,
        });
    
        // 3. Immediately restore admin session to prevent being logged out.
        // FIX: Cast to any to bypass type error for setSession.
        const { error: setSessionError } = await (supabase.auth as any).setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
        });
        
        // 4. Handle errors after session is restored.
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
        
        // 5. Manually insert the profile data.
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
            // A robust solution would clean up the auth user here.
            throw profileError;
        }
    
        // 6. Success: Refresh data and notify.
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
            const newStudentFromDB = toCamelCase(data) as Student;
            setStudents(prev => [...prev, newStudentFromDB]);
            addLog('Student Added', `New student added: ${newStudentFromDB.name}.`);
            showToast('Success', `Student ${newStudentFromDB.name} has been added.`);
        }
    };

    const updateStudent = async (updatedStudent: Student) => {
        const { data, error } = await supabase.from('students').update(toSnakeCase(updatedStudent)).eq('id', updatedStudent.id).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            const updatedStudentFromDB = toCamelCase(data) as Student;
            setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudentFromDB : s));
            addLog('Student Updated', `Student profile updated for ${updatedStudentFromDB.name}.`);
            showToast('Success', `${updatedStudentFromDB.name}'s profile has been updated.`);
        }
    };

    const deleteStudent = async (studentId: string) => {
        const studentToDelete = students.find(s => s.id === studentId);
        if (!studentToDelete) return;

        const { error } = await supabase.from('students').delete().eq('id', studentId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }

        setStudents(prev => prev.filter(s => s.id !== studentId));
        addLog('Student Deleted', `Student profile deleted for ${studentToDelete.name}.`);
        showToast('Success', `${studentToDelete.name}'s profile has been deleted.`);
    };

    const addClass = async (classData: Omit<Class, 'id'>) => {
        const { data, error } = await supabase.from('classes').insert(toSnakeCase(classData)).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            const newClass = toCamelCase(data) as Class;
            setClasses(prev => [...prev, newClass]);
            addLog('Class Added', `New class created: ${newClass.name}.`);
            showToast('Success', `Class ${newClass.name} created.`);
        }
    };
    
    const updateClass = async (updatedClass: Class) => {
        const { data, error } = await supabase.from('classes').update(toSnakeCase(updatedClass)).eq('id', updatedClass.id).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            const updatedClassFromDB = toCamelCase(data) as Class;
            setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClassFromDB : c));
            addLog('Class Updated', `Class details updated for ${updatedClassFromDB.name}.`);
            showToast('Success', `${updatedClassFromDB.name}'s details have been updated.`);
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

        setClasses(prev => prev.filter(c => c.id !== classId));
        addLog('Class Deleted', `Class deleted: ${classToDelete.name}.`);
        showToast('Success', `Class ${classToDelete.name} has been deleted.`);
    };

    const setAttendance = async (date: string, attendanceData: { studentId: string; status: 'Present' | 'Absent' | 'Leave' }[]) => {
        const recordsToUpsert = attendanceData.map(d => ({
            student_id: d.studentId,
            date,
            status: d.status
        }));
        
        const { data, error } = await supabase.from('attendance').upsert(recordsToUpsert, { onConflict: 'student_id, date' }).select();
        
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        
        if (data) {
            const upsertedRecords = toCamelCase(data) as Attendance[];
            setAttendanceState(prev => {
                const otherDaysRecords = prev.filter(a => a.date !== date);
                return [...otherDaysRecords, ...upsertedRecords];
            });
            addLog('Attendance Marked', `Attendance marked for ${recordsToUpsert.length} students on ${date}.`);
            showToast('Success', `Attendance for ${date} has been saved.`);
        }
    };
    
    const recordFeePayment = async (challanId: string, amount: number, discount: number, paidDate: string) => {
        const challan = fees.find(f => f.id === challanId);
        if (!challan) {
            showToast('Error', 'Challan not found.', 'error');
            throw new Error('Challan not found.');
        }

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
        if (data) {
            const updatedChallan = toCamelCase(data) as FeeChallan;
            setFees(prev => prev.map(f => f.id === challanId ? updatedChallan : f));
            addLog('Fee Payment', `Payment of Rs. ${amount} recorded for challan ${updatedChallan.challanNumber}.`);
            showToast('Success', 'Payment recorded successfully.');
        }
    };
    
    const generateChallansForMonth = async (schoolId: string, month: string, year: number, selectedFeeHeads: { feeHeadId: string, amount: number }[]) => {
        try {
            const activeStudents = students.filter(s => s.schoolId === schoolId && s.status === 'Active');
            const existingChallansForMonth = fees.filter(f => f.month === month && f.year === year);
            const studentsWithChallan = new Set(existingChallansForMonth.map(f => f.studentId));
            const studentsToGenerate = activeStudents.filter(s => !studentsWithChallan.has(s.id));

            if (studentsToGenerate.length === 0) {
                showToast('Info', 'All active students already have a challan for this month.', 'info');
                return 0;
            }

            const feesByStudent = fees.reduce((acc, fee) => {
                if (!acc[fee.studentId]) acc[fee.studentId] = [];
                acc[fee.studentId].push(fee);
                return acc;
            }, {} as Record<string, FeeChallan[]>);

            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const monthIndex = (months.indexOf(month) + 1).toString().padStart(2, '0');
            const prefix = `${year}${monthIndex}-`;

            let maxN = 0;
            fees.forEach(f => {
                if (f.year === year && f.month === month && f.challanNumber.startsWith(prefix)) {
                    const nPart = f.challanNumber.substring(prefix.length);
                    const n = parseInt(nPart, 10);
                    if (!isNaN(n) && n > maxN) {
                        maxN = n;
                    }
                }
            });
            let currentN = maxN + 1;

            const newChallansToInsert = [];
            for (const student of studentsToGenerate) {
                const studentChallans = feesByStudent[student.id] || [];
                const previousBalance = studentChallans.reduce((balance, challan) => {
                    return balance + (challan.totalAmount - challan.discount - challan.paidAmount);
                }, student.openingBalance || 0);

                const feeItems = selectedFeeHeads.map(fh => ({
                    description: feeHeads.find(h => h.id === fh.feeHeadId)?.name || 'Unknown Fee',
                    amount: fh.amount
                }));
                const currentMonthFee = feeItems.reduce((sum, item) => sum + item.amount, 0);
                const totalAmount = currentMonthFee + previousBalance;
                const dueDate = new Date(year, months.indexOf(month), 10).toISOString().split('T')[0];
                const challanNumber = `${prefix}${currentN++}`;

                newChallansToInsert.push({
                    studentId: student.id,
                    classId: student.classId,
                    month,
                    year,
                    challanNumber,
                    dueDate,
                    status: 'Unpaid',
                    feeItems,
                    previousBalance,
                    totalAmount,
                    discount: 0,
                    paidAmount: 0,
                    paidDate: null,
                });
            }

            const { data, error } = await supabase.from('fee_challans').insert(toSnakeCase(newChallansToInsert)).select();

            if (error) throw new Error(error.message);
            
            const count = data?.length || 0;
            showToast('Success', `${count} new challans were generated for ${month}, ${year}.`, 'success');
            addLog('Challans Generated', `${count} challans generated for ${month}, ${year}.`);
            await fetchData();
            return count;

        } catch (error: any) {
            showToast('Error', error.message, 'error');
            throw error;
        }
    };
    
    const addFeeHead = async (feeHeadData: Omit<FeeHead, 'id'>) => {
        const { data, error } = await supabase.from('fee_heads').insert(toSnakeCase(feeHeadData)).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            const newFeeHead = toCamelCase(data) as FeeHead;
            setFeeHeads(prev => [...prev, newFeeHead]);
            addLog('Fee Head Added', `New fee head created: ${newFeeHead.name}.`);
        }
    };

    const updateFeeHead = async (updatedFeeHead: FeeHead) => {
        const { data, error } = await supabase.from('fee_heads').update(toSnakeCase(updatedFeeHead)).eq('id', updatedFeeHead.id).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            const updatedFeeHeadFromDB = toCamelCase(data) as FeeHead;
            setFeeHeads(prev => prev.map(fh => fh.id === updatedFeeHead.id ? updatedFeeHeadFromDB : fh));
            addLog('Fee Head Updated', `Fee head updated: ${updatedFeeHeadFromDB.name}.`);
        }
    };
    
    const deleteFeeHead = async (feeHeadId: string) => {
        const feeHeadToDelete = feeHeads.find(fh => fh.id === feeHeadId);
        if (!feeHeadToDelete) return;

        const { error } = await supabase.from('fee_heads').delete().eq('id', feeHeadId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }

        setFeeHeads(prev => prev.filter(fh => fh.id !== feeHeadId));
        addLog('Fee Head Deleted', `Fee head deleted: ${feeHeadToDelete.name}.`);
    };

    const issueLeavingCertificate = async (studentId: string, details: { dateOfLeaving: string; reasonForLeaving: string; conduct: Student['conduct'] }) => {
        const { data, error } = await supabase.from('students')
            .update(toSnakeCase({ ...details, status: 'Left' }))
            .eq('id', studentId)
            .select()
            .single();

        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            const updatedStudentFromDB = toCamelCase(data) as Student;
            setStudents(prev => prev.map(s => s.id === studentId ? updatedStudentFromDB : s));
            addLog('Certificate Issued', `Leaving Certificate issued for ${updatedStudentFromDB.name}.`);
            showToast('Success', 'Leaving Certificate issued.');
        }
    };

    const saveResults = async (resultsToSave: Omit<Result, 'id'>[]) => {
        const recordsToUpsert = resultsToSave.map(r => toSnakeCase(r));
        
        const { data, error } = await supabase.from('results').upsert(recordsToUpsert, { onConflict: 'student_id, class_id, exam, subject' }).select();
        
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }

        if (data) {
            const upsertedRecords = toCamelCase(data) as Result[];
            setResults(prev => {
                const uniqueKeys = new Set(upsertedRecords.map(r => `${r.studentId}-${r.classId}-${r.exam}-${r.subject}`));
                const otherRecords = prev.filter(r => !uniqueKeys.has(`${r.studentId}-${r.classId}-${r.exam}-${r.subject}`));
                return [...otherRecords, ...upsertedRecords];
            });
            addLog('Results Saved', `${resultsToSave.length} results saved for exam: ${resultsToSave[0]?.exam}.`);
            showToast('Success', 'Results have been saved successfully.');
        }
    };
    
    const addSchool = async (name: string, address: string, logoUrl?: string | null) => {
        const { data, error } = await supabase.from('schools').insert({ name, address, logo_url: logoUrl }).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            const newSchool = toCamelCase(data) as School;
            setSchools(prev => [...prev, newSchool]);
            addLog('School Added', `New school created: ${newSchool.name}.`);
        }
    };

    const updateSchool = async (updatedSchool: School) => {
        const { data, error } = await supabase.from('schools').update(toSnakeCase(updatedSchool)).eq('id', updatedSchool.id).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            const updatedSchoolFromDB = toCamelCase(data) as School;
            setSchools(prev => prev.map(s => s.id === updatedSchool.id ? updatedSchoolFromDB : s));
            addLog('School Updated', `School details updated for ${updatedSchoolFromDB.name}.`);
        }
    };
    
    const deleteSchool = async (schoolId: string) => {
        const schoolToDelete = schools.find(s => s.id === schoolId);
        if (!schoolToDelete) return;

        const { error } = await supabase.from('schools').delete().eq('id', schoolId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }

        setSchools(prev => prev.filter(s => s.id !== schoolId));
        addLog('School Deleted', `School deleted: ${schoolToDelete.name}.`);
    };

    const addEvent = async (eventData: Omit<SchoolEvent, 'id'>) => {
        const { data, error } = await supabase.from('school_events').insert(toSnakeCase(eventData)).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            const newEvent = toCamelCase(data) as SchoolEvent;
            setEvents(prev => [...prev, newEvent]);
            addLog('Event Added', `New event created: ${newEvent.title}.`);
        }
    };
    
    const updateEvent = async (updatedEvent: SchoolEvent) => {
        const { data, error } = await supabase.from('school_events').update(toSnakeCase(updatedEvent)).eq('id', updatedEvent.id).select().single();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            const updatedEventFromDB = toCamelCase(data) as SchoolEvent;
            setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEventFromDB : e));
            addLog('Event Updated', `Event updated: ${updatedEventFromDB.title}.`);
        }
    };
    
    const deleteEvent = async (eventId: string) => {
        const eventToDelete = events.find(e => e.id === eventId);
        if (!eventToDelete) return;

        const { error } = await supabase.from('school_events').delete().eq('id', eventId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }

        setEvents(prev => prev.filter(e => e.id !== eventId));
        addLog('Event Deleted', `Event deleted: ${eventToDelete.title}.`);
    };
    
    const bulkAddStudents = async (studentsToAdd: Omit<Student, 'id' | 'status'>[]) => {
        const newStudents = studentsToAdd.map(s => ({ ...s, status: 'Active' as const }));
        const { data, error } = await supabase.from('students').insert(toSnakeCase(newStudents)).select();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            const addedStudents = toCamelCase(data) as Student[];
            setStudents(prev => [...prev, ...addedStudents]);
            addLog('Bulk Add Students', `Added ${addedStudents.length} new students.`);
            showToast('Success', `${addedStudents.length} students imported successfully.`);
        }
    };
    
    const bulkAddUsers = async (usersToAdd: (Omit<User, 'id'> & { password?: string })[]) => {
        const { data, error } = await supabase.rpc('bulk_create_users', { users_data: usersToAdd });

        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        
        const addedUsers = toCamelCase(data) as User[];
        setUsers(prev => [...prev, ...addedUsers]);
        addLog('Bulk Add Users', `Added ${addedUsers.length} new users.`);
        showToast('Success', `${addedUsers.length} users imported successfully.`);
    };
    
    const bulkAddClasses = async (classesToAdd: Omit<Class, 'id'>[]) => {
        const { data, error } = await supabase.from('classes').insert(toSnakeCase(classesToAdd)).select();
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        if (data) {
            const addedClasses = toCamelCase(data) as Class[];
            setClasses(prev => [...prev, ...addedClasses]);
            addLog('Bulk Add Classes', `Added ${addedClasses.length} new classes.`);
            showToast('Success', `${addedClasses.length} classes imported successfully.`);
        }
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

    const promoteAllStudents = useCallback(async (exemptedStudentIds: string[]) => {
        const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
        if (!effectiveSchoolId) {
            showToast('Error', 'No school selected to perform promotion.', 'error');
            throw new Error('No school selected');
        }

        const schoolClasses = classes.filter(c => c.schoolId === effectiveSchoolId);
        const sortedClasses = [...schoolClasses].sort((a, b) => getClassLevel(a.name) - getClassLevel(b.name));

        if (sortedClasses.length < 1) {
            showToast('Info', 'No classes found to perform promotion.', 'info');
            return;
        }

        const exemptedSet = new Set(exemptedStudentIds);
        // Iterate from highest to lowest class
        for (let i = sortedClasses.length - 1; i >= 0; i--) {
            const currentClass = sortedClasses[i];
            const studentsInClass = students.filter(s => s.classId === currentClass.id && s.status === 'Active' && !exemptedSet.has(s.id));

            if (studentsInClass.length === 0) {
                continue; // Skip empty class
            }

            const studentIds = studentsInClass.map(s => s.id);

            if (i === sortedClasses.length - 1) { // Highest class graduates
                const newStatus = `Class ${currentClass.name} Passed`;
                const { error } = await supabase.from('students').update({ status: newStatus }).in('id', studentIds);
                if (error) {
                    showToast('Error', `Failed to graduate students from ${currentClass.name}.`, 'error');
                    throw error;
                }
            } else { // Promote to next class
                const nextClass = sortedClasses[i + 1];
                const { error } = await supabase.from('students').update({ class_id: nextClass.id }).in('id', studentIds);
                if (error) {
                    showToast('Error', `Failed to promote students from ${currentClass.name} to ${nextClass.name}.`, 'error');
                    throw error;
                }
            }
        }
        
        addLog('Students Promoted', `Promoted students for the new academic year.`);
        showToast('Success', 'All students have been promoted successfully.', 'success');
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
                // Tuition fee already exists, update it
                newFeeStructure = [...currentFeeStructure];
                newFeeStructure[tuitionFeeIndex] = {
                    ...newFeeStructure[tuitionFeeIndex],
                    amount: newFeeStructure[tuitionFeeIndex].amount + increaseAmount,
                };
            } else {
                // Tuition fee doesn't exist, add it based on the default
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
    
        const challansToSend = fees.filter(f => challanIds.includes(f.id));
        if (challansToSend.length === 0) {
            showToast('Info', 'No challans selected for reminders.', 'info');
            return;
        }
    
        const studentMap = new Map(students.map(s => [s.id, s]));
        const parentMap = new Map<string, User>();
        const studentUserMap = new Map<string, User>();
        users.forEach(u => {
            if (u.role === UserRole.Parent && u.childStudentIds) {
                u.childStudentIds.forEach(childId => parentMap.set(childId, u));
            }
            const studentProfile = students.find(s => s.userId === u.id);
            if (studentProfile) {
                studentUserMap.set(studentProfile.id, u);
            }
        });
    
        const notificationsToInsert: Omit<Notification, 'id' | 'isRead' | 'timestamp'>[] = [];
        const notifiedUserChallanPairs = new Set<string>();
    
        for (const challan of challansToSend) {
            const student = studentMap.get(challan.studentId);
            if (!student) continue;
    
            const balance = challan.totalAmount - challan.discount - challan.paidAmount;
            const message = `Fee Reminder for ${student.name}: The challan for ${challan.month} ${challan.year} is due on ${formatDate(challan.dueDate)}. Current balance: Rs. ${balance.toLocaleString()}`;
    
            const usersToNotify: User[] = [];
            const parent = parentMap.get(student.id);
            if (parent) usersToNotify.push(parent);
            
            const studentUser = studentUserMap.get(student.id);
            if (studentUser) usersToNotify.push(studentUser);
    
            for (const userToNotify of usersToNotify) {
                const shouldNotify = userToNotify.notificationPreferences?.feeDeadlines?.inApp ?? true;
                const notificationKey = `${userToNotify.id}-${challan.id}`;
    
                if (shouldNotify && !notifiedUserChallanPairs.has(notificationKey)) {
                    notificationsToInsert.push({
                        userId: userToNotify.id,
                        message,
                        type: 'fee',
                        relatedId: challan.id,
                    });
                    notifiedUserChallanPairs.add(notificationKey);
                }
            }
        }
    
        if (notificationsToInsert.length === 0) {
            showToast('Info', 'No users with active notifications found for the selected challans.', 'info');
            return;
        }
    
        const { error } = await supabase.from('notifications').insert(toSnakeCase(notificationsToInsert));
    
        if (error) {
            showToast('Error', `Failed to send reminders: ${error.message}`, 'error');
            throw error;
        }
    
        showToast('Success', `Sent ${notificationsToInsert.length} fee reminders successfully.`, 'success');
        addLog('Fee Reminders Sent', `Sent ${notificationsToInsert.length} fee reminders.`);
    }, [user, fees, students, users, showToast, addLog]);


    const value = {
        schools, users, classes, students, attendance, fees, results, logs, feeHeads, events, loading, isInitialLoad, lastSyncTime,
        getSchoolById, updateUser, deleteUser, addStudent, updateStudent, deleteStudent,
        addClass, updateClass, deleteClass, setAttendance, recordFeePayment, generateChallansForMonth,
        addFeeHead, updateFeeHead, deleteFeeHead, issueLeavingCertificate, saveResults, addSchool,
        updateSchool, deleteSchool, addEvent, updateEvent, deleteEvent, bulkAddStudents, bulkAddUsers,
        bulkAddClasses, backupData, restoreData, addUserByAdmin, promoteAllStudents, increaseTuitionFees,
        sendFeeReminders,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};