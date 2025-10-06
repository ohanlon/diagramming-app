import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AdminRoute from '../components/AdminRoute';

const AdminHome: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AdminRoute>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Admin</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>Welcome to the admin console. Use the links below to manage application settings and users.</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => navigate('/admin/settings')}>Settings</Button>
          <Button variant="outlined" onClick={() => navigate('/admin/settings')}>Manage admins</Button>
        </Box>
      </Box>
    </AdminRoute>
  );
};

export default AdminHome;
