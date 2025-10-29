import type { FC } from 'react';
import { FeeChallan, Student, School } from '../../types';
import { EduSyncLogo } from '../../constants';
import QRCode from '../common/QRCode';
import { formatDate } from '../../utils/dateHelper';

interface PrintableChallanProps {
    challan: FeeChallan;
    student: Student;
    school: School;
    studentClass?: string;
}

const ChallanRow: FC<{ label: string; value: string | number; bold?: boolean }> = ({ label, value, bold }) => (
    <div className={`flex justify-between items-baseline py-1 px-2 border-b border-gray-200 last:border-b-0 ${bold ? 'font-bold' : ''}`}>
        <span className="text-xs">{label}</span>
        <span className="text-xs text-right">{typeof value === 'number' ? `Rs. ${value.toLocaleString()}` : value}</span>
    </div>
);

const PrintableChallan: FC<PrintableChallanProps> = ({ challan, student, school, studentClass }) => {
    
    const balance = challan.totalAmount - challan.discount - challan.paidAmount;

    const ChallanBody: FC = () => (
        <>
            <div className="flex items-center gap-2 p-2 border-b">
                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center">
                    {school.logoUrl ? (
                        <img src={school.logoUrl} alt="logo" className="max-h-10 max-w-10 object-contain" />
                    ) : (
                        <EduSyncLogo className="h-8 text-primary-700" />
                    )}
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-sm leading-tight">{school.name}</h3>
                    <p className="text-xs">Fee Challan</p>
                </div>
            </div>
            
            <div className="barcode-container py-1 border-b" style={{ minHeight: '50px' }}>
                <QRCode value={challan.challanNumber} size={45} />
            </div>

            <div className="p-1 text-xs">
                <div className="flex justify-between"><span>Issue Date:</span><span>{formatDate(new Date())}</span><span>Due Date:</span><span className="font-bold">{formatDate(challan.dueDate)}</span></div>
            </div>
            <div className="p-1 border-t border-b text-xs">
                <div className="flex justify-between">
                    <span>Student: <span className="font-bold">{student.name}</span></span>
                    <span>Father: <span>{student.fatherName}</span></span>
                </div>
                <div className="flex justify-between">
                    <span>Class: <span>{studentClass}</span></span>
                    <span>Roll #: <span>{student.rollNumber}</span></span>
                    <span>GR #: <span>{student.grNumber || '-'}</span></span>
                </div>
            </div>
            <div className="border-x border-gray-300">
                <div className="flex justify-between items-baseline py-1 px-2 bg-secondary-200 border-b border-gray-300">
                    <span className="font-bold text-xs">PARTICULARS</span>
                    <span className="font-bold text-xs">AMOUNT</span>
                </div>
                {challan.feeItems.map((item, index) => (
                    <ChallanRow key={index} label={item.description} value={item.amount} />
                ))}
                {challan.previousBalance > 0 && <ChallanRow label="Arrears" value={challan.previousBalance} />}
            </div>
            <div className="border border-t-0 border-gray-300 mt-auto">
                <ChallanRow label="Sub Total" value={challan.totalAmount} />
                <ChallanRow label="Discount" value={challan.discount} />
                <ChallanRow label="Total Amount Due" value={challan.totalAmount - challan.discount} bold />
                <ChallanRow label="Paid Amount" value={challan.paidAmount > 0 ? challan.paidAmount : '-'} />
                <ChallanRow label="Payment Date" value={challan.paidDate ? formatDate(challan.paidDate) : '-'} />
                <ChallanRow label="Balance" value={balance} bold />
            </div>
        </>
    );

    return (
        <>
            <div className="school-copy flex flex-col p-1 border-r h-full w-1/2">
                <ChallanBody />
                 <p className="text-[8px] font-bold text-center p-1">School Copy</p>
            </div>
            <div className="parent-copy flex flex-col p-1 h-full w-1/2">
                <ChallanBody />
                <p className="text-[8px] font-bold text-center p-1">Parent/Student Copy</p>
            </div>
        </>
    );
};

export default PrintableChallan;
