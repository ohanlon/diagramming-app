import React, { useState } from 'react';
import { IconButton, Avatar, Menu, MenuItem, ListItemText, Tooltip, Dialog, DialogContent, Typography, Box, FormControlLabel, Switch } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { useDiagramStore } from '../../store/useDiagramStore';
import { useCurrentUser, useLogout, useUserSettings, useUpdateUserSettings } from '../../api/hooks';
import { useNavigate } from 'react-router-dom';
import AvatarEditorComponent from '../AvatarEditor/AvatarEditor';

const AccountMenu: React.FC = () => {
  const { data: currentUser } = useCurrentUser();
  const logoutMutation = useLogout();
  const { data: userSettings } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [avatarSrcForEditing, setAvatarSrcForEditing] = useState<string | null>(null);

  // Always call hooks in a consistent order; avoid short-circuiting a hook call
  const themeModeFromStore = useDiagramStore(state => state.themeMode);
  const themeMode = (userSettings?.themeMode ?? themeModeFromStore) || 'light';
  const currentUserIsAdmin = currentUser?.roles?.includes('admin') || currentUser?.role === 'admin';
  const avatarUrl = currentUser?.avatarUrl;

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleClose();
    await logoutMutation.mutateAsync();
    navigate('/login');
  };

  const handleThemeToggle = async (isDark: boolean) => {
    const newMode = isDark ? 'dark' : 'light';
    // Update Zustand immediately for UI responsiveness
    useDiagramStore.setState({ themeMode: newMode });
    // Persist to server
    await updateSettings.mutateAsync({ themeMode: newMode });
    handleClose();
  };

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
          <MenuItem key="signed" disabled>Signed in as {currentUser.username}</MenuItem>,
          <MenuItem key="change-avatar" onClick={() => { handleClose(); setAvatarEditorOpen(true); }}>Change avatar</MenuItem>,
          <MenuItem key="remove-avatar" onClick={async () => {
            handleClose();
            await updateSettings.mutateAsync({ avatarDataUrl: null } as any);
          }}>
            <ListItemText>Remove avatar</ListItemText>
          </MenuItem>,
          currentUserIsAdmin ? (
            <MenuItem key="admin-images" onClick={() => { handleClose(); navigate('/admin/images'); }}>
              <ListItemText>Admin Page</ListItemText>
            </MenuItem>
          ) : null,
          <MenuItem key="theme-toggle">
            <ListItemText>Light&nbsp;</ListItemText>
            <Switch checked={themeMode === 'dark'} onChange={(e) => handleThemeToggle(e.target.checked)} />
            <ListItemText>&nbsp;Dark</ListItemText>
          </MenuItem>,
          currentUserIsAdmin ? (
            <MenuItem key="admin" onClick={() => { handleClose(); navigate('/admin'); }}>
              <ListItemText>Admin Settings</ListItemText>
            </MenuItem>
          ) : null,
          <MenuItem key="logout" onClick={handleLogout}>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        ] : [
          <MenuItem key="theme-toggle-guest">
            <ListItemText>Theme</ListItemText>
            <FormControlLabel
              control={<Switch checked={themeMode === 'dark'} onChange={(e) => handleThemeToggle(e.target.checked)} />}
              label={themeMode === 'dark' ? 'Dark' : 'Light'}
            />
          </MenuItem>,

          <MenuItem key="login" onClick={() => { handleClose(); navigate('/login'); }}>Login</MenuItem>,
          <MenuItem key="register" onClick={() => { handleClose(); navigate('/login'); }}>Register</MenuItem>
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
                    await updateSettings.mutateAsync({ avatarDataUrl: dataUrl } as any);
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
