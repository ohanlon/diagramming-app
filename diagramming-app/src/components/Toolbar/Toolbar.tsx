import { AppBar, Toolbar, IconButton, Tooltip, FormControl, MenuItem, type SelectChangeEvent, Divider } from '@mui/material';
import Select from '@mui/material/Select';
import { Undo, Redo, ContentCut, ContentCopy, ContentPaste, FormatBold, FormatItalic, FormatUnderlined, NoteAdd, FormatAlignJustify } from '@mui/icons-material';
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
  const { undo, redo, setSelectedFont, setSelectedFontSize, history, cutShape, copyShape, pasteShape, sheets, activeSheetId, toggleBold, toggleItalic, toggleUnderlined, resetStore, setTextAlign } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];

  const selectedShapes = activeSheet.selectedShapeIds.map(id => activeSheet.shapesById[id]).filter(Boolean);
  const hasSelectedShapes = selectedShapes.length > 0;

  const isBoldActive = hasSelectedShapes && selectedShapes.some(shape => shape.isBold);
  const isItalicActive = hasSelectedShapes && selectedShapes.some(shape => shape.isItalic);
  const isUnderlinedActive = hasSelectedShapes && selectedShapes.some(shape => shape.isUnderlined);

  const alignmentOptions = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'middle-left', label: 'Middle Left' },
    { value: 'middle-center', label: 'Middle Center' },
    { value: 'middle-right', label: 'Middle Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-right', label: 'Bottom Right' },
  ];

  const handleFontChange = (event: SelectChangeEvent<string>) => {
    setSelectedFont(event.target.value as string);
  };

  const handleFontSizeChange = (event: SelectChangeEvent<string>) => {
    setSelectedFontSize(Number(event.target.value));
  };

  const handleTextAlignChange = (event: SelectChangeEvent<string>) => {
    setTextAlign(event.target.value as string);
  };

  const currentTextAlign = hasSelectedShapes
    ? (selectedShapes.every(shape => shape.textAlign === selectedShapes[0].textAlign)
      ? selectedShapes[0].textAlign
      : '')
    : '';

  return (
    <AppBar position="static" sx={{ borderBottom: '1px solid #e0e0e0' }}>
      <Toolbar variant="dense">
        <Tooltip title="New Diagram">
          <IconButton color="inherit" onClick={resetStore} data-testid="new-diagram-button">
            <NoteAdd />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
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
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Tooltip title="Cut">
          <IconButton color="inherit" onClick={() => cutShape(activeSheet.selectedShapeIds)} data-testid="cut-button" disabled={activeSheet.selectedShapeIds.length === 0}>
            <ContentCut />
          </IconButton>
        </Tooltip>
        <Tooltip title="Copy">
          <IconButton color="inherit" onClick={() => copyShape(activeSheet.selectedShapeIds)} data-testid="copy-button" disabled={activeSheet.selectedShapeIds.length === 0}>
            <ContentCopy />
          </IconButton>
        </Tooltip>
        <Tooltip title="Paste">
          <IconButton color="inherit" onClick={() => pasteShape()} data-testid="paste-button" disabled={!activeSheet.clipboard || activeSheet.clipboard.length === 0}>
            <ContentPaste />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Tooltip title="Bold">
          <IconButton sx={{ bgcolor: isBoldActive ? '#A0A0A0' : 'transparent', color: 'inherit' }} onClick={toggleBold} data-testid="bold-button" disabled={!hasSelectedShapes}>
            <FormatBold />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic">
          <IconButton sx={{ bgcolor: isItalicActive ? '#A0A0A0' : 'transparent', color: 'inherit' }} onClick={toggleItalic} data-testid="italic-button" disabled={!hasSelectedShapes}>
            <FormatItalic />
          </IconButton>
        </Tooltip>
        <Tooltip title="Underline">
          <IconButton sx={{ bgcolor: isUnderlinedActive ? '#A0A0A0' : 'transparent', color: 'inherit' }} onClick={toggleUnderlined} data-testid="underline-button" disabled={!hasSelectedShapes}>
            <FormatUnderlined />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <FormControl sx={{ m: 1, minWidth: 80 }} size="small">
          <Select
            labelId="font-select-label"
            id="font-select"
            value={activeSheet.selectedFont || googleFonts[0].value}
            displayEmpty
            autoWidth
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
        <FormControl sx={{ m: 1, minWidth: 60 }} size="small">
          <Select
            labelId="font-size-select-label"
            id="font-size-select"
            value={String(activeSheet.selectedFontSize || 10)}
            displayEmpty
            autoWidth
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
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <FormControl sx={{ m: 1, minWidth: 120 }} size="small" disabled={!hasSelectedShapes}>
          <Select
            labelId="text-align-select-label"
            id="text-align-select"
            value={currentTextAlign}
            displayEmpty
            autoWidth
            onChange={handleTextAlignChange}
            inputProps={{ 'data-testid': 'selectTextAlign' }}
          >
            {alignmentOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Toolbar>
    </AppBar>
  );
};

export default ToolbarComponent;
