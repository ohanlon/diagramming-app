import React, { useState } from 'react';
import { Menu, MenuItem, ListItemText, ListItemIcon } from '@mui/material';
import { ArrowUpward, ArrowDownward, VerticalAlignTop, VerticalAlignBottom, ChevronRight, Layers } from '@mui/icons-material';

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
  const [arrangeMenuAnchor, setArrangeMenuAnchor] = useState<null | HTMLElement>(null);

  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  const handleArrangeClick = (event: React.MouseEvent<HTMLElement>) => {
    setArrangeMenuAnchor(event.currentTarget);
  };

  const handleArrangeClose = () => {
    setArrangeMenuAnchor(null);
  };

  const handleArrangeItemClick = (action: () => void) => {
    action();
    handleArrangeClose();
    onClose();
  };

  return (
    <>
      <Menu
        open={true}
        onClose={onClose}
        anchorReference="anchorPosition"
        anchorPosition={{ top: y, left: x }}
      >
        <MenuItem onClick={handleArrangeClick}>
          <ListItemIcon>
            <Layers fontSize="small" />
          </ListItemIcon>
          <ListItemText>Arrange</ListItemText>
          <ChevronRight fontSize="small" />
        </MenuItem>
      </Menu>

      <Menu
        open={Boolean(arrangeMenuAnchor)}
        anchorEl={arrangeMenuAnchor}
        onClose={handleArrangeClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={() => handleArrangeItemClick(onBringToFront)}>
          <ListItemIcon>
            <VerticalAlignTop fontSize="small" />
          </ListItemIcon>
          <ListItemText>Bring to Front</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleArrangeItemClick(onBringForward)}>
          <ListItemIcon>
            <ArrowUpward fontSize="small" />
          </ListItemIcon>
          <ListItemText>Bring Forward</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleArrangeItemClick(onSendBackward)}>
          <ListItemIcon>
            <ArrowDownward fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send Backward</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleArrangeItemClick(onSendToBack)}>
          <ListItemIcon>
            <VerticalAlignBottom fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send to Back</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ContextMenu;
