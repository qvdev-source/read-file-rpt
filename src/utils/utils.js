// utils/utils.js

export const getColumnLetter = (colNumber) => {
    let dividend = colNumber;
    let columnName = '';
    let modulo;
    while (dividend > 0) {
        modulo = (dividend - 1) % 26;
        columnName = String.fromCharCode(65 + modulo) + columnName;
        dividend = Math.floor((dividend - modulo) / 26);
    }
    return columnName;
};

export const isFloat = (value) => !isNaN(parseFloat(value)) && isFinite(value);

export const capitalizeNuclide = (nuclide) => {
    const parts = nuclide.split('-');
    if (parts.length === 2) {
        return (
            parts[0].charAt(0).toUpperCase() +
            parts[0].slice(1).toLowerCase() +
            '-' +
            parts[1]
        );
    }
    return nuclide;
};
