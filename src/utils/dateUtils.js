const { format, parse } = require('date-fns');

// Parse date in "DD MMM, YYYY" format
const parseDateString = (dateString) => {
    try {
        return parse(dateString, 'dd MMM, yyyy', new Date());
    } catch {
        return null;
    }
};

// Format date to ISO string
const formatToISOString = (dateString) => {
    const date = parseDateString(dateString);
    return date ? format(date, 'yyyy-MM-dd') : null;
};

module.exports = { parseDateString, formatToISOString };
