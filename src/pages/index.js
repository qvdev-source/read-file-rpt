import { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Button,
    Box,
    LinearProgress,
    TextField,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import StartIcon from '@mui/icons-material/Start';
import ExcelJS from 'exceljs';

export default function Home() {
    // Trạng thái xác thực
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Tài khoản đăng nhập được cấp sẵn
    const predefinedUsername = 'admin';
    const predefinedPassword = 'admin';

    // Trạng thái của form đăng nhập
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Các trạng thái khác
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [progress, setProgress] = useState(0);
    const [outputFile, setOutputFile] = useState(null);
    const [fileName, setFileName] = useState('Results'); // Tên file mặc định

    // Thêm bộ đếm thời gian tự động đăng xuất
    useEffect(() => {
        let logoutTimer;
        if (isAuthenticated) {
            // Bắt đầu bộ đếm thời gian 5 phút
            logoutTimer = setTimeout(() => {
                setIsAuthenticated(false);
                alert('Bạn đã bị đăng xuất do không hoạt động trong 5 phút.');
            }, 5 * 60 * 1000); // 5 phút = 5 * 60 * 1000 milliseconds
        }
        return () => {
            // Xóa bộ đếm thời gian khi component unmount hoặc khi isAuthenticated thay đổi
            if (logoutTimer) {
                clearTimeout(logoutTimer);
            }
        };
    }, [isAuthenticated]);

    // Xử lý đăng nhập
    const handleLogin = (e) => {
        e.preventDefault();
        if (username === predefinedUsername && password === predefinedPassword) {
            setIsAuthenticated(true);
            setLoginError('');
            setUsername(''); // Xóa giá trị username sau khi đăng nhập
            setPassword(''); // Xóa giá trị password sau khi đăng nhập
        } else {
            setLoginError('Sai tên đăng nhập hoặc mật khẩu.');
        }
    };

    // Xử lý tải lên file
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files).filter(
            (file) => file.name.endsWith('.RPT')
        );
        setSelectedFiles(files);
        alert(`${files.length} tệp được chọn.`);
    };

    // Xử lý quá trình xử lý file
    const handleProcess = async () => {
        if (selectedFiles.length === 0) {
            alert('Vui lòng chọn tệp trước!');
            return;
        }

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

        // Thu thập tất cả các tiêu đề từ outputData
        const headersSet = new Set();
        outputData.forEach((data) => {
            Object.keys(data).forEach((key) => headersSet.add(key));
        });
        const headers = Array.from(headersSet);

        // Tạo workbook và worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Results');

        // Thêm hàng tiêu đề
        const headerRow = worksheet.addRow(headers);

        // Định dạng tiêu đề cho các cột đặc biệt
        headers.forEach((header, colIndex) => {
            const cell = headerRow.getCell(colIndex + 1);
            if (
                !header.startsWith('SS') &&
                !header.startsWith('STT') &&
                !header.startsWith('Tên')
            ) {
                cell.font = { color: { argb: 'FFFF0000' } }; // Đặt màu đỏ cho tiêu đề
            }
        });

        // Thêm dữ liệu từ outputData vào các hàng
        outputData.forEach((data) => {
            const row = headers.map((header) => data[header] || '');
            worksheet.addRow(row);
        });

        // Tạo Blob và tải file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        setOutputFile(url);
        alert('File Excel đã được tạo. Bạn có thể tải xuống bên dưới.');
    };

    // Hàm xử lý từng file
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
                        currentNuclide = nuclide;

                        if (assignedEnergies[currentNuclide]) {
                            const assignedEnergy = assignedEnergies[currentNuclide];
                            if (Math.abs(energyVal - assignedEnergy) < 1) {
                                if (
                                    parseFloat(activity) >= 0 &&
                                    parseFloat(uncertainty) >= 0
                                ) {
                                    results[`${currentNuclide}, Bq/kg`] = parseFloat(activity);
                                    results[`SS, Bq/kg (${currentNuclide})`] = parseFloat(
                                        uncertainty
                                    );
                                } else {
                                    results[`${currentNuclide}, Bq/kg`] = '';
                                    results[`SS, Bq/kg (${currentNuclide})`] = '';
                                }
                            }
                        } else {
                            if (
                                parseFloat(activity) >= 0 &&
                                parseFloat(uncertainty) >= 0
                            ) {
                                results[`${currentNuclide}, Bq/kg`] = parseFloat(activity);
                                results[`SS, Bq/kg (${currentNuclide})`] = parseFloat(
                                    uncertainty
                                );
                            } else {
                                results[`${currentNuclide}, Bq/kg`] = '';
                                results[`SS, Bq/kg (${currentNuclide})`] = '';
                            }
                        }
                    }
                }
            }
        }

        return results;
    };

    return (
        <Container maxWidth="md" sx={{ mt: 5 }}>
            {!isAuthenticated ? (
                // Form đăng nhập
                <Box sx={{ my: 5 }}>
                    <Typography variant="h4" gutterBottom>
                        Đăng nhập
                    </Typography>
                    <form onSubmit={handleLogin} autoComplete="off">
                        <TextField
                            label="Username"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            autoComplete="off"
                        />
                        <TextField
                            label="Password"
                            type="password"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            autoComplete="off"
                        />
                        {loginError && (
                            <Typography color="error" variant="body2">
                                {loginError}
                            </Typography>
                        )}
                        <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                            sx={{ mt: 2 }}
                        >
                            Đăng nhập
                        </Button>
                    </form>
                </Box>
            ) : (
                // Ứng dụng chính
                <>
                    <Typography variant="h4" gutterBottom>
                        Sample Processor
                    </Typography>

                    <Box sx={{ my: 2 }}>
                        <Button
                            variant="contained"
                            component="label"
                            startIcon={<UploadFileIcon />}
                        >
                            Chọn tệp
                            <input
                                type="file"
                                hidden
                                multiple
                                onChange={handleFileUpload}
                                accept=".RPT"
                            />
                        </Button>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            {selectedFiles.length > 0
                                ? `${selectedFiles.length} tệp được chọn.`
                                : 'Chưa chọn tệp nào.'}
                        </Typography>
                    </Box>

                    <Box sx={{ my: 2 }}>
                        <TextField
                            label="Tên file"
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
                            Bắt đầu xử lý
                        </Button>
                    </Box>

                    <Box sx={{ my: 2 }}>
                        <LinearProgress variant="determinate" value={progress} />
                        <Typography variant="body2" color="textSecondary">
                            {progress}%
                        </Typography>
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
                                Tải xuống file Excel
                            </Button>
                        </Box>
                    )}
                </>
            )}
        </Container>
    );
}
