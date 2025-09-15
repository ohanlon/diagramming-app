import React, { useState } from 'react';
import { Toolbar, Button, Menu, MenuItem } from '@mui/material';
import { ArrowRight } from '@mui/icons-material';
import { useDiagramStore } from '../../store/useDiagramStore';

const MainToolbar: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [newMenuAnchorEl, setNewMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { resetStore } = useDiagramStore();

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNewMenuAnchorEl(null);
  };

  const handleNewSubMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNewMenuAnchorEl(event.currentTarget);
  };

  const handleNewSubMenuClose = () => {
    setNewMenuAnchorEl(null);
  };

  const handleNewDiagram = () => {
    resetStore();
    handleMenuClose();
  };

  return (
    <Toolbar disableGutters variant="dense" sx={{ borderBottom: '1px solid #e0e0e0', padding: '0 0', marginLeft: 0, boxShadow: 'none', color: 'black' }}>
      <Button onClick={handleMenuOpen} sx={{ color: 'black' }}>
        File
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onMouseOver={handleNewSubMenuOpen}
          sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
        >
          New
          <ArrowRight sx={{ fontSize: '1.2rem', ml: 1 }} />
        </MenuItem>
      </Menu>
      <Menu
        anchorEl={newMenuAnchorEl}
        open={Boolean(newMenuAnchorEl)}
        onClose={handleNewSubMenuClose}
        MenuListProps={{ onMouseLeave: handleNewSubMenuClose }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={handleNewDiagram}>Diagram</MenuItem>
      </Menu>
    </Toolbar>
  );
};

export default MainToolbar;
