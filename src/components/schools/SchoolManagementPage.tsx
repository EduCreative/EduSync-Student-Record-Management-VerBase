import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { School } from '../../types';
import Modal from '../common/Modal';
import ImageUpload from '../common/ImageUpload';
import { useAuth } from '../../context/AuthContext';
import { ActiveView } from '../layout/Layout';
import { Permission } from '../../permissions';
import Avatar from '../common/Avatar';

const SchoolFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (school: School | Omit<School, 'id'>) => void;
    schoolToEdit: School | null;
}> = ({ isOpen, onClose, onSave, schoolToEdit }) => {
    
    const getInitialState = () => ({
        name: schoolToEdit?.name || '',
        address: schoolToEdit?.address || '',
        logoUrl: schoolToEdit?.logoUrl || null
    });

    const [formData, setFormData] = useState(getInitialState());
    
    React.useEffect(() => {
        if(isOpen) {
            setFormData(getInitialState());
        }
    }, [isOpen, schoolToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (schoolToEdit) {
            onSave({ ...schoolToEdit, ...formData });
        } else {
            onSave(formData);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={schoolToEdit ? 'Edit School' : 'Add New School'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <ImageUpload 
                  imageUrl={formData.logoUrl}
                  onChange={(newLogoUrl) => setFormData(prev => ({...prev, logoUrl: newLogoUrl}))}
                  bucketName="logos"
                />
                <div>
                    <label className="input-label">School Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className="input-field" required />
                </div>
                <div>
                    <label className="input-label">Address</label>
                    <textarea value={formData.address} onChange={e => setFormData(p => ({...p, address: e.target.value}))} className="input-field" rows={3} required></textarea>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Save School</button>
                </div>
            </form>
        </Modal>
    );
};

const BuildingIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
    </svg>
);

const SchoolCard: React.FC<{
    school: School;
    stats: { studentCount: number; classCount: number };
    onViewAsAdmin: () => void;
    onDetails: () => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ school, stats, onViewAsAdmin, onDetails, onEdit, onDelete }) => {
    const { hasPermission } = useAuth();
    return (
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="p-5">
                <div className="flex items-start space-x-4">
                    {school.logoUrl ? (
                        <img src={school.logoUrl} alt={`${school.name} logo`} className="w-16 h-16 object-contain rounded-md bg-white p-1 border dark:border-secondary-700"/>
                    ) : (
                        <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-700 rounded-md flex items-center justify-center text-xs text-secondary-500">
                            <BuildingIcon className="w-8 h-8 text-secondary-400" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-secondary-900 dark:text-white truncate">{school.name}</h3>
                        <p className="text-sm text-secondary-500 line-clamp-2 h-10">{school.address}</p>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center border-t dark:border-secondary-700 pt-4">
                    <div>
                        <p className="text-xs text-secondary-500 uppercase">Students</p>
                        <p className="text-2xl font-bold">{stats.studentCount}</p>
                    </div>
                    <div>
                        <p className="text-xs text-secondary-500 uppercase">Classes</p>
                        <p className="text-2xl font-bold">{stats.classCount}</p>
                    </div>
                </div>
            </div>
            <div className="bg-secondary-50 dark:bg-secondary-800/50 px-5 py-3 border-t dark:border-secondary-700">
                <div className="flex items-center justify-end space-x-3 text-sm font-medium">
                    <button onClick={onDetails} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Details</button>
                    <button onClick={onViewAsAdmin} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">View as Admin</button>
                    {hasPermission(Permission.CAN_MANAGE_SCHOOLS) && (
                        <button onClick={onEdit} className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">Edit</button>
                    )}
                    {hasPermission(Permission.CAN_DELETE_SCHOOLS) && (
                        <button onClick={onDelete} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                    )}
                </div>
            </div>
        </div>
    );
};


interface SchoolManagementPageProps {
    setActiveView: (view: ActiveView) => void;
}

const SchoolManagementPage: React.FC<SchoolManagementPageProps> = ({ setActiveView }) => {
    const { schools, students, classes, addSchool, updateSchool, deleteSchool } = useData();
    const { switchSchoolContext, hasPermission } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [schoolToEdit, setSchoolToEdit] = useState<School | null>(null);
    const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
    
    // State for details modal
    const [viewingSchool, setViewingSchool] = useState<School | null>(null);
    const [activeDetailsTab, setActiveDetailsTab] = useState<'students' | 'classes'>('students');

    const handleSave = (school: School | Omit<School, 'id'>) => {
        if ('id' in school) {
            updateSchool(school);
        } else {
            addSchool(school.name, school.address, school.logoUrl);
        }
    };

    const handleSchoolClick = (schoolId: string) => {
        switchSchoolContext(schoolId);
        setActiveView({ view: 'dashboard' });
    };
    
    const schoolStats = useMemo(() => {
        const stats = new Map<string, { studentCount: number; classCount: number }>();
        schools.forEach(school => {
            stats.set(school.id, {
                studentCount: students.filter(s => s.schoolId === school.id).length,
                classCount: classes.filter(c => c.schoolId === school.id).length,
            });
        });
        return stats;
    }, [schools, students, classes]);

    const schoolDetails = useMemo(() => {
        if (!viewingSchool) return null;
        return {
            students: students.filter(s => s.schoolId === viewingSchool.id),
            classes: classes.filter(c => c.schoolId === viewingSchool.id),
        };
    }, [viewingSchool, students, classes]);

    return (
        <>
            <SchoolFormModal 
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSchoolToEdit(null); }}
                onSave={handleSave}
                schoolToEdit={schoolToEdit}
            />
            <Modal isOpen={!!schoolToDelete} onClose={() => setSchoolToDelete(null)} title="Confirm Deletion">
                 <p>Are you sure you want to delete {schoolToDelete?.name}? This will affect all associated users and students.</p>
                 <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={() => setSchoolToDelete(null)} className="btn-secondary">Cancel</button>
                    <button type="button" onClick={() => { if(schoolToDelete) deleteSchool(schoolToDelete.id); setSchoolToDelete(null); }} className="btn-danger">Delete</button>
                </div>
            </Modal>

             <Modal isOpen={!!viewingSchool} onClose={() => setViewingSchool(null)} title={viewingSchool?.name || 'School Details'}>
                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                        {viewingSchool?.logoUrl ? (
                            <img src={viewingSchool.logoUrl} alt={`${viewingSchool.name} logo`} className="w-16 h-16 object-contain rounded-md bg-white p-1" />
                        ) : (
                            <div className="w-16 h-16 bg-secondary-200 dark:bg-secondary-600 rounded-md flex items-center justify-center text-secondary-400">
                                No Logo
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-lg">{viewingSchool?.name}</h3>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">{viewingSchool?.address}</p>
                        </div>
                    </div>
                    
                    <div className="border-b border-secondary-200 dark:border-secondary-700">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                            <button
                                onClick={() => setActiveDetailsTab('students')}
                                className={`${activeDetailsTab === 'students' ? 'border-primary-500 text-primary-600' : 'border-transparent text-secondary-500 hover:text-secondary-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                            >
                                Students ({schoolDetails?.students.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveDetailsTab('classes')}
                                className={`${activeDetailsTab === 'classes' ? 'border-primary-500 text-primary-600' : 'border-transparent text-secondary-500 hover:text-secondary-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                            >
                                Classes ({schoolDetails?.classes.length || 0})
                            </button>
                        </nav>
                    </div>

                    <div className="max-h-64 overflow-y-auto pr-2">
                        {activeDetailsTab === 'students' && (
                            <ul className="divide-y dark:divide-secondary-700">
                                {schoolDetails?.students.map(student => (
                                    <li key={student.id} className="py-2 flex items-center space-x-3">
                                        <Avatar student={student} className="w-8 h-8"/>
                                        <div>
                                            <p className="font-medium text-sm">{student.name}</p>
                                            <p className="text-xs text-secondary-500">Roll No: {student.rollNumber}</p>
                                        </div>
                                    </li>
                                ))}
                                {schoolDetails?.students.length === 0 && <p className="text-center text-sm text-secondary-500 py-4">No students found for this school.</p>}
                            </ul>
                        )}
                        {activeDetailsTab === 'classes' && (
                            <ul className="divide-y dark:divide-secondary-700">
                                {schoolDetails?.classes.map(cls => (
                                    <li key={cls.id} className="py-2">
                                        <p className="font-medium text-sm">{cls.name}</p>
                                    </li>
                                ))}
                                {schoolDetails?.classes.length === 0 && <p className="text-center text-sm text-secondary-500 py-4">No classes found for this school.</p>}
                            </ul>
                        )}
                    </div>
                </div>
            </Modal>

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">School Management</h1>
                    {hasPermission(Permission.CAN_MANAGE_SCHOOLS) && (
                        <button onClick={() => { setSchoolToEdit(null); setIsModalOpen(true); }} className="btn-primary">+ Add School</button>
                    )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {schools.map(school => (
                        <SchoolCard
                            key={school.id}
                            school={school}
                            stats={schoolStats.get(school.id) || { studentCount: 0, classCount: 0 }}
                            onDetails={() => { setViewingSchool(school); setActiveDetailsTab('students'); }}
                            onViewAsAdmin={() => handleSchoolClick(school.id)}
                            onEdit={() => { setSchoolToEdit(school); setIsModalOpen(true); }}
                            onDelete={() => setSchoolToDelete(school)}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

export default SchoolManagementPage;