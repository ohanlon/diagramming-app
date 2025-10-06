import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, Alert, List, ListItem, ListItemText, Divider } from '@mui/material';
import { apiFetch } from '../utils/apiFetch';
import AdminRoute from '../components/AdminRoute';
import { useDiagramStore } from '../store/useDiagramStore';

const AdminSettings: React.FC = () => {
  const [days, setDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Array<{ id: string; username: string }>>([]);
  const [promoteName, setPromoteName] = useState('');
  const serverUrl = useDiagramStore.getState().serverUrl || 'http://localhost:4000';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const resp = await apiFetch(`${serverUrl}/admin/refresh-token-days`, { method: 'GET' });
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
      const resp = await apiFetch(`${serverUrl}/admin/refresh-token-days`, { method: 'POST', body: JSON.stringify({ days }), headers: { 'Content-Type': 'application/json' } });
      if (!resp.ok) {
        const text = await resp.text().catch(() => `Status ${resp.status}`);
        throw new Error(text);
      }
      setMessage('Updated successfully');
    } catch (e: any) {
      setError(String(e));
    }
  };

  // Fetch admins for display
  const fetchAdmins = async () => {
    try {
      const resp = await apiFetch(`${serverUrl}/admin/admins`, { method: 'GET' });
      if (!resp.ok) throw new Error(`Failed to fetch admins: ${resp.status}`);
      const json = await resp.json();
      setAdmins(json.admins || []);
    } catch (e: any) {
      console.warn('Failed to load admins', e);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handlePromote = async () => {
    setMessage(null);
    setError(null);
    try {
      if (!promoteName || promoteName.trim().length === 0) throw new Error('Please enter a username or id to promote');
      const resp = await apiFetch(`${serverUrl}/admin/promote`, { method: 'POST', body: JSON.stringify({ username: promoteName }), headers: { 'Content-Type': 'application/json' } });
      if (!resp.ok) {
        const text = await resp.text().catch(() => `Status ${resp.status}`);
        throw new Error(text);
      }
      const json = await resp.json();
      setMessage(`Promoted ${json.user?.username || promoteName}`);
      setPromoteName('');
      await fetchAdmins();
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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
          <TextField label="Refresh token lifetime (days)" type="number" value={days ?? ''} onChange={(e) => setDays(Number(e.target.value))} />
          <Button variant="contained" onClick={handleSave} disabled={loading}>Save</Button>
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Admin users</Typography>
        <List dense>
          {admins.length === 0 ? <ListItem><ListItemText primary="(none)" /></ListItem> : admins.map(a => (
            <ListItem key={a.id}><ListItemText primary={a.username} secondary={a.id} /></ListItem>
          ))}
        </List>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
          <TextField label="Promote user (email)" value={promoteName} onChange={(e) => setPromoteName(e.target.value)} />
          <Button variant="contained" color="secondary" onClick={handlePromote}>Promote</Button>
        </Box>
      </Box>
    </AdminRoute>
  );
};

export default AdminSettings;
