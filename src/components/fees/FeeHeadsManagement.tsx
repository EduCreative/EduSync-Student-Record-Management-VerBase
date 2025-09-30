import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { FeeHead, UserRole } from '../../types';
import Modal from '../common/Modal';
import FeeHeadFormModal from './FeeHeadFormModal';

const FeeHeadsManagement: React.FC = () => {
    const { user, activeSchoolId } = useAuth();
    const { feeHeads, addFeeHead, updateFeeHead, deleteFeeHead } = useData();

    const effectiveSchoolId = user?.role === UserRole.Owner && activeSchoolId ? activeSchoolId : user?.schoolId;

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [feeHeadToEdit, setFeeHeadToEdit] = useState<FeeHead | null>(null);
    const [feeHeadToDelete, setFeeHeadToDelete] = useState<FeeHead | null>(null);

    const handleOpenModal = (feeHead: FeeHead | null = null) => {
        setFeeHeadToEdit(feeHead);
        setIsFormModalOpen(true);
    };

    const handleCloseModal = () => {
        setFeeHeadToEdit(null);
        setIsFormModalOpen(false);
    };

    const handleSaveFeeHead = (data: Omit<FeeHead, 'id'> | FeeHead) => {
        if (!effectiveSchoolId) return;

        if ('id' in data) {
            updateFeeHead(data);
        } else {
            addFeeHead({ ...data, schoolId: effectiveSchoolId });
        }
    };

    const handleDelete = () => {
        if (feeHeadToDelete) {
            deleteFeeHead(feeHeadToDelete.id);
            setFeeHeadToDelete(null);
        }
    };

    return (
        <>
            <FeeHeadFormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveFeeHead}
                feeHeadToEdit={feeHeadToEdit}
            />
            <Modal isOpen={!!feeHeadToDelete} onClose={() => setFeeHeadToDelete(null)} title="Confirm Deletion">
                <p>Are you sure you want to delete the fee head "{feeHeadToDelete?.name}"? This action cannot be undone.</p>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={() => setFeeHeadToDelete(null)} className="btn-secondary">Cancel</button>
                    <button type="button" onClick={handleDelete} className="btn-danger">Delete</button>
                </div>
            </Modal>
            
            <div className="p-4 sm:p-6">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">Manage Fee Heads</h2>
                    <button onClick={() => handleOpenModal()} className="btn-primary">
                        + Add Fee Head
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-secondary-500 dark:text-secondary-400">
                        <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">Fee Head Name</th>
                                <th scope="col" className="px-6 py-3">Default Amount</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feeHeads.map(fh => (
                                <tr key={fh.id} className="bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                    <td className="px-6 py-4 font-medium text-secondary-900 dark:text-white">{fh.name}</td>
                                    <td className="px-6 py-4">Rs. {fh.defaultAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-4">
                                            <button onClick={() => handleOpenModal(fh)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Edit</button>
                                            <button onClick={() => setFeeHeadToDelete(fh)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <style>{`
                .btn-primary { @apply px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg; }
                .btn-secondary { @apply px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg; }
                .btn-danger { @apply px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg; }
            `}</style>
        </>
    );
};

export default FeeHeadsManagement;
