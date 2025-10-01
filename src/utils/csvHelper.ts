// FIX: Added and exported a 'parseCsv' function to handle CSV file imports.
// A simple CSV parser that handles quoted fields
export const parseCsv = (csvText: string): Record<string, any>[] => {
    const lines = csvText.trim().split(/\r\n|\n/);
    if (lines.length < 2) {
        return []; // Not enough lines for headers and data
    }
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    // Regex to split by comma but ignore commas inside double quotes
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = line.split(regex).map(field => {
            // Trim whitespace and remove quotes from start/end
            let value = field.trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            // Also handle escaped quotes if they exist "" -> "
            return value.replace(/""/g, '"');
        });

        if (values.length !== headers.length) {
            console.warn(`CSV Parse Warning: Row ${i + 1} has ${values.length} columns, but header has ${headers.length}. Skipping row.`);
            continue;
        }
        
        const row: Record<string, any> = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });
        
        data.push(row);
    }
    return data;
};

// A simple CSV exporter
export const exportToCsv = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                let value = row[header];
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`; // Quote values with commas
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
