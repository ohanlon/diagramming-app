import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Paper } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDiagramStore } from '../store/useDiagramStore';

const DiagramHistory: React.FC = () => {
  const { id } = useParams() as { id?: string };
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({});
  const navigate = useNavigate();
  const serverUrl = useDiagramStore.getState().serverUrl;

  useEffect(() => {
    let mounted = true;
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const { apiFetch } = await import('../utils/apiFetch');
        const resp = await apiFetch(`${serverUrl}/diagrams/${id}/history`, { method: 'GET' });
        if (!resp.ok) throw new Error(`Failed to list history: ${resp.status}`);
        const json = await resp.json();
        if (!mounted) return;
        setEntries(json.history || json || []);
        // Kick off parallel detail fetches to obtain thumbnails for entries
        for (const e of (json.history || json || [])) {
          (async (historyId: string) => {
            setLoadingMap(prev => ({ ...prev, [historyId]: true }));
            try {
              const detailResp = await (await import('../utils/apiFetch')).apiFetch(`${serverUrl}/diagrams/${id}/history/${historyId}`, { method: 'GET' });
              if (!detailResp.ok) throw new Error('detail fetch failed');
              const detailJson = await detailResp.json();
              const thumb = detailJson.state && detailJson.state.thumbnailDataUrl ? detailJson.state.thumbnailDataUrl : null;
              setThumbnails(prev => ({ ...prev, [historyId]: thumb }));
            } catch (err) {
              console.warn('Failed to load history entry detail', err);
              setThumbnails(prev => ({ ...prev, [historyId]: null }));
            } finally {
              setLoadingMap(prev => { const copy = { ...prev }; delete copy[historyId]; return copy; });
            }
          })(e.id);
        }
      } catch (e) {
        console.error('Failed to load history list', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, serverUrl]);

  const handleOpenEntry = async (historyId: string) => {
    if (!id) return;
    try {
      const { apiFetch } = await import('../utils/apiFetch');
      const resp = await apiFetch(`${serverUrl}/diagrams/${id}/history/${historyId}`, { method: 'GET' });
      if (!resp.ok) throw new Error('Failed to fetch history entry');
      const json = await resp.json();
      const snapshot = json.state;
      // Apply the snapshot into the client store and navigate to the editor for this diagram
      useDiagramStore.getState().applyStateSnapshot(snapshot);
      useDiagramStore.getState().setRemoteDiagramId(id);
      navigate(`/diagram/${id}`);
    } catch (e) {
      console.error('Open history entry failed', e);
    }
  };

  const handleRestore = async (historyId: string) => {
    if (!id) return;
    try {
      const { apiFetch } = await import('../utils/apiFetch');
      const resp = await apiFetch(`${serverUrl}/diagrams/${id}/history/${historyId}/restore`, { method: 'POST' });
      if (!resp.ok) {
        const text = await resp.text().catch(() => `Status ${resp.status}`);
        throw new Error(text);
      }
      // After restore, navigate to the editor and reload the diagram from server
      navigate(`/diagram/${id}`);
    } catch (e) {
      console.error('Restore failed', e);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Diagram History</Typography>
      {!id && <Typography color="error">No diagram specified</Typography>}
      {loading && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={18} /><Typography>Loading history...</Typography></Box>}
      {!loading && entries.length === 0 && <Typography color="text.secondary">No history entries available.</Typography>}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {entries.map(entry => (
          <Paper key={entry.id} sx={{ p: 2, width: 320 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ width: 120, height: 80, background: (theme) => theme.palette.background.paper, border: (theme) => `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {thumbnails[entry.id] ? (
                  <img src={thumbnails[entry.id] as string} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                ) : loadingMap[entry.id] ? <CircularProgress size={24} /> : <Typography variant="caption">No preview</Typography>}
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography noWrap sx={{ fontWeight: 600 }}>{entry.operation}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(entry.created_at).toLocaleString()}</Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => handleOpenEntry(entry.id)}>Open</Button>
                  <Button size="small" variant="contained" onClick={() => handleRestore(entry.id)}>Restore</Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default DiagramHistory;
