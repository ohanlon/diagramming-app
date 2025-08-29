import { AppBar, Toolbar, IconButton, Tooltip, FormControl, MenuItem, type SelectChangeEvent, Divider, Menu, Box } from '@mui/material';
import Select from '@mui/material/Select';
import { Undo, Redo, ContentCut, ContentCopy, ContentPaste, FormatBold, FormatItalic, FormatUnderlined, NoteAdd, VerticalAlignBottom, VerticalAlignCenter, VerticalAlignTop, AlignHorizontalLeft, AlignHorizontalCenter, AlignHorizontalRight, FormatColorTextOutlined } from '@mui/icons-material';
import { useDiagramStore } from '../../store/useDiagramStore';
import React from 'react';

const googleFonts = [
  { name: 'Open Sans', value: 'Open Sans' },
  { name: 'Roboto', value: 'Roboto' },
  { name: 'Lato', value: 'Lato' },
  { name: 'Montserrat', value: 'Montserrat' },
  { name: 'Oswald', value: 'Oswald' },
  { name: 'Playfair Display', value: 'Playfair Display' },
  { name: 'Arial', value: 'Arial' },
  { name: 'Verdana', value: 'Verdana' },
  { name: 'Alex Brush', value: 'Alex Brush' },
  { name: 'Pacifico', value: 'Pacifico' },
  { name: 'Indie Flower', value: 'Indie Flower' },
  { name: 'Dancing Script', value: 'Dancing Script' },
  { name: 'Great Vibes', value: 'Great Vibes' },
  { name: 'Caveat', value: 'Caveat' },
  { name: 'Satisfy', value: 'Satisfy' },
  { name: 'Cookie', value: 'Cookie' },
  { name: 'Lobster', value: 'Lobster' },
  { name: 'Kaushan Script', value: 'Kaushan Script' },
  { name: 'Allura', value: 'Allura' },
  { name: 'Sacramento', value: 'Sacramento' },
  { name: 'Yellowtail', value: 'Yellowtail' },
  { name: 'Abhaya Libre', value: 'Abhaya Libre' },
  { name: 'Merriweather', value: 'Merriweather' },
  { name: 'Crimson Text', value: 'Crimson Text' },
  { name: 'Aboreto', value: 'Aboreto' },
  { name: 'Alegreya', value: 'Alegreya' },
  { name: 'Bitter', value: 'Bitter' },
  { name: 'Cardo', value: 'Cardo' },
  { name: 'Cormorant Garamond', value: 'Cormorant Garamond' },
];

const fontSizes = [6, 7, 8, 9, 10, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96];

import ColorPicker from '../ColorPicker/ColorPicker';

