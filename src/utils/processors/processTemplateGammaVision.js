// utils/processors/processTemplateGammaVision.js

import { isFloat, capitalizeNuclide } from '../utils';

export const processTemplateGammaVision = (stt, content, assignedEnergies) => {
    let sampleName = '';
    const results = { STT: stt, 'Tên mẫu': '' };
    let startReading = false;
    let lineCounter = 0;

    const lines = content.split('\n');
    for (const line of lines) {
        if (line.includes('     Spectrum name:')) {
            sampleName = line.split(':')[1].trim();
            results['Tên mẫu'] = sampleName;
        }

        if (line.includes('*****   S U M M A R Y   O F   N U C L I D E S   I N   S A M P L E   *****')) {
            startReading = true;
            lineCounter = 0; // Reset the counter when this line is encountered
            continue;
        }

        if (startReading) {
            lineCounter++;
            if (lineCounter < 5) {
                // Skip the first 4 lines, process from the 5th line onwards
                continue;
            }

            // Stop processing if the line is empty
            if (line.trim().includes("# - All peaks for activity calculation had bad shape.")) {
                break;
            }

            // Clean the line and extract the data
            const cleanLine = line.replace(/([A-Za-z0-9-]+)\s+[^0-9]+([\d.+-eE]+)/, '$1 $2').trim(); // Remove unwanted characters
            // Updated regex to handle names like U-235
            const regex = /^([\w-]+)\s+([\d.+-eE]+)\s+\S+\s+([\d.+-eE]+)$/;
            const match = cleanLine.match(regex);

            if (match) {
                const [, nuclide, activity, uncertainty] = match;
                results[`${capitalizeNuclide(nuclide)}, Bq/kg`] = parseFloat(activity);
                results[`SS, Bq/kg (${capitalizeNuclide(nuclide)})`] = parseFloat(uncertainty);
            }
        }
    }

    return results;
};
