import { useState } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountMenu from '../components/AppBar/AccountMenu';
import { AppBar, Toolbar } from '@mui/material';

export default function OnboardingPage() {
  const [name, setName] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [localAdminEmail, setLocalAdminEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const { apiFetch } = await import('../utils/apiFetch');
      const resp = await apiFetch(`${(window as any).DIAGRAM_SERVER_URL || ''}/onboarding/organisations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, primaryContactEmail: primaryEmail, localAdminEmail }) });
      if (!resp.ok) {
        const text = await resp.text().catch(() => resp.statusText);
        throw new Error(text || `Server returned ${resp.status}`);
      }
      await resp.json().catch(() => null);
      setTimeout(() => {
        try {
          const ev = new CustomEvent('show-unsaved-dialog', { detail: { tx: { retry: () => navigate('/dashboard') } } });
          window.dispatchEvent(ev);
        } catch (e) {
          navigate('/dashboard');
        }
      }, 800);
    } catch (e) {
      console.error(String(e));
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: (theme) => theme.palette.background.default }}>
      <AppBar position="static" color="primary" sx={{ padding: '0 1rem' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>Diagramming App</Typography>
          <AccountMenu />
        </Toolbar>
      </AppBar>
      <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h4">Welcome to the Onboarding Page</Typography>
      </Box>
      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 640 }}>
        <TextField label="Organisation name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Primary contact email" value={primaryEmail} onChange={(e) => setPrimaryEmail(e.target.value)} />
        <TextField label="Local admin email" value={localAdminEmail} onChange={(e) => setLocalAdminEmail(e.target.value)} />
        <Box>
          <Button variant="contained" onClick={handleSubmit} disabled={!name || !primaryEmail || !localAdminEmail}>Create organisation</Button>
        </Box>
      </Box>
    </Box>
  );
}
