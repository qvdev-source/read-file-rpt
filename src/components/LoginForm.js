// components/LoginForm.js

import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';

const LoginForm = ({ username, password, setUsername, setPassword, handleLogin, loginError }) => {
    return (
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
    );
};

export default LoginForm;
