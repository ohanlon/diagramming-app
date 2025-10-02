import React, { useEffect, useState } from 'react';
import { Box, Card, CardMedia, CardContent, Typography, CircularProgress, IconButton, Button, List, ListItemButton, ListItemText, Menu, MenuItem, ListItemIcon, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteIcon from '@mui/icons-material/Delete';
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
  const [selectedSection, setSelectedSection] = useState<'all' | 'favorites'>('all');
  const favoritesCount = (diagrams || []).filter(d => favorites[d.id]).length;
  const navigate = useNavigate();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuForId, setMenuForId] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const currentUserId = useDiagramStore(state => state.currentUser?.id);
  const currentUserIsAdmin = useDiagramStore(state => state.currentUser?.id === 'admin');

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

  // If there are no favorites and the user is viewing the favorites section, fall back to 'all'
  useEffect(() => {
    if (favoritesCount === 0 && selectedSection === 'favorites') setSelectedSection('all');
  }, [favoritesCount, selectedSection]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ display: 'flex', gap: 2, padding: 2 }}>
      {/* Left sidebar: simple text sections to filter main grid */}
      <Box sx={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <List>
          {favoritesCount > 0 && (
            <ListItemButton selected={selectedSection === 'favorites'} onClick={() => setSelectedSection('favorites')}>
              <ListItemText primary={`Favorites (${favoritesCount})`} />
            </ListItemButton>
          )}
          <ListItemButton selected={selectedSection === 'all'} onClick={() => setSelectedSection('all')}>
            <ListItemText primary={`All Diagrams (${diagrams?.length || 0})`} />
          </ListItemButton>
        </List>
      </Box>

      {/* Main content: header + grid of diagrams */}
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>My Diagrams</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {((diagrams || []).filter(d => (selectedSection === 'all' ? true : !!favorites[d.id]))).map((d) => (
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

              {/* Menu at top-right */}
              <IconButton aria-label="more" sx={{ position: 'absolute', right: 4, top: 4, zIndex: 2 }} onClick={(e) => { e.stopPropagation(); setMenuAnchorEl(e.currentTarget); setMenuForId(d.id); }}>
                <MoreVertIcon />
              </IconButton>
              <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl && menuForId === d.id)} onClose={() => { setMenuAnchorEl(null); setMenuForId(null); }}>
                <MenuItem onClick={() => { setMenuAnchorEl(null); navigate(`/diagram/${d.id}`); }}>
                  <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
                  Open
                </MenuItem>
                <MenuItem disabled={isCloning && menuForId === d.id} onClick={async () => {
                  setMenuAnchorEl(null);
                  setIsCloning(true);
                  try {
                    const { apiFetch } = await import('../utils/apiFetch');
                    // Fetch original diagram state
                    const serverUrl = useDiagramStore.getState().serverUrl;
                    const getResp = await apiFetch(`${serverUrl}/diagrams/${d.id}`, { method: 'GET' });
                    if (!getResp.ok) throw new Error('Failed to fetch original diagram');
                    const original = await getResp.json();
                    const newState = { ...original.state };
                    newState.diagramName = `${newState.diagramName || 'Untitled'} (Copy)`;
                    const postResp = await apiFetch(`${serverUrl}/diagrams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: newState }) });
                    if (!postResp.ok) throw new Error('Failed to create clone');
                    const created = await postResp.json();
                    // Navigate to newly created diagram
                    navigate(`/diagram/${created.id}`);
                  } catch (err) {
                    console.error('Clone failed', err);
                    // Optionally show toast
                  } finally {
                    setIsCloning(false);
                  }
                }}>
                  <ListItemIcon>
                    {isCloning && menuForId === d.id ? <CircularProgress size={18} /> : <FileCopyIcon fontSize="small" />}
                  </ListItemIcon>
                  Clone
                </MenuItem>
                <MenuItem onClick={() => { setMenuAnchorEl(null); setDeleteTargetId(d.id); setConfirmDeleteOpen(true); }} disabled={!(d as any).ownerUserId || ((d as any).ownerUserId !== currentUserId && !currentUserIsAdmin)}>
                  <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
                  Delete
                </MenuItem>
              </Menu>

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

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete diagram?</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this diagram? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={async () => {
            if (!deleteTargetId) return;
            try {
              const { apiFetch } = await import('../utils/apiFetch');
              const serverUrl = useDiagramStore.getState().serverUrl;
              const resp = await apiFetch(`${serverUrl}/diagrams/${deleteTargetId}`, { method: 'DELETE' });
              if (!resp.ok) throw new Error('Delete failed');
              // Remove from local state
              setDiagrams(prev => (prev || []).filter(x => x.id !== deleteTargetId));
              // Remove from favorites if present
              setFavorites(prev => { const copy = { ...prev }; delete copy[deleteTargetId]; return copy; });
            } catch (err) {
              console.error('Failed to delete diagram', err);
            } finally {
              setConfirmDeleteOpen(false);
              setDeleteTargetId(null);
            }
          }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
