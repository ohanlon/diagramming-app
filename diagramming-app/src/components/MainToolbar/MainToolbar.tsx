import React, { useState } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem } from '@mui/material';
import { useDiagramStore } from '../../store/useDiagramStore';

const MainToolbar: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { resetStore } = useDiagramStore();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNewDocument = () => {
    resetStore();
    handleClose();
  };

  return (
    <Toolbar disableGutters variant="dense" sx={{ borderBottom: '1px solid #e0e0e0', padding: '0 0', marginLeft: 0, boxShadow: 'none', color: 'black' }}>
      <Button
        id="file-button"
        aria-controls={anchorEl ? 'file-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={anchorEl ? 'true' : undefined}
        onClick={handleClick}
        sx={{ color: 'black' }}
      >
        File
      </Button>
      <Menu
        id="file-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'file-button',
        }}
      >
        <MenuItem onClick={handleNewDocument}>New document</MenuItem>
      </Menu>
    </Toolbar>
  );
};

export default MainToolbar;
