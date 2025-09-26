
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { SchoolEvent } from '../../types';

const CalendarPage: React.FC = () => {
    const { events } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());

    const handleMonthChange = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + offset);
            return newDate;
        });
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, currentDate.getMonth(), 1).getDay();

    const calendarDays = Array(firstDayOfMonth).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
    
    const eventsByDate = React.useMemo(() => {
        return events.reduce((acc, event) => {
            (acc[event.date] = acc[event.date] || []).push(event);
            return acc;
        }, {} as Record<string, SchoolEvent[]>);
    }, [events]);

    const getCategoryColor = (category: SchoolEvent['category']) => {
        switch (category) {
            case 'Exam': return 'bg-red-100 dark:bg-red-900 border-red-500';
            case 'Holiday': return 'bg-blue-100 dark:bg-blue-900 border-blue-500';
            case 'Meeting': return 'bg-yellow-100 dark:bg-yellow-900 border-yellow-500';
            case 'Event': return 'bg-green-100 dark:bg-green-900 border-green-500';
            default: return 'bg-secondary-100 dark:bg-secondary-700 border-secondary-500';
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">School Calendar</h1>
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700">&lt;</button>
                    <h2 className="text-xl font-semibold">{monthName} {year}</h2>
                    <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700">&gt;</button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-secondary-500 dark:text-secondary-400 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2">{day}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => {
                        const dateStr = day ? `${year}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` : '';
                        const dayEvents = eventsByDate[dateStr] || [];
                        const isToday = day && new Date().toDateString() === new Date(year, currentDate.getMonth(), day).toDateString();
                        
                        return (
                            <div key={index} className={`relative w-full aspect-video border dark:border-secondary-700 rounded-md p-1.5 flex flex-col ${day ? '' : 'bg-secondary-50 dark:bg-secondary-800/50'}`}>
                                {day && <span className={`absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center text-xs rounded-full ${isToday ? 'bg-primary-600 text-white' : ''}`}>{day}</span>}
                                <div className="mt-7 space-y-1 overflow-y-auto">
                                    {dayEvents.map(event => (
                                        <div key={event.id} title={event.title} className={`text-xs p-1 rounded-md border-l-4 ${getCategoryColor(event.category)}`}>
                                            <p className="font-medium truncate text-secondary-800 dark:text-secondary-200">{event.title}</p>
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
