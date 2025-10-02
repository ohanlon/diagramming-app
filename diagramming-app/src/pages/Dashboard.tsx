import React, { useEffect, useState } from 'react';
import { Box, Card, CardMedia, CardContent, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDiagramStore } from '../store/useDiagramStore';

type DiagramListItem = {
  id: string;
  diagramName: string;
  thumbnailDataUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const Dashboard: React.FC = () => {
  const [diagrams, setDiagrams] = useState<DiagramListItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchDiagrams = async () => {
      setLoading(true);
      try {
        const { apiFetch } = await import('../utils/apiFetch');
        const resp = await apiFetch(`${useDiagramStore.getState().serverUrl}/diagrams`, { method: 'GET' });
        if (!resp.ok) {
          console.error('Failed to fetch diagrams', resp.status);
          setDiagrams([]);
          setLoading(false);
          return;
        }
        const json = await resp.json();
        if (mounted) setDiagrams(json.diagrams || []);
      } catch (e) {
        console.error('Error fetching diagrams', e);
        if (mounted) setDiagrams([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDiagrams();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>My Diagrams</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
        {(diagrams || []).map((d) => (
          <Card key={d.id} sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => navigate(`/diagram/${d.id}`)}>
            {d.thumbnailDataUrl ? (
              <CardMedia component="img" image={d.thumbnailDataUrl} alt={d.diagramName} sx={{ height: 98, width: 128, objectFit: 'contain', background: '#fff', mt: 1 }} />
            ) : (
              <Box sx={{ height: 98, width: 128, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee', mt: 1 }}>
                <Typography variant="caption">No preview</Typography>
              </Box>
            )}
            <CardContent sx={{ width: '100%' }}>
              <Typography variant="subtitle1" noWrap>{d.diagramName || 'Untitled'}</Typography>
              <Typography variant="caption" color="text.secondary">{d.updatedAt ? new Date(d.updatedAt).toLocaleString() : ''}</Typography>
            </CardContent>
          </Card>
        ))}
        {(!diagrams || diagrams.length === 0) && (
          <Box>
            <Typography variant="body2" color="text.secondary">You have no saved diagrams yet.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
