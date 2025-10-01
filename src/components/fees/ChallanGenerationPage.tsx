import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { FeeHead, UserRole } from '../../types';
import { useToast } from '../../context/ToastContext';

const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const ChallanGenerationPage: React.FC = () => {
    const { user, activeSchoolId } = useAuth();
    const { feeHeads, generateChallansForMonth } = useData();
    const { showToast } = useToast();

    const [month, setMonth] = useState(months[new Date().getMonth()]);
    const [year, setYear] = useState(currentYear);
    const [selectedFeeHeads, setSelectedFeeHeads] = useState<Map<string, { selected: boolean; amount: number }>>(new Map());
    const [isGenerating, setIsGenerating] = useState(false);

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;

    useMemo(() => {
        const newMap = new Map<string, { selected: boolean; amount: number }>();
        feeHeads.forEach(fh => {
            newMap.set(fh.id, { selected: true, amount: fh.defaultAmount });
        });
        setSelectedFeeHeads(newMap);
    }, [feeHeads]);

    const handleFeeHeadToggle = (id: string) => {
        setSelectedFeeHeads(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(id);
            if (current) {
                newMap.set(id, { ...current, selected: !current.selected });
            }
            return newMap;
        });
    };
    
    const handleAmountChange = (id: string, amount: string) => {
        const numAmount = parseInt(amount, 10);
        if (isNaN(numAmount)) return;
        
        setSelectedFeeHeads(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(id);
            if (current) {
                newMap.set(id, { ...current, amount: numAmount });
            }
            return newMap;
        });
    };

    const handleGenerate = async () => {
        if (!effectiveSchoolId) {
            showToast('Error', 'No school context selected.', 'error');
            return;
        }

        const feeHeadsToGenerate = Array.from(selectedFeeHeads.entries())
            .filter(([, { selected }]) => selected)
            .map(([feeHeadId, { amount }]) => ({ feeHeadId, amount }));

        if (feeHeadsToGenerate.length === 0) {
            showToast('Info', 'Please select at least one fee head to generate challans.', 'info');
            return;
        }

        setIsGenerating(true);
        await generateChallansForMonth(effectiveSchoolId, month, year, feeHeadsToGenerate);
        setIsGenerating(false);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Generate Monthly Fee Challans</h2>
                <p className="text-sm text-secondary-500">This will create new challans for all active students who don't already have one for the selected month and year.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="month-select" className="input-label">For Month</label>
                    <select id="month-select" value={month} onChange={e => setMonth(e.target.value)} className="input-field">
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="year-select" className="input-label">For Year</label>
                    <select id="year-select" value={year} onChange={e => setYear(Number(e.target.value))} className="input-field">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-medium mb-2">Include Fee Heads</h3>
                <div className="space-y-3 p-4 border dark:border-secondary-700 rounded-lg max-h-60 overflow-y-auto">
                    {feeHeads.map(fh => (
                        <div key={fh.id} className="flex items-center justify-between gap-4">
                            <label className="flex items-center space-x-3 flex-1">
                                <input
                                    type="checkbox"
                                    checked={selectedFeeHeads.get(fh.id)?.selected || false}
                                    onChange={() => handleFeeHeadToggle(fh.id)}
                                    className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span>{fh.name}</span>
                            </label>
                            <div className="flex items-center space-x-2">
                                <span>Rs.</span>
                                <input
                                    type="number"
                                    value={selectedFeeHeads.get(fh.id)?.amount || 0}
                                    onChange={(e) => handleAmountChange(fh.id, e.target.value)}
                                    className="input-field w-24 text-right"
                                    disabled={!selectedFeeHeads.get(fh.id)?.selected}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="btn-primary w-full sm:w-auto"
                >
                    {isGenerating ? 'Generating...' : 'Generate Challans'}
                </button>
            </div>
        </div>
    );
};

export default ChallanGenerationPage;
