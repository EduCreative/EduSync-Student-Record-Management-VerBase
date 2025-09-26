
import React, { useState, useEffect } from 'react';
import { FeeChallan } from '../../types';
import Modal from '../users/Modal';
import { useData } from '../../context/DataContext';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    challan: FeeChallan;
}

const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, challan }) => {
    const { recordFeePayment } = useData();
    const remainingAmount = challan.totalAmount - challan.paidAmount - (challan.discount || 0);
    
    const [paidAmount, setPaidAmount] = useState<number | ''>(remainingAmount > 0 ? remainingAmount : 0);
    const [discount, setDiscount] = useState<number | ''>(challan.discount || 0);
    const [paidDate, setPaidDate] = useState<string>(formatDateForInput(new Date()));
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const newRemaining = challan.totalAmount - challan.paidAmount;
            setPaidAmount(newRemaining > 0 ? newRemaining : 0);
            setDiscount(challan.discount || 0);
            setPaidDate(formatDateForInput(new Date()));
            setError('');
        }
    }, [isOpen, challan]);

    const handleSave = () => {
        const payment = Number(paidAmount) || 0;
        const disc = Number(discount) || 0;
        const totalPaidAndDiscounted = challan.paidAmount + payment + disc;

        if (payment <= 0 && disc <= challan.discount) {
            setError('Paid amount must be greater than zero or discount must be updated.');
            return;
        }

        if (totalPaidAndDiscounted > challan.totalAmount) {
             setError('Total payment (including discount) cannot exceed the total challan amount.');
             return;
        }
        recordFeePayment(challan.id, payment, disc, paidDate);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Record Payment for Challan #${challan.challanNumber}`}>
            <div className="space-y-4">
                <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                    <div className="flex justify-between text-sm"><span>Total Amount:</span> <span className="font-semibold">Rs. {challan.totalAmount.toLocaleString()}</span></div>
                    <div className="flex justify-between text-sm"><span>Already Paid:</span> <span className="font-semibold">Rs. {challan.paidAmount.toLocaleString()}</span></div>
                    <div className="flex justify-between text-sm"><span>Current Discount:</span> <span className="font-semibold">Rs. {challan.discount.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold mt-2"><span>Amount Due:</span> <span>Rs. {(challan.totalAmount - challan.paidAmount - challan.discount).toLocaleString()}</span></div>
                </div>

                {error && <p className="text-red-500 text-sm p-3 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 rounded-md">{error}</p>}

                <div>
                    <label htmlFor="paidAmount" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Amount being Paid Now (Rs.)</label>
                    <input type="number" id="paidAmount" value={paidAmount} onChange={e => setPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full input-style" />
                </div>
                <div>
                    <label htmlFor="discount" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Total Discount (Rs.)</label>
                    <input type="number" id="discount" value={discount} onChange={e => setDiscount(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full input-style" />
                </div>
                 <div>
                    <label htmlFor="paidDate" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Payment Date</label>
                    <input type="date" id="paidDate" value={paidDate} onChange={e => setPaidDate(e.target.value)} className="w-full input-style" />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-600 dark:hover:bg-secondary-500">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg">Save Payment</button>
                </div>
            </div>
             <style>{`.input-style { background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 0.5rem; width: 100%; padding: 0.625rem; } .dark .input-style { background-color: #374151; border-color: #4b5563; color: white; }`}</style>
        </Modal>
    );
};

export default RecordPaymentModal;