
import React, { useState, useRef, useEffect } from 'react';

interface LogoUploadProps {
    logoUrl: string | null | undefined;
    onChange: (fileData: string | null) => void;
}

const SchoolIconPlaceholder: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-secondary-400">
        <path d="m4 6 8-4 8 4"/>
        <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/>
        <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/>
        <path d="M18 5v17"/>
        <path d="M6 5v17"/>
        <circle cx="12" cy="9" r="2"/>
    </svg>
);

const LogoUpload: React.FC<LogoUploadProps> = ({ logoUrl, onChange }) => {
    const [preview, setPreview] = useState<string | null | undefined>(logoUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPreview(logoUrl);
    }, [logoUrl]);

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
            <div className="relative w-24 h-24 rounded-lg bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center overflow-hidden">
                {preview ? (
                    <img src={preview} alt="School Logo Preview" className="w-full h-full object-contain" />
                ) : (
                    <SchoolIconPlaceholder />
                )}
            </div>
            <div className="flex space-x-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/svg+xml"
                />
                <button
                    type="button"
                    onClick={handleUploadClick}
                    className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg"
                >
                    {preview ? 'Change Logo' : 'Upload Logo'}
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

export default LogoUpload;
