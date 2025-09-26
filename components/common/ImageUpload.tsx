
import React, { useState, useRef } from 'react';
import Avatar from './Avatar';
import { Student } from '../../types';

interface ImageUploadProps {
    imageUrl: string | null | undefined;
    gender?: Student['gender'];
    onChange: (fileData: string | null) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ imageUrl, gender, onChange }) => {
    const [preview, setPreview] = useState<string | null | undefined>(imageUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setPreview(imageUrl);
    }, [imageUrl]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreview(result);
                onChange(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col items-center space-y-4 mb-4">
            <div className="relative">
                <Avatar 
                    student={{ gender } as Student} 
                    user={{ avatarUrl: preview } as any} 
                    className="w-24 h-24"
                />
            </div>
            <div className="flex space-x-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg"
                />
                <button
                    type="button"
                    onClick={handleUploadClick}
                    className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg"
                >
                    {preview ? 'Change Photo' : 'Upload Photo'}
                </button>
                {preview && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 rounded-lg"
                    >
                        Remove
                    </button>
                )}
            </div>
        </div>
    );
};

export default ImageUpload;