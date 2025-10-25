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
                // For Admin or Owner-as-Admin views, we need to include unassigned users for approval.
                // This logic specifically applies when fetching the 'profiles' table.
                const isAdminManagingUsers = (tableName === 'profiles' && (user.role === UserRole.Admin || (user.role === UserRole.Owner && activeSchoolId)));
        
                if (effectiveSchoolId) {
                    if (isAdminManagingUsers) {
                        // When managing users, fetch users from the current school OR unassigned ones.
                        query = query.or(`school_id.eq.${effectiveSchoolId},school_id.is.null`);
                    } else {
                        // For all other data (students, classes, etc.), filter strictly by school.
                        query = query.eq('school_id', effectiveSchoolId);
                    }
                } else if (user.role === UserRole.Owner) {
                    // This is the Owner's global view (no specific school selected). No filter is applied, which is correct.
                } else if (user.schoolId) {
                    // This handles other roles like Teacher, Accountant. They only see their own school's data.
                    query = query.eq('school_id', user.schoolId);
                } else {
                    // A non-owner with no schoolId assigned should not see any school-specific data.
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
        const { data: { session: adminSession } } = await supabase.auth.getSession();
        if (!adminSession) {
            showToast('Error', 'Your session has expired. Please log in again.', 'error');
            throw new Error("Admin session not found.");
        }

        // 2. Sign up the new user
        const { name, email, password, role, schoolId, status, avatarUrl } = userData;
        const { error: signUpError } = await supabase.auth.signUp({
            email: email!,
            password: password!,
            options: {
                data: toSnakeCase({
                    name,
                    role,
                    schoolId,
                    status: status || 'Pending Approval',
                    avatarUrl
                })
            }
        });

        // 3. Immediately restore admin session to prevent being logged out.
        const { error: setSessionError } = await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
        });

        // 4. Handle errors after session is restored.
        if (setSessionError) {
            showToast('Critical Error', 'Could not restore your session. Please log in again.', 'error');
            // This is a critical failure. Force a reload to the login page.
            window.location.reload();
            throw setSessionError;
        }

        if (signUpError) {
            showToast('Error Creating User', signUpError.message, 'error');
            throw signUpError;
        }

        // 5. Success: Refresh data and notify.
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
        // NOTE: If this function fails with a "schema cache" error, it may be because the `generate_monthly_challans`
        // function was recently updated in the database. A hard refresh of the browser or restarting the application
        // usually forces the Supabase client to refresh its cache and resolve the issue.
        const { data: count, error } = await supabase.rpc('generate_monthly_challans', {
            p_school_id: schoolId,
            p_month: month,
            p_year: year,
            p_fee_items: selectedFeeHeads.map(fh => ({ fee_head_id: fh.feeHeadId, amount: fh.amount }))
        });

        if (error) {
            showToast('Error', error.message, 'error');
            throw new Error(error.message);
        }
        
        showToast('Success', `${count || 0} new challans were generated for ${month}, ${year}.`, 'success');
        addLog('Challans Generated', `${count || 0} challans generated for ${month}, ${year}.`);
        await fetchData(); // Refresh all data
        return count || 0;
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

    const value = {
        schools, users, classes, students, attendance, fees, results, logs, feeHeads, events, loading,
        getSchoolById, updateUser, deleteUser, addStudent, updateStudent, deleteStudent,
        addClass, updateClass, deleteClass, setAttendance, recordFeePayment, generateChallansForMonth,
        addFeeHead, updateFeeHead, deleteFeeHead, issueLeavingCertificate, saveResults, addSchool,
        updateSchool, deleteSchool, addEvent, updateEvent, deleteEvent, bulkAddStudents, bulkAddUsers,
        bulkAddClasses, backupData, restoreData, addUserByAdmin,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};