import { AppBar, Toolbar, IconButton, Tooltip, FormControl, MenuItem, type SelectChangeEvent } from '@mui/material';
import Select from '@mui/material/Select';
import { Undo, Redo, ContentCut, ContentCopy, ContentPaste } from '@mui/icons-material';
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
  const { undo, redo, setSelectedFont, setSelectedFontSize, history, cutShape, copyShape, pasteShape, sheets, activeSheetId } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];

  const handleFontChange = (event: SelectChangeEvent<string>) => {
    setSelectedFont(event.target.value as string);
  };

  const handleFontSizeChange = (event: SelectChangeEvent<string>) => {
    setSelectedFontSize(Number(event.target.value));
  };

  return (
    <AppBar position="static">
      <Toolbar variant="dense">
        <Tooltip title="Undo">
          <span style={{ display: "contents" }}>
            <IconButton color="inherit" onClick={undo} data-testid="undo-button" disabled={history.past.length === 0}>
              <Undo />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Redo">
          <span style={{ display: "contents" }}>
            <IconButton color="inherit" onClick={redo} data-testid="redo-button" disabled={history.future.length === 0}>
              <Redo />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Cut">
          <span style={{ display: "contents" }}>
            <IconButton color="inherit" onClick={() => cutShape(activeSheet.selectedShapeIds)} data-testid="cut-button" disabled={activeSheet.selectedShapeIds.length === 0}>
              <ContentCut />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Copy">
          <span style={{ display: "contents" }}>
            <IconButton color="inherit" onClick={() => copyShape(activeSheet.selectedShapeIds)} data-testid="copy-button" disabled={activeSheet.selectedShapeIds.length === 0}>
              <ContentCopy />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Paste">
          <span style={{ display: "contents" }}>
            <IconButton color="inherit" onClick={() => pasteShape()} data-testid="paste-button" disabled={!activeSheet.clipboard || activeSheet.clipboard.length === 0}>
              <ContentPaste />
            </IconButton>
          </span>
        </Tooltip>
        <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
          <Select
            labelId="font-select-label"
            id="font-select"
            value={activeSheet.selectedFont || ''}
            displayEmpty
            onChange={handleFontChange}
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
          <Select
            labelId="font-size-select-label"
            id="font-size-select"
            value={String(activeSheet.selectedFontSize)}
            displayEmpty
            onChange={handleFontSizeChange}
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
