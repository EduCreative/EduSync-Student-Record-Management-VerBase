// FIX: Added and exported a 'parseCsv' function to handle CSV file imports.
// A simple CSV parser that handles quoted fields
export const parseCsv = (csvText: string): { data: Record<string, any>[], errors: string[] } => {
    let text = csvText.trim();
    // Handle BOM (Byte Order Mark)
    if (text.charCodeAt(0) === 0xFEFF) {
        text = text.substring(1);
    }
    const lines = text.split(/\r\n|\n/);
    const errors: string[] = [];
    
    if (lines.length < 2 || !lines[0].trim()) {
        errors.push("File must have a header row and at least one data row.");
        return { data: [], errors };
    }

    // Trim quotes from headers, in case they are quoted in the CSV
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = [];
    
    // Regex to split by comma but ignore commas inside double quotes
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = line.split(regex).map(field => {
            let value = field.trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            // Handle escaped double quotes "" -> "
            return value.replace(/""/g, '"');
        });

        if (values.length !== headers.length) {
            errors.push(`Row ${i + 1}: Expected ${headers.length} columns, but found ${values.length}. This might be due to unquoted commas in your data. Skipping row.`);
            continue;
        }
        
        const row: Record<string, any> = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });
        
        data.push(row);
    }
    return { data, errors };
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