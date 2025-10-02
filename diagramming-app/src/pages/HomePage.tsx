import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
      <Typography variant="h4">Welcome to Diagramming App</Typography>
      <Typography variant="body1">This is the public home page. Click below to open the diagram editor.</Typography>
      <Button component={RouterLink} to="/diagram" variant="contained">Open Diagram Editor</Button>
    </Box>
  );
};

export default HomePage;
