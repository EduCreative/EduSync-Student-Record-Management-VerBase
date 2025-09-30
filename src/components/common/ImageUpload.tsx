

import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';

interface ImageUploadProps {
  imageUrl: string | null | undefined;
  onChange: (url: string) => void;
  bucketName?: 'avatars' | 'logos';
}

const ImageUpload: React.FC<ImageUploadProps> = ({ imageUrl, onChange, bucketName = 'avatars' }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            let { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
            
            if (!data.publicUrl) {
                throw new Error('Could not get public URL for the uploaded image.');
            }
            
            onChange(data.publicUrl);
            showToast('Success', 'Image uploaded successfully.');

        } catch (error: any) {
            showToast('Upload Error', error.message, 'error');
        } finally {
            setUploading(false);
        }
    };
    
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                    <img src={imageUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                    <UserIcon className="w-12 h-12 text-secondary-400" />
                )}
            </div>
            <button
                type="button"
                onClick={triggerFileInput}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg disabled:opacity-50"
            >
                {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
            />
        </div>
    );
};

const UserIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);


export default ImageUpload;