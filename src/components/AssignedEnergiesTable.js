// components/AssignedEnergiesTable.js

import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { capitalizeNuclide } from '../utils/utils';

const AssignedEnergiesTable = ({ assignedEnergies }) => {
    return (
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
    );
};

export default AssignedEnergiesTable;
