import { UserRole } from './types';

export enum Permission {
  // School Management (Owner Only)
  CAN_MANAGE_SCHOOLS = 'CAN_MANAGE_SCHOOLS',
  CAN_DELETE_SCHOOLS = 'CAN_DELETE_SCHOOLS',

  // User Management
  CAN_MANAGE_USERS = 'CAN_MANAGE_USERS',
  CAN_DELETE_USERS = 'CAN_DELETE_USERS',

  // Student Management
  CAN_MANAGE_STUDENTS = 'CAN_MANAGE_STUDENTS',
  CAN_DELETE_STUDENTS = 'CAN_DELETE_STUDENTS',
  CAN_VIEW_STUDENT_LISTS = 'CAN_VIEW_STUDENT_LISTS',

  // Class Management
  CAN_MANAGE_CLASSES = 'CAN_MANAGE_CLASSES',

  // Fee & Financial Management
  CAN_MANAGE_FEES = 'CAN_MANAGE_FEES',
  CAN_MANAGE_FEE_HEADS = 'CAN_MANAGE_FEE_HEADS',
  CAN_VIEW_FINANCIAL_REPORTS = 'CAN_VIEW_FINANCIAL_REPORTS',

  // Academic Management
  CAN_MANAGE_ATTENDANCE = 'CAN_MANAGE_ATTENDANCE',
  CAN_MANAGE_RESULTS = 'CAN_MANAGE_RESULTS',
  CAN_VIEW_ACADEMIC_REPORTS = 'CAN_VIEW_ACADEMIC_REPORTS',
  CAN_GENERATE_ID_CARDS = 'CAN_GENERATE_ID_CARDS',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.Owner]: Object.values(Permission), // Owner has all permissions

  [UserRole.Admin]: [
    Permission.CAN_MANAGE_USERS,
    Permission.CAN_DELETE_USERS,
    Permission.CAN_MANAGE_STUDENTS,
    Permission.CAN_DELETE_STUDENTS,
    Permission.CAN_VIEW_STUDENT_LISTS,
    Permission.CAN_MANAGE_CLASSES,
    Permission.CAN_MANAGE_FEES,
    Permission.CAN_MANAGE_FEE_HEADS,
    Permission.CAN_VIEW_FINANCIAL_REPORTS,
    Permission.CAN_MANAGE_ATTENDANCE,
    Permission.CAN_MANAGE_RESULTS,
    Permission.CAN_VIEW_ACADEMIC_REPORTS,
    Permission.CAN_GENERATE_ID_CARDS,
  ],

  [UserRole.Accountant]: [
    Permission.CAN_MANAGE_FEES,
    Permission.CAN_VIEW_FINANCIAL_REPORTS,
    Permission.CAN_VIEW_STUDENT_LISTS, // To see student names for fees
  ],
  
  [UserRole.Teacher]: [
    Permission.CAN_MANAGE_ATTENDANCE,
    Permission.CAN_MANAGE_RESULTS,
    Permission.CAN_VIEW_STUDENT_LISTS, // To see students in their class
  ],

  [UserRole.Parent]: [], // View-only logic is handled by data filtering
  [UserRole.Student]: [], // View-only logic is handled by data filtering
};