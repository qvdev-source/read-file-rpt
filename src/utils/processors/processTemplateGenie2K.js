// utils/processors/processTemplateGenie2K.js

import { isFloat, capitalizeNuclide } from '../utils';

export const processTemplateGenie2K = (stt, content, assignedEnergies) => {
    let sampleName = '';
    const results = { STT: stt, 'Tên mẫu': '' };
    let startReading = false;

    const lines = content.split('\n');
    for (const line of lines) {
        if (line.startsWith('     Sample Title:')) {
            sampleName = line.split(':')[1].trim();
            results['Tên mẫu'] = sampleName;
        }

        if (line.includes('IDENTIFIED NUCLIDES')) {
            startReading = true;
            continue;
        }

        if (startReading) {
            if (line.startsWith('       * = Energy')) {
                break;
            }

            const regex = /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/;
            const match = line.match(regex);
            if (match) {
                const [
                    _,
                    nuclide,
                    confidence,
                    energy,
                    yield_,
                    activity,
                    uncertainty,
                ] = match;
                if (isFloat(energy.replace('*', ''))) {
                    const energyVal = parseFloat(energy.replace('*', ''));
                    const normalizedNuclide = nuclide.toLowerCase();

                    if (assignedEnergies[normalizedNuclide]) {
                        const assignedEnergy = assignedEnergies[normalizedNuclide];
                        if (Math.abs(energyVal - assignedEnergy) < 1) {
                            if (
                                parseFloat(activity) >= 0 &&
                                parseFloat(uncertainty) >= 0
                            ) {
                                results[`${capitalizeNuclide(normalizedNuclide)}, Bq/kg`] = parseFloat(activity);
                                results[`SS, Bq/kg (${capitalizeNuclide(normalizedNuclide)})`] = parseFloat(
                                    uncertainty
                                );
                            } else {
                                results[`${capitalizeNuclide(normalizedNuclide)}, Bq/kg`] = '';
                                results[`SS, Bq/kg (${capitalizeNuclide(normalizedNuclide)})`] = '';
                            }
                        }
                    } else {
                        // If nuclide not in assignedEnergies, still store if data is valid
                        if (
                            parseFloat(activity) >= 0 &&
                            parseFloat(uncertainty) >= 0
                        ) {
                            results[`${capitalizeNuclide(normalizedNuclide)}, Bq/kg`] = parseFloat(activity);
                            results[`SS, Bq/kg (${capitalizeNuclide(normalizedNuclide)})`] = parseFloat(
                                uncertainty
                            );
                        } else {
                            results[`${capitalizeNuclide(normalizedNuclide)}, Bq/kg`] = '';
                            results[`SS, Bq/kg (${capitalizeNuclide(normalizedNuclide)})`] = '';
                        }
                    }
                }
            }
        }
    }

    return results;
};
