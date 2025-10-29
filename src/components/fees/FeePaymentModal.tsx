import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { FeeChallan, Student } from '../../types';
import { useData } from '../../context/DataContext';
import { getTodayString } from '../../utils/dateHelper';
import { useToast } from '../../context/ToastContext';

interface FeePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    challan: FeeChallan;
    student: Student;
}

const FeePaymentModal: React.FC<FeePaymentModalProps> = ({ isOpen, onClose, challan, student }) => {
    const { recordFeePayment } = useData();
    const { showToast } = useToast();
    const balanceDue = challan.totalAmount - challan.discount - challan.paidAmount;

    const [amount, setAmount] = useState(balanceDue);
    const [discount, setDiscount] = useState(challan.discount);
    const [paidDate, setPaidDate] = useState(getTodayString());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const balance = challan.totalAmount - challan.discount - challan.paidAmount;
            setAmount(balance);
            setDiscount(challan.discount);
            setPaidDate(getTodayString());
        }
    }, [isOpen, challan]);

    const remainingBalance = challan.totalAmount - (challan.paidAmount + amount + discount);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const paymentPromise = recordFeePayment(challan.id, amount, discount, paidDate);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Payment recording timed out after 15 seconds. Please try again.")), 15000)
            );
            await Promise.race([paymentPromise, timeoutPromise]);
            onClose();
        } catch (error: any) {
            console.error("Failed to record payment:", error);
            showToast('Error', error.message || 'Could not record payment.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Record Payment for ${student.name}`}>
            <div className="text-sm space-y-2 mb-4 p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                <p><strong>Challan:</strong> {challan.month} {challan.year}</p>
                <p><strong>Total Amount:</strong> Rs. {challan.totalAmount.toLocaleString()}</p>
                <p><strong>Already Paid:</strong> Rs. {challan.paidAmount.toLocaleString()}</p>
                <p className="font-bold"><strong>Current Balance Due:</strong> Rs. {balanceDue.toLocaleString()}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="amount" className="input-label">Amount Paying Now</label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                        className="input-field"
                        max={balanceDue}
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
                        {isSubmitting ? 'Saving...' : 'Confirm Payment'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default FeePaymentModal;