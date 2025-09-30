
import React from 'react';

interface BarChartProps {
    title: string;
    data: { label: string; value: number }[];
    color?: string;
}

const BarChart: React.FC<BarChartProps> = ({ title, data, color = '#3b82f6' }) => {
    const maxValue = Math.max(...data.map(item => item.value), 0);
    if (maxValue === 0) {
        return (
             <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg h-full">
                <h2 className="text-xl font-semibold mb-2">{title}</h2>
                <div className="flex items-center justify-center h-48 text-secondary-500">
                    No data to display
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            <div className="flex justify-around items-end h-48 space-x-2">
                {data.map((item, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                            className="w-full rounded-t-md"
                            style={{ 
                                height: `${(item.value / maxValue) * 100}%`,
                                backgroundColor: color,
                                transition: 'height 0.3s ease-in-out'
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
