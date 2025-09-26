
import React, { useState } from 'react';
import { usePrint } from '../../context/PrintContext';

interface ReportViewerProps {
    title: string;
    children: React.ReactNode;
    exportData?: {
        headers: string[];
        rows: (string | number)[][];
        filename: string;
    };
    onClose?: () => void;
}

const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const allRows = [headers, ...rows];
    const processRow = (row: (string|number)[]) => row.map(val => {
        const strVal = String(val ?? '').replace(/"/g, '""');
        return `"${strVal}"`;
    }).join(',');

    const csvContent = allRows.map(processRow).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const ReportViewer: React.FC<ReportViewerProps> = ({ title, children, exportData, onClose }) => {
    const [zoom, setZoom] = useState(1);
    const { showPrintPreview } = usePrint();

    const handleZoom = (level: number) => {
        setZoom(prev => Math.max(0.5, Math.min(2, prev + level)));
    };

    const handlePrint = () => {
        showPrintPreview(children, `${title} - Preview`);
    };
    
    const handleExport = () => {
        if (exportData) {
            exportToCsv(exportData.filename, exportData.headers, exportData.rows);
        }
    };
    
    // SVG Icons
    const ZoomInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>;
    const ZoomOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>;
    const PdfIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M10 12v6"/><path d="M14 15h-2a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2"/><path d="M10 12h1.5a1.5 1.5 0 0 1 0 3H10"/></svg>;
    const ExcelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m16 13-4 4 4 4"/><path d="m10 13 4 4-4 4"/></svg>;
    const PrinterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>;
    const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

    return (
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
             <div className="flex justify-between items-center border-b dark:border-secondary-700 pb-4 mb-4 no-print">
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-white">{title}</h3>
                <div className="flex items-center space-x-2">
                    {/* Zoom Controls */}
                    <button onClick={() => handleZoom(-0.1)} title="Zoom Out" className="btn-icon"><ZoomOutIcon /></button>
                    <span className="text-sm w-12 text-center select-none cursor-pointer" title="Reset Zoom" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</span>
                    <button onClick={() => handleZoom(0.1)} title="Zoom In" className="btn-icon"><ZoomInIcon /></button>

                    <div className="h-6 border-l dark:border-secondary-600 mx-2"></div>

                    {/* Action Buttons */}
                    <button onClick={handlePrint} title="Save as PDF" className="btn-action"><PdfIcon /> <span>Save as PDF</span></button>
                    {exportData && <button onClick={handleExport} title="Export to Excel" className="btn-action"><ExcelIcon /> <span>Export</span></button>}
                    <button onClick={handlePrint} title="Print" className="btn-action"><PrinterIcon /></button>
                    
                    {onClose && (
                        <>
                            <div className="h-6 border-l dark:border-secondary-600 mx-2"></div>
                            <button onClick={onClose} title="Close" className="btn-close"><CloseIcon /></button>
                        </>
                    )}
                </div>
            </div>

            <div className="overflow-auto printable-report">
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.2s' }}>
                    {children}
                </div>
            </div>
            <style>{`
                .btn-icon, .btn-action, .btn-close {
                    display: flex; align-items: center; justify-content: center;
                    padding: 0.5rem; border-radius: 0.5rem; transition: background-color 0.2s, color 0.2s, border-color 0.2s;
                    border: 1px solid transparent;
                    font-weight: 500;
                }
                .btn-icon {
                    background-color: #f3f4f6; color: #374151;
                }
                .dark .btn-icon { background-color: #4b5563; color: #f9fafb; }
                .btn-icon:hover { background-color: #e5e7eb; }
                .dark .btn-icon:hover { background-color: #6b7280; }
                
                .btn-action {
                    gap: 0.5rem;
                    background-color: #eef2ff; color: #4338ca;
                    font-size: 0.875rem; padding: 0.5rem 1rem;
                }
                .dark .btn-action { background-color: #3730a3; color: #e0e7ff; }
                .btn-action:hover { background-color: #e0e7ff; }
                .dark .btn-action:hover { background-color: #4338ca; }

                .btn-close {
                    background-color: #fee2e2; color: #b91c1c;
                }
                .dark .btn-close { background-color: #7f1d1d; color: #fecaca; }
                .btn-close:hover { background-color: #fecaca; }
                .dark .btn-close:hover { background-color: #991b1b; }
            `}</style>
        </div>
    );
};

export default ReportViewer;
