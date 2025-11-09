import type { FC } from 'react';
import { FeeChallan, Student, School } from '../../types';
import { formatDate, EduSyncLogo } from '../../constants';
import Barcode from '../common/Barcode';

interface PrintableChallanProps {
    challan: FeeChallan;
    student: Student;
    school: School;
    studentClass?: string;
}

const ChallanRow: FC<{ label: string; value: string | number; bold?: boolean }> = ({ label, value, bold }) => (
    <div className={`flex justify-between items-baseline py-0.5 px-2 border-b border-gray-200 ${bold ? 'font-bold' : ''}`}>
        <span className="text-xs break-all">{label}</span>
        <span className="text-xs text-right whitespace-nowrap">{typeof value === 'number' ? `Rs. ${value.toLocaleString()}` : value}</span>
    </div>
);

const PrintableChallan: FC<PrintableChallanProps> = ({ challan, student, school, studentClass }) => {
    
    const ChallanBody: FC<{ copyName: string }> = ({ copyName }) => (
        <>
            <div className="flex items-center justify-between p-1 border-b border-gray-300">
                <div className="flex items-center gap-1 overflow-hidden">
                    <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center">
                        {school.logoUrl ? (
                            <img src={school.logoUrl} alt="logo" className="max-h-8 max-w-8 object-contain" />
                        ) : (
                            <EduSyncLogo className="h-6 text-primary-700" />
                        )}
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-xs leading-tight break-words">{school.name}</h3>
                        <p className="text-[10px]">Fee Challan</p>
                    </div>
                </div>
                <div className="barcode-container flex-shrink-0 ml-1">
                    <Barcode value={challan.challanNumber} height={25} barWidth={0.8} />
                </div>
            </div>

            <div className="flex justify-between items-baseline p-1 text-[10px] border-b border-gray-300">
                <span>Student:</span>
                <span className="font-bold text-right break-words">{student.name}</span>
            </div>
             <div className="flex justify-between items-baseline p-1 text-[10px] border-b border-gray-300">
                <span>Father:</span>
                <span className="text-right break-words">{student.fatherName}</span>
            </div>
            <div className="flex justify-between items-baseline p-1 text-[10px] border-b border-gray-300">
                <div className="flex justify-between w-1/3 pr-1">
                    <span>Class:</span>
                    <span className="text-right">{studentClass || 'N/A'}</span>
                </div>
                <div className="flex justify-between w-1/3 px-1 border-l border-gray-200">
                    <span>Roll No.:</span>
                    <span className="text-right">{student.rollNumber}</span>
                </div>
                <div className="flex justify-between w-1/3 pl-1 border-l border-gray-200">
                    <span>GR No.:</span>
                    <span className="text-right">{student.grNumber || '---'}</span>
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
                <ChallanRow label="Arrears" value={challan.previousBalance || 0} />
            </div>
            <div className="border border-t-0 border-gray-300">
                <ChallanRow label="Sub Total" value={challan.totalAmount} />
                <ChallanRow label="Discount" value={challan.discount || 0} />
                <ChallanRow label="Total Amount Due" value={challan.totalAmount - (challan.discount || 0)} bold />
                
                <div className="flex justify-between items-baseline py-0.5 px-2 border-b border-gray-200 text-xs">
                    <span>Payment Date:</span>
                    <span>{challan.paidDate ? formatDate(challan.paidDate) : '___-___-____'}</span>
                </div>
                 <div className="flex justify-between items-baseline py-0.5 px-2 border-b border-gray-200 text-xs">
                    <span>Paid Amount:</span>
                    <span>Rs. {(challan.paidAmount || 0).toLocaleString()}</span>
                </div>

                <ChallanRow label="Balance" value={challan.totalAmount - (challan.discount || 0) - (challan.paidAmount || 0)} bold />
                <p className="text-[8px] font-bold text-center p-0.5">{copyName}</p>
            </div>
        </>
    );

    return (
        <>
            <div className="bank-copy flex flex-col p-1 border-b md:border-b-0 md:border-r border-gray-400 w-full md:w-1/3">
                <ChallanBody copyName="Bank Copy" />
            </div>
            <div className="school-copy flex flex-col p-1 border-b md:border-b-0 md:border-r border-gray-400 w-full md:w-1/3">
                <ChallanBody copyName="School Copy" />
            </div>
            <div className="parent-copy flex flex-col p-1 w-full md:w-1/3">
                <ChallanBody copyName="Parent/Student Copy" />
            </div>
        </>
    );
};

export default PrintableChallan;