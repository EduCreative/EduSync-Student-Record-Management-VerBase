import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { ChallanPreviewItem } from './ChallanGenerationPage';

interface ChallanPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (studentIds: string[]) => Promise<void>;
    previewData: ChallanPreviewItem[];
    isGenerating: boolean;
}

const ChallanPreviewModal: React.FC<ChallanPreviewModalProps> = ({ isOpen, onClose, onConfirm, previewData, isGenerating }) => {
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            // Pre-select all students when modal opens
            setSelectedStudentIds(new Set(previewData.map(p => p.student.id)));
        }
    }, [isOpen, previewData]);
    
    const handleToggleStudent = (studentId: string) => {
        setSelectedStudentIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const handleToggleAll = () => {
        if (selectedStudentIds.size === previewData.length) {
            setSelectedStudentIds(new Set());
        } else {
            setSelectedStudentIds(new Set(previewData.map(p => p.student.id)));
        }
    };

    const handleConfirmClick = () => {
        onConfirm(Array.from(selectedStudentIds));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Challan Generation Preview (${previewData.length} Students)`}>
            <div className="space-y-4">
                <p className="text-sm text-secondary-500">
                    Review the challans to be generated. Uncheck any students you wish to exclude.
                </p>

                <div className="max-h-80 overflow-y-auto border dark:border-secondary-600 rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300 sticky top-0">
                            <tr>
                                <th className="p-2 w-12 text-center">
                                    <input type="checkbox"
                                        className="rounded"
                                        checked={previewData.length > 0 && selectedStudentIds.size === previewData.length}
                                        onChange={handleToggleAll}
                                        aria-label="Select all students"
                                    />
                                </th>
                                <th className="px-4 py-2">Student</th>
                                <th className="px-4 py-2 text-right">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-secondary-700">
                            {previewData.map(item => (
                                <tr key={item.student.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                    <td className="p-2 text-center">
                                        <input type="checkbox"
                                            className="rounded"
                                            checked={selectedStudentIds.has(item.student.id)}
                                            onChange={() => handleToggleStudent(item.student.id)}
                                            aria-label={`Select ${item.student.name}`}
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-3">
                                            <Avatar student={item.student} className="w-8 h-8" />
                                            <div>
                                                <p className="font-medium">{item.student.name}</p>
                                                <p className="text-xs text-secondary-500">{item.student.className} - Roll: {item.student.rollNumber}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-right font-semibold">
                                        Rs. {item.totalAmount.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                 <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2 text-center">
                    {selectedStudentIds.size} of {previewData.length} challans selected for generation.
                </p>

                <div className="flex justify-end space-x-3 pt-4 border-t dark:border-secondary-700">
                    <button type="button" onClick={onClose} className="btn-secondary" disabled={isGenerating}>Cancel</button>
                    <button type="button" onClick={handleConfirmClick} className="btn-primary" disabled={isGenerating || selectedStudentIds.size === 0}>
                        {isGenerating ? 'Generating...' : `Generate ${selectedStudentIds.size} Challans`}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ChallanPreviewModal;