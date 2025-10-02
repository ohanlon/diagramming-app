import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Print from '../Print/Print';
import { Toolbar, Button, Menu, MenuItem, ListItemText, Typography, ListItemIcon, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton, Tooltip, Box, Avatar, TextField } from '@mui/material';
import { ArticleOutlined, ContentCopy, ContentCut, ContentPaste, PrintOutlined, RedoOutlined, SaveOutlined, UndoOutlined, Person as PersonIcon } from '@mui/icons-material';
import { useDiagramStore } from '../../store/useDiagramStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useNavigate } from 'react-router-dom';
import AvatarEditorComponent from '../AvatarEditor/AvatarEditor';

const MainToolbar: React.FC = () => {
  const [fileMenuAnchorEl, setFileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [editMenuAnchorEl, setEditMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectMenuAnchorEl, setSelectMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [accountMenuAnchorEl, setAccountMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { resetStore, undo, redo, cutShape, copyShape, pasteShape, selectAll, selectShapes, selectConnectors, activeSheetId, sheets, isDirty } = useDiagramStore();
  const { history } = useHistoryStore();
  const activeSheet = sheets[activeSheetId];
  const currentUser = useDiagramStore(state => state.currentUser);
  const logout = useDiagramStore(state => state.logout);
  const navigate = useNavigate();
  const diagramName = useDiagramStore(state => state.diagramName) || 'New Diagram';
  const setDiagramName = useDiagramStore(state => state.setDiagramName);
  const [editNameOpen, setEditNameOpen] = React.useState(false);
  const [editingName, setEditingName] = React.useState(diagramName);
  const [pendingNewCreation, setPendingNewCreation] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentUser?.avatarUrl);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [avatarSrcForEditing, setAvatarSrcForEditing] = useState<string | null>(null);

  // If activeSheet is undefined, it means the store state is inconsistent
  if (!activeSheet) {
    console.error('Active sheet not found, resetting store');
    resetStore();
    return <div>Loading...</div>;
  }

  const handleFileMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFileMenuAnchorEl(event.currentTarget);
  };

  // When any top-level menu is open, hovering over another top-level menu should open it
  const isAnyTopMenuOpen = Boolean(fileMenuAnchorEl || editMenuAnchorEl || selectMenuAnchorEl);

  const handleTopLevelMouseEnter = (event: React.MouseEvent<HTMLButtonElement>, menu: 'file' | 'edit' | 'select') => {
    if (!isAnyTopMenuOpen) return;
    // Open the hovered menu and close others
    const target = event.currentTarget;
    if (menu === 'file') {
      setFileMenuAnchorEl(target);
      setEditMenuAnchorEl(null);
      setSelectMenuAnchorEl(null);
    } else if (menu === 'edit') {
      setEditMenuAnchorEl(target);
      setFileMenuAnchorEl(null);
      setSelectMenuAnchorEl(null);
    } else if (menu === 'select') {
      setSelectMenuAnchorEl(target);
      setFileMenuAnchorEl(null);
      setEditMenuAnchorEl(null);
    }
  };

  const handleFileMenuClose = () => {
    setFileMenuAnchorEl(null);
  };

  const handleEditMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setEditMenuAnchorEl(event.currentTarget);
  };

  const handleEditMenuClose = () => {
    setEditMenuAnchorEl(null);
  };

  const handleSelectMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectMenuAnchorEl(event.currentTarget);
  };

  const handleSelectMenuClose = () => {
    setSelectMenuAnchorEl(null);
  };

  const handlePrint = () => {
    const printContainer = document.createElement('div');
    printContainer.className = 'print-container';
    document.body.appendChild(printContainer);
    const root = createRoot(printContainer);
    root.render(<Print />);

    setTimeout(() => {
      window.print();
      document.body.removeChild(printContainer);
    }, 500);

    handleFileMenuClose();
  };

  const { saveDiagram } = useDiagramStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        handlePrint();
      }
      if ((event.ctrlKey || event.metaKey) && (event.key === 's' || event.key === 'S')) {
        event.preventDefault();
        saveDiagram();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrint, saveDiagram]);

  const createNewDiagram = useDiagramStore(state => state.createNewDiagram);
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);

  const handleNewDiagramConfirmed = () => {
    // User confirmed discarding unsaved changes — proceed to prompt for a name
    setConfirmNewOpen(false);
    setEditingName('New Diagram');
    setEditNameOpen(true);
    handleFileMenuClose();
  };

  const handleNewDiagram = () => {
    // Start the 'create new diagram' flow. If there are unsaved changes, ask the user
    // to confirm discarding them, otherwise prompt for a name immediately.
    setPendingNewCreation(true);
    if (isDirty) {
      setConfirmNewOpen(true);
    } else {
      setEditingName('New Diagram');
      setEditNameOpen(true);
      handleFileMenuClose();
    }
  };

  const handleUndo = () => {
    undo();
    handleEditMenuClose();
  };

  const handleRedo = () => {
    redo();
    handleEditMenuClose();
  };

  const handleCut = () => {
    if (activeSheet?.selectedShapeIds?.length > 0) {
      cutShape(activeSheet.selectedShapeIds);
    }
    handleEditMenuClose();
  };

  const handleCopy = () => {
    if (activeSheet?.selectedShapeIds?.length > 0) {
      copyShape(activeSheet.selectedShapeIds);
    }
    handleEditMenuClose();
  };

  const handlePaste = () => {
    pasteShape();
    handleEditMenuClose();
  };

  const handleSelectAll = () => {
    selectAll();
    handleSelectMenuClose();
  };

  const handleSelectShapes = () => {
    selectShapes();
    handleSelectMenuClose();
  };

  const handleSelectLines = () => {
    selectConnectors();
    handleSelectMenuClose();
  };

  return (
    <Toolbar disableGutters variant="dense" sx={{ borderBottom: '1px solid #e0e0e0', padding: '0 0', marginLeft: 0, boxShadow: 'none', color: 'black', minHeight: '2em' }}>
      <Button onClick={handleFileMenuOpen} onMouseEnter={(e) => handleTopLevelMouseEnter(e, 'file')} sx={{ color: 'black' }}>
        File
      </Button>
      {/* Diagram name display and edit */}
      <Button onClick={() => { setEditingName(diagramName); setEditNameOpen(true); }} sx={{ textTransform: 'none', ml: 1 }}>
        <Typography variant="subtitle1">{diagramName}</Typography>
      </Button>
      <Menu
        elevation={0}
        anchorEl={fileMenuAnchorEl}
        open={Boolean(fileMenuAnchorEl)}
        onClose={handleFileMenuClose}
        PaperProps={{ style: { border: '1px solid #a0a0a0' } }}
      >
        <MenuItem onClick={handleNewDiagram}>
          <ListItemIcon><ArticleOutlined fontSize="small" /></ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>New Diagram</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { saveDiagram(); handleFileMenuClose(); }}>
          <ListItemIcon>
            <SaveOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Save</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+S</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handlePrint}>
          <ListItemIcon>
            <PrintOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Print</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+P</Typography>
        </MenuItem>
      </Menu>

      <Button onClick={handleEditMenuOpen} onMouseEnter={(e) => handleTopLevelMouseEnter(e, 'edit')} sx={{ color: 'black' }}>
        Edit
      </Button>
      <Menu
        elevation={0}
        anchorEl={editMenuAnchorEl}
        open={Boolean(editMenuAnchorEl)}
        onClose={handleEditMenuClose}
        PaperProps={{ style: { border: '1px solid #a0a0a0' } }}
      >
        <MenuItem onClick={handleUndo} disabled={history.past.length === 0}>
          <ListItemIcon>
            <UndoOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Undo</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+Z</Typography>
        </MenuItem>
        <MenuItem onClick={handleRedo} disabled={history.future.length === 0}>
          <ListItemIcon>
            <RedoOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Redo</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+Y</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleCut} disabled={!activeSheet || activeSheet.selectedShapeIds.length === 0}>
          <ListItemIcon>
            <ContentCut fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Cut</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+X</Typography>
        </MenuItem>
        <MenuItem onClick={handleCopy} disabled={!activeSheet || activeSheet.selectedShapeIds.length === 0}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Copy</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+C</Typography>
        </MenuItem>
        <MenuItem onClick={handlePaste} disabled={!activeSheet || !activeSheet.clipboard || activeSheet.clipboard.length === 0}>
          <ListItemIcon>
            <ContentPaste fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Paste</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+V</Typography>
        </MenuItem>
      </Menu>

      <Button onClick={handleSelectMenuOpen} onMouseEnter={(e) => handleTopLevelMouseEnter(e, 'select')} sx={{ color: 'black' }}>
        Select
      </Button>
      <Menu
        elevation={0}
        anchorEl={selectMenuAnchorEl}
        open={Boolean(selectMenuAnchorEl)}
        onClose={handleSelectMenuClose}
        PaperProps={{ style: { border: '1px solid #a0a0a0' } }}
      >
        <MenuItem onClick={handleSelectAll}>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>All</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+A</Typography>
        </MenuItem>
        <MenuItem onClick={handleSelectShapes}>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Shapes</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleSelectLines}>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Lines</ListItemText>
        </MenuItem>
      </Menu>
      <Dialog open={confirmNewOpen} onClose={() => { setConfirmNewOpen(false); setPendingNewCreation(false); }}>
        <DialogTitle>Discard unsaved changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Creating a new diagram will discard these changes. Do you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setConfirmNewOpen(false); setPendingNewCreation(false); }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleNewDiagramConfirmed}>Discard & New</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editNameOpen} onClose={() => { setEditNameOpen(false); setPendingNewCreation(false); }}>
        <DialogTitle>Edit Diagram Name</DialogTitle>
        <DialogContent>
          <TextField label="Diagram name" value={editingName} onChange={(e) => setEditingName(e.target.value)} fullWidth autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditNameOpen(false); setPendingNewCreation(false); }}>Cancel</Button>
          <Button onClick={() => {
            const finalName = editingName && editingName.trim() ? editingName.trim() : 'New Diagram';
            if (pendingNewCreation) {
              // Creating a brand new diagram with the provided name
              createNewDiagram(finalName);
              setPendingNewCreation(false);
            } else {
              // Just renaming the current diagram
              setDiagramName(finalName);
            }
            setEditNameOpen(false);
          }} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      {/* Ensure pending flag is cleared if user navigates away or closes menus */}
      {/* (Handled above in onClose handlers) */}
      {/* Flexible spacer pushes account UI to far right */}
      <Box sx={{ flex: 1 }} />
      <Tooltip title={currentUser ? `Signed in as ${currentUser.username}` : 'Account'}>
        <IconButton onClick={(e) => setAccountMenuAnchorEl(e.currentTarget)} color={currentUser ? 'primary' : 'default'}>
          <Avatar src={avatarUrl} sx={{ width: 32, height: 32 }}>
            {!avatarUrl && <PersonIcon />}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        id="main-account-menu"
        anchorEl={accountMenuAnchorEl}
        open={Boolean(accountMenuAnchorEl)}
        onClose={() => setAccountMenuAnchorEl(null)}
      >
        {currentUser ? [
          <MenuItem key="signed-in" disabled>Signed in as {currentUser.username}</MenuItem>,
          <MenuItem key="change-avatar" onClick={() => { setAccountMenuAnchorEl(null); setAvatarEditorOpen(true); }}>Change avatar</MenuItem>,
          <MenuItem key="remove-avatar" onClick={async () => {
            setAccountMenuAnchorEl(null);
            try {
              const { apiFetch } = await import('../../utils/apiFetch');
              // Read existing settings first
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
          }}>Remove avatar</MenuItem>,
          <MenuItem key="logout" onClick={() => { setAccountMenuAnchorEl(null); logout(); }}>Logout</MenuItem>
        ] : [
          <MenuItem key="login" onClick={() => { setAccountMenuAnchorEl(null); navigate('/login'); }}>Login</MenuItem>,
          <MenuItem key="register" onClick={() => { setAccountMenuAnchorEl(null); navigate('/login'); }}>Register</MenuItem>
        ]}
      </Menu>

      {/* Avatar editor dialog */}
      {avatarEditorOpen && (
        <Dialog open={avatarEditorOpen} onClose={() => setAvatarEditorOpen(false)}>
          <DialogContent>
            <Typography variant="subtitle1">Choose an image file to crop. Final avatar must be &lt;= 50KB.</Typography>
            <Box sx={{ mt: 2 }}>
              <input type="file" accept="image/*" onChange={async (e) => {
                const f = e.target.files && e.target.files[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => {
                  setAvatarSrcForEditing(String(reader.result));
                };
                reader.readAsDataURL(f);
              }} />
            </Box>
            {avatarSrcForEditing && (
              <Box sx={{ mt: 2 }}>
                <AvatarEditorComponent imageSrc={avatarSrcForEditing} onCancel={() => { setAvatarEditorOpen(false); setAvatarSrcForEditing(null); }} onSave={async (dataUrl) => {
                  try {
                    // Save to settings
                    const { apiFetch } = await import('../../utils/apiFetch');
                    const existingResp = await apiFetch(`${useDiagramStore.getState().serverUrl}/users/me/settings`, { method: 'GET' });
                    const existingJson = existingResp.ok ? await existingResp.json() : { settings: {} };
                    const mergedSettings = { ...(existingJson.settings || {}), avatarDataUrl: dataUrl };
                    const resp = await apiFetch(`${useDiagramStore.getState().serverUrl}/users/me/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: mergedSettings }) });
                    if (resp.ok) {
                      setAvatarUrl(dataUrl);
                      useDiagramStore.setState({ currentUser: { ...(useDiagramStore.getState().currentUser || {}), avatarUrl: dataUrl } as any });
                      setAvatarEditorOpen(false);
                      setAvatarSrcForEditing(null);
                    } else {
                      console.error('Failed to save avatar settings');
                    }
                  } catch (err) {
                    console.error('Failed to save avatar', err);
                  }
                }} maxBytes={50 * 1024} />
              </Box>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Toolbar>
  );
};

export default MainToolbar;
