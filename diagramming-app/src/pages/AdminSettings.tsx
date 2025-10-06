import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { apiFetch } from '../utils/apiFetch';
import AdminRoute from '../components/AdminRoute';

const AdminSettings: React.FC = () => {
  const [days, setDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const resp = await apiFetch('/admin/refresh-token-days', { method: 'GET' });
        if (!resp.ok) throw new Error(`Failed to load: ${resp.status}`);
        const json = await resp.json();
        setDays(json.days || null);
      } catch (e: any) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setMessage(null);
    setError(null);
    try {
      if (!days) throw new Error('Please enter a valid number of days');
      const resp = await apiFetch('/admin/refresh-token-days', { method: 'POST', body: JSON.stringify({ days }), headers: { 'Content-Type': 'application/json' } });
      if (!resp.ok) {
        const text = await resp.text().catch(() => `Status ${resp.status}`);
        throw new Error(text);
      }
      setMessage('Updated successfully');
    } catch (e: any) {
      setError(String(e));
    }
  };

  return (
    <AdminRoute>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Admin Settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Configure application-level settings.</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField label="Refresh token lifetime (days)" type="number" value={days ?? ''} onChange={(e) => setDays(Number(e.target.value))} />
          <Button variant="contained" onClick={handleSave} disabled={loading}>Save</Button>
        </Box>
      </Box>
    </AdminRoute>
  );
};

export default AdminSettings;
