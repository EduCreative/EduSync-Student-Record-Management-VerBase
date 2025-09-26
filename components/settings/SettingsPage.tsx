
import React, { useRef, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole, Student, Class } from '../../types';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

const SettingsPage: React.FC = () => {
    const { theme, toggleTheme, fontSize, increaseFontSize, decreaseFontSize, resetFontSize } = useTheme();
    const { user } = useAuth();
    const { students, classes, users, addStudent, updateStudent, addClass, updateClass, feeHeads } = useData();
    const { showToast } = useToast();
    const studentImportRef = useRef<HTMLInputElement>(null);
    const classImportRef = useRef<HTMLInputElement>(null);

    const isDataAdmin = user?.role === UserRole.Admin || user?.role === UserRole.Owner;

    const fontSizeTextMap = {
        sm: 'Small',
        base: 'Default',
        lg: 'Large',
    };

    const schoolFeeHeads = useMemo(() => feeHeads.filter(fh => fh.schoolId === user?.schoolId), [feeHeads, user]);
    
    // --- CSV UTILS ---
    const downloadCsv = (filename: string, content: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadStudentSample = () => {
        const headers = "name,classId,rollNumber,fatherName,fatherCnic,dateOfBirth,dateOfAdmission,contactNumber,secondaryContactNumber,address,gender,openingBalance,lastSchoolAttended,admittedInClass,Tuition Fee\n";
        const row = "John Doe,class-1,10A-99,Richard Doe,12345-1234567-1,2008-05-10,2020-04-01,0300-1234567,0301-7654321,123 Main St,Male,1500,Previous School,Grade 9,20000\n";
        downloadCsv('student_import_sample.csv', headers + row);
    };

    const handleExportStudents = () => {
        const feeHeadCols = schoolFeeHeads.map(fh => fh.name);
        const feeHeadIdToNameMap = new Map(schoolFeeHeads.map(fh => [fh.id, fh.name]));

        const headers = ["id", "name", "classId", "rollNumber", "fatherName", "fatherCnic", "dateOfBirth", "dateOfAdmission", "contactNumber", "secondaryContactNumber", "address", "gender", "openingBalance", "lastSchoolAttended", "admittedInClass", ...feeHeadCols];
        
        const rows = students
            .filter(s => s.schoolId === user?.schoolId)
            .map(s => {
                const feeAmounts = new Map(s.feeStructure?.map(f => [feeHeadIdToNameMap.get(f.feeHeadId), f.amount]));
                const feeValues = feeHeadCols.map(colName => feeAmounts.get(colName) || '');
                return [s.id, s.name, s.classId, s.rollNumber, s.fatherName, s.fatherCnic, s.dateOfBirth, s.dateOfAdmission, s.contactNumber, s.secondaryContactNumber || '', s.address, s.gender, s.openingBalance || 0, s.lastSchoolAttended || '', s.admittedInClass || '', ...feeValues];
            });
        
        const processRow = (row: (string|number)[]) => row.map(val => {
            const strVal = String(val ?? '').replace(/"/g, '""');
            return `"${strVal}"`;
        }).join(',');

        const content = [headers, ...rows].map(processRow).join('\n');
        downloadCsv('students_export.csv', content);
    };

    const handleImportStudents = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        const feeHeadNameToIdMap = new Map(schoolFeeHeads.map(fh => [fh.name, fh.id]));

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            // FIX: The result from FileReader can be an ArrayBuffer. Added a type guard to ensure it's a string before processing.
            if (typeof result !== 'string') {
                showToast('Error', 'Could not read file.', 'error');
                return;
            }
            const text = result;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            let added = 0, updated = 0;
            for(let i = 1; i < lines.length; i++) {
                const data = lines[i].split(',').map(d => d.trim().replace(/"/g, ''));
                
                const feeStructure: { feeHeadId: string; amount: number }[] = [];
                const studentData: Record<string, any> = {};

                headers.forEach((header, index) => {
                    if (feeHeadNameToIdMap.has(header)) {
                        const feeHeadId = feeHeadNameToIdMap.get(header)!;
                        const amount = Number(data[index]);
                        if (!isNaN(amount)) {
                            feeStructure.push({ feeHeadId, amount });
                        }
                    } else {
                        studentData[header] = data[index];
                    }
                });

                const studentObj: Partial<Student> & { id?: string } = {
                    name: studentData.name,
                    classId: studentData.classId,
                    rollNumber: studentData.rollNumber,
                    fatherName: studentData.fatherName,
                    fatherCnic: studentData.fatherCnic,
                    dateOfBirth: studentData.dateOfBirth,
                    dateOfAdmission: studentData.dateOfAdmission,
                    contactNumber: studentData.contactNumber,
                    secondaryContactNumber: studentData.secondaryContactNumber,
                    address: studentData.address,
                    gender: studentData.gender as 'Male' | 'Female',
                    openingBalance: Number(studentData.openingBalance) || 0,
                    lastSchoolAttended: studentData.lastSchoolAttended,
                    admittedInClass: studentData.admittedInClass,
                    id: studentData.id,
                    feeStructure,
                };

                if (!studentObj.name || !studentObj.classId) continue;
                
                const existingStudent = studentObj.id ? students.find(s => s.id === studentObj.id) : null;
                if (existingStudent) {
                    updateStudent({ ...existingStudent, ...studentObj });
                    updated++;
                } else {
                    addStudent({ schoolId: user.schoolId, ...studentObj } as Omit<Student, 'id' | 'status'>);
                    added++;
                }
            }
            showToast('Import Complete', `${added} students added, ${updated} updated.`);
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    };
    
    // --- CLASS CSV ---
    const handleDownloadClassSample = () => {
        const headers = "id,name,teacherId\n";
        const row = "class-1,Grade 10 - Section A,user-4\n";
        downloadCsv('class_import_sample.csv', headers + row);
    };
    
    const handleExportClasses = () => {
        const headers = ["id", "name", "teacherId"];
        const rows = classes
            .filter(c => c.schoolId === user?.schoolId)
            .map(c => [c.id, c.name, c.teacherId]);
        
        const content = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        downloadCsv('classes_export.csv', content);
    };
    
    const handleImportClasses = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Similar logic to student import
        showToast('Info', 'Class import functionality is being implemented.');
        event.target.value = '';
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Settings</h1>

            {/* Appearance Settings Card */}
            <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 border-b dark:border-secondary-700 pb-3">Appearance</h2>
                <div className="space-y-6">
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-md font-medium text-secondary-900 dark:text-white">Theme</h3>
                            <p className="text-sm text-secondary-500 dark:text-secondary-400">
                                Switch between light and dark mode.
                            </p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="flex items-center space-x-2 px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition"
                        >
                            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                            <span className="capitalize">{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                        </button>
                    </div>

                    {/* Font Size Selector */}
                    <div className="flex items-center justify-between">
                         <div>
                            <h3 className="text-md font-medium text-secondary-900 dark:text-white">Font Size</h3>
                            <p className="text-sm text-secondary-500 dark:text-secondary-400">
                                Adjust the application's font size. Current: <span className="font-semibold">{fontSizeTextMap[fontSize]}</span>
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={decreaseFontSize}
                                disabled={fontSize === 'sm'}
                                className="px-4 py-2 text-sm rounded-lg transition-colors border border-secondary-300 dark:border-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Decrease font size"
                            >
                                Decrease
                            </button>
                             <button
                                onClick={resetFontSize}
                                className="px-4 py-2 text-sm rounded-lg transition-colors border border-secondary-300 dark:border-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                                aria-label="Reset font size to default"
                            >
                                Reset
                            </button>
                             <button
                                onClick={increaseFontSize}
                                disabled={fontSize === 'lg'}
                                className="px-4 py-2 text-sm rounded-lg transition-colors border border-secondary-300 dark:border-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Increase font size"
                            >
                                Increase
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isDataAdmin && (
                <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 border-b dark:border-secondary-700 pb-3">Data Management</h2>
                    <input type="file" ref={studentImportRef} onChange={handleImportStudents} className="hidden" accept=".csv" />
                    <input type="file" ref={classImportRef} onChange={handleImportClasses} className="hidden" accept=".csv" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Student Data Section */}
                        <div className="p-4 border rounded-lg dark:border-secondary-700">
                            <h3 className="font-semibold mb-3">Student Data</h3>
                            <div className="space-y-2">
                                <button onClick={handleDownloadStudentSample} className="data-btn">Download Sample CSV</button>
                                <button onClick={() => studentImportRef.current?.click()} className="data-btn">Import from CSV</button>
                                <button onClick={handleExportStudents} className="data-btn">Export All Students</button>
                            </div>
                        </div>
                        {/* Class Data Section */}
                        <div className="p-4 border rounded-lg dark:border-secondary-700">
                            <h3 className="font-semibold mb-3">Class Data</h3>
                             <div className="space-y-2">
                                <button onClick={handleDownloadClassSample} className="data-btn">Download Sample CSV</button>
                                <button onClick={() => classImportRef.current?.click()} className="data-btn">Import from CSV</button>
                                <button onClick={handleExportClasses} className="data-btn">Export All Classes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* About Card */}
            <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
                 <h2 className="text-xl font-semibold mb-4 border-b dark:border-secondary-700 pb-3">About EduSync</h2>
                 <div className="space-y-4 text-sm text-secondary-600 dark:text-secondary-400">
                    <p>
                        EduSync is a comprehensive, responsive Student Record Management System designed to streamline school administration. It supports multiple user roles, including Owners, Admins, Accountants, Teachers, Parents, and Students, with role-based access control.
                    </p>
                    <p>
                        Version: 1.1.0
                    </p>
                 </div>
            </div>
            <style>{`
                .data-btn {
                    display: block; width: 100%; text-align: left; padding: 0.5rem 1rem; border-radius: 0.375rem;
                    background-color: #f9fafb; border: 1px solid #d1d5db;
                    transition: background-color 0.2s;
                }
                .dark .data-btn {
                    background-color: #374151; border-color: #4b5563;
                }
                .data-btn:hover {
                    background-color: #f3f4f6;
                }
                .dark .data-btn:hover {
                    background-color: #4b5563;
                }
            `}</style>
        </div>
    );
};


const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);


export default SettingsPage;
