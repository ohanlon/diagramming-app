import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { ArrowUpward, ArrowDownward, VerticalAlignTop, VerticalAlignBottom } from '@mui/icons-material';

interface ArrangeMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onMouseMove: (ev: React.MouseEvent) => void;
  onBringToFront: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onSendToBack: () => void;
  disabled: boolean;
}

const ArrangeMenu: React.FC<ArrangeMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onKeyDown,
  onMouseMove,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  disabled,
}) => {
  return (
    <Menu
      id="arrange-menu"
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
      <MenuItem onClick={onBringToFront} disabled={disabled}>
        <ListItemIcon>
          <VerticalAlignTop fontSize="small" />
        </ListItemIcon>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Bring to Front</ListItemText>
      </MenuItem>
      <MenuItem onClick={onBringForward} disabled={disabled}>
        <ListItemIcon>
          <ArrowUpward fontSize="small" />
        </ListItemIcon>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Bring Forward</ListItemText>
      </MenuItem>
      <MenuItem onClick={onSendBackward} disabled={disabled}>
        <ListItemIcon>
          <ArrowDownward fontSize="small" />
        </ListItemIcon>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Send Backward</ListItemText>
      </MenuItem>
      <MenuItem onClick={onSendToBack} disabled={disabled}>
        <ListItemIcon>
          <VerticalAlignBottom fontSize="small" />
        </ListItemIcon>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Send to Back</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default ArrangeMenu;
