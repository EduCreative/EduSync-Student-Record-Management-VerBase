import React from 'react';
import Modal from './Modal';
import { EduSyncLogo } from '../../constants';
import { version } from '../../../package.json';
import metadata from '../../../metadata.json';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="About EduSync">
            <div className="text-center p-4">
                <EduSyncLogo className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
                    EduSync
                </h2>
                <p className="text-sm text-secondary-500">Version {version}</p>
                <p className="mt-4 text-secondary-600 dark:text-secondary-400 max-w-md mx-auto">
                    {metadata.description}
                </p>
                <p className="mt-6 text-xs text-secondary-400">
                    &copy; {new Date().getFullYear()} EduSync. All rights reserved.
                </p>
            </div>
        </Modal>
    );
};

export default AboutModal;
