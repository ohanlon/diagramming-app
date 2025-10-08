import React, { useEffect, useState } from 'react';
import { Box, Card, CardMedia, CardContent, Typography, CircularProgress, IconButton, Button, List, ListItemButton, ListItemText, Menu, MenuItem, ListItemIcon, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, Snackbar, AppBar, Toolbar } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import { useNavigate } from 'react-router-dom';
import validator from 'validator';
import { useDiagramStore } from '../store/useDiagramStore';
import { listDiagrams, listSharedDiagrams } from '../utils/grpc/diagramsClient';
import MuiAlert from '@mui/material/Alert';
import NewButton from '../components/AppBar/NewMenu';
import AccountMenu from '../components/AppBar/AccountMenu';

type DiagramListItem = {
  id: string;
  diagramName: string;
  thumbnailDataUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  ownerUserId?: string | null;
};

const Dashboard: React.FC = () => {
  const [ownedDiagrams, setOwnedDiagrams] = useState<DiagramListItem[] | null>(null);
  const [sharedDiagrams, setSharedDiagrams] = useState<DiagramListItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [selectedSection, setSelectedSection] = useState<'all' | 'favorites' | 'shared' | 'mine'>('all');
  const favoritesCount = ((ownedDiagrams || []).concat(sharedDiagrams || [])).filter(d => favorites[d.id]).length;
  const ownedCount = (ownedDiagrams || []).length;
  const sharedCount = (sharedDiagrams || []).length;
  const navigate = useNavigate();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuForId, setMenuForId] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const currentUserId = useDiagramStore(state => state.currentUser?.id);
  const currentUserIsAdmin = useDiagramStore(state => !!state.currentUser?.roles?.includes('admin'));
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareInput, setShareInput] = useState('');
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('success');
  const [shareList, setShareList] = useState<Array<{ userId: string; username: string; sharedBy?: string | null; createdAt?: string }>>([]);
  const [shareListLoading, setShareListLoading] = useState(false);
  const [unsharingMap, setUnsharingMap] = useState<Record<string, boolean>>({});
  const [missingEmailsToInvite, setMissingEmailsToInvite] = useState<string[] | null>(null);

  useEffect(() => {
    let mounted = true;
      const fetchDiagrams = async () => {
      setLoading(true);
      try {
        const diagrams = await listDiagrams();
        if (mounted) setOwnedDiagrams(diagrams || []);
        // Also fetch diagrams that have been shared with this user
        try {
          const shared = await listSharedDiagrams();
          if (mounted) setSharedDiagrams(shared || []);
        } catch (e) {
          console.warn('Failed to fetch diagrams shared with me', e);
          if (mounted) setSharedDiagrams([]);
        }
        // Fetch user settings to determine favorites
        try {
          const settingsResp = await (await import('../utils/apiFetch')).apiFetch(`${useDiagramStore.getState().serverUrl}/users/me/settings`, { method: 'GET' });
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
        if (mounted) setOwnedDiagrams([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDiagrams();
    return () => { mounted = false; };
  }, []);

  // No longer auto-fallback away from favorites; allow the user to view an empty favorites list
  // (we keep favoritesCount to show counts in the sidebar)

  // When ownedDiagrams changes ensure selectedSection fallback if appropriate
  useEffect(() => {
    if (selectedSection === 'all' && (ownedDiagrams || []).length === 0 && (sharedDiagrams || []).length > 0) {
      // keep 'all' even if none; optional behavior
    }
  }, [ownedDiagrams, sharedDiagrams, selectedSection]);

  // Fetch share list when dialog opens for a selected diagram, and clear the list when dialog closes
  useEffect(() => {
    let mounted = true;
    const fetchShareList = async (diagramId: string) => {
      setShareListLoading(true);
      try {
        const { apiFetch } = await import('../utils/apiFetch');
        const serverUrl = useDiagramStore.getState().serverUrl;
        const resp = await apiFetch(`${serverUrl}/diagrams/${diagramId}/shares`, { method: 'GET' });
        if (!resp.ok) {
          setShareList([]);
        } else {
          const json = await resp.json();
          if (mounted) setShareList(json.shares || []);
        }
      } catch (e) {
        console.warn('Failed to fetch share list', e);
        if (mounted) setShareList([]);
      } finally {
        if (mounted) setShareListLoading(false);
      }
    };

    if (shareDialogOpen && menuForId) {
      fetchShareList(menuForId);
    } else {
      setShareList([]);
    }

    return () => { mounted = false; };
  }, [shareDialogOpen, menuForId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ display: 'flex', gap: 2, padding: '2' }}>
      {/* Left sidebar: simple text sections to filter main grid */}
      <Box sx={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <List>
          <ListItemButton selected={selectedSection === 'favorites'} onClick={() => setSelectedSection('favorites')}>
            <ListItemText primary={`Favorites (${favoritesCount})`} />
          </ListItemButton>
          <ListItemButton selected={selectedSection === 'mine'} onClick={() => setSelectedSection('mine')}>
            <ListItemText primary={`My Diagrams (${ownedCount})`} />
          </ListItemButton>
          <ListItemButton selected={selectedSection === 'all'} onClick={() => setSelectedSection('all')}>
            <ListItemText primary={`All Diagrams (${ownedCount + sharedCount})`} />
          </ListItemButton>
          <ListItemButton selected={selectedSection === 'shared'} onClick={() => setSelectedSection('shared')}>
            <ListItemText primary={`Shared (${sharedCount})`} />
          </ListItemButton>
          {useDiagramStore.getState().currentUser?.roles?.includes('admin') && (
            <ListItemButton onClick={() => navigate('/admin')}>
              <ListItemText primary={`Admin`} />
            </ListItemButton>
          )}
        </List>
      </Box>

      {/* Main content: header + grid of diagrams */}
      <Box sx={{ flexGrow: 1 }}>
        {/* Compute dynamic header title based on selected section */}
        {
          (() => {
            const headerTitle = selectedSection === 'mine'
              ? `My Diagrams`
              : selectedSection === 'all'
                ? `All Diagrams`
                : selectedSection === 'shared'
                  ? `Shared`
                  : `Favorites`;
            return (
              <AppBar color='primary' position="fixed" sx={{ top: 0, left: 0, right: 0, padding: 0, boxShadow: 'none', borderBottom: '1px solid #e0e0e0', zIndex: 1300 }}>
                <Toolbar disableGutters variant="dense"  sx={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 1 }}>
                  <Typography variant="h6">{headerTitle}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <NewButton />
                    <AccountMenu />
                  </Box>
                </Toolbar>
              </AppBar>
            );
          })()
        }
        {/* Spacer to avoid content being covered by the fixed AppBar */}
        <Toolbar />

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {(() => {
            // When showing 'all' combine owned and shared, de-duplicating by id (owned takes precedence)
            const mergedAll = (() => {
              const map = new Map<string, DiagramListItem>();
              (ownedDiagrams || []).forEach(d => map.set(d.id, d));
              (sharedDiagrams || []).forEach(d => { if (!map.has(d.id)) map.set(d.id, d); });
              return Array.from(map.values());
            })();
            const diagramsToShow = selectedSection === 'all'
              ? mergedAll
              : selectedSection === 'mine'
                ? (ownedDiagrams || [])
                : selectedSection === 'favorites'
                  ? mergedAll.filter(d => favorites[d.id])
                  : (sharedDiagrams || []);
            return diagramsToShow.map((d) => (
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
                <MenuItem onClick={() => { setMenuAnchorEl(null); navigate(`/diagram/${d.id}/history`); }}>
                  <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
                  History
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
                <MenuItem onClick={() => { setMenuAnchorEl(null); setShareDialogOpen(true); setMenuForId(d.id); }} disabled={!(d as any).ownerUserId || ((d as any).ownerUserId !== currentUserId && !currentUserIsAdmin)}>
                  <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
                  Share
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
            ));
          })()}
          {(() => {
            const diagramsToShow = selectedSection === 'all'
              ? (ownedDiagrams || [])
              : selectedSection === 'favorites'
                ? ((ownedDiagrams || []).concat(sharedDiagrams || [])).filter(d => favorites[d.id])
                : (sharedDiagrams || []);
            if (diagramsToShow.length === 0) {
              if (selectedSection === 'mine') return null;
              let message = 'You have no saved diagrams yet.';
              if (selectedSection === 'shared') message = 'No diagrams have been shared with you.';
              if (selectedSection === 'favorites') message = 'You have no favorites yet.';
              return (
                <Box>
                  <Typography variant="body2" color="text.secondary">{message}</Typography>
                </Box>
              );
            }
          })()}
        </Box>

        {/* Favorites list view (vertical list) */}
        {selectedSection === 'favorites' && (() => {
          const favoritesList = ((ownedDiagrams || []).concat(sharedDiagrams || [])).filter(d => favorites[d.id]);
          return (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Favorites</Typography>
              {favoritesList.length === 0 ? (
                <Typography variant="body2" color="text.secondary">You have no favorites yet.</Typography>
              ) : (
                <List>
                  {favoritesList.map(f => (
                    <ListItemButton key={f.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={() => navigate(`/diagram/${f.id}`)}>
                      <Box sx={{ width: 64, height: 48, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee' }}>
                        {f.thumbnailDataUrl ? <img src={f.thumbnailDataUrl} alt={f.diagramName} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <Typography variant="caption">No preview</Typography>}
                      </Box>
                      <Box sx={{ flexGrow: 1, textAlign: 'left' }}>
                        <Typography noWrap>{f.diagramName}</Typography>
                        <Typography variant="caption" color="text.secondary">{f.ownerUserId === currentUserId ? 'You' : 'Shared'}</Typography>
                      </Box>
                      <IconButton aria-label="unfavorite" onClick={async (e) => {
                        e.stopPropagation();
                        // Toggle favorite off locally and persist
                        const currentlyFav = !!favorites[f.id];
                        setFavorites(prev => ({ ...prev, [f.id]: !currentlyFav }));
                        try {
                          const { apiFetch } = await import('../utils/apiFetch');
                          const settingsResp = await apiFetch(`${useDiagramStore.getState().serverUrl}/users/me/settings`, { method: 'GET' });
                          let settingsJson: any = { settings: {} };
                          if (settingsResp.ok) settingsJson = await settingsResp.json();
                          const existingFavs: string[] = (settingsJson.settings && settingsJson.settings.favorites) || [];
                          const favoritesToSave = currentlyFav ? existingFavs.filter((id: string) => id !== f.id) : Array.from(new Set([...existingFavs, f.id]));
                          await apiFetch(`${useDiagramStore.getState().serverUrl}/users/me/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: { ...(settingsJson.settings || {}), favorites: favoritesToSave } }) });
                        } catch (err) {
                          console.error('Failed to toggle favorite', err);
                        }
                      }}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Box>
          );
        })()}
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
              setOwnedDiagrams(prev => (prev || []).filter(x => x.id !== deleteTargetId));
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

      {/* Share dialog */}
      <Dialog open={shareDialogOpen} onClose={() => { setShareDialogOpen(false); setShareInput(''); setShareError(null); setMenuForId(null); setShareList([]); }}>
        <DialogTitle>Share diagram</DialogTitle>
        <DialogContent>
          <DialogContentText>Enter one or more email addresses separated by commas. Example: alice@example.com, bob@example.com</DialogContentText>
          {/* Existing shares list */}
          <Box sx={{ mt: 1, mb: 1 }}>
            <Typography variant="subtitle2">Shared with</Typography>
            {shareListLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={18} /></Box>
            ) : (
              <List dense>
                {shareList.map(s => (
                  <ListItemButton key={s.userId} sx={{ pl: 0, pr: 0 }}>
                    <ListItemText primary={s.username} />
                    {( (menuForId && ((ownedDiagrams || []).find(dd => dd.id === menuForId) as any)?.ownerUserId === currentUserId) || currentUserIsAdmin) && (
                      <IconButton edge="end" size="small" onClick={async (e) => {
                        e.stopPropagation();
                        if (!menuForId) return;
                        setUnsharingMap(prev => ({ ...prev, [s.userId]: true }));
                        try {
                          const { apiFetch } = await import('../utils/apiFetch');
                          const serverUrl = useDiagramStore.getState().serverUrl;
                          const resp = await apiFetch(`${serverUrl}/diagrams/${menuForId}/share/${s.userId}`, { method: 'DELETE' });
                          if (!resp.ok) throw new Error('Unshare failed');
                          setShareList(prev => prev.filter(x => x.userId !== s.userId));
                          setSnackbarSeverity('success');
                          setSnackbarMessage('Access revoked');
                          setSnackbarOpen(true);
                        } catch (err) {
                          console.error('Failed to unshare', err);
                        } finally {
                          setUnsharingMap(prev => { const copy = { ...prev }; delete copy[s.userId]; return copy; });
                        }
                      }} disabled={!!unsharingMap[s.userId]}>
                        {unsharingMap[s.userId] ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                      </IconButton>
                    )}
                  </ListItemButton>
                ))}
                {shareList.length === 0 && !shareListLoading && <Typography variant="caption" color="text.secondary">Not shared with anyone yet.</Typography>}
              </List>
            )}
          </Box>

          <TextField fullWidth autoFocus multiline minRows={2} value={shareInput} onChange={(e) => setShareInput(e.target.value)} placeholder="email1@example.com, email2@example.com" sx={{ mt: 2 }} />
           {shareError && <Typography color="error" variant="caption">{shareError}</Typography>}
         </DialogContent>
         <DialogActions>
           <Button onClick={() => { setShareDialogOpen(false); setShareInput(''); setShareError(null); setMenuForId(null); }}>Cancel</Button>
          <Button variant="contained" disabled={shareLoading} onClick={async () => {
             setShareError(null);
             const targetId = menuForId;
             if (!targetId) return setShareError('No diagram selected');
             // Parse emails from input
             const parts = shareInput.split(',').map(s => s.trim()).filter(Boolean);
             const valids = parts.filter(p => validator.isEmail(p));
             if (valids.length === 0) return setShareError('No valid email addresses found');
             setShareLoading(true);
             try {
               const { apiFetch } = await import('../utils/apiFetch');
               const serverUrl = useDiagramStore.getState().serverUrl;
               const resp = await apiFetch(`${serverUrl}/diagrams/${targetId}/share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emails: valids }) });
               if (!resp.ok) {
                 // Try to parse missing emails payload if present
                 let body: any = null;
                 try { body = await resp.json(); } catch (e) { /* ignore */ }
                 if (body && body.missing && Array.isArray(body.missing) && body.missing.length > 0) {
                   setMissingEmailsToInvite(body.missing);
                   return setShareError('Some emails are not registered users. You may invite them.');
                 }
                 const text = await resp.text().catch(() => String(resp.status));
                 return setShareError(`Share failed: ${text}`);
               }
               // Success: refresh share list to show newly shared users and clear input
               setShareInput('');
               setShareError(null);
               setSnackbarSeverity('success');
               setSnackbarMessage('Shared successfully');
               setSnackbarOpen(true);
               // Reload share list
               try {
                 const sharesResp = await (await import('../utils/apiFetch')).apiFetch(`${serverUrl}/diagrams/${targetId}/shares`, { method: 'GET' });
                 if (sharesResp.ok) {
                   const sharesJson = await sharesResp.json();
                   setShareList(sharesJson.shares || []);
                 }
               } catch (e) {
                 console.warn('Failed to refresh share list after share', e);
               }
             } catch (err) {
               console.error('Share failed', err);
               setShareError('Share request failed');
             } finally {
               setShareLoading(false);
             }
           }}>{shareLoading ? 'Sharing...' : 'Share'}</Button>
         </DialogActions>
       </Dialog>

       {/* Invite missing emails button */}
       {missingEmailsToInvite && missingEmailsToInvite.length > 0 && (
         <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
           <Typography variant="body2">Invite these emails to register and view the diagram:</Typography>
           <Button variant="outlined" onClick={async () => {
             if (!menuForId) return;
             try {
               const { apiFetch } = await import('../utils/apiFetch');
               const serverUrl = useDiagramStore.getState().serverUrl;
               const resp = await apiFetch(`${serverUrl}/diagrams/${menuForId}/invite`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emails: missingEmailsToInvite }) });
               if (!resp.ok) throw new Error('Invite failed');
               setMissingEmailsToInvite(null);
               setSnackbarSeverity('success');
               setSnackbarMessage('Invites sent');
               setSnackbarOpen(true);
             } catch (err) {
               console.error('Invite failed', err);
               setSnackbarSeverity('error');
               setSnackbarMessage('Failed to send invites');
               setSnackbarOpen(true);
             }
           }}>Send invites</Button>
         </Box>
       )}

       <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
         <MuiAlert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} elevation={6} variant="filled">{snackbarMessage}</MuiAlert>
       </Snackbar>
    </Box>
  );
};

export default Dashboard;
