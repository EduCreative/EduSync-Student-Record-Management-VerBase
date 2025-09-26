import React, { useState } from 'react';

interface ChartDataItem {
    label: string;
    value: number;
    color: string;
}

interface DoughnutChartProps {
    data: ChartDataItem[];
    title: string;
}

interface TooltipData {
    x: number;
    y: number;
    label: string;
    value: number;
    percentage: string;
    color: string;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ data, title }) => {
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);

    const handleMouseEnter = (e: React.MouseEvent, item: ChartDataItem) => {
        setTooltip({
            x: e.clientX,
            y: e.clientY,
            label: item.label,
            value: item.value,
            percentage: totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : "0.0",
            color: item.color,
        });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    if (totalValue === 0) {
        return (
            <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg h-full flex flex-col justify-center items-center">
                <h3 className="text-lg font-semibold mb-2 text-secondary-800 dark:text-secondary-100">{title}</h3>
                <p className="text-secondary-500 dark:text-secondary-400">No data available.</p>
            </div>
        );
    }

    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    let accumulatedCircumference = 0;

    return (
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg h-full">
            {tooltip && (
                <div 
                    className="fixed z-10 p-2 text-xs bg-secondary-900 text-white rounded-md shadow-lg pointer-events-none"
                    style={{ 
                        top: `${tooltip.y + 10}px`, 
                        left: `${tooltip.x + 10}px` 
                    }}
                >
                    <div className="flex items-center mb-1">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: tooltip.color }}></span>
                        <span className="font-bold">{tooltip.label}</span>
                    </div>
                    <div>Users: {tooltip.value} ({tooltip.percentage}%)</div>
                </div>
            )}
            <h3 className="text-lg font-semibold mb-4 text-secondary-800 dark:text-secondary-100">{title}</h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative w-40 h-40">
                    <svg className="transform -rotate-90" width="100%" height="100%" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r={radius} fill="transparent" strokeWidth="30" className="text-secondary-200 dark:text-secondary-700" stroke="currentColor" />
                        {data.map((item, index) => {
                            const segmentLength = (item.value / totalValue) * circumference;
                            const strokeDashoffset = circumference - accumulatedCircumference;
                            accumulatedCircumference += segmentLength;

                            return (
                                <circle
                                    key={index}
                                    onMouseEnter={(e) => handleMouseEnter(e, item)}
                                    onMouseLeave={handleMouseLeave}
                                    cx="100"
                                    cy="100"
                                    r={radius}
                                    fill="transparent"
                                    strokeWidth="30"
                                    stroke={item.color}
                                    strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                                    strokeDashoffset={strokeDashoffset}
                                    className="transition-all duration-500 cursor-pointer hover:opacity-80"
                                />
                            );
                        })}
                    </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-secondary-800 dark:text-secondary-100">{totalValue}</span>
                        <span className="text-sm text-secondary-500 dark:text-secondary-400">Total</span>
                    </div>
                </div>
                <div className="flex-1">
                    <ul className="space-y-2">
                        {data.map((item, index) => (
                            <li key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                                    <span className="text-secondary-600 dark:text-secondary-300">{item.label}</span>
                                </div>
                                <span className="font-semibold text-secondary-800 dark:text-secondary-100">{item.value} ({totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(0) : 0}%)</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DoughnutChart;