import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import { ContentCopy, ContentCut, ContentPaste, RedoOutlined, UndoOutlined } from '@mui/icons-material';

interface EditMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onMouseMove: (ev: React.MouseEvent) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onFind: () => void;
  onReplace: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canCut: boolean;
  canCopy: boolean;
  canPaste: boolean;
}

const EditMenu: React.FC<EditMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onKeyDown,
  onMouseMove,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onFind,
  onReplace,
  canUndo,
  canRedo,
  canCut,
  canCopy,
  canPaste,
}) => {
  return (
    <Menu
      id="edit-menu"
      elevation={0}
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      onKeyDown={onKeyDown}
      PaperProps={{
        style: { border: '1px solid #a0a0a0' },
        onMouseMove,
      }}
    >
      <MenuItem onClick={onUndo} disabled={!canUndo}>
        <ListItemIcon>
          <UndoOutlined fontSize="small" />
        </ListItemIcon>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Undo</ListItemText>
        <Typography variant="body2" color="text.secondary">Ctrl+Z</Typography>
      </MenuItem>
      <MenuItem onClick={onRedo} disabled={!canRedo}>
        <ListItemIcon>
          <RedoOutlined fontSize="small" />
        </ListItemIcon>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Redo</ListItemText>
        <Typography variant="body2" color="text.secondary">Ctrl+Y</Typography>
      </MenuItem>
      <Divider />
      <MenuItem onClick={onCut} disabled={!canCut}>
        <ListItemIcon>
          <ContentCut fontSize="small" />
        </ListItemIcon>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Cut</ListItemText>
        <Typography variant="body2" color="text.secondary">Ctrl+X</Typography>
      </MenuItem>
      <MenuItem onClick={onCopy} disabled={!canCopy}>
        <ListItemIcon>
          <ContentCopy fontSize="small" />
        </ListItemIcon>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Copy</ListItemText>
        <Typography variant="body2" color="text.secondary">Ctrl+C</Typography>
      </MenuItem>
      <MenuItem onClick={onPaste} disabled={!canPaste}>
        <ListItemIcon>
          <ContentPaste fontSize="small" />
        </ListItemIcon>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Paste</ListItemText>
        <Typography variant="body2" color="text.secondary">Ctrl+V</Typography>
      </MenuItem>
      <Divider />
      <MenuItem onClick={onFind}>
        <ListItemIcon></ListItemIcon>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Find...</ListItemText>
        <Typography variant="body2" color="text.secondary">Ctrl+F</Typography>
      </MenuItem>
      <MenuItem onClick={onReplace}>
        <ListItemIcon></ListItemIcon>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Replace...</ListItemText>
        <Typography variant="body2" color="text.secondary">Ctrl+R</Typography>
      </MenuItem>
    </Menu>
  );
};

export default EditMenu;
