import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Print from '../Print/Print';
import { Toolbar, Button, MenuList, MenuItem, Menu, ListItemText, Typography, ListItemIcon, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Box, TextField } from '@mui/material';
import { ContentCopy, ContentCut, ContentPaste, PrintOutlined, RedoOutlined, SaveOutlined, UndoOutlined, Dashboard, History } from '@mui/icons-material';
import { useDiagramStore } from '../../store/useDiagramStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useNavigate } from 'react-router-dom';
import AccountMenu from '../AppBar/AccountMenu';
import { NewMenuItem } from '../AppBar/NewMenu';

const MainToolbar: React.FC = () => {
  const [fileMenuAnchorEl, setFileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [editMenuAnchorEl, setEditMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectMenuAnchorEl, setSelectMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { resetStore, undo, redo, cutShape, copyShape, pasteShape, selectAll, selectShapes, selectConnectors, activeSheetId, sheets, isDirty } = useDiagramStore();
  const { history } = useHistoryStore();
  const activeSheet = sheets[activeSheetId];
  const navigate = useNavigate();
  const diagramName = useDiagramStore(state => state.diagramName) || 'New Diagram';
  const setDiagramName = useDiagramStore(state => state.setDiagramName);
  const [editNameOpen, setEditNameOpen] = React.useState(false);
  const [editingName, setEditingName] = React.useState(diagramName);
  const [pendingNewCreation, setPendingNewCreation] = React.useState(false);

  // If activeSheet is undefined, it means the store state is inconsistent
  if (!activeSheet) {
    console.error('Active sheet not found, resetting store');
    resetStore();
    return <div>Loading...</div>;
  }

  const handleFileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Open File and ensure other menus are closed
    setFileMenuAnchorEl(event.currentTarget as HTMLElement);
    setEditMenuAnchorEl(null);
    setSelectMenuAnchorEl(null);
    clearHoverTimer();
    setMenubarActive(true);
  };

  // When any top-level menu is open, hovering over another top-level menu should open it
  const [menubarActive, setMenubarActive] = useState(false);
  // Refs for top-level menu items so we can open/ focus them programmatically
  const fileRef = useRef<HTMLButtonElement | null>(null);
  const editRef = useRef<HTMLButtonElement | null>(null);
  const selectRef = useRef<HTMLButtonElement | null>(null);
  // Hover-delay timer to avoid accidental menu switches
  const hoverTimerRef = useRef<number | null>(null);
  const HOVER_DELAY_MS = 200;
  const hoverCandidateRef = useRef<'file'|'edit'|'select' | null>(null);

  const handleTopLevelMouseEnter = (event: React.MouseEvent<HTMLElement>, menu: 'file' | 'edit' | 'select') => {
    // Only allow hover-to-open if the menubar has been activated (menu opened)
    if (!menubarActive) return;
    // Debounce switching menus on hover to avoid accidental switches
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    hoverTimerRef.current = window.setTimeout(() => {
      const target = event.currentTarget as HTMLElement;
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
    }, HOVER_DELAY_MS);
  };

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  // Fallback: listen to global mouse movements when menubar is active so
  // overlaying popovers don't prevent us from detecting pointer location
  useEffect(() => {
    if (!menubarActive) return;
    const onMove = (ev: MouseEvent) => {
      try {
        const x = ev.clientX;
        const y = ev.clientY;
        const checkRect = (el: HTMLElement | null) => {
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        };
        let candidate: 'file'|'edit'|'select' | null = null;
        if (checkRect(fileRef.current)) candidate = 'file';
        else if (checkRect(editRef.current)) candidate = 'edit';
        else if (checkRect(selectRef.current)) candidate = 'select';

        if (candidate === hoverCandidateRef.current) return;
        hoverCandidateRef.current = candidate;
        if (hoverTimerRef.current) {
          window.clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
        }
        if (!candidate) return;
        hoverTimerRef.current = window.setTimeout(() => {
          openMenuByName(candidate as 'file'|'edit'|'select');
          hoverTimerRef.current = null;
          hoverCandidateRef.current = null;
        }, HOVER_DELAY_MS);
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      clearHoverTimer();
      hoverCandidateRef.current = null;
    };
  }, [menubarActive]);

  const handleFileMenuClose = () => {
    setFileMenuAnchorEl(null);
    setMenubarActive(false);
    clearHoverTimer();
  };

  const handleEditMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Open Edit and ensure other menus are closed
    clearHoverTimer();
    setEditMenuAnchorEl(event.currentTarget as HTMLElement);
    setFileMenuAnchorEl(null);
    setSelectMenuAnchorEl(null);
    setMenubarActive(true);
  };

  const handleEditMenuClose = () => {
    setEditMenuAnchorEl(null);
    setMenubarActive(false);
    clearHoverTimer();
  };

  const handleSelectMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Open Select and ensure other menus are closed
    clearHoverTimer();
    setSelectMenuAnchorEl(event.currentTarget as HTMLElement);
    setFileMenuAnchorEl(null);
    setEditMenuAnchorEl(null);
    setMenubarActive(true);
  };

  const handleSelectMenuClose = () => {
    setSelectMenuAnchorEl(null);
    setMenubarActive(false);
    clearHoverTimer();
  };

  // Ensure menubarActive reflects whether any menu is open (covers keyboard-open cases)
  useEffect(() => {
    setMenubarActive(Boolean(fileMenuAnchorEl || editMenuAnchorEl || selectMenuAnchorEl));
  }, [fileMenuAnchorEl, editMenuAnchorEl, selectMenuAnchorEl]);

  const openMenuByName = (name: 'file' | 'edit' | 'select') => {
    // Clear any pending hover timers and open the requested menu while
    // ensuring other menus are closed.
    clearHoverTimer();
    if (name === 'file') {
      if (fileRef.current) setFileMenuAnchorEl(fileRef.current);
      setEditMenuAnchorEl(null);
      setSelectMenuAnchorEl(null);
    } else if (name === 'edit') {
      if (editRef.current) setEditMenuAnchorEl(editRef.current);
      setFileMenuAnchorEl(null);
      setSelectMenuAnchorEl(null);
    } else {
      if (selectRef.current) setSelectMenuAnchorEl(selectRef.current);
      setFileMenuAnchorEl(null);
      setEditMenuAnchorEl(null);
    }
    setMenubarActive(true);
  };

  const closeAllMenus = () => {
    setFileMenuAnchorEl(null);
    setEditMenuAnchorEl(null);
    setSelectMenuAnchorEl(null);
    setMenubarActive(false);
    clearHoverTimer();
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent, current: 'file' | 'edit' | 'select') => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const order: ('file'|'edit'|'select')[] = ['file','edit','select'];
      const idx = order.indexOf(current);
      const next = order[(idx + 1) % order.length];
      openMenuByName(next);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const order: ('file'|'edit'|'select')[] = ['file','edit','select'];
      const idx = order.indexOf(current);
      const prev = order[(idx + order.length - 1) % order.length];
      openMenuByName(prev);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeAllMenus();
    }
  };

  // Keep menubarActive in sync with any open anchor so keyboard-open also enables hover switching
  useEffect(() => {
    setMenubarActive(Boolean(fileMenuAnchorEl || editMenuAnchorEl || selectMenuAnchorEl));
  }, [fileMenuAnchorEl, editMenuAnchorEl, selectMenuAnchorEl]);

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
  const isEditable = useDiagramStore(state => state.isEditable !== false);
  const remoteDiagramId = useDiagramStore(state => state.remoteDiagramId);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        handlePrint();
      }
      if ((event.ctrlKey || event.metaKey) && (event.key === 's' || event.key === 'S')) {
        event.preventDefault();
        if (isEditable) saveDiagram();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrint, saveDiagram]);

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
  <Toolbar disableGutters variant="dense" sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}`, padding: '0 0', marginLeft: 0, boxShadow: 'none', color: 'inherit', minHeight: '2em' }}>
      {/* Diagram name display and edit (moved before File menu) */}
  <Button color="inherit" onClick={() => { setEditingName(diagramName); setEditNameOpen(true); }} sx={{ textTransform: 'none', mr: 1 }}>
        <Typography variant="subtitle1" sx={{ maxWidth: '128px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{diagramName}</Typography>
      </Button>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <MenuList role="menubar" aria-label="Main menu" sx={{ display: 'flex', alignItems: 'center' }} onMouseLeave={() => clearHoverTimer()}>
        <MenuItem
          component="button"
          ref={fileRef}
          onClick={handleFileMenuOpen}
          onMouseEnter={(e) => handleTopLevelMouseEnter(e, 'file')}
          onMouseLeave={() => clearHoverTimer()}
          aria-haspopup="true"
          aria-controls={fileMenuAnchorEl ? 'file-menu' : undefined}
          aria-expanded={Boolean(fileMenuAnchorEl)}
          sx={{ color: 'inherit', ml: 1 }}
        >
          File
        </MenuItem>
        <MenuItem
          component="button"
          ref={editRef}
          onClick={handleEditMenuOpen}
          onMouseEnter={(e) => handleTopLevelMouseEnter(e, 'edit')}
          onMouseLeave={() => clearHoverTimer()}
          aria-haspopup="true"
          aria-controls={editMenuAnchorEl ? 'edit-menu' : undefined}
          aria-expanded={Boolean(editMenuAnchorEl)}
          sx={{ color: 'inherit' }}
        >
          Edit
        </MenuItem>
        <MenuItem
          component="button"
          ref={selectRef}
          onClick={handleSelectMenuOpen}
          onMouseEnter={(e) => handleTopLevelMouseEnter(e, 'select')}
          onMouseLeave={() => clearHoverTimer()}
          aria-haspopup="true"
          aria-controls={selectMenuAnchorEl ? 'select-menu' : undefined}
          aria-expanded={Boolean(selectMenuAnchorEl)}
          sx={{ color: 'inherit' }}
        >
          Select
        </MenuItem>
      </MenuList>

      {/* File menu */}
      <Menu
        id="file-menu"
        elevation={0}
        anchorEl={fileMenuAnchorEl}
        open={Boolean(fileMenuAnchorEl)}
        onClose={handleFileMenuClose}
        onKeyDown={(e) => handleMenuKeyDown(e as React.KeyboardEvent, 'file')}
        PaperProps={{
          style: { border: '1px solid #a0a0a0' },
          onMouseMove: (ev: React.MouseEvent) => {
            // If user moves pointer over the opened popover, interpret their
            // horizontal position relative to the menubar and switch menus
            if (!menubarActive) return;
            try {
              const x = ev.clientX;
              const y = ev.clientY;
              const checkRect = (el: HTMLElement | null) => {
                if (!el) return false;
                const r = el.getBoundingClientRect();
                return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
              };
              let candidate: 'file'|'edit'|'select' | null = null;
              if (checkRect(fileRef.current)) candidate = 'file';
              else if (checkRect(editRef.current)) candidate = 'edit';
              else if (checkRect(selectRef.current)) candidate = 'select';
              if (!candidate) return;
              if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
              hoverTimerRef.current = window.setTimeout(() => { openMenuByName(candidate as 'file'|'edit'|'select'); hoverTimerRef.current = null; }, HOVER_DELAY_MS);
            } catch (e) {}
          }
        }}
      >
        <NewMenuItem onNew={handleNewDiagram} />
        <Divider />
        <MenuItem onClick={() => { if (isEditable) saveDiagram(); handleFileMenuClose(); }} disabled={!isEditable}>
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
        <Divider />
        <MenuItem onClick={() => { handleFileMenuClose(); navigate('/dashboard'); }}>
          <ListItemIcon>
            <Dashboard fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Dashboard</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleFileMenuClose(); if (remoteDiagramId) navigate(`/diagram/${remoteDiagramId}/history`); }} disabled={!isEditable || !remoteDiagramId}>
          <ListItemIcon>
            <History fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>History</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit menu */}
      <Menu
        id="edit-menu"
        elevation={0}
        anchorEl={editMenuAnchorEl}
        open={Boolean(editMenuAnchorEl)}
        onClose={handleEditMenuClose}
        onKeyDown={(e) => handleMenuKeyDown(e as React.KeyboardEvent, 'edit')}
        PaperProps={{
          style: { border: '1px solid #a0a0a0' },
          onMouseMove: (ev: React.MouseEvent) => {
            if (!menubarActive) return;
            try {
              const x = ev.clientX;
              const y = ev.clientY;
              const checkRect = (el: HTMLElement | null) => {
                if (!el) return false;
                const r = el.getBoundingClientRect();
                return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
              };
              let candidate: 'file'|'edit'|'select' | null = null;
              if (checkRect(fileRef.current)) candidate = 'file';
              else if (checkRect(editRef.current)) candidate = 'edit';
              else if (checkRect(selectRef.current)) candidate = 'select';
              if (!candidate) return;
              if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
              hoverTimerRef.current = window.setTimeout(() => { openMenuByName(candidate as 'file'|'edit'|'select'); hoverTimerRef.current = null; }, HOVER_DELAY_MS);
            } catch (e) {}
          }
        }}
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

      {/* Select menu */}
      <Menu
        id="select-menu"
        elevation={0}
        anchorEl={selectMenuAnchorEl}
        open={Boolean(selectMenuAnchorEl)}
        onClose={handleSelectMenuClose}
        onKeyDown={(e) => handleMenuKeyDown(e as React.KeyboardEvent, 'select')}
        PaperProps={{
          style: { border: '1px solid #a0a0a0' },
          onMouseMove: (ev: React.MouseEvent) => {
            if (!menubarActive) return;
            try {
              const x = ev.clientX;
              const y = ev.clientY;
              const checkRect = (el: HTMLElement | null) => {
                if (!el) return false;
                const r = el.getBoundingClientRect();
                return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
              };
              let candidate: 'file'|'edit'|'select' | null = null;
              if (checkRect(fileRef.current)) candidate = 'file';
              else if (checkRect(editRef.current)) candidate = 'edit';
              else if (checkRect(selectRef.current)) candidate = 'select';
              if (!candidate) return;
              if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
              hoverTimerRef.current = window.setTimeout(() => { openMenuByName(candidate as 'file'|'edit'|'select'); hoverTimerRef.current = null; }, HOVER_DELAY_MS);
            } catch (e) {}
          }
        }}
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
      <Dialog open={editNameOpen} onClose={() => { setEditNameOpen(false); setPendingNewCreation(false); }} PaperProps={{ sx: { minWidth: '256px' } }}>
        <DialogTitle>Edit Diagram Name</DialogTitle>
        <DialogContent>
          <TextField
            label="Diagram name"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            autoFocus
            sx={{ maxWidth: '256px' }}
            InputProps={{ sx: { input: { textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' } } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditNameOpen(false); setPendingNewCreation(false); }}>Cancel</Button>
          <Button onClick={() => {
            const finalName = editingName && editingName.trim() ? editingName.trim() : 'New Diagram';
            if (pendingNewCreation) {
              // Creating a brand new diagram with the provided name and persist it so a remote id exists
              (async () => {
                try {
                  const createAndSave = (useDiagramStore as any).getState().createAndSaveNewDiagram as (name?: string) => Promise<string | null>;
                  await createAndSave(finalName);
                } catch (e) {
                  console.error('Failed to create and save new diagram from toolbar', e);
                }
              })();
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
      <AccountMenu />
    </Toolbar>
  );
};

export default MainToolbar;
