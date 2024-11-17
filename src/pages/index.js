
import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
} from '@mui/material';
import ExcelJS from 'exceljs';
import LoginForm from '../components/LoginForm';
import AssignedEnergiesTable from '../components/AssignedEnergiesTable';
import FileUploader from '../components/FileUploader';
import ProcessControls from '../components/ProcessControls';
import DownloadButton from '../components/DownloadButton';
import { templateConfig } from '@/utils/templateConfig';
import { getColumnLetter, capitalizeNuclide } from '@/utils/utils';

const Home = () => {
    // Authentication states
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Predefined credentials
    const predefinedUsername = 'admin';
    const predefinedPassword = 'admin';

    // Login form states
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Other states
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [progress, setProgress] = useState(0);
    const [outputFile, setOutputFile] = useState(null);
    const [fileName, setFileName] = useState('Results'); // Default file name
    const [selectedTemplate, setSelectedTemplate] = useState('A'); // Default template

    // Auto logout timer
    useEffect(() => {
        let logoutTimer;
        if (isAuthenticated) {
            // Start 5-minute timer
            logoutTimer = setTimeout(() => {
                setIsAuthenticated(false);
                alert('Bạn đã bị đăng xuất do không hoạt động trong 5 phút.');
            }, 5 * 60 * 1000); // 5 minutes
        }
        return () => {
            if (logoutTimer) {
                clearTimeout(logoutTimer);
            }
        };
    }, [isAuthenticated]);

    // Handle login
    const handleLogin = (e) => {
        e.preventDefault();
        if (username === predefinedUsername && password === predefinedPassword) {
            setIsAuthenticated(true);
            setLoginError('');
            setUsername(''); // Clear username
            setPassword(''); // Clear password
        } else {
            setLoginError('Sai tên đăng nhập hoặc mật khẩu.');
        }
    };

    // Handle file upload
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files).filter(
            (file) => file.name.endsWith('.RPT') || file.name.endsWith('.rpt')
        );
        setSelectedFiles(files);
        alert(`${files.length} tệp được chọn.`);
    };

    // Handle processing
    const handleProcess = async () => {
        if (selectedFiles.length === 0) {
            alert('Vui lòng chọn tệp trước!');
            return;
        }

        setProgress(0);
        const outputData = [];
        const currentTemplateConfig = templateConfig[selectedTemplate];

        try {
            // Process each file
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const text = await file.text();
                const result = currentTemplateConfig.processFile(i + 1, text, assignedEnergies);
                outputData.push(result);
                setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
            }

            // Extract unique nuclides, ignoring keys starting with "SS,"
            const nuclidesSet = new Set();
            outputData.forEach((data) => {
                Object.keys(data).forEach((key) => {
                    if (!key.startsWith('SS,')) { // Ignore "SS," keys
                        const match = key.match(/^(.+?), Bq\/kg/);
                        if (match) {
                            nuclidesSet.add(match[1].toLowerCase()); // Normalize to lowercase
                        }
                    }
                });
            });
            const nuclides = Array.from(nuclidesSet).sort();

            // Assign numbers to nuclides
            const numberedNuclides = nuclides.map((nuclide, index) => ({
                name: capitalizeNuclide(nuclide),
                number: index + 1,
            }));

            // Create workbook and worksheet
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Results');

            // Use template-specific Excel generation
            await currentTemplateConfig.generateExcel(worksheet, numberedNuclides, outputData);

            // Create Blob and download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type:
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            setOutputFile(url);
            alert('File Excel đã được tạo. Bạn có thể tải xuống bên dưới.');
        } catch (error) {
            console.error('Error processing files:', error);
            alert('Đã xảy ra lỗi trong quá trình xử lý tệp.');
        }
    };

    // Assigned Energies
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

    return (
        <Container maxWidth="md" sx={{ mt: 5 }}>
            {!isAuthenticated ? (
                // Login Form
                <LoginForm
                    username={username}
                    password={password}
                    setUsername={setUsername}
                    setPassword={setPassword}
                    handleLogin={handleLogin}
                    loginError={loginError}
                />
            ) : (
                // Main Application
                <>
                    <Typography variant="h4" gutterBottom>
                        Sample Processor
                    </Typography>

                    {/* Assigned Energies Table */}
                    <AssignedEnergiesTable assignedEnergies={assignedEnergies} />

                    {/* File Uploader */}
                    <FileUploader
                        handleFileUpload={handleFileUpload}
                        selectedFiles={selectedFiles}
                    />

                    {/* Process Controls */}
                    <ProcessControls
                        handleProcess={handleProcess}
                        progress={progress}
                        fileName={fileName}
                        setFileName={setFileName}
                        selectedTemplate={selectedTemplate}
                        setSelectedTemplate={setSelectedTemplate}
                    />

                    {/* Download Button */}
                    {outputFile && (
                        <DownloadButton
                            outputFile={outputFile}
                            fileName={fileName}
                        />
                    )}
                </>
            )}
        </Container>
    );
};

export default Home;

