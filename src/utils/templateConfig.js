// utils/templateConfig.js

import { processTemplateGenie2K } from './processors/processTemplateGenie2K';
import { processTemplateGammaVision } from './processors/processTemplateGammaVision';
import { generateExcelTemplateGenie2K } from './excelGenerators/generateExcelTemplateGenie2K';
import { generateExcelGammaVision } from './excelGenerators/generateExcelGammaVision';

export const templateConfig = {
    A: {
        name: 'Mẫu Genie2K',
        processFile: processTemplateGenie2K,
        generateExcel: generateExcelTemplateGenie2K,
        headers: [
            { title: 'STT', merge: { start: 'A1', end: 'A3' }, style: { bold: true } },
            { title: 'Tên mẫu', merge: { start: 'B1', end: 'B3' }, style: { bold: true } },
        ],
        extraFields: [],
    },
    B: {
        name: 'Mẫu GammaVision',
        processFile: processTemplateGammaVision,
        generateExcel: generateExcelGammaVision,
        headers: [
            { title: 'STT', merge: { start: 'A1', end: 'A3' }, style: { bold: true } },
            { title: 'Tên mẫu', merge: { start: 'B1', end: 'B3' }, style: { bold: true } },
        ],
        extraFields: [],
    },
    // Add more templates as needed
};
