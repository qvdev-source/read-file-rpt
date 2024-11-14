import { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Button,
    Box,
    LinearProgress,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import StartIcon from '@mui/icons-material/Start';
import ExcelJS from 'exceljs';

// Định nghĩa assignedEnergies với các khóa ở định dạng chữ thường
const assignedEnergies = {
    'pb-210': 46.54,
    'pb-212': 238.63,
    'pl-214': 609.31,
    'ra-226': 186.21,
    'tl-208': 583.19,
    'pb-214': 351.92,
    'bi-212': 727.17,
    'ac-228': 911.6,
    'k-40': 1460.81,
    'cs-137': 661.65,
    'i-131': 364.48,
    'be-7': 477.59,
};

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

    // Hàm chuyển số cột thành chữ cái Excel (ví dụ: 1 -> 'A')
    const getColumnLetter = (colNumber) => {
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

    // Hàm kiểm tra xem giá trị có phải là số thực không
    const isFloat = (value) => !isNaN(parseFloat(value)) && isFinite(value);

    // Hàm chuyển đổi nuclide thành dạng chữ hoa chữ thường phù hợp
    const capitalizeNuclide = (nuclide) => {
        // Ví dụ: 'pb-210' -> 'Pb-210'
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

    // Hàm xử lý từng file
    const processFile = (stt, content, assignedEnergies) => {
        let sampleName = '';
        const results = { STT: stt, 'Tên mẫu': '' };
        let currentNuclide = '';
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
                        currentNuclide = nuclide;

                        // Chuẩn hóa nuclide thành chữ thường để so sánh
                        const normalizedNuclide = currentNuclide.toLowerCase();

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
                            // Nếu nuclide không có trong assignedEnergies, vẫn lưu trữ nếu dữ liệu hợp lệ
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

    // Xử lý quá trình xử lý file
    const handleProcess = async () => {
        if (selectedFiles.length === 0) {
            alert('Vui lòng chọn tệp trước!');
            return;
        }

        setProgress(0);
        const outputData = [];

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const text = await file.text();
            const result = processFile(i + 1, text, assignedEnergies);
            outputData.push(result);
            setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
        }

        // Extract unique nuclides, bỏ qua các khóa bắt đầu bằng "SS,"
        const nuclidesSet = new Set();
        outputData.forEach((data) => {
            Object.keys(data).forEach((key) => {
                if (!key.startsWith('SS,')) { // Bỏ qua các khóa bắt đầu bằng "SS,"
                    const match = key.match(/^(.+?), Bq\/kg/);
                    if (match) {
                        nuclidesSet.add(match[1].toLowerCase()); // Chuẩn hóa thành chữ thường
                    }
                }
            });
        });
        const nuclides = Array.from(nuclidesSet).sort();

        // Assign numbers to nuclides
        const numberedNuclides = nuclides.map((nuclide, index) => ({
            name: capitalizeNuclide(nuclide), // Hàm để giữ lại định dạng gốc nếu cần
            number: index + 1,
        }));

        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Results');

        // Define header rows
        const headerRow1 = ['STT', 'Tên mẫu'];
        const headerRow2 = ['', ''];
        const headerRow3 = ['', ''];

        numberedNuclides.forEach(() => {
            headerRow1.push(''); // Placeholder cho dòng 1 của nhóm
            headerRow1.push('');
            headerRow2.push(''); // Placeholder cho dòng 2 của nhóm
            headerRow2.push('');
            headerRow3.push('Hoạt độ');
            headerRow3.push('Sai số');
        });

        // Thêm các dòng header vào worksheet
        worksheet.addRow(headerRow1);
        worksheet.addRow(headerRow2);
        worksheet.addRow(headerRow3);

        // Merge "STT" vertically qua 3 dòng
        worksheet.mergeCells(`A1:A3`);
        const sttCell = worksheet.getCell('A1');
        sttCell.value = 'STT';
        sttCell.alignment = { vertical: 'middle', horizontal: 'center' };
        sttCell.font = { bold: true };

        // Merge "Tên mẫu" vertically qua 3 dòng
        worksheet.mergeCells(`B1:B3`);
        const tenMauCell = worksheet.getCell('B1');
        tenMauCell.value = 'Tên mẫu';
        tenMauCell.alignment = { vertical: 'middle', horizontal: 'center' };
        tenMauCell.font = { bold: true };

        // Merge và thiết lập các nhóm cột
        numberedNuclides.forEach((nuclide, index) => {
            const startCol = 3 + index * 2;
            const endCol = startCol + 1;
            const startLetter = getColumnLetter(startCol);
            const endLetter = getColumnLetter(endCol);

            // Merge hai cột cho dòng 1 của nhóm
            worksheet.mergeCells(`${startLetter}1:${endLetter}1`);
            const groupHeader = `(${nuclide.number}) ${nuclide.name}`;
            const cell = worksheet.getCell(`${startLetter}1`);
            cell.value = groupHeader;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { bold: true };

            // Thiết lập "Bq/kg khô" cho dòng 2, gộp qua hai cột và in nghiêng
            worksheet.mergeCells(`${startLetter}2:${endLetter}2`);
            const bqkgCell = worksheet.getCell(`${startLetter}2`);
            bqkgCell.value = 'Bq/kg khô';
            bqkgCell.alignment = { horizontal: 'center', vertical: 'middle' };
            bqkgCell.font = { italic: true };
        });

        // Điều chỉnh độ rộng cột (tùy chọn)
        worksheet.columns.forEach((column) => {
            column.width = 20;
        });

        // Áp dụng đường viền và căn giữa cho các ô header
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

        // Thêm dữ liệu vào các hàng tiếp theo
        outputData.forEach((data) => {
            const row = [];
            // Push STT và Tên mẫu
            row.push(data['STT']);
            row.push(data['Tên mẫu']);
            // Push dữ liệu cho từng nuclide
            numberedNuclides.forEach((nuclide) => {
                const activityKey = `${nuclide.name}, Bq/kg`;
                const ssKey = `SS, Bq/kg (${nuclide.name})`;
                row.push(data[activityKey] !== undefined ? data[activityKey] : '');
                row.push(data[ssKey] !== undefined ? data[ssKey] : '');
            });
            worksheet.addRow(row);
        });

        // Áp dụng đường viền và căn giữa cho các ô dữ liệu
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

                    {/* Bảng hiển thị assignedEnergies */}
                    <Box sx={{ my: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Assigned Energies
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table aria-label="assigned energies table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Chất</strong></TableCell>
                                        <TableCell><strong>Năng lượng (keV)</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.entries(assignedEnergies).map(([nuclide, energy]) => (
                                        <TableRow key={nuclide}>
                                            <TableCell>{capitalizeNuclide(nuclide)}</TableCell>
                                            <TableCell>{energy}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Nút chọn file */}
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

                    {/* Trường nhập tên file */}
                    <Box sx={{ my: 2 }}>
                        <TextField
                            label="Tên file"
                            variant="outlined"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            fullWidth
                        />
                    </Box>

                    {/* Nút bắt đầu xử lý */}
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

                    {/* Thanh tiến trình */}
                    <Box sx={{ my: 2 }}>
                        <LinearProgress variant="determinate" value={progress} />
                        <Typography variant="body2" color="textSecondary">
                            {progress}%
                        </Typography>
                    </Box>

                    {/* Nút tải xuống file Excel */}
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
