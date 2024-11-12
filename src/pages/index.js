import { useState } from 'react';
import {
    Container,
    Typography,
    Button,
    Box,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    TextField,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import StartIcon from '@mui/icons-material/Start';
import ExcelJS from 'exceljs';

export default function Home() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0);
    const [outputFile, setOutputFile] = useState(null);
    const [fileName, setFileName] = useState("Results"); // Tên file mặc định

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files).filter(
            (file) => file.name.startsWith('D') && file.name.endsWith('.RPT')
        );
        setSelectedFiles(files);
        setLogs((prev) => [...prev, `${files.length} files selected.`]);
    };

    const handleProcess = async () => {
        if (selectedFiles.length === 0) {
            alert('Please select files first!');
            return;
        }

        setLogs([]);
        setProgress(0);
        const outputData = [];
        const assignedEnergies = {
            'Tl-208': 583,
            'Pb-214': 295,
            'K-40': 1461,
            'Th-234': 63.29,
        };

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const text = await file.text();
            const result = processFile(i + 1, text, assignedEnergies);
            outputData.push(result);
            setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
        }

        setLogs((prev) => [...prev, 'Processing complete. Generating Excel...']);

        // Tạo workbook và worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Results');

        // Thêm hàng tiêu đề
        const headers = Object.keys(outputData[0]);
        const headerRow = worksheet.addRow(headers);

        // Định dạng tiêu đề cho các cột đặc biệt
        headers.forEach((header, colIndex) => {
            const cell = headerRow.getCell(colIndex + 1);
            if (!header.startsWith('SS') && !header.startsWith('STT') && !header.startsWith('Tên')) {
                cell.font = { color: { argb: 'FFFF0000' } }; // Đặt màu đỏ cho tiêu đề
            }
        });

        // Thêm dữ liệu từ outputData vào các hàng
        outputData.forEach((data) => {
            worksheet.addRow(Object.values(data));
        });

        // Tạo Blob và tải file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        setOutputFile(url);

        setLogs((prev) => [...prev, 'Excel file generated. You can download it below.']);
    };

    const processFile = (stt, content, assignedEnergies) => {
        let sampleName = '';
        const results = { STT: stt, 'Tên mẫu': '' };
        let currentNuclide = '';
        let startReading = false;

        const isFloat = (value) => !isNaN(parseFloat(value));

        const lines = content.split('\n');
        for (const line of lines) {
            if (line.startsWith('     Sample Title:')) {
                sampleName = line.split(':')[1].trim();
                results['Tên mẫu'] = sampleName;
                setLogs((prev) => [...prev, `Processing Sample: ${sampleName}`]);
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
                    const [_, nuclide, confidence, energy, yield_, activity, uncertainty] = match;
                    if (isFloat(energy.replace('*', ''))) {
                        const energyVal = parseFloat(energy.replace('*', ''));
                        currentNuclide = nuclide;

                        setLogs((prev) => [
                            ...prev,
                            `Found Nuclide: ${currentNuclide} - Energy: ${energyVal} keV`,
                        ]);

                        if (assignedEnergies[currentNuclide]) {
                            const assignedEnergy = assignedEnergies[currentNuclide];
                            if (Math.abs(energyVal - assignedEnergy) < 1) {
                                if (parseFloat(activity) >= 0 && parseFloat(uncertainty) >= 0) {
                                    results[`${currentNuclide}, Bq/kg`] = parseFloat(activity);
                                    results[`SS, Bq/kg (${currentNuclide})`] = parseFloat(uncertainty);
                                } else {
                                    results[`${currentNuclide}, Bq/kg`] = '';
                                    results[`SS, Bq/kg (${currentNuclide})`] = '';
                                }
                            }
                        } else if (!results[`${currentNuclide}, Bq/kg`]) {
                            if (parseFloat(activity) >= 0 && parseFloat(uncertainty) >= 0) {
                                results[`${currentNuclide}, Bq/kg`] = parseFloat(activity);
                                results[`SS, Bq/kg (${currentNuclide})`] = parseFloat(uncertainty);
                            } else {
                                results[`${currentNuclide}, Bq/kg`] = '';
                                results[`SS, Bq/kg (${currentNuclide})`] = '';
                            }
                        }
                    }
                }
            }
        }

        setLogs((prev) => [...prev, `Results for file ${stt}: ${JSON.stringify(results)}`]);
        return results;
    };

    return (
        <Container maxWidth="md" sx={{ mt: 5 }}>
            <Typography variant="h4" gutterBottom>
                Sample Processor
            </Typography>

            <Box sx={{ my: 2 }}>
                <Button variant="contained" component="label" startIcon={<UploadFileIcon />}>
                    Choose Files
                    <input type="file" hidden multiple onChange={handleFileUpload} accept=".RPT" />
                </Button>
                <Typography variant="body1" sx={{ mt: 1 }}>
                    {selectedFiles.length > 0
                        ? `${selectedFiles.length} file(s) selected.`
                        : 'No files selected.'}
                </Typography>
            </Box>

            <Box sx={{ my: 2 }}>
                <TextField
                    label="File Name"
                    variant="outlined"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    fullWidth
                />
            </Box>

            <Box sx={{ my: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleProcess}
                    startIcon={<StartIcon />}
                >
                    Start Processing
                </Button>
            </Box>

            <Box sx={{ my: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="body2" color="textSecondary">
                    {progress}%
                </Typography>
            </Box>

            <Box sx={{ my: 2 }}>
                <Typography variant="h6">Logs:</Typography>
                <List dense>
                    {logs.map((log, index) => (
                        <ListItem key={index}>
                            <ListItemText primary={log} />
                        </ListItem>
                    ))}
                </List>
            </Box>

            {outputFile && (
                <Box sx={{ my: 2 }}>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<SaveAltIcon />}
                        href={outputFile}
                        download={`${fileName}.xlsx`}
                    >
                        Download Excel File
                    </Button>
                </Box>
            )}
        </Container>
    );
}
