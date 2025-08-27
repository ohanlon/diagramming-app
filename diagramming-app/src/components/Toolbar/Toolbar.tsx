import React from 'react';
import { AppBar, Toolbar, Button, IconButton, Tooltip, Menu, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Undo, Redo, ZoomIn, ZoomOut, Square, Circle, Timeline, TextFields, Create } from '@mui/icons-material';
import { useDiagramStore } from '../../store/useDiagramStore';

const googleFonts = [
  { name: 'Open Sans (Default)', value: 'Open Sans' },
  { name: 'Roboto', value: 'Roboto' },
  { name: 'Lato', value: 'Lato' },
  { name: 'Montserrat', value: 'Montserrat' },
  { name: 'Oswald', value: 'Oswald' },
  { name: 'Playfair Display', value: 'Playfair Display' },
  { name: 'Arial', value: 'Arial' },
  { name: 'Verdana', value: 'Verdana' },
];

const ToolbarComponent: React.FC = () => {
  const { undo, redo, setZoom, addShape, activeSheet, selectedFont, setSelectedFont } = useDiagramStore();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAddShape = (type: string) => {
    if (!activeSheet) return;
    const newShape = {
      id: new Date().getTime().toString(),
      type,
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      text: type,
      color: '#f0f0f0',
      layerId: activeSheet.activeLayerId,
      svgContent: '',
      minX: 0,
      minY: 0,
      fontFamily: selectedFont,
    };
    addShape(newShape);
    handleClose();
  };

  const handleFontChange = (event: any) => {
    setSelectedFont(event.target.value as string);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Tooltip title="Undo">
          <IconButton color="inherit" onClick={undo}>
            <Undo />
          </IconButton>
        </Tooltip>
        <Tooltip title="Redo">
          <IconButton color="inherit" onClick={redo}>
            <Redo />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom In">
          <IconButton color="inherit" onClick={() => setZoom(activeSheet.zoom * 1.1)}>
            <ZoomIn />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton color="inherit" onClick={() => setZoom(activeSheet.zoom / 1.1)}>
            <ZoomOut />
          </IconButton>
        </Tooltip>
        <Button
          id="basic-button"
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleMenu}
          color="inherit"
        >
          Shapes
        </Button>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'basic-button',
          }}
        >
          <MenuItem onClick={() => handleAddShape('rectangle')}><Square sx={{ mr: 1 }} /> Rectangle</MenuItem>
          <MenuItem onClick={() => handleAddShape('circle')}><Circle sx={{ mr: 1 }} /> Circle</MenuItem>
          <MenuItem onClick={() => handleAddShape('diamond')}><Timeline sx={{ mr: 1 }} /> Diamond</MenuItem>
          <MenuItem onClick={() => handleAddShape('text')}><TextFields sx={{ mr: 1 }} /> Text</MenuItem>
        </Menu>
        <Tooltip title="Draw Connector">
          <IconButton color="inherit">
            <Create />
          </IconButton>
        </Tooltip>
        <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
          <InputLabel id="font-select-label" sx={{ color: 'white' }}>Font</InputLabel>
          <Select
            labelId="font-select-label"
            id="font-select"
            value={selectedFont}
            label="Font"
            onChange={handleFontChange}
            sx={{ color: 'white', '.MuiSvgIcon-root': { color: 'white' } }}
          >
            {googleFonts.map((font) => (
              <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                {font.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Toolbar>
    </AppBar>
  );
};

export default ToolbarComponent;
