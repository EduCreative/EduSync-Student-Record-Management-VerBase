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
                setSchools([]); setUsers([]); setClasses([]); setStudents([]);
                setAttendanceState([]); setFees([]); setResults([]); setLogs([]);
                setFeeHeads([]); setEvents([]);
                return;
            }

            setLoading(true);

            const effectiveSchoolId = user.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user.schoolId;

            // Helper function to fetch data from a single table
            const fetchTable = async (tableName: string, options: { order?: string, limit?: number, filterBySchool?: boolean } = {}) => {
                let query = supabase.from(tableName).select('*');
                
                if (options.filterBySchool) {
                    if (effectiveSchoolId) {
                        query = query.eq('school_id', effectiveSchoolId);
                    } else if (user.role !== UserRole.Owner && user.schoolId) {
                        query = query.eq('school_id', user.schoolId);
                    } else if (user.role !== UserRole.Owner && !user.schoolId) {
                        return []; // Non-owners must have a school context
                    }
                    // For Owner global view, no filter is applied, fetching all.
                }
                
                if (options.order) query = query.order(options.order, { ascending: false });
                if (options.limit) query = query.limit(options.limit);
                
                const { data, error } = await query;
                if (error) {
                    throw new Error(`Could not load data for ${tableName}.`);
                }
                return toCamelCase(data || []);
            };
            
            // Helper to process settled promises
            const handleResult = <T,>(result: PromiseSettledResult<T>, setter: React.Dispatch<React.SetStateAction<T>>, tableName: string): T => {
                if (result.status === 'fulfilled') {
                    setter(result.value);
                    return result.value;
                } else {
                    console.error(`Failed to fetch ${tableName}:`, result.reason);
                    showToast('Data Load Error', result.reason.message || `Could not load data for ${tableName}.`, 'error');
                    setter([] as T); // Set state to empty array on failure
                    return [] as T;
                }
            };
            
            // Step 1: Fetch all data concurrently and handle individual failures
            const dataPromises = await Promise.allSettled([
                fetchTable('schools'),
                fetchTable('profiles', { filterBySchool: true }),
                fetchTable('classes', { filterBySchool: true }),
                fetchTable('students', { filterBySchool: true }),
                fetchTable('attendance', { filterBySchool: true }), // <-- Potential failure point
                fetchTable('results', { filterBySchool: true }),     // <-- Potential failure point
                fetchTable('activity_logs', { order: 'timestamp', limit: 100, filterBySchool: true }),
                fetchTable('fee_heads', { filterBySchool: true }),
                fetchTable('school_events', { filterBySchool: true }),
                fetchTable('fee_challans'), // Fetches all, filters on client
            ]);

            const [
                schoolsRes, usersRes, classesRes, studentsRes, attendanceRes,
                resultsRes, logsRes, feeHeadsRes, eventsRes, allFeesRes
            ] = dataPromises;

            // Step 2: Process results, setting state for success and showing toasts for failure
            const studentsData = handleResult(studentsRes, setStudents, 'Students');
            const allFeesData = handleResult(allFeesRes, setFees, 'Fee Challans');

            handleResult(schoolsRes, setSchools, 'Schools');
            handleResult(usersRes, setUsers, 'Users');
            handleResult(classesRes, setClasses, 'Classes');
            handleResult(attendanceRes, setAttendanceState, 'Attendance');
            handleResult(resultsRes, setResults, 'Results');
            handleResult(logsRes, setLogs, 'Activity Logs');
            handleResult(feeHeadsRes, setFeeHeads, 'Fee Heads');
            handleResult(eventsRes, setEvents, 'School Events');

            // Step 3: Perform any client-side filtering after data is loaded
            // This ensures that even if other fetches fail, fees can be filtered against the students that did load.
            const schoolStudentIds = new Set((studentsData as Student[]).map(s => s.id));
            const feesData = (allFeesData as FeeChallan[]).filter(fee => schoolStudentIds.has(fee.studentId));
            setFees(feesData);
            
            updateSyncTime();
            setLoading(false);
        };

        fetchData();
    }, [user, activeSchoolId, showToast, updateSyncTime]);
    
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
        updateSyncTime();
    }, [user, activeSchoolId, updateSyncTime]);

    const getSchoolById = useCallback((schoolId: string) => schools.find(s => s.id === schoolId), [schools]);
    
    const addUser = async (userData: Omit<User, 'id'>, password?: string) => {
        if (!password) {
            return showToast('Error', 'A password is required to create a new user.', 'error');
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: userData.email,
            password: password,
        });

        if (signUpError) {
            return showToast('Error', `Could not create auth user: ${signUpError.message}`, 'error');
        }

        if (!signUpData.user) {
            return showToast('Error', 'User was not created in authentication system. They may already exist.', 'error');
        }

        const profileData = { ...userData, id: signUpData.user.id };
        const { data: profileInsertData, error: profileError } = await supabase
            .from('profiles')
            .insert(toSnakeCase(profileData))
            .select()
            .single();
        
        if (profileError) {
            console.error("Failed to create user profile:", profileError.message);
            return showToast('Error', 'Auth user created, but profile creation failed. Please contact support.', 'error');
        }
        
        if (profileInsertData) {
            const newUser = toCamelCase(profileInsertData) as User;
            setUsers(prev => [...prev, newUser]);
            addLog('User Added', `New user created: ${newUser.name}.`);
            showToast('Success', `User ${newUser.name} created. They must confirm their email to log in.`);
        }
    };

    const updateUser = async (updatedUser: User) => {
        const { data, error } = await supabase.from('profiles').update(toSnakeCase(updatedUser)).eq('id', updatedUser.id).select().single();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            const updatedUserFromDB = toCamelCase(data) as User;
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUserFromDB : u));
            addLog('User Updated', `User profile updated for ${updatedUserFromDB.name}.`);
            showToast('Success', `${updatedUserFromDB.name}'s profile has been updated.`);
        }
    };

    const deleteUser = async (userId: string) => {
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
        const newStudent = { ...studentData, status: 'Active' as const };
        const { data, error } = await supabase.from('students').insert(toSnakeCase(newStudent)).select().single();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            setStudents(prev => [...prev, toCamelCase(data) as Student]);
            addLog('Student Added', `New student added: ${newStudent.name}.`);
            showToast('Success', `${newStudent.name} has been added.`);
        }
    };
    
    const updateStudent = async (updatedStudent: Student) => {
        const { data, error } = await supabase.from('students').update(toSnakeCase(updatedStudent)).eq('id', updatedStudent.id).select().single();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            const updatedStudentFromDB = toCamelCase(data) as Student;
            setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudentFromDB : s));
            addLog('Student Updated', `Profile updated for ${updatedStudentFromDB.name}.`);
            showToast('Success', `${updatedStudentFromDB.name}'s profile has been updated.`);
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
    
    const addClass = async (classData: Omit<Class, 'id'>) => {
        const { data, error } = await supabase.from('classes').insert(toSnakeCase(classData)).select().single();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            const newClass = toCamelCase(data) as Class;
            setClasses(prev => [...prev, newClass]);
            addLog('Class Added', `New class added: ${newClass.name}.`);
            showToast('Success', `Class "${newClass.name}" has been created.`);
        }
    };

    const updateClass = async (updatedClass: Class) => {
        const { data, error } = await supabase.from('classes').update(toSnakeCase(updatedClass)).eq('id', updatedClass.id).select().single();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            const updatedClassFromDB = toCamelCase(data) as Class;
            setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClassFromDB : c));
            addLog('Class Updated', `Class details updated for ${updatedClassFromDB.name}.`);
            showToast('Success', `Class "${updatedClassFromDB.name}" has been updated.`);
        }
    };
    
    const deleteClass = async (classId: string) => {
        const studentInClass = students.some(s => s.classId === classId);
        if (studentInClass) {
            return showToast('Error', 'Cannot delete class with students assigned.', 'error');
        }

        const classToDelete = classes.find(c => c.id === classId);

        const { error } = await supabase.from('classes').delete().eq('id', classId);
        if (error) return showToast('Error', error.message, 'error');

        setClasses(prev => prev.filter(c => c.id !== classId));
        if (classToDelete) {
            addLog('Class Deleted', `Class deleted: ${classToDelete.name}.`);
            showToast('Success', `Class "${classToDelete.name}" deleted.`);
        }
    };

    const setAttendance = async (date: string, attendanceData: { studentId: string; status: 'Present' | 'Absent' | 'Leave' }[]) => {
        if (!user) return;
        const effectiveSchoolId = user.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user.schoolId;
        const recordsToUpsert = attendanceData.map(item => ({
            student_id: item.studentId,
            date: date,
            status: item.status,
            school_id: effectiveSchoolId
        }));

        const { data, error } = await supabase.from('attendance').upsert(recordsToUpsert, { onConflict: 'student_id, date' }).select();
        
        if (error) return showToast('Error', `Failed to save attendance: ${error.message}`, 'error');
        
        if (data && data.length > 0) {
            const upsertedRecords = toCamelCase(data) as Attendance[];
            const otherDayRecords = attendance.filter(a => a.date !== date);
            setAttendanceState([...otherDayRecords, ...upsertedRecords]);
            addLog('Attendance Marked', `Attendance marked for date ${date}.`);
            showToast('Success', 'Attendance saved successfully.');
        }
    };

    const recordFeePayment = async (challanId: string, amount: number, discount: number, paidDate: string) => {
        const challan = fees.find(f => f.id === challanId);
        if (!challan) return showToast('Error', 'Challan not found.', 'error');

        const newPaidAmount = challan.paidAmount + amount;
        const newStatus = newPaidAmount + discount >= challan.totalAmount ? 'Paid' : 'Partial';

        const { data, error } = await supabase.from('fee_challans')
            .update({ 
                paid_amount: newPaidAmount, 
                status: newStatus, 
                discount: discount,
                paid_date: paidDate 
            })
            .eq('id', challanId)
            .select()
            .single();

        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            setFees(prev => prev.map(f => f.id === challanId ? toCamelCase(data) as FeeChallan : f));
            const student = students.find(s => s.id === challan.studentId);
            if (student) {
                addLog('Fee Payment Recorded', `Payment of Rs. ${amount} for ${student.name}.`);
            }
            showToast('Success', 'Payment recorded successfully.');
        }
    };
    
    const generateChallansForMonth = async (schoolId: string, month: string, year: number, selectedFeeHeads: { feeHeadId: string, amount: number }[]): Promise<number> => {
        const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
        const activeStudents = students.filter(s => s.schoolId === schoolId && s.status === 'Active');
        if (activeStudents.length === 0) {
            showToast('Info', 'No active students found to generate challans for.', 'info');
            return 0;
        }
        
        const feeHeadsMap = new Map(feeHeads.map(fh => [fh.id, fh]));
        const challansToCreate: Omit<FeeChallan, 'id'>[] = [];

        for (const student of activeStudents) {
            const alreadyExists = fees.some(f => f.studentId === student.id && f.month === month && f.year === year);
            if (alreadyExists) continue;

            const feeItems: { description: string, amount: number }[] = [];
            let totalAmount = 0;

            student.feeStructure?.forEach(fee => {
                const feeHead = feeHeadsMap.get(fee.feeHeadId);
                if (feeHead) {
                    feeItems.push({ description: feeHead.name, amount: fee.amount });
                    totalAmount += fee.amount;
                }
            });

            selectedFeeHeads.forEach(selectedFee => {
                 const feeHead = feeHeadsMap.get(selectedFee.feeHeadId);
                 if (feeHead && !feeItems.some(item => item.description === feeHead.name)) {
                     feeItems.push({ description: feeHead.name, amount: selectedFee.amount });
                     totalAmount += selectedFee.amount;
                 }
            });

            const previousBalance = student.openingBalance || 0;
            if (previousBalance > 0) {
                totalAmount += previousBalance;
            }

            const dueDate = new Date(year, months.indexOf(month), 10);

            challansToCreate.push({
                challanNumber: `CHN-${year}${String(months.indexOf(month)+1).padStart(2,'0')}-${String(Math.floor(1000 + Math.random() * 9000))}`,
                studentId: student.id, classId: student.classId, month, year,
                dueDate: dueDate.toISOString().split('T')[0], status: 'Unpaid',
                feeItems, previousBalance, totalAmount, discount: 0, paidAmount: 0,
            });
        }

        if (challansToCreate.length === 0) {
            showToast('Info', 'All challans for this month and class already exist.', 'info');
            return 0;
        }

        const { data, error } = await supabase.from('fee_challans').insert(challansToCreate.map(toSnakeCase)).select();
        if (error) {
            showToast('Error', `Failed to generate challans: ${error.message}`, 'error');
            return 0;
        }

        if (data) {
            setFees(prev => [...prev, ...toCamelCase(data) as FeeChallan[]]);
            addLog('Challans Generated', `${data.length} challans generated for ${month} ${year}.`);
            showToast('Success', `${data.length} fee challans have been generated.`);
            return data.length;
        }
        return 0;
    };

    const addFeeHead = async (feeHeadData: Omit<FeeHead, 'id'>) => {
        const { data, error } = await supabase.from('fee_heads').insert(toSnakeCase(feeHeadData)).select().single();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            setFeeHeads(prev => [...prev, toCamelCase(data) as FeeHead]);
            addLog('Fee Head Added', `New fee head created: ${feeHeadData.name}.`);
            showToast('Success', `Fee Head "${feeHeadData.name}" added.`);
        }
    };

    const updateFeeHead = async (updatedFeeHead: FeeHead) => {
        const { data, error } = await supabase.from('fee_heads').update(toSnakeCase(updatedFeeHead)).eq('id', updatedFeeHead.id).select().single();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            const updatedFeeHeadFromDB = toCamelCase(data) as FeeHead;
            setFeeHeads(prev => prev.map(fh => fh.id === updatedFeeHead.id ? updatedFeeHeadFromDB : fh));
            addLog('Fee Head Updated', `Fee head updated: ${updatedFeeHeadFromDB.name}.`);
            showToast('Success', `Fee Head "${updatedFeeHeadFromDB.name}" updated.`);
        }
    };

    const deleteFeeHead = async (feeHeadId: string) => {
        const { error } = await supabase.from('fee_heads').delete().eq('id', feeHeadId);
        if (error) return showToast('Error', error.message, 'error');

        const feeHeadToDelete = feeHeads.find(fh => fh.id === feeHeadId);
        setFeeHeads(prev => prev.filter(fh => fh.id !== feeHeadId));
        if (feeHeadToDelete) {
             addLog('Fee Head Deleted', `Fee head deleted: ${feeHeadToDelete.name}.`);
             showToast('Success', `Fee Head "${feeHeadToDelete.name}" deleted.`);
        }
    };

    const issueLeavingCertificate = async (studentId: string, details: { dateOfLeaving: string; reasonForLeaving: string; conduct: Student['conduct'] }) => {
        const studentUpdate = { ...details, status: 'Left' as const };
        const { data, error } = await supabase.from('students').update(toSnakeCase(studentUpdate)).eq('id', studentId).select().single();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            updateStudent(toCamelCase(data) as Student); 
            addLog('Certificate Issued', `Leaving certificate issued for student ID ${studentId}.`);
            showToast('Success', `Leaving Certificate has been processed.`);
        }
    };
    
    const saveResults = async (resultsToSave: Omit<Result, 'id'>[]) => {
        if (!user) return;
        const effectiveSchoolId = user.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user.schoolId;
        const recordsToUpsert = resultsToSave.map(r => toSnakeCase({ ...r, school_id: effectiveSchoolId }));
        
        const { data, error } = await supabase.from('results').upsert(recordsToUpsert, { onConflict: 'student_id, exam, subject' }).select();

        if (error) return showToast('Error', `Failed to save results: ${error.message}`, 'error');

        if (data) {
            const upsertedResults: Result[] = toCamelCase(data) as Result[];
            const upsertedMap = new Map(upsertedResults.map((r) => [`${r.studentId}-${r.exam}-${r.subject}`, r]));
            const oldResultsFiltered = results.filter(r => !upsertedMap.has(`${r.studentId}-${r.exam}-${r.subject}`));
            
            setResults([...oldResultsFiltered, ...upsertedResults]);
            addLog('Results Saved', `Results saved.`);
            showToast('Success', 'Results have been saved.');
        }
    };

    const addSchool = async (name: string, address: string, logoUrl?: string | null) => {
        if (!user || user.role !== UserRole.Owner) {
            return showToast('Error', 'You do not have permission to add schools.', 'error');
        }
        const newSchool: Omit<School, 'id'> = { name, address, logoUrl };
        const { data, error } = await supabase.from('schools').insert(toSnakeCase(newSchool)).select().single();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            const addedSchool: School = toCamelCase(data) as School;
            setSchools(prev => [...prev, addedSchool]);
            addLog('School Added', `New school added: ${addedSchool.name}.`);
            showToast('Success', `School "${addedSchool.name}" has been created.`);
        }
    };

    const updateSchool = async (updatedSchool: School) => {
        const { data, error } = await supabase.from('schools').update(toSnakeCase(updatedSchool)).eq('id', updatedSchool.id).select().single();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            const updatedSchoolFromDB = toCamelCase(data) as School;
            setSchools(prev => prev.map(s => s.id === updatedSchool.id ? updatedSchoolFromDB : s));
            addLog('School Updated', `Details updated for ${updatedSchoolFromDB.name}.`);
            showToast('Success', `${updatedSchoolFromDB.name}'s details have been updated.`);
        }
    };

    const deleteSchool = async (schoolId: string) => {
        const schoolToDelete = schools.find(s => s.id === schoolId);

        const { error } = await supabase.from('schools').delete().eq('id', schoolId);
        if (error) return showToast('Error', error.message, 'error');

        setSchools(prev => prev.filter(s => s.id !== schoolId));
        if (schoolToDelete) {
             addLog('School Deleted', `School deleted: ${schoolToDelete.name}.`);
             showToast('Success', `${schoolToDelete.name} has been deleted.`);
        }
    };

    const addEvent = async (eventData: Omit<SchoolEvent, 'id'>) => {
        const { data, error } = await supabase.from('school_events').insert(toSnakeCase(eventData)).select().single();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            const newEvent = toCamelCase(data) as SchoolEvent;
            setEvents(prev => [...prev, newEvent]);
            addLog('Event Added', `New event created: ${newEvent.title}.`);
            showToast('Success', `Event "${newEvent.title}" has been created.`);
        }
    };

    const updateEvent = async (updatedEvent: SchoolEvent) => {
        const { data, error } = await supabase.from('school_events').update(toSnakeCase(updatedEvent)).eq('id', updatedEvent.id).select().single();
        if (error) return showToast('Error', error.message, 'error');
        if (data) {
            const updatedEventFromDB = toCamelCase(data) as SchoolEvent;
            setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEventFromDB : e));
            addLog('Event Updated', `Event details updated for ${updatedEventFromDB.title}.`);
            showToast('Success', `Event "${updatedEventFromDB.title}" has been updated.`);
        }
    };

    const deleteEvent = async (eventId: string) => {
        const eventToDelete = events.find(e => e.id === eventId);
        const { error } = await supabase.from('school_events').delete().eq('id', eventId);
        if (error) return showToast('Error', error.message, 'error');

        setEvents(prev => prev.filter(e => e.id !== eventId));
        if (eventToDelete) {
            addLog('Event Deleted', `Event deleted: ${eventToDelete.title}.`);
            showToast('Success', `Event "${eventToDelete.title}" deleted.`);
        }
    };

    const bulkAddStudents = async (studentsToAdd: Omit<Student, 'id' | 'status'>[]) => {
        const newStudents = studentsToAdd.map(s => ({ ...s, status: 'Active' as const }));
        const { data, error } = await supabase.from('students').insert(newStudents.map(toSnakeCase)).select();
        
        if (error) {
            return showToast('Error', `Bulk import failed: ${error.message}`, 'error');
        }

        if (data) {
            const addedStudents = toCamelCase(data) as Student[];
            setStudents(prev => [...prev, ...addedStudents]);
            addLog('Bulk Student Import', `${addedStudents.length} new students imported.`);
            showToast('Success', `${addedStudents.length} students imported successfully.`);
        }
    };
    
    const bulkAddUsers = async (usersToAdd: (Omit<User, 'id'> & { password?: string })[]) => {
        let successCount = 0;
        for (const userData of usersToAdd) {
            const { password, ...profileData } = userData;
            if (password) {
                 const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: userData.email, password: password,
                });
                if (signUpError || !signUpData.user) {
                     showToast('Error', `Could not create auth user for ${userData.email}: ${signUpError?.message}`, 'error');
                     continue;
                }
                const { error: profileError } = await supabase.from('profiles').insert(toSnakeCase({ ...profileData, id: signUpData.user.id }));
                if (profileError) {
                     showToast('Error', `Auth user created, but profile failed for ${userData.email}.`, 'error');
                } else {
                    successCount++;
                }
            }
        }
        const { data } = await supabase.from('profiles').select('*');
        if(data) setUsers(toCamelCase(data) as User[]);
        
        addLog('Bulk User Import', `${successCount} new users imported.`);
        showToast('Success', `${successCount} out of ${usersToAdd.length} users imported. Check for individual errors.`);
    };

    const bulkAddClasses = async (classesToAdd: Omit<Class, 'id'>[]) => {
        if (!user) return;
        const effectiveSchoolId = user.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user.schoolId;

        const newClasses = classesToAdd.map(c => ({ ...c, schoolId: effectiveSchoolId }));
        const { data, error } = await supabase.from('classes').insert(newClasses.map(toSnakeCase)).select();
        
        if (error) {
            return showToast('Error', `Bulk import failed: ${error.message}`, 'error');
        }

        if (data) {
            const addedClasses = toCamelCase(data) as Class[];
            setClasses(prev => [...prev, ...addedClasses]);
            addLog('Bulk Class Import', `${addedClasses.length} new classes imported.`);
            showToast('Success', `${addedClasses.length} classes imported successfully.`);
        }
    };


    const value: DataContextType = {
        schools, users, classes, students, attendance, fees, results, logs, feeHeads, events, loading,
        getSchoolById, addUser, updateUser, deleteUser, addStudent, updateStudent, deleteStudent,
        addClass, updateClass, deleteClass, setAttendance, recordFeePayment, generateChallansForMonth,
        addFeeHead, updateFeeHead, deleteFeeHead, issueLeavingCertificate, saveResults,
        addSchool, updateSchool, deleteSchool, addEvent, updateEvent, deleteEvent,
        bulkAddStudents, bulkAddUsers, bulkAddClasses,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};