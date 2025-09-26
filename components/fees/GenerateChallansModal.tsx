
import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../users/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface GenerateChallansModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const GenerateChallansModal: React.FC<GenerateChallansModalProps> = ({ isOpen, onClose }) => {
    const { user: currentUser } = useAuth();
    const { feeHeads, generateChallansForMonth } = useData();

    const [selectedMonth, setSelectedMonth] = useState<string>(months[new Date().getMonth()]);
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [feeHeadSelections, setFeeHeadSelections] = useState<Record<string, { selected: boolean; amount: number }>>({});
    
    const schoolFeeHeads = useMemo(() => {
        return feeHeads.filter(fh => fh.schoolId === currentUser?.schoolId);
    }, [feeHeads, currentUser]);

    useEffect(() => {
        if (isOpen) {
            const initialSelections: Record<string, { selected: boolean; amount: number }> = {};
            schoolFeeHeads.forEach(fh => {
                initialSelections[fh.id] = {
                    selected: fh.name === 'Tuition Fee', // Default Tuition Fee to be checked
                    amount: fh.defaultAmount
                };
            });
            setFeeHeadSelections(initialSelections);
        }
    }, [isOpen, schoolFeeHeads]);

    const handleFeeHeadToggle = (feeHeadId: string) => {
        setFeeHeadSelections(prev => {
            // FIX: Provide a default object for `current` to ensure type safety, as `prev[feeHeadId]` can be undefined for new entries.
            const current = prev[feeHeadId] || { selected: false, amount: 0 };
            return {
                ...prev,
                [feeHeadId]: {
                    amount: current.amount,
                    selected: !current.selected,
                },
            };
        });
    };

    const handleAmountChange = (feeHeadId: string, value: string) => {
        setFeeHeadSelections(prev => {
            // FIX: Provide a default object for `current` to ensure type safety, as `prev[feeHeadId]` can be undefined for new entries.
            const current = prev[feeHeadId] || { selected: false, amount: 0 };
            return {
                ...prev,
                [feeHeadId]: {
                    selected: current.selected,
                    amount: Number(value) >= 0 ? Number(value) : 0,
                },
            };
        });
    };

    const handleGenerate = () => {
        if (currentUser?.schoolId) {
            const selectedFeeHeads = Object.entries(feeHeadSelections)
                .filter(([, { selected }]) => selected)
                .map(([id, { amount }]) => ({ feeHeadId: id, amount }));
            
            if (selectedFeeHeads.length === 0) {
                alert("Please select at least one fee head to generate challans.");
                return;
            }
            generateChallansForMonth(currentUser.schoolId, selectedMonth, selectedYear, selectedFeeHeads);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Monthly Fee Challans">
            <div className="space-y-4">
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Select the month, year, and the fee components to include in the challans. This will not override existing challans for the same month.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="month" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Month</label>
                        <select id="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full input-style">
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Year</label>
                        <select id="year" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="w-full input-style">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Fee Heads to Include</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-secondary-50 dark:bg-secondary-700 rounded-md">
                        {schoolFeeHeads.map(fh => {
                            const selection = feeHeadSelections[fh.id] || { selected: false, amount: 0 };
                            const isTuitionFee = fh.name === 'Tuition Fee';
                            return (
                                <div key={fh.id} className="flex items-center justify-between space-x-3 py-1">
                                    <label className="flex items-center space-x-3 flex-grow cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selection.selected}
                                            onChange={() => handleFeeHeadToggle(fh.id)}
                                            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-secondary-800 dark:text-secondary-200">{fh.name}</span>
                                    </label>
                                    {isTuitionFee ? (
                                        <span className="text-sm text-secondary-500 dark:text-secondary-400">(Auto-applied per student)</span>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <span className="text-secondary-500 dark:text-secondary-400">Rs.</span>
                                            <input
                                                type="number"
                                                value={selection.amount}
                                                onChange={(e) => handleAmountChange(fh.id, e.target.value)}
                                                className="w-24 p-1 border rounded-md dark:bg-secondary-600 dark:border-secondary-500 text-sm"
                                                disabled={!selection.selected}
                                                min="0"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-600 dark:hover:bg-secondary-500">Cancel</button>
                    <button type="button" onClick={handleGenerate} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg">Generate</button>
                </div>
            </div>
            <style>{`.input-style { background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 0.5rem; width: 100%; padding: 0.625rem; } .dark .input-style { background-color: #374151; border-color: #4b5563; color: white; }`}</style>
        </Modal>
    );
};

export default GenerateChallansModal;
