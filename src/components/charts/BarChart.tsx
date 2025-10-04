import React from 'react';

// FIX: Export the BarChartData interface so it can be used in other components.
export interface BarChartData {
    label: string;
    value: number;
    color?: string;
    [key: string]: any;
}

interface BarChartProps {
    title: React.ReactNode;
    data: BarChartData[];
    color?: string;
    onClick?: (item: BarChartData) => void;
}

const BarChart: React.FC<BarChartProps> = ({ title, data, color = '#3b82f6', onClick }) => {
    const maxValue = Math.max(...data.map(item => item.value), 0);
    if (data.length === 0 || maxValue === 0) {
        return (
             <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg h-full">
                <div className="text-xl font-semibold mb-2">{title}</div>
                <div className="flex items-center justify-center h-48 text-secondary-500">
                    No data to display
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
            <div className="mb-4">{title}</div>
            <div className="flex justify-around items-end h-48 space-x-2">
                {data.map((item, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 group" onClick={() => onClick && onClick(item)}>
                        <div 
                            className={`w-full rounded-t-md ${onClick ? 'cursor-pointer group-hover:opacity-80' : ''}`}
                            style={{ 
                                height: `${(item.value / maxValue) * 100}%`,
                                backgroundColor: item.color || color,
                                transition: 'height 0.3s ease-in-out, opacity 0.2s'
                            }}
                            title={`${item.label}: ${item.value}`}
                        ></div>
                        <span className="text-xs text-secondary-500 mt-2 truncate">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BarChart;