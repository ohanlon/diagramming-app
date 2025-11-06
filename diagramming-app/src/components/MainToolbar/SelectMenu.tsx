import React from 'react';
import { Menu, MenuItem, ListItemText, Typography } from '@mui/material';

interface SelectMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onMouseMove: (ev: React.MouseEvent) => void;
  onSelectAll: () => void;
  onSelectShapes: () => void;
  onSelectLines: () => void;
}

const SelectMenu: React.FC<SelectMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onKeyDown,
  onMouseMove,
  onSelectAll,
  onSelectShapes,
  onSelectLines,
}) => {
  return (
    <Menu
      id="select-menu"
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
      <MenuItem onClick={onSelectAll}>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>All</ListItemText>
        <Typography variant="body2" color="text.secondary">Ctrl+A</Typography>
      </MenuItem>
      <MenuItem onClick={onSelectShapes}>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Shapes</ListItemText>
      </MenuItem>
      <MenuItem onClick={onSelectLines}>
        <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>Lines</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default SelectMenu;
