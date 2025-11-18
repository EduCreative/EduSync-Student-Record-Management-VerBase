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
    <div className={`flex justify-between items-baseline py-0.5 px-2 border-b border-gray-200 ${bold ? 'font-bold' : ''}`}>
        <span className="text-xs break-all">{label}</span>
        <span className="text-xs text-right whitespace-nowrap">{typeof value === 'number' ? `Rs. ${value.toLocaleString()}` : value}</span>
    </div>
);

const PrintableChallan: FC<PrintableChallanProps> = ({ challan, student, school, studentClass, copies = 3 }) => {
    
    const ChallanBody: FC<{ copyName: string }> = ({ copyName }) => (
        <div className="printable-challan border border-gray-800 p-2 h-full flex flex-col justify-between bg-white text-black">
            <div>
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
                            <p className="text-[10px]">Fee Challan - {copyName}</p>
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
                        <span>ID:</span>
                        <span className="text-right font-extrabold text-sm text-primary-700">{student.rollNumber}</span>
                    </div>
                    <div className="flex justify-between w-1/3 pl-1 border-l border-gray-200">
                        <span>GR No.:</span>
                        <span className="text-right">{student.grNumber || '---'}</span>
                    </div>
                </div>
                
                 <div className="flex justify-between items-baseline p-1 text-[10px] border-b border-gray-300">
                     <div className="flex justify-between w-1/2 pr-1">
                        <span>Challan #:</span>
                        <span className="font-bold">{challan.challanNumber}</span>
                    </div>
                    <div className="flex justify-between w-1/2 pl-1 border-l border-gray-200">
                        <span>Due Date:</span>
                        <span className="font-bold">{formatDate(challan.dueDate)}</span>
                    </div>
                </div>

                <div className="mt-1 border border-gray-300 border-b-0">
                    <div className="flex justify-between items-baseline py-1 px-2 bg-gray-100 border-b border-gray-300">
                        <span className="font-bold text-[10px]">PARTICULARS</span>
                        <span className="font-bold text-[10px]">AMOUNT</span>
                    </div>
                    {challan.feeItems.map((item, index) => (
                        <ChallanRow key={index} label={item.description} value={item.amount} />
                    ))}
                    <ChallanRow label="Arrears" value={challan.previousBalance || 0} />
                </div>
                <div className="border border-gray-300 bg-gray-50">
                    <ChallanRow label="Sub Total" value={challan.totalAmount} />
                    <ChallanRow label="Discount" value={challan.discount || 0} />
                    <div className="flex justify-between items-baseline py-1 px-2 font-bold bg-gray-200">
                        <span className="text-xs">PAYABLE</span>
                        <span className="text-xs">Rs. {(challan.totalAmount - (challan.discount || 0)).toLocaleString()}</span>
                    </div>
                </div>
                 <div className="mt-2 text-[9px] text-center italic text-gray-500">
                    <p>Generated on {formatDate(new Date())}.</p>
                    <p>This is a computer generated document.</p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t-2 border-dotted border-gray-400 flex justify-between items-end px-2">
                <div className="text-center">
                    <p className="text-[10px] font-bold border-t border-black pt-1 px-2">Bank Officer</p>
                </div>
                 <div className="text-center">
                    <p className="text-[10px] font-bold border-t border-black pt-1 px-2">School Admin</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-wrap gap-4 justify-center mb-8 page-break-after-always">
            <div className="w-[32%] min-w-[250px]">
                <ChallanBody copyName="Bank Copy" />
            </div>
            <div className="w-[32%] min-w-[250px]">
                <ChallanBody copyName="School Copy" />
            </div>
            {copies === 3 && (
                <div className="w-[32%] min-w-[250px]">
                    <ChallanBody copyName="Student Copy" />
                </div>
            )}
        </div>
    );
};

export default PrintableChallan;