
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { FeeHead } from '../../types';
import Modal from '../users/Modal';
import FeeHeadFormModal from './FeeHeadFormModal';

const FeeHeadManager: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { feeHeads, addFeeHead, updateFeeHead, deleteFeeHead } = useData();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [feeHeadToEdit, setFeeHeadToEdit] = useState<FeeHead | null>(null);
    const [feeHeadToDelete, setFeeHeadToDelete] = useState<FeeHead | null>(null);

    const schoolFeeHeads = useMemo(() => {
        return feeHeads.filter(fh => fh.schoolId === currentUser?.schoolId);
    }, [feeHeads, currentUser]);

    const handleOpenModal = (feeHead: FeeHead | null = null) => {
        setFeeHeadToEdit(feeHead);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setFeeHeadToEdit(null);
        setIsModalOpen(false);
    };

    const handleSaveFeeHead = (data: FeeHead | Omit<FeeHead, 'id'>) => {
        if ('id' in data) {
            updateFeeHead(data);
        } else {
            addFeeHead(data);
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
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveFeeHead}
                feeHeadToEdit={feeHeadToEdit}
            />
            <Modal isOpen={!!feeHeadToDelete} onClose={() => setFeeHeadToDelete(null)} title="Confirm Deletion">
                <div>
                    <p>Are you sure you want to delete the fee head "{feeHeadToDelete?.name}"? This action cannot be undone.</p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setFeeHeadToDelete(null)} className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary-100">Cancel</button>
                        <button type="button" onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg">Delete</button>
                    </div>
                </div>
            </Modal>

            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                <div className="p-4 flex justify-between items-center border-b dark:border-secondary-700">
                    <h2 className="text-lg font-semibold">Manage Fee Heads</h2>
                    <button onClick={() => handleOpenModal()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition">
                        + Add Fee Head
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-secondary-500 dark:text-secondary-400">
                        <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-700 dark:text-secondary-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3 text-right">Default Amount (Rs.)</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schoolFeeHeads.map(fh => (
                                <tr key={fh.id} className="bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                                    <td className="px-6 py-4 font-medium text-secondary-900 dark:text-white">{fh.name}</td>
                                    <td className="px-6 py-4 text-right font-mono">{fh.defaultAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-4">
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
        </>
    );
};

export default FeeHeadManager;
