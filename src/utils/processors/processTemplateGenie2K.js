// utils/processors/processTemplateGenie2K.js

import { isFloat, capitalizeNuclide } from '../utils';

export const processTemplateGenie2K = (stt, content, assignedEnergies) => {
    let sampleName = '';
    const results = { STT: stt, 'Tên mẫu': '' };
    let startReading = false;
    let currentNuclide = null;

    // Định nghĩa regex cho dòng chính và dòng bổ sung
    const mainLineRegex = /^\s*(\S+)\s+(\d+\.\d+)\s+(\d+\.\d+)\*\s+(\d+\.\d+)\s+([0-9E\+\-\.]+)\s+([0-9E\+\-\.]+)/;
    const continuationLineRegex = /^\s*(\d+\.\d+)\*\s+(\d+\.\d+)\s+([0-9E\+\-\.]+)\s+([0-9E\+\-\.]+)/;

    const lines = content.split('\n');
    for (const line of lines) {
        // Trích xuất tên mẫu
        if (line.startsWith('     Sample Title:')) {
            sampleName = line.split(':')[1].trim();
            results['Tên mẫu'] = sampleName;
        }

        // Bắt đầu đọc các dòng nuclide
        if (line.includes('IDENTIFIED NUCLIDES')) {
            startReading = true;
            continue;
        }

        if (startReading) {
            // Kết thúc khi gặp dòng chứa '* = Energy'
            if (line.startsWith('       * = Energy')) {
                break;
            }

            // Kiểm tra xem dòng có phải là dòng chính không
            const mainMatch = line.match(mainLineRegex);
            if (mainMatch) {
                const [
                    _,
                    nuclide,
                    confidence,
                    energy,
                    yield_,
                    activity,
                    uncertainty,
                ] = mainMatch;

                const normalizedNuclide = nuclide.toLowerCase();

                // Kiểm tra nếu nuclide hiện tại có trong assignedEnergies
                if (assignedEnergies.hasOwnProperty(normalizedNuclide)) {
                    const assignedEnergy = assignedEnergies[normalizedNuclide];
                    const energyVal = parseFloat(energy.replace('*', ''));

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
                    // Nếu nuclide không có trong assignedEnergies, vẫn thêm nếu dữ liệu hợp lệ
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

                // Cập nhật nuclide hiện tại để gán các dòng bổ sung
                currentNuclide = normalizedNuclide;
                continue; // Chuyển sang dòng tiếp theo
            }

            // Kiểm tra xem dòng có phải là dòng bổ sung không
            const continuationMatch = line.match(continuationLineRegex);
            if (continuationMatch && currentNuclide) {
                const [
                    _,
                    energyCont,
                    yieldCont,
                    activityCont,
                    uncertaintyCont,
                ] = continuationMatch;

                const energyVal = parseFloat(energyCont.replace('*', ''));
                const assignedEnergy = assignedEnergies[currentNuclide];

                if (assignedEnergy && Math.abs(energyVal - assignedEnergy) < 1) {
                    if (
                        parseFloat(activityCont) >= 0 &&
                        parseFloat(uncertaintyCont) >= 0
                    ) {
                        results[`${capitalizeNuclide(currentNuclide)}, Bq/kg`] = parseFloat(activityCont);
                        results[`SS, Bq/kg (${capitalizeNuclide(currentNuclide)})`] = parseFloat(
                            uncertaintyCont
                        );
                    } else {
                        results[`${capitalizeNuclide(currentNuclide)}, Bq/kg`] = '';
                        results[`SS, Bq/kg (${capitalizeNuclide(currentNuclide)})`] = '';
                    }
                }
                continue; // Chuyển sang dòng tiếp theo
            }

            // Nếu dòng không khớp với bất kỳ regex nào, bỏ qua
        }
    }

    return results;
};

