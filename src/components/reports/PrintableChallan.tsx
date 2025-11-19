import { type FC } from 'react';
import { FeeChallan, Student, School } from '../../types';
import { formatDate, EduSyncLogo } from '../../constants';
import Barcode from '../common/Barcode';

interface PrintableChallanProps {
    challan: FeeChallan;
    student: Student;
    school: School;
    studentClass?: string;
    copies?: 2 | 3;
}

const ChallanRow: FC<{ label: string; value: string | number; bold?: boolean }> = ({ label, value, bold }) => (
    <div className={`flex justify-between items-baseline border-b border-gray-300 leading-none ${bold ? 'font-bold' : ''}`}>
        <span className="text-[9px] py-0.5">{label}</span>
        <span className="text-[9px] py-0.5 text-right whitespace-nowrap">{typeof value === 'number' ? `Rs. ${value.toLocaleString()}` : value}</span>
    </div>
);

const PrintableChallan: FC<PrintableChallanProps> = ({ challan, student, school, studentClass, copies = 3 }) => {
    
    const copyLabels = copies === 2 
        ? ["School Copy", "Parent/Student Copy"] 
        : ["Bank Copy", "School Copy", "Student Copy"];

    const ChallanBody: FC<{ copyName: string }> = ({ copyName }) => (
        <div className="printable-challan border-2 border-gray-800 p-1 h-full flex flex-col justify-between bg-white text-black relative box-border">
            {/* Header */}
            <div className="flex items-start gap-1 border-b-2 border-gray-800 pb-1 mb-1">
                <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center mt-1">
                    {school.logoUrl ? (
                        <img src={school.logoUrl} alt="logo" className="max-h-8 max-w-8 object-contain" />
                    ) : (
                        <EduSyncLogo className="h-6 text-primary-700" />
                    )}
                </div>
                <div className="flex-1 text-center">
                    <h3 className="font-bold text-xs uppercase leading-tight">{school.name}</h3>
                    <p className="text-[8px] leading-tight line-clamp-2">{school.address}</p>
                    <div className="mt-1">
                        <span className="text-[9px] font-bold bg-black text-white px-2 py-0.5 rounded-sm uppercase">{copyName}</span>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] mb-1 leading-tight">
                <div className="flex justify-between"><span>Challan #:</span> <span className="font-bold">{challan.challanNumber}</span></div>
                <div className="flex justify-between"><span>Due Date:</span> <span className="font-bold">{formatDate(challan.dueDate)}</span></div>
                <div className="col-span-2 flex justify-between border-b border-dotted border-gray-400"><span>Student:</span> <span className="font-bold truncate ml-1">{student.name}</span></div>
                <div className="col-span-2 flex justify-between border-b border-dotted border-gray-400"><span>Father:</span> <span className="font-bold truncate ml-1">{student.fatherName}</span></div>
                <div className="flex justify-between"><span>Class:</span> <span className="font-bold truncate max-w-[60px]">{studentClass || 'N/A'}</span></div>
                <div className="flex justify-between"><span>ID:</span> <span className="font-bold">{student.rollNumber}</span></div>
            </div>

            {/* Fee Table */}
            <div className="flex-1 border border-gray-400 mb-1 flex flex-col">
                <div className="flex justify-between bg-gray-200 px-1 py-0.5 border-b border-gray-400">
                    <span className="text-[9px] font-bold">Description</span>
                    <span className="text-[9px] font-bold">Amount</span>
                </div>
                <div className="flex-1 overflow-hidden px-1">
                    {challan.feeItems.map((item, index) => (
                        <ChallanRow key={index} label={item.description} value={item.amount} />
                    ))}
                    {challan.previousBalance > 0 && (
                         <ChallanRow label="Arrears" value={challan.previousBalance} />
                    )}
                </div>
            </div>

            {/* Totals */}
            <div className="text-[9px] space-y-0.5">
                <div className="flex justify-between border-b border-dotted border-gray-400">
                    <span>Current Amount:</span>
                    <span>Rs. {(challan.totalAmount - (challan.previousBalance || 0)).toLocaleString()}</span>
                </div>
                 <div className="flex justify-between border-b border-dotted border-gray-400">
                    <span>Total Arrears:</span>
                    <span>Rs. {(challan.previousBalance || 0).toLocaleString()}</span>
                </div>
                 <div className="flex justify-between border-b border-dotted border-gray-400">
                    <span>Discount:</span>
                    <span>Rs. {(challan.discount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-[10px] bg-gray-100 px-1 py-0.5 border border-gray-400">
                    <span>Payable By Due Date:</span>
                    <span>Rs. {(challan.totalAmount - (challan.discount || 0)).toLocaleString()}</span>
                </div>
                 <div className="flex justify-between text-[9px] font-bold">
                    <span>Payable After Due Date:</span>
                    <span>Rs. {(challan.totalAmount - (challan.discount || 0) + 500).toLocaleString()}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-1 pt-1 flex justify-between items-end">
                 <div className="flex flex-col items-center w-[30%]">
                     <div className="h-4 w-full border-b border-black"></div>
                     <span className="text-[7px] uppercase">Officer</span>
                 </div>
                 <div className="flex-1 px-1 flex justify-center overflow-hidden">
                    <div className="scale-90 origin-bottom">
                        <Barcode value={challan.challanNumber} height={20} barWidth={0.8} />
                    </div>
                 </div>
                 <div className="flex flex-col items-center w-[30%]">
                     <div className="h-4 w-full border-b border-black"></div>
                     <span className="text-[7px] uppercase">Cashier</span>
                 </div>
            </div>
            
            <div className="text-[6px] text-center text-gray-400 leading-none mt-0.5">
                Generated: {formatDate(new Date())} | ID: {student.rollNumber}
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-row justify-between gap-2 px-1 box-border">
             {copyLabels.map((label, index) => (
                <div key={index} style={{ width: copies === 2 ? '49%' : '32%' }} className="h-full">
                    <ChallanBody copyName={label} />
                </div>
             ))}
        </div>
    );
};

export default PrintableChallan;