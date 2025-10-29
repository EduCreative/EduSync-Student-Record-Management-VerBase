/**
 * Formats a 13-digit CNIC string into the standard XXXXX-XXXXXXX-X format.
 * If the input is not a 13-digit string, it returns the original string.
 * @param cnic The CNIC string to format.
 * @returns The formatted CNIC string or the original input.
 */
export const formatCnic = (cnic: string | null | undefined): string => {
    if (!cnic) {
        return '';
    }
    const cleaned = cnic.replace(/[^0-9]/g, '');
    if (cleaned.length === 13) {
        return `${cleaned.substring(0, 5)}-${cleaned.substring(5, 12)}-${cleaned.substring(12)}`;
    }
    return cnic; // Return original if not a 13-digit number
};
