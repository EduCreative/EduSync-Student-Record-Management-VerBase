import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import { Class, Student } from '../../types';
import Avatar from '../common/Avatar';

interface PromotionStep {
    from: Class;
    to: Class | null;
    totalStudentCount: number;
    type: 'promote' | 'graduate';
}

interface PromotionPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (exemptedStudentIds: string[]) => Promise<void>;
    promotionPlan: PromotionStep[];
    isPromoting: boolean;
    allStudents: Student[];
}

const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
const GraduationCapIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const UserXIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" x2="16" y1="8" y2="14"/><line x1="16" x2="22" y1="8" y2="14"/></svg>;


const PromotionPreviewModal: React.FC<PromotionPreviewModalProps> = ({ isOpen, onClose, onConfirm, promotionPlan, isPromoting, allStudents }) => {
    const [view, setView] = useState<'preview' | 'exempt'>('preview');
    const [classToExempt, setClassToExempt] = useState<Class | null>(null);
    const [exemptedStudentIds, setExemptedStudentIds] = useState<Set<string>>(new Set());
    
    // State for exemption view
    const [tempExemptedIds, setTempExemptedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setView('preview');
            setClassToExempt(null);
            setExemptedStudentIds(new Set());
        }
    }, [isOpen]);

    const handleOpenExemptView = (cls: Class) => {
        setClassToExempt(cls);
        const exemptionsInClass = new Set<string>();
        const studentsInThisClass = allStudents.filter(s => s.classId === cls.id && s.status === 'Active');
        studentsInThisClass.forEach(s => {
            if (exemptedStudentIds.has(s.id)) {
                exemptionsInClass.add(s.id);
            }
        });
        setTempExemptedIds(exemptionsInClass);
        setView('exempt');
    };

    const handleSaveExemptions = () => {
        if (!classToExempt) return;
        const finalExemptedIds = new Set(exemptedStudentIds);
        const studentsInThisClass = allStudents.filter(s => s.classId === classToExempt.id && s.status === 'Active');
        
        studentsInThisClass.forEach(s => finalExemptedIds.delete(s.id));
        tempExemptedIds.forEach(id => finalExemptedIds.add(id));

        setExemptedStudentIds(finalExemptedIds);
        setView('preview');
        setClassToExempt(null);
        setSearchTerm('');
    };

    const handleConfirm = () => {
        onConfirm(Array.from(exemptedStudentIds));
    };

    const studentsByClass = (classId: string) => allStudents.filter(s => s.classId === classId && s.status === 'Active');
    
    // Render logic for exemption view
    if (view === 'exempt' && classToExempt) {
        const studentsInClass = studentsByClass(classToExempt.id);
        const filteredStudents = searchTerm
            ? studentsInClass.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNumber.includes(searchTerm))
            : studentsInClass;

        return (
            <Modal isOpen={isOpen} onClose={handleSaveExemptions} title={`Exempt Students from ${classToExempt.name}`}>
                <div className="space-y-4">
                     <p className="text-sm text-secondary-500">
                        Select students who should NOT be promoted or graduated. They will remain in {classToExempt.name}.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field" placeholder="Search student..."/>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setTempExemptedIds(new Set(studentsInClass.map(s => s.id)))} className="btn-secondary text-xs w-full">Select All</button>
                            <button onClick={() => setTempExemptedIds(new Set())} className="btn-secondary text-xs w-full">Deselect All</button>
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto border dark:border-secondary-600 rounded-md p-2 space-y-1">
                        {filteredStudents.map(student => (
                            <label key={student.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-700/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={tempExemptedIds.has(student.id)}
                                    onChange={() => setTempExemptedIds(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(student.id)) newSet.delete(student.id);
                                        else newSet.add(student.id);
                                        return newSet;
                                    })}
                                    className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                                />
                                <Avatar student={student} className="w-8 h-8" />
                                <div>
                                    <p className="text-sm font-medium">{student.name}</p>
                                    <p className="text-xs text-secondary-500">Roll: {student.rollNumber}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2">{tempExemptedIds.size} of {studentsInClass.length} students selected for exemption.</p>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={handleSaveExemptions} className="btn-primary">Save Exemptions</button>
                    </div>
                </div>
            </Modal>
        );
    }
    
    // Render logic for main preview view
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Student Promotion">
            <div>
                <div className="bg-yellow-50 dark:bg-yellow-900/50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-4">
                    <h4 className="font-bold text-yellow-800 dark:text-yellow-200">Warning!</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        This action will permanently update records for all selected students. You can exempt specific students from being promoted.
                    </p>
                </div>
                
                <h3 className="font-semibold text-lg mb-2">Promotion Plan:</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3 dark:border-secondary-600">
                    {promotionPlan.length > 0 ? (
                        promotionPlan.map((step, index) => {
                            const studentsInExemption = studentsByClass(step.from.id).filter(s => exemptedStudentIds.has(s.id)).length;
                            const studentsToPromote = step.totalStudentCount - studentsInExemption;

                            return (
                            <div key={index} className="p-2 rounded bg-secondary-50 dark:bg-secondary-700/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-secondary-800 dark:text-secondary-200">{step.from.name}</span>
                                        <span className="text-xs text-secondary-500">({studentsToPromote} of {step.totalStudentCount} students)</span>
                                    </div>
                                    
                                    {step.type === 'promote' ? (
                                        <div className="flex items-center gap-2">
                                            <ArrowRightIcon className="w-5 h-5 text-primary-500" />
                                            <span className="font-medium text-primary-600 dark:text-primary-400">{step.to?.name}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <ArrowRightIcon className="w-5 h-5 text-green-500" />
                                            <div className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                                                <GraduationCapIcon className="w-5 h-5" />
                                                <span>Graduated</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-end mt-1">
                                    <button onClick={() => handleOpenExemptView(step.from)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                        <UserXIcon className="w-3 h-3"/>
                                        Exempt Students ({studentsInExemption})
                                    </button>
                                </div>
                            </div>
                            )
                        })
                    ) : (
                        <p className="text-secondary-500 text-center">No promotion steps to display.</p>
                    )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="btn-secondary" disabled={isPromoting}>
                        Cancel
                    </button>
                    <button type="button" onClick={handleConfirm} className="btn-danger" disabled={isPromoting || promotionPlan.length === 0}>
                        {isPromoting ? 'Promoting...' : 'Confirm & Promote'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PromotionPreviewModal;