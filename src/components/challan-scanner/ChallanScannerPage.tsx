import React, { useState, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';

// Icons
const UploadCloudIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-secondary-400"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>;
const ScanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2"><path d="m12 3-1.9 3.8-3.8 1.9 3.8 1.9L12 14.4l1.9-3.8 3.8-1.9-3.8-1.9L12 3z"/><path d="M5 11.5 6.9 13.4l1.9 3.8-1.9 3.8L5 22.5l-1.9-1.9-3.8-1.9 3.8-1.9L5 11.5z"/><path d="M19 11.5 17.1 13.4l-1.9 3.8 1.9 3.8L19 22.5l1.9-1.9 3.8-1.9-3.8-1.9L19 11.5z"/></svg>;
const LoaderIcon = () => <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

// Helper to convert file to base64
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

interface ExtractedData {
    challanNumber?: string;
    issueDate?: string;
    dueDate?: string;
    studentName?: string;
    fatherName?: string;
    className?: string;
    rollNumber?: string;
    feeItems?: { particulars: string; amount: number }[];
    discount?: number;
    grandTotal?: number;
}

const ChallanScannerPage: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFileChange = useCallback((file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            setExtractedData(null);
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setError('Please select a valid image file.');
        }
    }, []);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const handleExtractData = async () => {
        if (!imageFile) {
            setError('Please upload an image first.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setExtractedData(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const imagePart = await fileToGenerativePart(imageFile);
            
            const schema = {
                type: Type.OBJECT,
                properties: {
                    challanNumber: { type: Type.STRING, description: "Challan #" },
                    issueDate: { type: Type.STRING, description: "Date of issue" },
                    dueDate: { type: Type.STRING, description: "Payment due date" },
                    studentName: { type: Type.STRING },
                    fatherName: { type: Type.STRING },
                    className: { type: Type.STRING, description: "Class or Grade" },
                    rollNumber: { type: Type.STRING },
                    feeItems: {
                        type: Type.ARRAY,
                        description: "List of all fee items like tuition, annual fees.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                particulars: { type: Type.STRING, description: "Name of the fee item" },
                                amount: { type: Type.NUMBER, description: "Amount for the item" }
                            },
                            required: ["particulars", "amount"]
                        }
                    },
                    discount: { type: Type.NUMBER, description: "Discount amount, usually negative" },
                    grandTotal: { type: Type.NUMBER, description: "The final total amount" }
                }
            };

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { 
                    parts: [
                        imagePart,
                        { text: "Analyze the provided image of a school fee challan and extract the key information. Return the data in a structured JSON format according to the provided schema." }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                }
            });
            
            const jsonStr = response.text;
            if (!jsonStr) {
                throw new Error("AI model returned no text. The response might be empty or in an unexpected format.");
            }
            const data = JSON.parse(jsonStr.trim());
            setExtractedData(data);

        } catch (e) {
            console.error(e);
            setError('Failed to extract data. The AI model could not process the image, or the API key is invalid. Please try again with a clearer image.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Challan Scanner</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div 
                        onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className={`p-6 bg-white dark:bg-secondary-800 rounded-lg shadow-md border-2 border-dashed ${dragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-secondary-300 dark:border-secondary-600'}`}
                    >
                        <div className="flex flex-col items-center justify-center text-center">
                            <UploadCloudIcon />
                            <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                                <label htmlFor="file-upload" className="font-medium text-primary-600 dark:text-primary-400 hover:underline cursor-pointer">
                                    Upload a file
                                </label>
                                {' '}or drag and drop
                            </p>
                            <p className="text-xs text-secondary-500">PNG, JPG, GIF up to 10MB</p>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
                        </div>
                    </div>

                    {imagePreviewUrl && (
                        <div className="bg-white dark:bg-secondary-800 p-4 rounded-lg shadow-md">
                            <h3 className="font-semibold mb-2">Image Preview</h3>
                            <img src={imagePreviewUrl} alt="Challan preview" className="rounded-md max-h-96 w-auto mx-auto"/>
                            <button onClick={handleExtractData} disabled={isLoading} className="btn-primary w-full mt-4">
                                {isLoading ? <LoaderIcon /> : <SparklesIcon />}
                                {isLoading ? 'Extracting...' : 'Extract Information with AI'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                    <div className="p-4 border-b dark:border-secondary-700">
                        <h2 className="text-xl font-semibold">Extracted Information</h2>
                    </div>
                    <div className="p-4">
                        {isLoading && <div className="text-center p-8"><p>Analyzing image with Gemini AI...</p></div>}
                        {error && <div className="text-center p-8 text-red-500">{error}</div>}
                        {extractedData && (
                            <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InfoField label="Challan #" value={extractedData.challanNumber} />
                                <InfoField label="Issue Date" value={extractedData.issueDate} />
                                <InfoField label="Due Date" value={extractedData.dueDate} />
                                <InfoField label="Student Name" value={extractedData.studentName} />
                                <InfoField label="Father's Name" value={extractedData.fatherName} />
                                <InfoField label="Class" value={extractedData.className} />
                                <InfoField label="Roll #" value={extractedData.rollNumber} />
                                <div className="sm:col-span-2">
                                    <h4 className="input-label font-medium mb-2">Fee Particulars</h4>
                                    <div className="space-y-2">
                                        {extractedData.feeItems?.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center p-2 bg-secondary-50 dark:bg-secondary-700 rounded-md">
                                                <input type="text" defaultValue={item.particulars} className="input-field bg-transparent border-0 p-0" />
                                                <input type="number" defaultValue={item.amount} className="input-field w-24 text-right bg-transparent border-0 p-0" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <InfoField label="Discount" value={extractedData.discount} type="number" />
                                <InfoField label="Grand Total" value={extractedData.grandTotal} type="number" />
                            </form>
                        )}
                        {!isLoading && !extractedData && !error && (
                            <div className="text-center p-8 text-secondary-500 flex flex-col items-center gap-2">
                                <ScanIcon />
                                <p>Upload an image and click "Extract" to see the results here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoField: React.FC<{ label: string; value?: string | number; type?: string }> = ({ label, value, type = 'text' }) => (
    <div>
        <label className="input-label">{label}</label>
        <input type={type} defaultValue={value ?? ''} className="input-field" />
    </div>
);

export default ChallanScannerPage;