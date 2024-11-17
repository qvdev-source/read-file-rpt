// components/TemplateSelector.js

import React from 'react';
import { Box, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';

const TemplateSelector = ({ selectedTemplate, setSelectedTemplate }) => {
    const handleChange = (event) => {
        setSelectedTemplate(event.target.value);
    };

    return (
        <Box sx={{ my: 2 }}>
            <FormControl component="fieldset">
                <FormLabel component="legend">Chọn mẫu Excel</FormLabel>
                <RadioGroup
                    row
                    aria-label="template"
                    name="template"
                    value={selectedTemplate}
                    onChange={handleChange}
                >
                    <FormControlLabel value="A" control={<Radio />} label="Mẫu Genenie2K" />
                    <FormControlLabel value="B" control={<Radio />} label="Mẫu GammaVision" />
                    {/* Add more templates here as needed */}
                </RadioGroup>
            </FormControl>
        </Box>
    );
};

export default TemplateSelector;
