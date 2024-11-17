// utils/excelGenerators/generateExcelGammaVision.js

import { getColumnLetter } from '../utils';

export const generateExcelGammaVision = async (worksheet, numberedNuclides, outputData) => {
    // Define header rows
    const headerRow1 = ['STT', 'Tên mẫu'];
    const headerRow2 = ['', ''];
    const headerRow3 = ['', ''];

    numberedNuclides.forEach(() => {
        headerRow1.push(''); // Placeholder for group header
        headerRow1.push('');
        headerRow2.push(''); // Placeholder for sub-header
        headerRow2.push('');
        headerRow3.push('Hoạt độ');
        headerRow3.push('Sai số');
    });

    // Add header rows to worksheet
    worksheet.addRow(headerRow1);
    worksheet.addRow(headerRow2);
    worksheet.addRow(headerRow3);

    // Merge and style headers
    worksheet.mergeCells('A1:A3');
    const sttCell = worksheet.getCell('A1');
    sttCell.value = 'STT';
    sttCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sttCell.font = { bold: true };

    worksheet.mergeCells('B1:B3');
    const tenMauCell = worksheet.getCell('B1');
    tenMauCell.value = 'Tên mẫu';
    tenMauCell.alignment = { vertical: 'middle', horizontal: 'center' };
    tenMauCell.font = { bold: true };

    numberedNuclides.forEach((nuclide, index) => {
        const startCol = 3 + index * 2;
        const endCol = startCol + 1;
        const startLetter = getColumnLetter(startCol);
        const endLetter = getColumnLetter(endCol);

        // Merge group headers
        worksheet.mergeCells(`${startLetter}1:${endLetter}1`);
        const groupHeader = `(${nuclide.number}) ${nuclide.name}`;
        const cell = worksheet.getCell(`${startLetter}1`);
        cell.value = groupHeader;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true };

        // Merge sub-headers
        worksheet.mergeCells(`${startLetter}2:${endLetter}2`);
        const bqkgCell = worksheet.getCell(`${startLetter}2`);
        bqkgCell.value = 'Bq/kg khô';
        bqkgCell.alignment = { horizontal: 'center', vertical: 'middle' };
        bqkgCell.font = { italic: true };
    });

    // Adjust column widths
    worksheet.columns.forEach((column) => {
        column.width = 20;
    });

    // Apply borders and alignment to header cells
    const totalColumns = 2 + numberedNuclides.length * 2;
    for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= totalColumns; j++) {
            const cell = worksheet.getCell(i, j);
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
    }

    // Add data rows
    outputData.forEach((data) => {
        const row = [];
        row.push(data['STT']);
        row.push(data['Tên mẫu']);
        numberedNuclides.forEach((nuclide) => {
            const activityKey = `${nuclide.name}, Bq/kg`;
            const ssKey = `SS, Bq/kg (${nuclide.name})`;
            row.push(data[activityKey] !== undefined ? data[activityKey] : '');
            row.push(data[ssKey] !== undefined ? data[ssKey] : '');
        });
        worksheet.addRow(row);
    });

    // Apply borders and alignment to data cells
    const lastRow = worksheet.lastRow.number;
    for (let i = 4; i <= lastRow; i++) {
        for (let j = 1; j <= totalColumns; j++) {
            const cell = worksheet.getCell(i, j);
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
    }
};
