import React from 'react';

export interface LineChartData {
    label: string;
    value: number;
}

interface LineChartProps {
    title: React.ReactNode;
    data: LineChartData[];
    color?: string;
}

const LineChart: React.FC<LineChartProps> = ({ title, data, color = '#3b82f6' }) => {
    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return (
            <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg h-full">
                <div className="mb-2">{title}</div>
                <div className="flex items-center justify-center h-64 text-secondary-500">
                    No data to display
                </div>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(item => item.value), 0);
    const chartHeight = 200;
    const chartWidth = 500; // ViewBox width

    const points = data.map((point, i) => {
        const x = (i / (data.length - 1)) * chartWidth;
        const y = chartHeight - (point.value / maxValue) * chartHeight;
        return `${x},${y}`;
    }).join(' ');

    const areaPath = `M0,${chartHeight} ${points} L${chartWidth},${chartHeight} Z`;

    return (
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
            <div className="mb-4">{title}</div>
            <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} className="min-w-[400px]">
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#areaGradient)" />
                    <polyline
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        points={points}
                    />
                    {data.map((point, i) => {
                        const x = (i / (data.length - 1)) * chartWidth;
                        const y = chartHeight - (point.value / maxValue) * chartHeight;
                        return (
                            <g key={i}>
                                <circle
                                    cx={x}
                                    cy={y}
                                    r="3"
                                    fill={color}
                                />
                                {(i % 5 === 0 || i === data.length - 1) && (
                                <text
                                    x={x}
                                    y={chartHeight + 20}
                                    textAnchor="middle"
                                    fontSize="12"
                                    className="fill-current text-secondary-500 dark:text-secondary-400"
                                >
                                    {point.label}
                                </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default LineChart;