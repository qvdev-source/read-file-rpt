// components/FileUploader.js

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const FileUploader = ({ handleFileUpload, selectedFiles }) => {
    return (
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
    );
};

export default FileUploader;