const ToolbarComponent: React.FC = () => {
  const { undo, redo, setSelectedFont, setSelectedFontSize, history, cutShape, copyShape, pasteShape, sheets, activeSheetId, toggleBold, toggleItalic, toggleUnderlined, resetStore, setVerticalAlign, setHorizontalAlign, setSelectedTextColor } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorSelect = (color: string) => {
    setSelectedTextColor(color);
    handleClose();
  };

  const selectedShapes = activeSheet.selectedShapeIds.map(id => activeSheet.shapesById[id]).filter(Boolean);
  const hasSelectedShapes = selectedShapes.length > 0;

  const isBoldActive = hasSelectedShapes && selectedShapes.some(shape => shape.isBold);
  const isItalicActive = hasSelectedShapes && selectedShapes.some(shape => shape.isItalic);
  const isUnderlinedActive = hasSelectedShapes && selectedShapes.some(shape => shape.isUnderlined);

  const isVerticalAlignTopActive = hasSelectedShapes && selectedShapes.every(shape => shape.verticalAlign === 'top');
  const isVerticalAlignCenterActive = hasSelectedShapes && selectedShapes.every(shape => shape.verticalAlign === 'middle');
  const isVerticalAlignBottomActive = hasSelectedShapes && selectedShapes.every(shape => shape.verticalAlign === 'bottom');

  const isHorizontalAlignLeftActive = hasSelectedShapes && selectedShapes.every(shape => shape.horizontalAlign === 'left');
  const isHorizontalAlignCenterActive = hasSelectedShapes && selectedShapes.every(shape => shape.horizontalAlign === 'center');
  const isHorizontalAlignRightActive = hasSelectedShapes && selectedShapes.every(shape => shape.horizontalAlign === 'right');

  const handleFontChange = (event: SelectChangeEvent<string>) => {
    setSelectedFont(event.target.value as string);
  };

  const handleFontSizeChange = (event: SelectChangeEvent<string>) => {
    setSelectedFontSize(Number(event.target.value));
  };



  return (
    <AppBar position="static" sx={{ borderBottom: '1px solid #e0e0e0' }}>
      <Toolbar variant="dense" sx={{ paddingLeft: 0, marginLeft: 0 }}>
        <Tooltip title="New Diagram">
          <IconButton color="inherit" onClick={resetStore} data-testid="new-diagram-button" sx={{ borderRadius: 0 }}>
            <NoteAdd />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Tooltip title="Undo">
          <span>
            <IconButton color="inherit" onClick={undo} data-testid="undo-button" disabled={history.past.length === 0} sx={{ borderRadius: 0 }}>
              <Undo />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Redo">
          <span>
            <IconButton color="inherit" onClick={redo} data-testid="redo-button" disabled={history.future.length === 0} sx={{ borderRadius: 0 }}>
              <Redo />
            </IconButton>
          </span>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Tooltip title="Cut">
          <span>
            <IconButton color="inherit" onClick={() => cutShape(activeSheet.selectedShapeIds)} data-testid="cut-button" disabled={activeSheet.selectedShapeIds.length === 0} sx={{ borderRadius: 0 }}>
              <ContentCut />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Copy">
          <span>
            <IconButton color="inherit" onClick={() => copyShape(activeSheet.selectedShapeIds)} data-testid="copy-button" disabled={activeSheet.selectedShapeIds.length === 0} sx={{ borderRadius: 0 }}>
              <ContentCopy />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Paste">
          <span>
            <IconButton color="inherit" onClick={() => pasteShape()} data-testid="paste-button" disabled={!activeSheet.clipboard || activeSheet.clipboard.length === 0} sx={{ borderRadius: 0 }}>
              <ContentPaste />
            </IconButton>
          </span>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <FormControl sx={{ m: 1, minWidth: 40 }} size="small">
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
        <FormControl sx={{ m: 1, minWidth: 40 }} size="small">
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
        <Tooltip title="Bold">
          <span>
            <IconButton sx={{ bgcolor: isBoldActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={toggleBold} data-testid="bold-button" disabled={!hasSelectedShapes}>
              <FormatBold />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Italic">
          <span>
            <IconButton sx={{ bgcolor: isItalicActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={toggleItalic} data-testid="italic-button" disabled={!hasSelectedShapes}>
              <FormatItalic />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Underline">
          <span>
            <IconButton sx={{ bgcolor: isUnderlinedActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={toggleUnderlined} data-testid="underline-button" disabled={!hasSelectedShapes}>
              <FormatUnderlined />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Text Color">
          <IconButton
            onClick={handleClick}
            sx={{ color: 'inherit', borderRadius: 0 }}
          >
            <FormatColorTextOutlined />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <ColorPicker selectedColor={activeSheet.selectedTextColor} onColorSelect={handleColorSelect} />
        </Menu>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Tooltip title="Align Top">
          <span>
            <IconButton sx={{ bgcolor: isVerticalAlignTopActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={() => setVerticalAlign('top')} data-testid="align-top-button" disabled={!hasSelectedShapes}>
              <VerticalAlignTop />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Align Middle">
          <span>
            <IconButton sx={{ bgcolor: isVerticalAlignCenterActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={() => setVerticalAlign('middle')} data-testid="align-middle-button" disabled={!hasSelectedShapes}>
              <VerticalAlignCenter />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Align Bottom">
          <span>
            <IconButton sx={{ bgcolor: isVerticalAlignBottomActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={() => setVerticalAlign('bottom')} data-testid="align-bottom-button" disabled={!hasSelectedShapes}>
              <VerticalAlignBottom />
            </IconButton>
          </span>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Tooltip title="Align Left">
          <span>
            <IconButton sx={{ bgcolor: isHorizontalAlignLeftActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={() => setHorizontalAlign('left')} data-testid="align-left-button" disabled={!hasSelectedShapes}>
              <AlignHorizontalLeft />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Align Center">
          <span>
            <IconButton sx={{ bgcolor: isHorizontalAlignCenterActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={() => setHorizontalAlign('center')} data-testid="align-center-button" disabled={!hasSelectedShapes}>
              <AlignHorizontalCenter />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Align Right">
          <span>
            <IconButton sx={{ bgcolor: isHorizontalAlignRightActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={() => setHorizontalAlign('right')} data-testid="align-right-button" disabled={!hasSelectedShapes}>
              <AlignHorizontalRight />
            </IconButton>
          </span>
        </Tooltip>

      </Toolbar>
    </AppBar>
  );
};

export default ToolbarComponent;