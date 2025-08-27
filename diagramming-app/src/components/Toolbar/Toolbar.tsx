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
  const { undo, redo, setZoom, addShape, activeSheet, selectedFont = 'Open Sans', setSelectedFont } = useDiagramStore();
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
      <Toolbar sx={{ height: '1em', minHeight: '1em' }}>
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
