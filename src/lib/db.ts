// FIX: Import `Dexie` as a named export to ensure correct class extension and resolve typing issues.
import { Dexie, type Table } from 'dexie';
import { School, User, Class, Student, Attendance, FeeChallan, Result, ActivityLog, FeeHead, SchoolEvent, Notification } from '../types';

export class EduSyncDB extends Dexie {
    schools!: Table<School, string>;
    users!: Table<User, string>;
    classes!: Table<Class, string>;
    students!: Table<Student, string>;
    attendance!: Table<Attendance, string>;
    fees!: Table<FeeChallan, string>;
    results!: Table<Result, string>;
    logs!: Table<ActivityLog, string>;
    feeHeads!: Table<FeeHead, string>;
    events!: Table<SchoolEvent, string>;
    notifications!: Table<Notification, string>;

    constructor() {
        super('EduSyncDB');
        this.version(1).stores({
            schools: 'id, name',
            users: 'id, schoolId, role, email',
            classes: 'id, schoolId, teacherId',
            students: 'id, schoolId, classId, userId',
            attendance: 'id, &[studentId+date]',
            fees: 'id, studentId, classId, month, year, challanNumber',
            results: 'id, &[studentId+classId+exam+subject]',
            logs: 'id, userId, schoolId, timestamp',
            feeHeads: 'id, schoolId',
            events: 'id, schoolId, date',
            notifications: 'id, userId, isRead, timestamp',
        });
    }
}

export const db = new EduSyncDB();
