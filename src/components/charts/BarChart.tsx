import React, { useState, useEffect, type FC, type ReactNode } from 'react';

// FIX: Export the BarChartData interface so it can be used in other components.
export interface BarChartData {
    label: string;
    value: number;
    color?: string;
    [key: string]: any;
}

interface BarChartProps {
    title: ReactNode;
    data: BarChartData[];
    color?: string;
    onClick?: (item: BarChartData) => void;
    multiColor?: boolean;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#64748b'];

const BarChart: FC<BarChartProps> = ({ title, data, color = '#3b82f6', onClick, multiColor = false }) => {
    const [isAnimated, setIsAnimated] = useState(false);
    const [tooltip, setTooltip] = useState<{ visible: boolean; content: string; x: number; y: number } | null>(null);

    useEffect(() => {
        // A short delay helps ensure the CSS transition is applied correctly on mount
        const timer = setTimeout(() => setIsAnimated(true), 100);
        return () => clearTimeout(timer);
    }, [data]);


    if (data.length === 0 || data.every(d => d.value === 0)) {
        return (
             <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg h-full">
                <div className="text-xl font-semibold mb-2">{title}</div>
                <div className="flex items-center justify-center h-48 text-secondary-500">
                    No data to display
                </div>
            </div>
        );
    }
    
    const maxValue = Math.max(...data.map(item => item.value), 0);

    const handleMouseOver = (e: React.MouseEvent, item: BarChartData) => {
        setTooltip({
            visible: true,
            content: `${item.label}: ${item.value.toLocaleString()}`,
            x: e.clientX,
            y: e.clientY,
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
    };

    const handleMouseOut = () => {
        setTooltip(null);
    };

    return (
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg h-full" onMouseLeave={handleMouseOut}>
             {tooltip?.visible && (
                <div 
                    className="chart-tooltip" 
                    style={{ 
                        position: 'fixed', 
                        left: tooltip.x, 
                        top: tooltip.y, 
                        transform: 'translate(-50%, -120%)'
                    }}
                >
                    {tooltip.content}
                </div>
            )}
            <div className="mb-4">{title}</div>
            <div className="flex justify-around items-end h-48 space-x-2">
                {data.map((item, index) => (
                    <div 
                        key={index} 
                        className="flex flex-col items-center flex-1 group h-full justify-end" 
                        onClick={() => onClick && onClick(item)}
                        onMouseOver={(e) => handleMouseOver(e, item)}
                        onMouseMove={handleMouseMove}
                    >
                        <div 
                            className={`w-full rounded-t-md bar-item ${onClick ? 'cursor-pointer' : ''}`}
                            style={{ 
                                height: isAnimated ? `${(item.value / maxValue) * 100}%` : '0%',
                                backgroundColor: item.color || (multiColor ? CHART_COLORS[index % CHART_COLORS.length] : color),
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