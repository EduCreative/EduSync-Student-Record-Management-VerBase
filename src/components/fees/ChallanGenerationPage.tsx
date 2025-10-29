import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole, FeeHead } from '../../types';
import { useToast } from '../../context/ToastContext';

const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const ChallanGenerationPage: React.FC = () => {
    const { user, activeSchoolId } = useAuth();
    const { students, fees, feeHeads, generateChallansForMonth } = useData();
    const { showToast } = useToast();

    const [month, setMonth] = useState(months[new Date().getMonth()]);
    const [year, setYear] = useState(currentYear);
    const [selectedFeeHeads, setSelectedFeeHeads] = useState<Map<string, { selected: boolean; amount: number }>>(new Map());
    const [isGenerating, setIsGenerating] = useState(false);

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;

    useEffect(() => {
        const newMap = new Map<string, { selected: boolean; amount: number }>();
        feeHeads.forEach((fh: FeeHead) => {
            newMap.set(fh.id, { selected: true, amount: fh.defaultAmount });
        });
        setSelectedFeeHeads(newMap);
    }, [feeHeads]);
    
    const generationSummary = useMemo(() => {
        if (!effectiveSchoolId) return { totalActive: 0, alreadyGenerated: 0, toGenerate: 0 };

        const activeStudentsInSchool = students.filter(s => s.schoolId === effectiveSchoolId && s.status === 'Active');
        const studentIdsInSchool = new Set(activeStudentsInSchool.map(s => s.id));

        const existingChallansForPeriod = new Set(
            fees
                .filter(f => 
                    f.month === month && 
                    f.year === year &&
                    studentIdsInSchool.has(f.studentId)
                )
                .map(f => f.studentId)
        );

        const alreadyGenerated = existingChallansForPeriod.size;
        const toGenerate = activeStudentsInSchool.length - alreadyGenerated;

        return {
            totalActive: activeStudentsInSchool.length,
            alreadyGenerated,
            toGenerate,
        };
    }, [students, fees, effectiveSchoolId, month, year]);

    const handleFeeHeadToggle = (id: string) => {
        setSelectedFeeHeads((prev: Map<string, { selected: boolean; amount: number }>) => {
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
        
        setSelectedFeeHeads((prev: Map<string, { selected: boolean; amount: number }>) => {
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
        try {
            const generationPromise = generateChallansForMonth(effectiveSchoolId, month, year, feeHeadsToGenerate);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Challan generation timed out after 30 seconds. The process may be running in the background.")), 30000)
            );
            await Promise.race([generationPromise, timeoutPromise]);
        } catch (error: any) {
            console.error('Failed to generate challans:', error);
            showToast('Error', error.message || 'An unknown error occurred during challan generation.', 'error');
        } finally {
            setIsGenerating(false);
        }
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

            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <div className="flex justify-between"><span>Total Active Students:</span> <strong>{generationSummary.totalActive}</strong></div>
                <div className="flex justify-between"><span>Challans Already Generated:</span> <strong>{generationSummary.alreadyGenerated}</strong></div>
                <div className="flex justify-between font-bold border-t border-blue-200 dark:border-blue-700 pt-1 mt-1"><span>New Challans to be Generated:</span> <strong>{generationSummary.toGenerate}</strong></div>
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
                    disabled={isGenerating || generationSummary.toGenerate === 0}
                    className="btn-primary w-full sm:w-auto"
                >
                    {isGenerating ? 'Generating...' : `Generate ${generationSummary.toGenerate} Challans`}
                </button>
            </div>
        </div>
    );
};

export default ChallanGenerationPage;