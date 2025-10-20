import React, { useState } from 'react';
import { IconButton, Avatar, Menu, MenuItem, ListItemText, Tooltip, Dialog, DialogContent, Typography, Box, FormControlLabel, Switch } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { useDiagramStore } from '../../store/useDiagramStore';
import { getCurrentUserFromCookie } from '../../utils/userCookie';
import { useNavigate } from 'react-router-dom';
import AvatarEditorComponent from '../AvatarEditor/AvatarEditor';

const AccountMenu: React.FC = () => {
  const currentUser = useDiagramStore(state => state.currentUser as any);
  const currentUserIsAdmin = useDiagramStore(state => !!state.currentUser?.roles?.includes('admin'));
  const logout = useDiagramStore(state => state.logout);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentUser?.avatarUrl);
  const [avatarSrcForEditing, setAvatarSrcForEditing] = useState<string | null>(null);
  const themeMode = useDiagramStore(state => state.themeMode || 'light');
  const setThemeMode = useDiagramStore(state => state.setThemeMode as (mode: 'light'|'dark') => void);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // If the in-memory store is not yet hydrated but a cookie exists, hydrate it
  React.useEffect(() => {
    if (!currentUser) {
      const cookie = getCurrentUserFromCookie();
      if (cookie) {
        useDiagramStore.setState({ currentUser: cookie } as any);
        setAvatarUrl((cookie as any).avatarUrl);
      }
    }
  }, [currentUser]);

  return (
    <>
      <Tooltip title={currentUser ? `Signed in as ${currentUser.firstName || currentUser.username} ${currentUser.lastName || ''}`.trim() : 'Account'}>
        <IconButton onClick={handleOpen} color="inherit">
          <Avatar src={avatarUrl} sx={{ width: 32, height: 32 }}>
            {!avatarUrl && <PersonIcon />}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose} id="account-menu">
    {currentUser ? [
      <MenuItem key="signed" disabled>Signed in as {((currentUser.firstName || '') + ' ' + (currentUser.lastName || '')).trim() || currentUser.username}</MenuItem>,
          <MenuItem key="change-avatar" onClick={() => { handleClose(); setAvatarEditorOpen(true); }}>Change avatar</MenuItem>,
          <MenuItem key="remove-avatar" onClick={async () => {
            handleClose();
            try {
              const { apiFetch } = await import('../../utils/apiFetch');
              const existingResp = await apiFetch(`${useDiagramStore.getState().serverUrl}/users/me/settings`, { method: 'GET' });
              const existingJson = existingResp.ok ? await existingResp.json() : { settings: {} };
              const resp = await apiFetch(`${useDiagramStore.getState().serverUrl}/users/me/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: { ...(existingJson.settings || {}), avatarDataUrl: null } }) });
              if (resp.ok) {
                setAvatarUrl(undefined);
                useDiagramStore.setState({ currentUser: { ...(useDiagramStore.getState().currentUser || {}), avatarUrl: undefined } as any });
              }
            } catch (e) {
              console.warn('Failed to remove avatar', e);
            }
          }}>
            <ListItemText>Remove avatar</ListItemText>
          </MenuItem>,
          <MenuItem key="logout" onClick={() => { handleClose(); logout(); }}>
            <ListItemText>Logout</ListItemText>
          </MenuItem>,
          <MenuItem key="theme-toggle">
            <ListItemText>Light&nbsp;</ListItemText>
            <Switch checked={themeMode === 'dark'} onChange={(e) => { setThemeMode(e.target.checked ? 'dark' : 'light'); handleClose(); }} />
            <ListItemText>&nbsp;Dark</ListItemText>
          </MenuItem>,
          currentUserIsAdmin ? (
            <MenuItem key="admin" onClick={() => { handleClose(); navigate('/admin'); }}>
              <ListItemText>Admin Settings</ListItemText>
            </MenuItem>
          ) : null
        ] : [
          <MenuItem key="theme-toggle-guest">
            <ListItemText>Theme</ListItemText>
            <FormControlLabel
              control={<Switch checked={themeMode === 'dark'} onChange={(e) => { setThemeMode(e.target.checked ? 'dark' : 'light'); handleClose(); }} />}
              label={themeMode === 'dark' ? 'Dark' : 'Light'}
            />
          </MenuItem>,
          <MenuItem key="login" onClick={() => { handleClose(); window.location.href = '/login'; }}>Login</MenuItem>,
          <MenuItem key="register" onClick={() => { handleClose(); window.location.href = '/login'; }}>Register</MenuItem>
        ]}
      </Menu>

      {/* Avatar editor dialog */}
      {avatarEditorOpen && (
        <Dialog open={avatarEditorOpen} onClose={() => setAvatarEditorOpen(false)}>
          <DialogContent>
            <Typography variant="subtitle1">Choose an image file to crop. Final avatar must be &lt;= 50KB.</Typography>
            <Box sx={{ mt: 2 }}>
              <input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => { setAvatarSrcForEditing(String(reader.result)); };
                reader.readAsDataURL(f);
              }} />
            </Box>
            {avatarSrcForEditing && (
              <Box sx={{ mt: 2 }}>
                <AvatarEditorComponent imageSrc={avatarSrcForEditing} onCancel={() => { setAvatarEditorOpen(false); setAvatarSrcForEditing(null); }} onSave={async (dataUrl: string) => {
                  try {
                    const { apiFetch } = await import('../../utils/apiFetch');
                    const existingResp = await apiFetch(`${useDiagramStore.getState().serverUrl}/users/me/settings`, { method: 'GET' });
                    const existingJson = existingResp.ok ? await existingResp.json() : { settings: {} };
                    const resp = await apiFetch(`${useDiagramStore.getState().serverUrl}/users/me/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: { ...(existingJson.settings || {}), avatarDataUrl: dataUrl } }) });
                    if (resp.ok) {
                      setAvatarUrl(dataUrl);
                      useDiagramStore.setState({ currentUser: { ...(useDiagramStore.getState().currentUser || {}), avatarUrl: dataUrl } as any });
                    }
                  } catch (e) {
                    console.error('Failed to save avatar', e);
                  } finally {
                    setAvatarEditorOpen(false);
                    setAvatarSrcForEditing(null);
                  }
                }} />
              </Box>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AccountMenu;
