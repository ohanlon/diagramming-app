import React, { useState } from 'react';
import { Toolbar, Button, Menu, MenuItem, ListItemText, Typography } from '@mui/material';
import { ArrowRight } from '@mui/icons-material';
import { useDiagramStore } from '../../store/useDiagramStore';

const MainToolbar: React.FC = () => {
  const [fileMenuAnchorEl, setFileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [editMenuAnchorEl, setEditMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [newMenuAnchorEl, setNewMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { resetStore, undo, redo, cutShape, copyShape, pasteShape, activeSheetId, sheets } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];

  const handleFileMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFileMenuAnchorEl(event.currentTarget);
  };

  const handleFileMenuClose = () => {
    setFileMenuAnchorEl(null);
    setNewMenuAnchorEl(null);
  };

  const handleEditMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setEditMenuAnchorEl(event.currentTarget);
  };

  const handleEditMenuClose = () => {
    setEditMenuAnchorEl(null);
  };

  const handleNewSubMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNewMenuAnchorEl(event.currentTarget);
  };

  const handleNewSubMenuClose = () => {
    setNewMenuAnchorEl(null);
  };

  const handleNewDiagram = () => {
    resetStore();
    handleFileMenuClose();
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
    if (activeSheet.selectedShapeIds.length > 0) {
      cutShape(activeSheet.selectedShapeIds);
    }
    handleEditMenuClose();
  };

  const handleCopy = () => {
    if (activeSheet.selectedShapeIds.length > 0) {
      copyShape(activeSheet.selectedShapeIds);
    }
    handleEditMenuClose();
  };

  const handlePaste = () => {
    pasteShape();
    handleEditMenuClose();
  };

  return (
    <Toolbar disableGutters variant="dense" sx={{ borderBottom: '1px solid #e0e0e0', padding: '0 0', marginLeft: 0, boxShadow: 'none', color: 'black' }}>
      <Button onClick={handleFileMenuOpen} sx={{ color: 'black' }}>
        File
      </Button>
      <Menu
        anchorEl={fileMenuAnchorEl}
        open={Boolean(fileMenuAnchorEl)}
        onClose={handleFileMenuClose}
      >
        <MenuItem
          onMouseOver={handleNewSubMenuOpen}
          sx={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <ListItemText>New</ListItemText>
          <ArrowRight sx={{ fontSize: '1.2rem', ml: 1 }} />
        </MenuItem>
      </Menu>
      <Menu
        anchorEl={newMenuAnchorEl}
        open={Boolean(newMenuAnchorEl)}
        onClose={handleNewSubMenuClose}
        MenuListProps={{ onMouseLeave: handleNewSubMenuClose }}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={handleNewDiagram}>Diagram</MenuItem>
      </Menu>

      <Button onClick={handleEditMenuOpen} sx={{ color: 'black' }}>
        Edit
      </Button>
      <Menu
        anchorEl={editMenuAnchorEl}
        open={Boolean(editMenuAnchorEl)}
        onClose={handleEditMenuClose}
      >
        <MenuItem onClick={handleUndo}>
          <ListItemText>Undo</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+Z</Typography>
        </MenuItem>
        <MenuItem onClick={handleRedo}>
          <ListItemText>Redo</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+Y</Typography>
        </MenuItem>
        <MenuItem onClick={handleCut}>
          <ListItemText>Cut</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+X</Typography>
        </MenuItem>
        <MenuItem onClick={handleCopy}>
          <ListItemText>Copy</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+C</Typography>
        </MenuItem>
        <MenuItem onClick={handlePaste}>
          <ListItemText>Paste</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+V</Typography>
        </MenuItem>
      </Menu>
    </Toolbar>
  );
};

export default MainToolbar;
