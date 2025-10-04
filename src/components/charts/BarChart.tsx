

import React from 'react';

// FIX: Export the BarChartData interface so it can be used in other components.
export interface BarChartData {
    label: string;
    value: number;
    [key: string]: any;
}

interface BarChartProps {
    title: string;
    data: BarChartData[];
    color?: string;
    onClick?: (item: BarChartData) => void;
}

const BarChart: React.FC<BarChartProps> = ({ title, data, color = '#3b82f6', onClick }) => {
    const maxValue = Math.max(...data.map(item => item.value), 0);
    if (maxValue === 0) {
        return (
             <div className="glass-card p-6 h-full">
                <h2 className="text-xl font-semibold mb-2">{title}</h2>
                <div className="flex items-center justify-center h-48 text-secondary-500">
                    No data to display
                </div>
            </div>
        );
    }
    
    return (
        <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            <div className="flex justify-around items-end h-48 space-x-2">
                {data.map((item, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 group" onClick={() => onClick && onClick(item)}>
                        <div 
                            className={`w-full rounded-t-md ${onClick ? 'cursor-pointer group-hover:opacity-80' : ''}`}
                            style={{ 
                                height: `${(item.value / maxValue) * 100}%`,
                                backgroundColor: color,
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
