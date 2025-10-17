import { useState } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function OnboardingPage() {
  const [name, setName] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [localAdminEmail, setLocalAdminEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    try {
      const { apiFetch } = await import('../utils/apiFetch');
      const resp = await apiFetch(`${(window as any).DIAGRAM_SERVER_URL || ''}/onboarding/organisations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, primaryContactEmail: primaryEmail, localAdminEmail }) });
      if (!resp.ok) {
        const text = await resp.text().catch(() => resp.statusText);
        setError(text || `Server returned ${resp.status}`);
        return;
      }
  await resp.json().catch(() => null);
  setSuccess('Organisation created');
      setTimeout(() => {
        try {
          const ev = new CustomEvent('show-unsaved-dialog', { detail: { tx: { retry: () => navigate('/dashboard') } } });
          window.dispatchEvent(ev);
        } catch (e) {
          navigate('/dashboard');
        }
      }, 800);
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5">Onboard an organisation</Typography>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, maxWidth: 640 }}>
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
