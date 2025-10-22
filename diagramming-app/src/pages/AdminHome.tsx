import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AdminRoute from '../components/AdminRoute';
import AccountMenu from '../components/AppBar/AccountMenu';
import { AppBar, Toolbar } from '@mui/material';

const AdminHome: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AdminRoute>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: (theme) => theme.palette.background.default }}>
        <AppBar position="static" color="primary" sx={{ padding: '0 1rem' }}>
          <Toolbar variant='dense' disableGutters>
            <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/diagram')}>Diagramming App</Typography>
            <AccountMenu />
          </Toolbar>
        </AppBar>
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h4">Welcome to the Admin Page</Typography>
        </Box>
      </Box>
    </AdminRoute>
  );
};

export default AdminHome;
