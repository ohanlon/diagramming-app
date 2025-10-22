import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountMenu from '../components/AppBar/AccountMenu';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: (theme) => theme.palette.background.default, color: (theme) => theme.palette.text.primary }}>
      {/* Force light theme */}
      <Box sx={{ bgcolor: '#f8f9fa', color: '#000000', flexGrow: 1 }}>
        {/* Top-level menu bar */}
        <AppBar position="static" color="primary" sx={{ padding: '0 1rem' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>Diagramming App</Typography>
            <Button color="inherit" onClick={() => navigate('/diagram')}>Diagrams</Button>
            <Button color="inherit" onClick={() => navigate('/onboarding')}>Onboarding</Button>
            <AccountMenu />
          </Toolbar>
        </AppBar>

        {/* Hero section */}
        <Container sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2rem' }}>
          <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Visualize, Collaborate, and Create
          </Typography>
          <Typography variant="h5" gutterBottom sx={{ color: (theme) => theme.palette.text.secondary }}>
            Unlock the power of diagramming to bring your ideas to life.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, marginTop: '2rem' }}>
            <Button variant="contained" color="primary" size="large" onClick={() => navigate('/diagram')}>
              Get Started
            </Button>
            <Button variant="outlined" color="primary" size="large" onClick={() => navigate('/onboarding')}>
              Learn More
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
