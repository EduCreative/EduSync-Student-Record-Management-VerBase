
import React, { useState } from 'react';
import { useData } from '../../context/DataContext.tsx';
import { SchoolEvent } from '../../types.ts';

const CalendarPage: React.FC = () => {
    const { events } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

    const days = [];
    let day = startDate;
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    const eventsByDate = events.reduce((acc, event) => {
        const date = event.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(event);
        return acc;
    }, {} as Record<string, SchoolEvent[]>);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const getCategoryColor = (category: SchoolEvent['category']) => {
        switch(category) {
            case 'Holiday': return 'bg-red-500';
            case 'Exam': return 'bg-yellow-500';
            case 'Event': return 'bg-green-500';
            case 'Meeting': return 'bg-blue-500';
            default: return 'bg-secondary-500';
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">School Calendar</h1>

            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700">&lt;</button>
                    <h2 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700">&gt;</button>
                </div>

                <div className="grid grid-cols-7 gap-px bg-secondary-200 dark:bg-secondary-700 border dark:border-secondary-700">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center py-2 bg-secondary-50 dark:bg-secondary-800 font-medium text-sm">{day}</div>
                    ))}
                    {days.map(d => {
                        const dateStr = d.toISOString().split('T')[0];
                        const dayEvents = eventsByDate[dateStr] || [];
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;
                        const isCurrentMonth = d.getMonth() === currentDate.getMonth();

                        return (
                            <div key={dateStr} className={`p-2 h-32 bg-white dark:bg-secondary-800 ${isCurrentMonth ? '' : 'bg-secondary-50 dark:bg-secondary-900/50 text-secondary-400'}`}>
                                <div className={`text-sm ${isToday ? 'font-bold text-primary-600' : ''}`}>{d.getDate()}</div>
                                <div className="space-y-1 mt-1 overflow-y-auto max-h-24 text-xs">
                                    {dayEvents.map(event => (
                                        <div key={event.id} className="p-1 rounded text-white" style={{ backgroundColor: getCategoryColor(event.category) }}>
                                            {event.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
