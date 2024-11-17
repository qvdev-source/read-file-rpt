// components/DownloadButton.js

import React from 'react';
import { Box, Button } from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';

const DownloadButton = ({ outputFile, fileName }) => {
    return (
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
    );
};

export default DownloadButton;
