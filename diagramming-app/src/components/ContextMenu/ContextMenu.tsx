import React, { useState } from 'react';
import { Menu, MenuItem, ListItemText, ListItemIcon, Divider } from '@mui/material';
import { ArrowUpward, ArrowDownward, VerticalAlignTop, VerticalAlignBottom, ChevronRight, Layers, ContentCut, ContentCopy, ContentPaste, Undo, Redo, Edit, GroupRemove } from '@mui/icons-material';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onEditDescription?: () => void;
  onUngroup?: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onCut,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onEditDescription,
  onUngroup,
}) => {
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
        {onCut && (
          <MenuItem onClick={() => handleItemClick(onCut)}>
            <ListItemIcon>
              <ContentCut fontSize="small" />
            </ListItemIcon>
            <ListItemText>Cut</ListItemText>
          </MenuItem>
        )}
        {onCopy && (
          <MenuItem onClick={() => handleItemClick(onCopy)}>
            <ListItemIcon>
              <ContentCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy</ListItemText>
          </MenuItem>
        )}
        {onPaste && (
          <MenuItem onClick={() => handleItemClick(onPaste)}>
            <ListItemIcon>
              <ContentPaste fontSize="small" />
            </ListItemIcon>
            <ListItemText>Paste</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => handleItemClick(onUndo)}>
          <ListItemIcon>
            <Undo fontSize="small" />
          </ListItemIcon>
          <ListItemText>Undo</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleItemClick(onRedo)}>
          <ListItemIcon>
            <Redo fontSize="small" />
          </ListItemIcon>
          <ListItemText>Redo</ListItemText>
        </MenuItem>
        <Divider />
        {onEditDescription && (
          <MenuItem onClick={() => handleItemClick(onEditDescription)}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Description</ListItemText>
          </MenuItem>
        )}
        {onUngroup && (
          <MenuItem onClick={() => handleItemClick(onUngroup)}>
            <ListItemIcon>
              <GroupRemove fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ungroup</ListItemText>
          </MenuItem>
        )}
        {(onEditDescription || onUngroup) && <Divider />}
        {onBringForward && onSendBackward && onBringToFront && onSendToBack && (
          <MenuItem onClick={handleArrangeClick}>
            <ListItemIcon>
              <Layers fontSize="small" />
            </ListItemIcon>
            <ListItemText>Arrange</ListItemText>
            <ChevronRight fontSize="small" />
          </MenuItem>
        )}
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
