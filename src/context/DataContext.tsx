import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { School, User, UserRole, Class, Student, Attendance, FeeChallan, Result, ActivityLog, FeeHead, SchoolEvent } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { supabase } from '../lib/supabaseClient';
import { db } from '../lib/db';
import { toCamelCase, toSnakeCase } from '../utils/caseConverter';
// FIX: Imported `getClassLevel` to enable robust sorting of classes for the promotion logic.
import { getClassLevel } from '../utils/sorting';

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
    generateChallansForMonth: (month: string, year: number, selectedFeeHeads: { feeHeadId: string, amount: number }[], studentIds: string[]) => Promise<number>;
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
        
        setLoading(true);

        try {
            const effectiveSchoolId = user.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user.schoolId;

            // Pure fetcher function without side effects
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
                        // No filter for Owner in global view, fetches all data for this table.
                    } else if (user.schoolId) {
                        query = query.eq('school_id', user.schoolId);
                    } else {
                        return []; // No context, return empty.
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

            // --- PHASE 1: FETCH ALL DATA ---
            const [
                schoolsData, usersData, classesData, feeHeadsData, eventsData, logsData, studentsData
            ] = await Promise.all([
                fetchTable('schools'),
                fetchTable('profiles', { filterBySchool: true }),
                fetchTable('classes', { filterBySchool: true }),
                fetchTable('fee_heads', { filterBySchool: true }),
                fetchTable('school_events', { filterBySchool: true }),
                fetchTable('activity_logs', { order: 'timestamp', limit: 100, filterBySchool: true }),
                fetchTable('students', { filterBySchool: true })
            ]);

            const studentIds = (studentsData || []).map((s: Student) => s.id);
            let feesData: FeeChallan[] | null = null;
            let attendanceData: Attendance[] | null = null;
            let resultsData: Result[] | null = null;

            if (studentIds.length > 0) {
                const CHUNK_SIZE = 500;
                const fetchDependentInChunks = async (tableName: string) => {
                    let allData: any[] = [];
                    for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
                        const chunk = studentIds.slice(i, i + CHUNK_SIZE);
                        const { data, error } = await supabase.from(tableName).select('*').in('student_id', chunk);
                        if (error) {
                            console.error(`Error fetching chunk for ${tableName}:`, error);
                        } else if (data) {
                            allData = allData.concat(data);
                        }
                    }
                    return toCamelCase(allData);
                };

                [feesData, attendanceData, resultsData] = await Promise.all([
                    fetchDependentInChunks('fee_challans'),
                    fetchDependentInChunks('attendance'),
                    fetchDependentInChunks('results'),
                ]);
            }
            
            // --- PHASE 2: ATOMIC DATABASE WRITE ---
            await db.transaction('rw', db.tables, async () => {
                const promises = [
                    schoolsData && db.schools.bulkPut(schoolsData),
                    usersData && db.users.bulkPut(usersData),
                    classesData && db.classes.bulkPut(classesData),
                    feeHeadsData && db.feeHeads.bulkPut(feeHeadsData),
                    eventsData && db.events.bulkPut(eventsData),
                    logsData && db.logs.bulkPut(logsData),
                    studentsData && db.students.bulkPut(studentsData),
                    feesData && db.fees.bulkPut(feesData),
                    attendanceData && db.attendance.bulkPut(attendanceData),
                    resultsData && db.results.bulkPut(resultsData),
                ].filter(Boolean);
                await Promise.all(promises);
                
                // If the student fetch returned an empty list for the context, clear dependent data.
                if (studentsData && studentsData.length === 0 && effectiveSchoolId) {
                     const localStudentsInContext = await db.students.where({ schoolId: effectiveSchoolId }).toArray();
                     const localStudentIds = localStudentsInContext.map(s => s.id);
                     if (localStudentIds.length > 0) {
                         await Promise.all([
                            db.fees.where('studentId').anyOf(localStudentIds).delete(),
                            db.attendance.where('studentId').anyOf(localStudentIds).delete(),
                            db.results.where('studentId').anyOf(localStudentIds).delete(),
                        ]);
                     }
                }
            });

            // --- PHASE 3: UPDATE REACT STATE ---
            if (schoolsData) setSchools(schoolsData);
            if (usersData) setUsers(usersData);
            if (classesData) setClasses(classesData);
            if (feeHeadsData) setFeeHeads(feeHeadsData);
            if (eventsData) setEvents(eventsData);
            if (logsData) setLogs(logsData);
            if (studentsData) setStudents(studentsData);
            
            setFees(feesData || []);
            setAttendanceState(attendanceData || []);
            setResults(resultsData || []);
            
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
            const updatedUserFromDB = toCamelCase(data) as User;
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUserFromDB : u));
            addLog('User Updated', `User profile updated for ${updatedUserFromDB.name}.`);
            showToast('Success', `${updatedUserFromDB.name}'s profile has been updated.`);
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
        const { data: { session: adminSession } } = await (supabase.auth as any).getSession();
        if (!adminSession) {
            showToast('Error', 'Your session has expired. Please log in again.', 'error');
            throw new Error("Admin session not found.");
        }
    
        // 2. Sign up the new user
        const { name, email, password, role, schoolId, status, avatarUrl } = userData;
        const { data: signUpData, error: signUpError } = await (supabase.auth as any).signUp({
            email: email!,
            password: password!,
        });
    
        // 3. Immediately restore admin session to prevent being logged out.
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

        const { error } = await supabase.from('students').delete().eq('id', studentId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        
        await fetchData();
        addLog('Student Deleted', `Student profile deleted for ${studentToDelete.name}.`);
        showToast('Success', `${studentToDelete.name}'s profile has been deleted.`);
    };

    const addClass = async (classData: Omit<Class, 'id'>) => {
        // Get current classes for the school to determine next sort order
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

        const { error } = await supabase.from('fee_challans')
            .update({ paid_amount: newPaidAmount, discount, status: newStatus, paid_date: paidDate })
            .eq('id', challanId)
            .select()
            .single();

        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Fee Payment', `Payment of Rs. ${amount} recorded for challan ${challan.challanNumber}.`);
        showToast('Success', 'Payment recorded successfully.');
    };
    
    const generateChallansForMonth = async (month: string, year: number, selectedFeeHeads: { feeHeadId: string, amount: number }[], studentIds: string[]) => {
        if (studentIds.length === 0) {
            showToast('Info', 'No students selected for challan generation.', 'info');
            return 0;
        }

        try {
            const studentMap = new Map(students.map(s => [s.id, s]));
            const feeHeadMap = new Map(feeHeads.map(fh => [fh.id, fh.name]));
            const challansToCreate: Omit<FeeChallan, 'id'>[] = [];

            const monthIndex = new Date(Date.parse(month +" 1, 2012")).getMonth();

            for (const studentId of studentIds) {
                const student = studentMap.get(studentId);
                if (!student) continue;

                const alreadyExists = fees.some(f => f.studentId === studentId && f.month === month && f.year === year);
                if (alreadyExists) continue;

                let previousBalance = student.openingBalance || 0;
                fees.forEach(f => {
                    if (f.studentId === studentId && (f.status === 'Unpaid' || f.status === 'Partial')) {
                        previousBalance += (f.totalAmount - f.discount - f.paidAmount);
                    }
                });

                const feeItems = selectedFeeHeads.map(({ feeHeadId, amount }) => ({
                    description: feeHeadMap.get(feeHeadId) || 'Unknown Fee',
                    amount: amount,
                }));

                const currentMonthTotal = feeItems.reduce((sum, item) => sum + item.amount, 0);
                const totalAmount = currentMonthTotal + previousBalance;
                
                const monthNum = (monthIndex + 1).toString().padStart(2, '0');
                const challanNumber = `${year}${monthNum}-${student.rollNumber}`;
                
                const dueDate = new Date(year, monthIndex, 10).toISOString().split('T')[0];

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
                const count = data?.length || 0;
                showToast('Success', `${count} new challans were generated for ${month}, ${year}.`, 'success');
                addLog('Challans Generated', `${count} challans generated for ${month}, ${year}.`);
                await fetchData();
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

    const issueLeavingCertificate = async (studentId: string, details: { dateOfLeaving: string; reasonForLeaving: string; conduct: Student['conduct'] }) => {
        const { error } = await supabase.from('students')
            .update(toSnakeCase({ ...details, status: 'Left' }))
            .eq('id', studentId);
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        const student = students.find(s=>s.id === studentId);
        addLog('Certificate Issued', `Leaving Certificate issued for ${student?.name}.`);
        showToast('Success', 'Leaving Certificate issued.');
    };

    const saveResults = async (resultsToSave: Omit<Result, 'id'>[]) => {
        const { error } = await supabase.from('results').upsert(toSnakeCase(resultsToSave), { onConflict: 'student_id, class_id, exam, subject' });
        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        await fetchData();
        addLog('Results Saved', `${resultsToSave.length} results saved for exam: ${resultsToSave[0]?.exam}.`);
        showToast('Success', 'Results have been saved successfully.');
    };
    
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

    const promoteAllStudents = useCallback(async (exemptedStudentIds: string[]) => {
        const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;
        if (!effectiveSchoolId) {
            showToast('Error', 'No school selected to perform promotion.', 'error');
            throw new Error('No school selected');
        }

        // FIX: Explicitly type 'c' to fix 'unknown' type error on 'c.schoolId'.
        const schoolClasses = classes.filter((c: Class) => c.schoolId === effectiveSchoolId);
        // FIX: Explicitly typed sort callback parameters 'a' and 'b' as 'Class' to resolve issue where they were being inferred as 'unknown'.
        const sortedClasses: Class[] = [...schoolClasses].sort((a: Class, b: Class) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity) || getClassLevel(a.name) - getClassLevel(b.name));

        if (sortedClasses.length < 1) {
            showToast('Info', 'No classes found to perform promotion.', 'info');
            return;
        }

        const exemptedSet = new Set(exemptedStudentIds);
        // Iterate from highest to lowest class
        for (let i = sortedClasses.length - 1; i >= 0; i--) {
            // FIX: Explicitly cast currentClass to Class to resolve 'unknown' type error.
            const currentClass = sortedClasses[i] as Class;
            // FIX: Explicitly type 's' to fix 'unknown' type error on 's.classId'.
            const studentsInClass = students.filter((s: Student) => s.classId === currentClass.id && s.status === 'Active' && !exemptedSet.has(s.id));

            if (studentsInClass.length === 0) {
                continue; // Skip empty class
            }

            // FIX: Explicitly type 's' to fix 'unknown' type error on 's.id'.
            const studentIds = studentsInClass.map((s: Student) => s.id);

            if (i === sortedClasses.length - 1) { // Highest class graduates
                const newStatus = `Class ${currentClass.name} Passed`;
                const { error } = await supabase.from('students').update({ status: newStatus }).in('id', studentIds);
                if (error) {
                    showToast('Error', `Failed to graduate students from ${currentClass.name}.`, 'error');
                    throw error;
                }
            } else { // Promote to next class
                // FIX: Explicitly cast nextClass to Class to resolve 'unknown' type error.
                const nextClass = sortedClasses[i + 1] as Class;
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

    // This function is being removed as the notifications table does not exist.
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
        await fetchData(); // Refresh local data
        addLog('Class Order Updated', `Reordered ${classesToUpdate.length} classes.`);
        showToast('Success', 'Class order saved successfully.');
    };

    const value = {
        schools, users, classes, students, attendance, fees, results, logs, feeHeads, events, loading, isInitialLoad, lastSyncTime,
        getSchoolById, updateUser, deleteUser, addStudent, updateStudent, deleteStudent,
        addClass, updateClass, deleteClass, setAttendance, recordFeePayment, generateChallansForMonth,
        addFeeHead, updateFeeHead, deleteFeeHead, issueLeavingCertificate, saveResults, addSchool,
        updateSchool, deleteSchool, addEvent, updateEvent, deleteEvent, bulkAddStudents, bulkAddUsers,
        bulkAddClasses, backupData, restoreData, addUserByAdmin, promoteAllStudents, increaseTuitionFees,
        sendFeeReminders, bulkUpdateClassOrder,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};