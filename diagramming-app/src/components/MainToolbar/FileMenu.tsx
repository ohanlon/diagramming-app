import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import { SaveOutlined, PrintOutlined, Dashboard } from '@mui/icons-material';
import { NewMenuItem } from '../AppBar/NewMenu';

interface FileMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onMouseMove: (ev: React.MouseEvent) => void;
  onNewDiagram: () => void;
  onSave: () => void;
  onPrint: () => void;
  onDashboard: () => void;
  onExportMenuClose: () => void;
  isEditable: boolean;
}

const FileMenu: React.FC<FileMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onKeyDown,
  onMouseMove,
  onNewDiagram,
  onSave,
  onPrint,
  onDashboard,
  onExportMenuClose,
  isEditable,
}) => {
  return (
    <Menu
      id="file-menu"
      elevation={0}
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      onKeyDown={onKeyDown}
      PaperProps={{
        style: { border: '1px solid #a0a0a0' },
        onMouseDown: (_ev: React.MouseEvent) => {
          try {
            // Always close any open Export submenu on mousedown inside the File menu
            onExportMenuClose();
          } catch (e) {
            // ignore
          }
        },
        onMouseMove,
      }}
    >
      <NewMenuItem onNew={() => { onExportMenuClose(); onNewDiagram(); }} />
      <Divider />
      <MenuItem onClick={() => { onExportMenuClose(); if (isEditable) onSave(); onClose(); }} disabled={!isEditable}>
        <ListItemIcon>
          <SaveOutlined fontSize="small" />
        </ListItemIcon>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Save</ListItemText>
        <Typography variant="body2" color="text.secondary">Ctrl+S</Typography>
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => { onExportMenuClose(); onPrint(); }}>
        <ListItemIcon>
          <PrintOutlined fontSize="small" />
        </ListItemIcon>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Print</ListItemText>
        <Typography variant="body2" color="text.secondary">Ctrl+P</Typography>
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => { onExportMenuClose(); onClose(); onDashboard(); }}>
        <ListItemIcon>
          <Dashboard fontSize="small" />
        </ListItemIcon>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Dashboard</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default FileMenu;
