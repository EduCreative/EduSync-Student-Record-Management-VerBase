
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { FeeChallan, UserRole } from '../../types';
import Badge from '../common/Badge';
import RecordPaymentModal from './RecordPaymentModal';
import GenerateChallansModal from './GenerateChallansModal';
import FeeChallanModal from './FeeChallanModal';
import FeeHeadManager from './FeeHeadManager';
import { PrinterIcon, formatDate } from '../../constants';
import { usePrint } from '../../context/PrintContext';
import ReportHeader from '../reports/ReportHeader';

const FeeManagementPage: React.FC = () => {
    const { user: currentUser, activeSchoolId } = useAuth();
    const { fees, students, classes } = useData();
    const { showPrintPreview } = usePrint();

    const effectiveSchoolId = currentUser?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : currentUser?.schoolId;

    const [activeTab, setActiveTab] = useState<'challans' | 'feeHeads'>('challans');
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Unpaid' | 'Partial'>('all');
    
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isGenerateModalOpen, setGenerateModalOpen] = useState(false);
    const [isChallanViewOpen, setChallanViewOpen] = useState(false);
    const [selectedChallan, setSelectedChallan] = useState<FeeChallan | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    
    const schoolClasses = useMemo(() => classes.filter(c => c.schoolId === effectiveSchoolId), [classes, effectiveSchoolId]);
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const filteredFees = useMemo(() => {
        return fees.filter(fee => {
            const student = studentMap.get(fee.studentId);
            if (!student || student.schoolId !== effectiveSchoolId) return false;
            
            if (classFilter !== 'all' && fee.classId !== classFilter) return false;
            if (statusFilter !== 'all' && fee.status !== statusFilter) return false;
            if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase()) && !fee.challanNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            
            return true;
        }).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }, [fees, effectiveSchoolId, searchTerm, classFilter, statusFilter, studentMap]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, classFilter, statusFilter]);
    
    const totalPages = Math.ceil(filteredFees.length / ITEMS_PER_PAGE);
    const paginatedFees = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredFees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredFees, currentPage]);

    const handleOpenPaymentModal = (challan: FeeChallan) => {
        setSelectedChallan(challan);
        setPaymentModalOpen(true);
    };
    
    const handleOpenChallanView = (challan: FeeChallan) => {
        setSelectedChallan(challan);
        setChallanViewOpen(true);
    };

    const getStatusColor = (status: 'Paid' | 'Unpaid' | 'Partial') => {
        switch (status) {
            case 'Paid': return 'green';
            case 'Unpaid': return 'red';
            case 'Partial': return 'yellow';
            default: return 'secondary';
        }
    };

    const handlePrint = () => {
        const printContent = (
            <div className="p-4 bg-white">
                <ReportHeader 
                    title="Fee Challan List"
                    filters={{
                        "Class": classFilter === 'all' ? 'All Classes' : schoolClasses.find(c => c.id === classFilter)?.name || '',
                        "Status": statusFilter === 'all' ? 'All' : statusFilter
                    }}
                />
                <table className="w-full text-sm">
                    <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                        <tr>
                            <th className="px-6 py-3 text-left">Student</th>
                            <th className="px-6 py-3 text-left">Month</th>
                            <th className="px-6 py-3 text-right">Amount (Rs.)</th>
                            <th className="px-6 py-3 text-right">Balance Due (Rs.)</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-left">Due Date</th>
                        </tr>
                    </thead>
                    <tbody className="text-secondary-700 dark:text-secondary-300">
                        {filteredFees.map(fee => {
                            const student = studentMap.get(fee.studentId);
                            const balanceDue = fee.totalAmount - fee.paidAmount - fee.discount;
                            return (
                            <tr key={fee.id} className="border-b dark:border-secondary-700">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-secondary-900 dark:text-white">{student?.name || 'N/A'}</div>
                                    <div className="text-xs text-secondary-500">{student?.fatherName}</div>
                                </td>
                                <td className="px-6 py-4">{fee.month}, {fee.year}</td>
                                <td className="px-6 py-4 text-right font-mono">{fee.totalAmount.toLocaleString()}</td>
                                <td className={`px-6 py-4 text-right font-mono font-semibold ${balanceDue > 0 ? 'text-yellow-600 dark:text-yellow-500' : ''}`}>{balanceDue.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center"><Badge color={getStatusColor(fee.status)}>{fee.status}</Badge></td>
                                <td className="px-6 py-4">{formatDate(fee.dueDate)}</td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        );
        showPrintPreview(printContent, "Fee Challan List Preview");
    };

    const showingFrom = filteredFees.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
    const showingTo = Math.min(currentPage * ITEMS_PER_PAGE, filteredFees.length);

    return (
        <>
            {selectedChallan && (
                <RecordPaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    challan={selectedChallan}
                />
            )}
            {selectedChallan && (
                 <FeeChallanModal
                    isOpen={isChallanViewOpen}
                    onClose={() => setChallanViewOpen(false)}
                    challan={selectedChallan}
                />
            )}
            <GenerateChallansModal 
                isOpen={isGenerateModalOpen}
                onClose={() => setGenerateModalOpen(false)}
            />

            <div className={`space-y-6 ${isChallanViewOpen ? 'no-print' : ''}`}>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 no-print">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Fee Management</h1>
                        <div className="mt-2 border-b border-secondary-200 dark:border-secondary-700">
                            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('challans')}
                                    className={`${activeTab === 'challans' ? 'border-primary-500 text-primary-600' : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Fee Challans
                                </button>
                                <button
                                    onClick={() => setActiveTab('feeHeads')}
                                    className={`${activeTab === 'feeHeads' ? 'border-primary-500 text-primary-600' : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Fee Heads
                                </button>
                            </nav>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        {activeTab === 'challans' && (
                            <>
                                <button onClick={handlePrint} className="bg-secondary-200 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary-300 dark:hover:bg-secondary-600 transition flex items-center gap-2">
                                   <PrinterIcon className="w-4 h-4" /> Print List
                                </button>
                                <button onClick={() => setGenerateModalOpen(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition">
                                    Generate Monthly Challans
                                </button>
                            </>
                        )}
                    </div>
                </div>
                
                {activeTab === 'challans' && (
                    <>
                        <div className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md no-print">
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                                <input
                                    type="text"
                                    placeholder="Search by Student or Challan #"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full p-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600"
                                />
                                 <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full p-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600">
                                     <option value="all">All Classes</option>
                                     {schoolClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                 </select>
                                 <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full p-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600">
                                     <option value="all">All Statuses</option>
                                     <option value="Paid">Paid</option>
                                     <option value="Unpaid">Unpaid</option>
                                     <option value="Partial">Partial</option>
                                 </select>
                             </div>
                        </div>

                        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md overflow-x-auto printable-area">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Student</th>
                                        <th className="px-6 py-3 text-left">Month</th>
                                        <th className="px-6 py-3 text-right">Amount (Rs.)</th>
                                        <th className="px-6 py-3 text-right">Paid Amount (Rs.)</th>
                                        <th className="px-6 py-3 text-right">Balance Due (Rs.)</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                        <th className="px-6 py-3 text-left">Due Date</th>
                                        <th className="px-6 py-3 text-center no-print">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-secondary-700 dark:text-secondary-300">
                                    {paginatedFees.map(fee => {
                                        const student = studentMap.get(fee.studentId);
                                        const balanceDue = fee.totalAmount - fee.paidAmount - fee.discount;
                                        return (
                                        <tr key={fee.id} className="border-b dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-secondary-900 dark:text-white">{student?.name || 'N/A'}</div>
                                                <div className="text-xs text-secondary-500">{student?.fatherName}</div>
                                            </td>
                                            <td className="px-6 py-4">{fee.month}, {fee.year}</td>
                                            <td className="px-6 py-4 text-right font-mono">{fee.totalAmount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-mono text-green-600 dark:text-green-500">{fee.paidAmount.toLocaleString()}</td>
                                            <td className={`px-6 py-4 text-right font-mono font-semibold ${balanceDue > 0 ? 'text-yellow-600 dark:text-yellow-500' : ''}`}>{balanceDue.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center"><Badge color={getStatusColor(fee.status)}>{fee.status}</Badge></td>
                                            <td className="px-6 py-4">{formatDate(fee.dueDate)}</td>
                                            <td className="px-6 py-4 text-center no-print">
                                               <div className="flex items-center justify-center gap-4">
                                                    <button onClick={() => handleOpenChallanView(fee)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">View</button>
                                                    <button 
                                                        onClick={() => handleOpenPaymentModal(fee)}
                                                        disabled={fee.status === 'Paid'}
                                                        className="font-medium text-primary-600 dark:text-primary-500 hover:underline disabled:text-secondary-400 disabled:no-underline disabled:cursor-not-allowed"
                                                    >
                                                        Pay
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                             <div className="flex justify-between items-center p-4 no-print">
                                <span className="text-sm">Showing {showingFrom}-{showingTo} of {filteredFees.length}</span>
                                {totalPages > 1 && (
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1 text-sm border rounded-md disabled:opacity-50">Previous</button>
                                        <span>{currentPage} of {totalPages}</span>
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border rounded-md disabled:opacity-50">Next</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
                {activeTab === 'feeHeads' && <FeeHeadManager />}
            </div>
        </>
    );
};

export default FeeManagementPage;
