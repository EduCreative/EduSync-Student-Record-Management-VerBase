import React, { useState } from 'react';

interface BarChartDataItem {
    label: string;
    value: number;
}

interface BarChartProps {
    data: BarChartDataItem[];
    title: string;
    color: string;
}

interface TooltipData {
    x: number;
    y: number;
    label: string;
    value: number;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, color }) => {
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0;

    const handleMouseEnter = (e: React.MouseEvent, item: BarChartDataItem) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            x: rect.left + rect.width / 2, // Center of the bar
            y: rect.top, // Top of the bar
            label: item.label,
            value: item.value,
        });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    if (maxValue === 0) {
        return (
            <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg h-full flex flex-col justify-center items-center">
                <h3 className="text-lg font-semibold mb-2 text-secondary-800 dark:text-secondary-100">{title}</h3>
                <p className="text-secondary-500 dark:text-secondary-400">No data available.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg h-full">
            {tooltip && (
                <div 
                    className="fixed z-10 p-2 text-xs bg-secondary-900 text-white rounded-md shadow-lg pointer-events-none"
                    style={{ 
                        top: `${tooltip.y}px`, 
                        left: `${tooltip.x}px`, 
                        transform: 'translate(-50%, -110%)' // Position above the bar
                    }}
                >
                    <div className="font-bold">{tooltip.label}</div>
                    <div>Students: {tooltip.value}</div>
                </div>
            )}
            <h3 className="text-lg font-semibold mb-4 text-secondary-800 dark:text-secondary-100">{title}</h3>
            <div className="w-full h-64 flex items-end justify-around space-x-4">
                {data.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center h-full">
                        <div className="w-full flex-1 flex items-end justify-center">
                            <div
                                onMouseEnter={(e) => handleMouseEnter(e, item)}
                                onMouseLeave={handleMouseLeave}
                                className="w-3/4 rounded-t-md hover:opacity-80 transition-all duration-300 cursor-pointer"
                                style={{
                                    height: `${(item.value / (maxValue * 1.1)) * 100}%`,
                                    backgroundColor: color
                                }}
                            />
                        </div>
                        <span className="text-xs text-center mt-2 text-secondary-500 dark:text-secondary-400">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BarChart;