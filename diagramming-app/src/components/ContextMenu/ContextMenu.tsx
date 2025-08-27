import React from 'react';
import { Menu, MenuItem, ListItemText, ListItemIcon } from '@mui/material';
import { ArrowUpward, ArrowDownward, VerticalAlignTop, VerticalAlignBottom } from '@mui/icons-material';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = (
  { x, y, onClose, onBringForward, onSendBackward, onBringToFront, onSendToBack },
) => {
  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <Menu
      open={true}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: y, left: x }}
    >
      <MenuItem onClick={() => handleItemClick(onBringForward)}>
        <ListItemIcon>
          <ArrowUpward fontSize="small" />
        </ListItemIcon>
        <ListItemText>Bring Forward</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => handleItemClick(onSendBackward)}>
        <ListItemIcon>
          <ArrowDownward fontSize="small" />
        </ListItemIcon>
        <ListItemText>Send Backward</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => handleItemClick(onBringToFront)}>
        <ListItemIcon>
          <VerticalAlignTop fontSize="small" />
        </ListItemIcon>
        <ListItemText>Bring to Front</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => handleItemClick(onSendToBack)}>
        <ListItemIcon>
          <VerticalAlignBottom fontSize="small" />
        </ListItemIcon>
        <ListItemText>Send to Back</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default ContextMenu;
