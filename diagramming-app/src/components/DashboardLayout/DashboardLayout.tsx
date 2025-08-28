import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Box, CssBaseline, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Drawer } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CategoryIcon from '@mui/icons-material/Category';
import { ChevronLeft } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const drawerWidth = 240;

interface DashboardLayoutProps {
  toolbar: React.ReactNode;
  children: React.ReactNode;
  onShowComponents: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ toolbar, children, onShowComponents }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{
        zIndex: theme.zIndex.drawer + 1,
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{
                marginRight: 5,
              }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
          <Toolbar variant="dense">
            {toolbar}
          </Toolbar>
        </Box>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        open={open}
      >
        <Toolbar /> {/* This is to push content below the AppBar */}
        <Box sx={{ minHeight: '128px' }} /> {/* This is to push content below the AppBar */}
        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
              onClick={onShowComponents}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <CategoryIcon />
              </ListItemIcon>
              <ListItemText primary="Components" sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 0, mt: '128px' }}>
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;