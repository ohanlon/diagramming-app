import { AppBar, Toolbar, IconButton, Tooltip, Select, FormControl, InputLabel, MenuItem } from '@mui/material';
import { Undo, Redo, ZoomIn, ZoomOut } from '@mui/icons-material';
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

const fontSizes = [6, 7, 8, 9, 10, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96];

const ToolbarComponent: React.FC = () => {
  const { undo, redo, setZoom, activeSheet, selectedFont = 'Open Sans', setSelectedFont, selectedFontSize = 10, setSelectedFontSize, history } = useDiagramStore();

  const handleFontChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFont(event.target.value as string);
  };

  const handleFontSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFontSize(Number(event.target.value));
  };

  return (
    <AppBar position="static">
      <Toolbar variant="dense">
        <Tooltip title="Undo">
          <IconButton color="inherit" onClick={undo} data-testid="undo-button" disabled={history.past.length === 0}>
            <Undo />
          </IconButton>
        </Tooltip>
        <Tooltip title="Redo">
          <IconButton color="inherit" onClick={redo} data-testid="redo-button" disabled={history.future.length === 0}>
            <Redo />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom In">
          <IconButton color="inherit" onClick={() => setZoom(activeSheet.zoom * 1.1)} data-testid="zoom-in-button">
            <ZoomIn />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton color="inherit" onClick={() => setZoom(activeSheet.zoom / 1.1)} data-testid="zoom-out-button">
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
            inputProps={{ 'data-testid': 'selectFont' }}
          >
            {googleFonts.slice().sort((a, b) => a.name.localeCompare(b.name)).map((font) => (
              <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                {font.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ m: 1, minWidth: 80 }} size="small">
          <InputLabel id="font-size-select-label" sx={{ color: 'white' }}>Size</InputLabel>
          <Select
            labelId="font-size-select-label"
            id="font-size-select"
            value={String(selectedFontSize)}
            label="Size"
            onChange={handleFontSizeChange}
            sx={{ color: 'white', '.MuiSvgIcon-root': { color: 'white' } }}
            inputProps={{ 'data-testid': 'selectFontSize' }}
          >
            {fontSizes.map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Toolbar>
    </AppBar>
  );
};

export default ToolbarComponent;
