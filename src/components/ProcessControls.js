// components/ProcessControls.js

import React from 'react';
import { Box, Button, LinearProgress, TextField, Typography } from '@mui/material';
import StartIcon from '@mui/icons-material/Start';
import TemplateSelector from './TemplateSelector';

const ProcessControls = ({ handleProcess, progress, fileName, setFileName, selectedTemplate, setSelectedTemplate }) => {
    return (
        <Box sx={{ my: 2 }}>
            {/* File Name Input */}
            <TextField
                label="Tên file"
                variant="outlined"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                fullWidth
            />

            {/* Template Selector */}
            <TemplateSelector
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
            />

            {/* Start Processing Button */}
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

            {/* Progress Bar */}
            <Box sx={{ my: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="body2" color="textSecondary">
                    {progress}%
                </Typography>
            </Box>
        </Box>
    );
};

export default ProcessControls;
