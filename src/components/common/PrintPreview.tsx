import React, { useState } from 'react';
import { usePrint } from '../../context/PrintContext';

const PrintPreview: React.FC = () => {
    const { printContent, printTitle, hidePrintPreview } = usePrint();
    const [zoom, setZoom] = useState(1);

    if (!printContent) {
        return null;
    }
    
    const handlePrint = () => {
        const contentToPrint = document.getElementById('print-content-container');
        if (!contentToPrint) {
            console.error("Print content container not found.");
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Could not open print window. Please check your browser's popup blocker settings.");
            return;
        }

        const stylesAndScripts = document.querySelectorAll(
            'style, link[rel="stylesheet"]'
        );
        
        let headContent = '';
        stylesAndScripts.forEach(el => {
            headContent += el.outerHTML;
        });

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-g" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>${printTitle}</title>
                    ${headContent}
                </head>
                <body class="bg-white">
                    <div style="transform: scale(1) !important; transform-origin: top !important;">
                        ${contentToPrint.innerHTML}
                    </div>
                </body>
            </html>
        `);

        printWindow.document.close();
        
        setTimeout(() => {
            try {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            } catch (e) {
                console.error("Printing failed:", e);
            }
        }, 500);
    };
    
    const handleZoom = (factor: number) => {
        setZoom(prev => Math.max(0.2, prev + factor));
    };

    const PrinterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>;
    const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    const ZoomInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>;
    const ZoomOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>;

    return (
        <div className="fixed inset-0 bg-secondary-200 dark:bg-secondary-900 z-[100] flex flex-col print-preview-root">
            <header className="no-print bg-white dark:bg-secondary-800 shadow-md p-3 grid grid-cols-3 items-center shrink-0">
                <div className="text-left">
                    <h2 className="text-lg font-bold text-secondary-900 dark:text-white truncate">{printTitle}</h2>
                </div>
                
                <div className="flex items-center justify-center space-x-2">
                    <button onClick={() => handleZoom(-0.1)} className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700" title="Zoom Out"><ZoomOutIcon /></button>
                    <span className="text-sm font-semibold w-16 text-center cursor-pointer" onClick={() => setZoom(1)} title="Reset Zoom">
                        {(zoom * 100).toFixed(0)}%
                    </span>
                    <button onClick={() => handleZoom(0.1)} className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700" title="Zoom In"><ZoomInIcon /></button>
                </div>
                
                <div className="flex items-center justify-end space-x-2">
                    <button onClick={handlePrint} className="btn-primary">
                        <PrinterIcon />
                        Print / Save PDF
                    </button>
                    <button onClick={hidePrintPreview} className="btn-secondary">
                        <CloseIcon />
                        Close
                    </button>
                </div>
            </header>
            
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div 
                    id="print-content-container" 
                    className="mx-auto transition-transform duration-150"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top' }}
                >
                    {printContent}
                </div>
            </main>
        </div>
    );
};

export default PrintPreview;
