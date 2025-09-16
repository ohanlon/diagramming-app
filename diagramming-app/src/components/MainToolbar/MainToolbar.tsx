import React, { useState } from 'react';
import { Toolbar, Button, Menu, MenuItem, ListItemText, Typography, ListItemIcon, Divider } from '@mui/material';
import { ArrowRight, ContentCopy, ContentCut, ContentPaste, RedoOutlined, UndoOutlined } from '@mui/icons-material';
import { useDiagramStore } from '../../store/useDiagramStore';

const MainToolbar: React.FC = () => {
  const [fileMenuAnchorEl, setFileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [editMenuAnchorEl, setEditMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectMenuAnchorEl, setSelectMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [newMenuAnchorEl, setNewMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { resetStore, undo, redo, cutShape, copyShape, pasteShape, selectAll, selectShapes, selectConnectors, activeSheetId, sheets, history } = useDiagramStore();
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

  const handleSelectMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectMenuAnchorEl(event.currentTarget);
  };

  const handleSelectMenuClose = () => {
    setSelectMenuAnchorEl(null);
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
        <MenuItem onClick={handleUndo} disabled={history.past.length === 0}>
          <ListItemIcon>
            <UndoOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Undo</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+Z</Typography>
        </MenuItem>
        <MenuItem onClick={handleRedo} disabled={history.future.length === 0}>
          <ListItemIcon>
            <RedoOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Redo</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+Y</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleCut} disabled={activeSheet.selectedShapeIds.length === 0}>
          <ListItemIcon>
            <ContentCut fontSize="small" />
          </ListItemIcon>
          <ListItemText>Cut</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+X</Typography>
        </MenuItem>
        <MenuItem onClick={handleCopy} disabled={activeSheet.selectedShapeIds.length === 0}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+C</Typography>
        </MenuItem>
        <MenuItem onClick={handlePaste} disabled={!activeSheet.clipboard || activeSheet.clipboard.length === 0}>
          <ListItemIcon>
            <ContentPaste fontSize="small" />
          </ListItemIcon>
          <ListItemText>Paste</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+V</Typography>
        </MenuItem>
      </Menu>

      <Button onClick={handleSelectMenuOpen} sx={{ color: 'black' }}>
        Select
      </Button>
      <Menu
        anchorEl={selectMenuAnchorEl}
        open={Boolean(selectMenuAnchorEl)}
        onClose={handleSelectMenuClose}
      >
        <MenuItem onClick={handleSelectAll}>
          <ListItemText>All</ListItemText>
          <Typography variant="body2" color="text.secondary">Ctrl+A</Typography>
        </MenuItem>
        <MenuItem onClick={handleSelectShapes}>
          <ListItemText>Shapes</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleSelectLines}>
          <ListItemText>Lines</ListItemText>
        </MenuItem>
      </Menu>
    </Toolbar>
  );
};

export default MainToolbar;
