export const formatDate = (dateString?: string | Date): string => {
    if (!dateString) return 'N/A';
    try {
        // Handle date strings that might not have timezone info by treating them as local
        const date = new Date(dateString);
        if (typeof dateString === 'string' && !dateString.includes('T') && dateString.includes('-')) {
             const [year, month, day] = dateString.split('-').map(Number);
             // Use UTC to prevent timezone shifts from changing the date
             const utcDate = new Date(Date.UTC(year, month - 1, day));
             if (isNaN(utcDate.getTime())) return 'Invalid Date';
             const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' };
             return utcDate.toLocaleDateString('en-GB', options).replace(/ /g, '-');
        }

        if (isNaN(date.getTime())) return 'Invalid Date';
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options).replace(/ /g, '-');
    } catch (error) {
        return 'Invalid Date';
    }
};

export const formatDateTime = (isoString?: string): string => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        const datePart = formatDate(date);
        const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return `${datePart}, ${time}`;
    } catch (error) {
        return 'Invalid Date';
    }
};

// Returns the current local date as a 'YYYY-MM-DD' string.
export const getTodayString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Returns the first day of the current month as a 'YYYY-MM-DD' string.
export const getFirstDayOfMonthString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}-01`;
};
