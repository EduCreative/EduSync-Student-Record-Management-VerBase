

export enum UserRole {
    Owner = 'Owner',
    Admin = 'Admin',
    Accountant = 'Accountant',
    Teacher = 'Teacher',
    Parent = 'Parent',
    Student = 'Student',
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    schoolId: string;
    status: 'Active' | 'Inactive' | 'Pending Approval' | 'Suspended';
    avatarUrl?: string | null;
    lastLogin?: string;
    childStudentIds?: string[]; // Added for Parent role
    disabledNavLinks?: string[]; // For Owner to disable menu items for a user
}

export interface School {
    id: string;
    name: string;
    address: string;
    logoUrl?: string | null;
}

export interface Class {
    id: string;
    name: string;
    teacherId: string | null;
    schoolId: string;
}

export interface Student {
    id: string;
    userId?: string | null;
    name: string;
    classId: string;
    schoolId: string;
    rollNumber: string;
    avatarUrl?: string | null;
    fatherName: string;
    fatherCnic: string;
    dateOfBirth: string;
    dateOfAdmission: string;
    contactNumber: string;
    secondaryContactNumber?: string;
    address: string;
    // New fields for leaving certificate and photo management
    status: 'Active' | 'Inactive' | 'Left';
    gender: 'Male' | 'Female';
    dateOfLeaving?: string;
    reasonForLeaving?: string;
    conduct?: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    // Fields for individual fee management
    openingBalance?: number;
    feeStructure?: { feeHeadId: string; amount: number }[];
    // FIX: Re-added fields as per user request and renamed `admittedInClass` to `admittedClass` to fix DB column name mismatch.
    admittedClass: string;
    caste?: string;
    lastSchoolAttended?: string;
}

export interface Attendance {
    id: string;
    studentId: string;
    date: string;
    status: 'Present' | 'Absent' | 'Leave';
}

export interface FeeHead {
    id: string;
    name: string;
    defaultAmount: number;
    schoolId: string;
}

export interface FeeChallan {
    id: string;
    challanNumber: string;
    studentId: string;
    classId: string;
    month: string;
    year: number;
    dueDate: string;
    status: 'Paid' | 'Unpaid' | 'Partial';
    feeItems: { description: string; amount: number }[];
    previousBalance: number;
    totalAmount: number;
    discount: number;
    paidAmount: number;
    paidDate?: string;
}


export interface Result {
    id: string;
    studentId: string;
    classId: string;
    exam: string;
    subject: string;
    marks: number;
    totalMarks: number;
}

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    schoolId: string;
    action: string;
    details: string;
    timestamp: string;
}

export interface SchoolEvent {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    category: 'Holiday' | 'Exam' | 'Event' | 'Meeting';
    description?: string;
    schoolId: string;
}