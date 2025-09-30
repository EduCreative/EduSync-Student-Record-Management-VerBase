
import React from 'react';

interface DoughnutChartProps {
    title: string;
    data: { label: string; value: number; color?: string }[];
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ title, data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
        return (
             <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg h-full">
                <h2 className="text-xl font-semibold mb-2">{title}</h2>
                <div className="flex items-center justify-center h-48 text-secondary-500">
                    No data to display
                </div>
            </div>
        );
    }

    let cumulative = 0;
    const segments = data.map(item => {
        const percentage = (item.value / total) * 100;
        const startAngle = (cumulative / total) * 360;
        cumulative += item.value;
        const endAngle = (cumulative / total) * 360;
        
        const start = polarToCartesian(50, 50, 40, endAngle);
        const end = polarToCartesian(50, 50, 40, startAngle);
        
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        
        const d = [
            "M", start.x, start.y, 
            "A", 40, 40, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");

        return {
            d,
            color: item.color || '#000',
            label: item.label,
            value: item.value,
            percentage: percentage.toFixed(1)
        };
    });
    
    function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
            x: centerX + radius * Math.cos(angleInRadians),
            y: centerY + radius * Math.sin(angleInRadians),
        };
    }
    
    return (
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="relative w-48 h-48 mx-auto">
                    <svg viewBox="0 0 100 100">
                        {segments.map((segment, index) => (
                            <path key={index} d={segment.d} fill="none" stroke={segment.color} strokeWidth="20" />
                        ))}
                    </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold">{total}</span>
                        <span className="text-sm text-secondary-500">Total</span>
                    </div>
                </div>
                <div className="space-y-2">
                    {segments.map((segment, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: segment.color }}></span>
                                <span>{segment.label}</span>
                            </div>
                            <span className="font-semibold">{segment.value} ({segment.percentage}%)</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DoughnutChart;
