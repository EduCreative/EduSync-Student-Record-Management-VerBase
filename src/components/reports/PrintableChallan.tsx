import type { FC } from 'react';
import { FeeChallan, Student, School } from '../../types';
import { formatDate, EduSyncLogo } from '../../constants';

interface PrintableChallanProps {
    challan: FeeChallan;
    student: Student;
    school: School;
    studentClass?: string;
}

const ChallanRow: FC<{ label: string; value: string | number; bold?: boolean }> = ({ label, value, bold }) => (
    <div className={`flex justify-between items-baseline py-1 px-2 ${bold ? 'font-bold' : ''}`}>
        <span className="text-xs">{label}</span>
        <span className="text-xs text-right">{typeof value === 'number' ? `Rs. ${value.toLocaleString()}` : value}</span>
    </div>
);

const PrintableChallan: FC<PrintableChallanProps> = ({ challan, student, school, studentClass }) => {
    
    const ChallanBody: FC = () => (
        <>
            <div className="text-center p-2 border-b">
                <div className="h-8 w-full flex items-center justify-center mb-1">
                    {school.logoUrl ? (
                        <img src={school.logoUrl} alt="logo" className="max-h-8 max-w-full object-contain" />
                    ) : (
                        <EduSyncLogo className="h-8 text-primary-700" />
                    )}
                </div>
                <h3 className="font-bold text-sm">{school.name}</h3>
                <p className="text-xs">Fee Challan</p>
            </div>
            <div className="p-1 text-xs">
                <div className="flex justify-between"><span>Challan #:</span><span>{challan.challanNumber}</span></div>
                <div className="flex justify-between"><span>Issue Date:</span><span>{formatDate(new Date())}</span></div>
                <div className="flex justify-between"><span>Due Date:</span><span className="font-bold">{formatDate(challan.dueDate)}</span></div>
            </div>
            <div className="p-1 border-t border-b text-xs">
                <div className="flex justify-between"><span>Student:</span><span className="font-bold">{student.name}</span></div>
                <div className="flex justify-between"><span>Father:</span><span>{student.fatherName}</span></div>
                <div className="flex justify-between"><span>Class:</span><span>{studentClass}</span></div>
                <div className="flex justify-between"><span>Roll #:</span><span>{student.rollNumber}</span></div>
            </div>
            <div className="py-1">
                <div className="flex justify-between items-baseline py-1 px-2 bg-secondary-200">
                    <span className="font-bold text-xs">PARTICULARS</span>
                    <span className="font-bold text-xs">AMOUNT</span>
                </div>
                {challan.feeItems.map((item, index) => (
                    <ChallanRow key={index} label={item.description} value={item.amount} />
                ))}
                {challan.previousBalance > 0 && <ChallanRow label="Arrears" value={challan.previousBalance} />}
            </div>
            <div className="border-t mt-auto">
                <ChallanRow label="Sub Total" value={challan.totalAmount} bold />
                {challan.discount > 0 && <ChallanRow label="Discount" value={-challan.discount} />}
                <ChallanRow label="Grand Total" value={challan.totalAmount - challan.discount} bold />
            </div>
        </>
    );

    return (
        <>
            <div className="school-copy flex flex-col p-1 border-r h-full">
                <ChallanBody />
                 <p className="text-[8px] font-bold text-center p-1">School Copy</p>
            </div>
            <div className="parent-copy flex flex-col p-1 h-full">
                <ChallanBody />
                <p className="text-[8px] font-bold text-center p-1">Parent/Student Copy</p>
            </div>
        </>
    );
};

export default PrintableChallan;