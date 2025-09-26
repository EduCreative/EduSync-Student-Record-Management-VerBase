
import React, { useState } from 'react';
import Modal from '../users/Modal';
import { useData } from '../../context/DataContext';
import { Student } from '../../types';

interface IssueCertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    onCertificateIssued: (studentId: string) => void;
}

const IssueCertificateModal: React.FC<IssueCertificateModalProps> = ({ isOpen, onClose, student, onCertificateIssued }) => {
    const { issueLeavingCertificate } = useData();
    const [formData, setFormData] = useState({
        dateOfLeaving: new Date().toISOString().split('T')[0],
        reasonForLeaving: '',
        conduct: 'Good' as Student['conduct'],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.reasonForLeaving) {
            alert('Reason for leaving is required.');
            return;
        }
        issueLeavingCertificate(student.id, formData);
        onCertificateIssued(student.id);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Issue Leaving Certificate for ${student.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="dateOfLeaving" className="block text-sm font-medium">Date of Leaving</label>
                    <input
                        type="date"
                        id="dateOfLeaving"
                        value={formData.dateOfLeaving}
                        onChange={e => setFormData(prev => ({...prev, dateOfLeaving: e.target.value}))}
                        className="w-full mt-1 p-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="reasonForLeaving" className="block text-sm font-medium">Reason for Leaving</label>
                    <input
                        type="text"
                        id="reasonForLeaving"
                        value={formData.reasonForLeaving}
                        onChange={e => setFormData(prev => ({...prev, reasonForLeaving: e.target.value}))}
                        className="w-full mt-1 p-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600"
                        placeholder="e.g., Relocation, Completed Studies"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="conduct" className="block text-sm font-medium">Conduct</label>
                    <select
                        id="conduct"
                        value={formData.conduct}
                        onChange={e => setFormData(prev => ({...prev, conduct: e.target.value as Student['conduct']}))}
                        className="w-full mt-1 p-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600"
                    >
                        <option>Excellent</option>
                        <option>Good</option>
                        <option>Fair</option>
                        <option>Poor</option>
                    </select>
                </div>
                 <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-secondary-200 dark:bg-secondary-700">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white">Issue Certificate</button>
                </div>
            </form>
        </Modal>
    );
};

export default IssueCertificateModal;