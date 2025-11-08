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
            <div className="text-sm space-y-2 mb-4 p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                <p><strong>Challan:</strong> {challan.month} {challan.year}</p>
                <p><strong>Total Amount:</strong> Rs. {challan.totalAmount.toLocaleString()}</p>
                {editMode ? (
                     <p className="font-bold"><strong>Currently Paid:</strong> Rs. {challan.paidAmount.toLocaleString()}</p>
                ) : (
                    <>
                        <p><strong>Already Paid:</strong> Rs. {challan.paidAmount.toLocaleString()}</p>
                        <p className="font-bold"><strong>Current Balance Due:</strong> Rs. {balanceDue.toLocaleString()}</p>
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

                <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-center font-medium">
                    Remaining Balance After this Payment: 
                    <span className={`ml-2 ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Rs. {remainingBalance.toLocaleString()}
                    </span>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary">
                        {isSubmitting ? 'Saving...' : (editMode ? 'Update Payment' : 'Confirm Payment')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default FeePaymentModal;