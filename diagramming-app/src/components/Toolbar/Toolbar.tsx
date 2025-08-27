import { AppBar, Toolbar, IconButton, Tooltip, Select, FormControl, InputLabel, MenuItem } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
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

const ToolbarComponent: React.FC = () => {
  const { undo, redo, setZoom, activeSheet, selectedFont = 'Open Sans', setSelectedFont, history } = useDiagramStore();

  const handleFontChange = (event: SelectChangeEvent<string>) => {
    setSelectedFont(event.target.value as string);
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ height: '1em', minHeight: '1em' }}>
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
