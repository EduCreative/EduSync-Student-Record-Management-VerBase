import React from 'react';
import { usePrint } from '../../context/PrintContext';

const PrintPreview: React.FC = () => {
    const { printContent, printTitle, hidePrintPreview } = usePrint();

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

        // Gather all style, link, and script tags from the main document
        const stylesAndScripts = document.querySelectorAll(
            'style, link[rel="stylesheet"], script[src="https://cdn.tailwindcss.com"], script#tailwind-config'
        );
        
        let headContent = '';
        stylesAndScripts.forEach(el => {
            headContent += el.outerHTML;
        });

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>${printTitle}</title>
                    ${headContent}
                </head>
                <body class="bg-white">
                    ${contentToPrint.innerHTML}
                </body>
            </html>
        `);

        printWindow.document.close();
        
        // Use a timeout to ensure all content and styles are loaded before printing
        setTimeout(() => {
            try {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            } catch (e) {
                console.error("Printing failed:", e);
                // Don't close automatically if print fails, so user can see content
            }
        }, 500);
    };

    const PrinterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>;
    const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

    return (
        <div className="fixed inset-0 bg-secondary-200 dark:bg-secondary-900 z-[100] flex flex-col print-preview-root">
            <header className="no-print bg-white dark:bg-secondary-800 shadow-md p-3 flex justify-between items-center shrink-0">
                <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{printTitle}</h2>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={handlePrint} 
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                    >
                        <PrinterIcon />
                        Print / Save as PDF
                    </button>
                    <button 
                        onClick={hidePrintPreview} 
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-600 rounded-lg"
                    >
                        <CloseIcon />
                        Close Preview
                    </button>
                </div>
            </header>
            
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="mx-auto" id="print-content-container">
                    {printContent}
                </div>
            </main>
        </div>
    );
};

export default PrintPreview;