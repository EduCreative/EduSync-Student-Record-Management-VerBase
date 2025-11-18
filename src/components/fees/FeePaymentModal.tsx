import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { FeeChallan, Student } from '../../types';
import { useData } from '../../context/DataContext';

interface FeePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    challan: FeeChallan;
    student: Student;
    editMode?: boolean;
    defaultDate?: string;
}

const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const FeePaymentModal: React.FC<FeePaymentModalProps> = ({ isOpen, onClose, challan, student, editMode = false, defaultDate }) => {
    const { recordFeePayment, updateFeePayment } = useData();
    
    const [amount, setAmount] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [paidDate, setPaidDate] = useState(getTodayString());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editMode) {
                setAmount(challan.paidAmount);
                setDiscount(challan.discount);
                setPaidDate(challan.paidDate || getTodayString());
            } else {
                const balance = challan.totalAmount - challan.discount - challan.paidAmount;
                setAmount(balance);
                setDiscount(challan.discount);
                setPaidDate(defaultDate || getTodayString());
            }
        }
    }, [isOpen, challan, editMode, defaultDate]);

    const remainingBalance = editMode
        ? challan.totalAmount - (amount + discount)
        : challan.totalAmount - (challan.paidAmount + amount + discount);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editMode) {
                await updateFeePayment(challan.id, amount, discount, paidDate);
            } else {
                await recordFeePayment(challan.id, amount, discount, paidDate);
            }
            onClose();
        } catch (error) {
            console.error("Failed to process payment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const balanceDue = challan.totalAmount - challan.discount - challan.paidAmount;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editMode ? `Edit Payment for ${student.name}`: `Record Payment for ${student.name}`}>
            <div className="space-y-4">
                <div className="p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg text-sm">
                     <div className="grid grid-cols-2 gap-2 mb-2">
                        <p><strong>Student ID:</strong> <span className="text-lg font-bold text-primary-700 dark:text-primary-400">{student.rollNumber}</span></p>
                        <p><strong>Father Name:</strong> {student.fatherName}</p>
                        <p><strong>Challan Month:</strong> {challan.month} {challan.year}</p>
                    </div>
                    
                    <div className="border-t dark:border-secondary-600 pt-2 mt-2">
                         <p className="font-semibold mb-1">Fee Breakdown:</p>
                         <ul className="space-y-1 text-xs text-secondary-600 dark:text-secondary-300">
                            {challan.feeItems.map((item, idx) => (
                                <li key={idx} className="flex justify-between">
                                    <span>{item.description}</span>
                                    <span>Rs. {item.amount.toLocaleString()}</span>
                                </li>
                            ))}
                             {challan.previousBalance > 0 && (
                                <li className="flex justify-between font-medium text-red-600 dark:text-red-400">
                                    <span>Arrears (Previous Balance)</span>
                                    <span>Rs. {challan.previousBalance.toLocaleString()}</span>
                                </li>
                            )}
                         </ul>
                    </div>

                    <div className="border-t dark:border-secondary-600 pt-2 mt-2 flex justify-between items-center text-base">
                        <strong>Total Amount:</strong> 
                        <strong>Rs. {challan.totalAmount.toLocaleString()}</strong>
                    </div>
                    
                    {editMode ? (
                         <div className="flex justify-between items-center mt-2">
                            <strong>Currently Paid:</strong> 
                            <span>Rs. {challan.paidAmount.toLocaleString()}</span>
                         </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mt-1 text-xs">
                                <span>Already Paid:</span>
                                <span>Rs. {challan.paidAmount.toLocaleString()}</span>
                            </div>
                             <div className="flex justify-between items-center mt-2 text-base font-bold text-primary-600 dark:text-primary-400">
                                <span>Current Balance Due:</span>
                                <span>Rs. {balanceDue.toLocaleString()}</span>
                            </div>
                        </>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="amount" className="input-label">{editMode ? 'Paid Amount' : 'Amount Paying Now'}</label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                            className="input-field"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="discount" className="input-label">Discount</label>
                        <input
                            type="number"
                            id="discount"
                            value={discount}
                            onChange={e => setDiscount(Number(e.target.value))}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label htmlFor="paidDate" className="input-label">Payment Date</label>
                        <input
                            type="date"
                            id="paidDate"
                            value={paidDate}
                            onChange={e => setPaidDate(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-center font-medium text-sm">
                        Remaining Balance After this Payment: 
                        <span className={`ml-2 ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            Rs. {remainingBalance.toLocaleString()}
                        </span>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary">
                            {isSubmitting ? 'Saving...' : (editMode ? 'Update Payment' : 'Record Payment')}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default FeePaymentModal;