import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { usePrint } from '../../context/PrintContext';
import { formatDate, EduSyncLogo } from '../../constants';
import { ActiveView } from '../layout/Layout';
import { Student } from '../../types';
import { useToast } from '../../context/ToastContext';

interface LeavingCertificatePageProps {
    studentId: string;
    setActiveView: (view: ActiveView) => void;
}

const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const LeavingCertificatePage: React.FC<LeavingCertificatePageProps> = ({ studentId, setActiveView }) => {
    const { students, classes, getSchoolById, issueLeavingCertificate } = useData();
    const { showPrintPreview } = usePrint();
    const { showToast } = useToast();

    const student = useMemo(() => students.find(s => s.id === studentId), [students, studentId]);
    const school = useMemo(() => getSchoolById(student?.schoolId || ''), [getSchoolById, student]);

    const [details, setDetails] = useState({
        dateOfLeaving: getTodayString(),
        reasonForLeaving: '',
        conduct: 'Good' as Student['conduct'],
    });
    const [isIssuing, setIsIssuing] = useState(false);

    if (!student || !school) return <div>Loading...</div>;
    
    const studentClass = classes.find(c => c.id === student.classId);

    const handleIssueAndPrint = async () => {
        if (!details.reasonForLeaving.trim()) {
            showToast('Missing Information', 'Please specify a reason for leaving.', 'error');
            return;
        }

        setIsIssuing(true);
        try {
            await issueLeavingCertificate(student.id, details);
            
            const certificateContent = (
                <div className="leaving-certificate-page font-serif text-black p-12 flex flex-col items-center justify-between bg-white h-full relative"
                     style={{ backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23333' stroke-width='8' stroke-dasharray='16%2c 16' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`}}>
                     
                    <div className="flex w-full items-center gap-4 relative z-10">
                        <div className="flex-shrink-0 h-24 w-24 flex items-center justify-center">
                            {school.logoUrl ? (
                                <img src={school.logoUrl} alt="School Logo" className="max-h-24 max-w-24 object-contain"/>
                            ) : (
                                <EduSyncLogo className="h-20 text-primary-700" />
                            )}
                        </div>
                        <div className="text-left">
                            <h1 className="text-4xl font-bold tracking-wider uppercase">{school.name}</h1>
                            <p className="text-lg">{school.address}</p>
                        </div>
                    </div>
                    
                    <div className="text-center w-full relative z-10 my-8">
                        <h2 className="text-3xl font-bold border-b-2 border-black pb-2 inline-block uppercase tracking-widest">School Leaving Certificate</h2>
                    </div>
                    
                    <div className="w-full text-lg space-y-6 px-8 text-left leading-loose relative z-10 flex-1">
                        <p>
                            This is to certify that <strong className="border-b border-dotted border-black px-2 min-w-[150px] inline-block text-center">{student.name}</strong>, 
                            son/daughter of <strong className="border-b border-dotted border-black px-2 min-w-[150px] inline-block text-center">{student.fatherName}</strong>, 
                            was a bona fide student of this institution.
                        </p>
                        <p>
                            He/She was studying in Class <strong className="border-b border-dotted border-black px-2 min-w-[100px] inline-block text-center">{studentClass?.name || 'N/A'}</strong> (Roll No: <strong>{student.rollNumber}</strong>).
                        </p>
                        <p>
                            His/Her date of admission was <strong className="border-b border-dotted border-black px-2">{formatDate(student.dateOfAdmission)}</strong> 
                            and date of leaving is <strong className="border-b border-dotted border-black px-2">{formatDate(details.dateOfLeaving)}</strong>.
                        </p>
                        <p>
                            According to the school records, his/her date of birth is <strong className="border-b border-dotted border-black px-2">{formatDate(student.dateOfBirth)}</strong>.
                        </p>
                        <p>
                            Reason for leaving: <strong className="border-b border-dotted border-black px-2 min-w-[200px] inline-block">{details.reasonForLeaving}</strong>.
                        </p>
                        <p>
                            General Conduct: <strong className="border-b border-dotted border-black px-2 min-w-[100px] inline-block text-center">{details.conduct}</strong>.
                        </p>
                        <p className="mt-8 italic text-center font-medium text-xl">
                            We wish him/her all the best for future endeavors.
                        </p>
                    </div>
    
                    <div className="w-full flex justify-between items-end mt-12 relative z-10">
                        <div className="text-center">
                            <p>Date of Issue: {formatDate(new Date())}</p>
                        </div>
                        <div className="text-center">
                            <p className="border-t-2 border-black pt-2 px-8 font-bold">Principal's Signature</p>
                        </div>
                    </div>
                </div>
            );
            showPrintPreview(certificateContent, `EduSync - Leaving Certificate - ${student.name}`);
        } catch (error) {
            console.error("Error issuing certificate:", error);
            // Toast is handled in context
        } finally {
            setIsIssuing(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
             <button onClick={() => setActiveView({ view: 'studentProfile', payload: { studentId } })} className="flex items-center text-sm font-medium text-secondary-600 hover:text-primary-600 dark:text-secondary-400">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Profile
            </button>

            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
                        Issue Leaving Certificate
                    </h1>
                    <span className="px-3 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-full text-sm">
                        {student.name}
                    </span>
                </div>

                <div className="space-y-4">
                     <div>
                        <label htmlFor="dateOfLeaving" className="input-label">Date of Leaving</label>
                        <input type="date" id="dateOfLeaving" value={details.dateOfLeaving} onChange={e => setDetails(d => ({...d, dateOfLeaving: e.target.value}))} className="input-field" />
                    </div>
                     <div>
                        <label htmlFor="reasonForLeaving" className="input-label">Reason for Leaving</label>
                        <input type="text" id="reasonForLeaving" value={details.reasonForLeaving} onChange={e => setDetails(d => ({...d, reasonForLeaving: e.target.value}))} className="input-field" placeholder="e.g., Relocation, Completed Studies" />
                    </div>
                     <div>
                        <label htmlFor="conduct" className="input-label">Conduct</label>
                        <select id="conduct" value={details.conduct} onChange={e => setDetails(d => ({...d, conduct: e.target.value as Student['conduct']}))} className="input-field">
                            <option>Excellent</option>
                            <option>Good</option>
                            <option>Fair</option>
                            <option>Poor</option>
                        </select>
                    </div>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-md text-sm text-yellow-800 dark:text-yellow-200 mt-4">
                        <p><strong>Note:</strong> Issuing this certificate will update the student's status to <strong>"Left"</strong>.</p>
                    </div>

                    <div className="pt-4">
                        <button onClick={handleIssueAndPrint} className="btn-primary w-full flex justify-center items-center gap-2" disabled={isIssuing}>
                            {isIssuing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Issuing...
                                </>
                            ) : (
                                'Issue & Print Certificate'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;

export default LeavingCertificatePage;