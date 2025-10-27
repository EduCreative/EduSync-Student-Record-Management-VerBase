import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { FeeChallan, Student } from '../../types';
import FeePaymentModal from '../fees/FeePaymentModal';
import Avatar from '../common/Avatar';
import { useToast } from '../../context/ToastContext';

// Declare BarcodeDetector for environments where it might not be typed
declare class BarcodeDetector {
  constructor(options?: { formats: string[] });
  static getSupportedFormats(): Promise<string[]>;
  detect(image: ImageBitmapSource): Promise<{ rawValue: string }[]>;
}

const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>;
const CameraOffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 2 20 20"/><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><path d="M9.53 9.47a3 3 0 1 0 4.98 4.98"/></svg>;


const ChallanScannerPage: React.FC = () => {
    const { fees, students } = useData();
    const { showToast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectorRef = useRef<BarcodeDetector | null>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [scannedChallan, setScannedChallan] = useState<FeeChallan | null>(null);
    const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const feesMap = useMemo(() => new Map(fees.map(f => [f.challanNumber, f])), [fees]);
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const startScan = useCallback(async () => {
        setError(null);
        setScannedChallan(null);
        setScannedStudent(null);
        
        if (!('BarcodeDetector' in window)) {
            setError('Barcode detection is not supported in this browser.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            detectorRef.current = new BarcodeDetector({ formats: ['code_128', 'qr_code'] });
            setIsScanning(true);
        } catch (err) {
            setError('Could not access camera. Please grant permission and try again.');
            console.error(err);
        }
    }, []);

    const stopScan = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsScanning(false);
    }, []);

    useEffect(() => {
        let animationFrameId: number;

        const scanLoop = async () => {
            if (videoRef.current && detectorRef.current && isScanning) {
                try {
                    const barcodes = await detectorRef.current.detect(videoRef.current);
                    if (barcodes.length > 0) {
                        const challanNumber = barcodes[0].rawValue;
                        const challan = feesMap.get(challanNumber);

                        if (challan) {
                            const student = studentMap.get(challan.studentId);
                            setScannedChallan(challan);
                            setScannedStudent(student || null);
                            showToast('Success', `Challan #${challanNumber} found!`, 'success');
                            stopScan();
                        } else {
                            showToast('Not Found', `Challan #${challanNumber} not found.`, 'error');
                        }
                    }
                } catch (e) {
                    console.error('Scan failed:', e);
                }
            }
            animationFrameId = requestAnimationFrame(scanLoop);
        };
        
        if(isScanning) {
            scanLoop();
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
            stopScan();
        };
    }, [isScanning, feesMap, studentMap, stopScan, showToast]);

    return (
        <>
            {scannedChallan && scannedStudent && (
                <FeePaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    challan={scannedChallan}
                    student={scannedStudent}
                />
            )}
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Scan & Pay Challan</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-secondary-800 p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
                        <div className="w-full aspect-video bg-black rounded-md overflow-hidden relative flex items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isScanning ? 'hidden' : ''}`}></video>
                            {!isScanning && <CameraOffIcon />}
                            {isScanning && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-sm h-1/4 border-2 border-dashed border-white/50 rounded-lg"></div>}
                        </div>
                        <button onClick={isScanning ? stopScan : startScan} className={`btn ${isScanning ? 'btn-danger' : 'btn-primary'} mt-4`}>
                            {isScanning ? <CameraOffIcon /> : <CameraIcon />}
                            {isScanning ? 'Stop Scanning' : 'Start Camera'}
                        </button>
                    </div>

                    <div className="bg-white dark:bg-secondary-800 p-4 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:border-secondary-700">Scanned Details</h2>
                        {error && <p className="text-red-500 text-center py-8">{error}</p>}
                        {scannedChallan && scannedStudent ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Avatar student={scannedStudent} className="w-16 h-16"/>
                                    <div>
                                        <p className="font-bold text-lg">{scannedStudent.name}</p>
                                        <p className="text-sm text-secondary-500">Challan #{scannedChallan.challanNumber}</p>
                                    </div>
                                </div>
                                <div className="text-sm space-y-2 p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                                    <p><strong>Month/Year:</strong> {scannedChallan.month} {scannedChallan.year}</p>
                                    <p><strong>Total Amount:</strong> Rs. {(scannedChallan.totalAmount - scannedChallan.discount).toLocaleString()}</p>
                                    <p><strong>Status:</strong> {scannedChallan.status}</p>
                                </div>
                                <button onClick={() => setIsPaymentModalOpen(true)} className="btn-primary w-full">
                                    Record Payment
                                </button>
                            </div>
                        ) : (
                            <p className="text-center py-8 text-secondary-500">
                                {isScanning ? "Point your camera at a challan's barcode." : "Start the camera to begin scanning."}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChallanScannerPage;