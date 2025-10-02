import React, { useEffect, useState } from 'react';
import { Box, Card, CardMedia, CardContent, Typography, CircularProgress, IconButton, Button } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
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
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
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
        // Fetch user settings to determine favorites
        try {
          const settingsResp = await apiFetch(`${useDiagramStore.getState().serverUrl}/users/me/settings`, { method: 'GET' });
          if (settingsResp.ok) {
            const settingsJson = await settingsResp.json();
            const favList: string[] = (settingsJson.settings && settingsJson.settings.favorites) || [];
            const favMap: Record<string, boolean> = {};
            for (const id of favList) favMap[id] = true;
            if (mounted) setFavorites(favMap);
          }
        } catch (e) {
          console.warn('Failed to fetch user settings for favorites', e);
        }
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
          <Card key={d.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {/* Favorite star at top-left */}
            <IconButton
              aria-label={favorites[d.id] ? 'Unfavorite' : 'Favorite'}
              sx={{ position: 'absolute', left: 4, top: 4, zIndex: 2 }}
              onClick={async (e) => {
                e.stopPropagation();
                // Toggle favorite in UI immediately
                const currentlyFav = !!favorites[d.id];
                setFavorites(prev => ({ ...prev, [d.id]: !currentlyFav }));
                // Persist to user settings
                try {
                  const { apiFetch } = await import('../utils/apiFetch');
                  const settingsResp = await apiFetch(`${useDiagramStore.getState().serverUrl}/users/me/settings`, { method: 'GET' });
                  let settingsJson: any = { settings: {} };
                  if (settingsResp.ok) settingsJson = await settingsResp.json();
                  const existingFavs: string[] = (settingsJson.settings && settingsJson.settings.favorites) || [];
                  const favoritesToSave = currentlyFav ? existingFavs.filter((id: string) => id !== d.id) : Array.from(new Set([...existingFavs, d.id]));
                  await apiFetch(`${useDiagramStore.getState().serverUrl}/users/me/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: { ...(settingsJson.settings || {}), favorites: favoritesToSave } }) });
                } catch (err) {
                  console.error('Failed to toggle favorite', err);
                }
              }}
            >
              {favorites[d.id] ? <StarIcon color="warning" /> : <StarBorderIcon />}
            </IconButton>
            {d.thumbnailDataUrl ? (
              <CardMedia component="img" image={d.thumbnailDataUrl} alt={d.diagramName} sx={{ height: 98, width: 128, objectFit: 'contain', background: '#fff', mt: 1 }} />
            ) : (
              <Box sx={{ height: 98, width: 128, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee', mt: 1 }}>
                <Typography variant="caption">No preview</Typography>
              </Box>
            )}
            <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="subtitle1" noWrap sx={{ width: '100%', textAlign: 'center' }}>{d.diagramName || 'Untitled'}</Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button variant="contained" size="small" onClick={() => navigate(`/diagram/${d.id}`)}>Open</Button>
              </Box>
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
