import { AppBar, Toolbar, IconButton, Tooltip, FormControl, MenuItem, type SelectChangeEvent, Divider, Menu } from '@mui/material';
import Select from '@mui/material/Select';
import { Undo, Redo, ContentCut, ContentCopy, ContentPaste, FormatBold, FormatItalic, FormatUnderlined, NoteAdd, VerticalAlignBottom, VerticalAlignCenter, VerticalAlignTop, AlignHorizontalLeft, AlignHorizontalCenter, AlignHorizontalRight, FormatColorTextOutlined, MoreHoriz as MoreHorizIcon, GroupAdd } from '@mui/icons-material';
import { useDiagramStore } from '../../store/useDiagramStore';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { googleFonts, fontSizes } from './Fonts';
import ColorPicker from '../ColorPicker/ColorPicker';

interface ToolDefinition {
  id: string;
  element: React.ReactNode;
  width: number;
}

const ToolbarComponent: React.FC = () => {
  const { undo, redo, setSelectedFont, setSelectedFontSize, history, cutShape, copyShape, pasteShape, sheets, activeSheetId, toggleBold, toggleItalic, toggleUnderlined, resetStore, setVerticalAlign, setHorizontalAlign, setSelectedTextColor, groupShapes } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];

  const [colorPickerAnchorEl, setColorPickerAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleColorPickerClick = (event: React.MouseEvent<HTMLElement>) => {
    setColorPickerAnchorEl(event.currentTarget);
  };

  const handleColorPickerClose = () => {
    setColorPickerAnchorEl(null);
  };

  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMoreMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchorEl(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchorEl(null);
  };

  const handleColorSelect = (color: string) => {
    setSelectedTextColor(color);
    handleColorPickerClose();
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

  const handleFontChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedFont(event.target.value as string);
  }, [setSelectedFont]);

  const handleFontSizeChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedFontSize(Number(event.target.value));
  }, [setSelectedFontSize]);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const [visibleTools, setVisibleTools] = useState<ToolDefinition[]>([]);
  const [hiddenTools, setHiddenTools] = useState<ToolDefinition[]>([]);
  const [moreButtonWidth, setMoreButtonWidth] = useState(0);

  const initialTools: ToolDefinition[] = useMemo(() => [
    { id: 'new-diagram', element: <Tooltip title="New Diagram"><IconButton color="inherit" onClick={resetStore} data-testid="new-diagram-button" sx={{ borderRadius: 0 }}><NoteAdd /></IconButton></Tooltip>, width: 48 },
    { id: 'divider-1', element: <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />, width: 16 }, // Approximate width for divider
    { id: 'undo', element: <Tooltip title="Undo"><span><IconButton color="inherit" onClick={undo} data-testid="undo-button" disabled={history.past.length === 0} sx={{ borderRadius: 0 }}><Undo /></IconButton></span></Tooltip>, width: 48 },
    { id: 'redo', element: <Tooltip title="Redo"><span><IconButton color="inherit" onClick={redo} data-testid="redo-button" disabled={history.future.length === 0} sx={{ borderRadius: 0 }}><Redo /></IconButton></span></Tooltip>, width: 48 },
    { id: 'divider-2', element: <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />, width: 16 },
    { id: 'cut', element: <Tooltip title="Cut"><span><IconButton color="inherit" onClick={() => cutShape(activeSheet.selectedShapeIds)} data-testid="cut-button" disabled={activeSheet.selectedShapeIds.length === 0} sx={{ borderRadius: 0 }}><ContentCut /></IconButton></span></Tooltip>, width: 48 },
    { id: 'copy', element: <Tooltip title="Copy"><span><IconButton color="inherit" onClick={() => copyShape(activeSheet.selectedShapeIds)} data-testid="copy-button" disabled={activeSheet.selectedShapeIds.length === 0} sx={{ borderRadius: 0 }}><ContentCopy /></IconButton></span></Tooltip>, width: 48 },
    { id: 'paste', element: <Tooltip title="Paste"><span><IconButton color="inherit" onClick={() => pasteShape()} data-testid="paste-button" disabled={!activeSheet.clipboard || activeSheet.clipboard.length === 0} sx={{ borderRadius: 0 }}><ContentPaste /></IconButton></span></Tooltip>, width: 48 },
    { id: 'group', element: <Tooltip title="Group"><span><IconButton color="inherit" onClick={() => groupShapes(activeSheet.selectedShapeIds)} data-testid="group-button" disabled={activeSheet.selectedShapeIds.length < 2} sx={{ borderRadius: 0 }}><GroupAdd /></IconButton></span></Tooltip>, width: 48 },
    { id: 'divider-3', element: <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />, width: 16 },
    { id: 'font-select', element: <FormControl sx={{ m: 1, minWidth: 40 }} size="small"><Select labelId="font-select-label" id="font-select" value={activeSheet.selectedFont || googleFonts[0].value} displayEmpty autoWidth onChange={handleFontChange} inputProps={{ 'data-testid': 'selectFont' }}>{googleFonts.slice().sort((a, b) => a.name.localeCompare(b.name)).map((font) => (<MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.name}</MenuItem>))}</Select></FormControl>, width: 120 }, // Approximate width
    { id: 'font-size-select', element: <FormControl sx={{ m: 1, minWidth: 40 }} size="small"><Select labelId="font-size-select-label" id="font-size-select" value={String(activeSheet.selectedFontSize || 10)} displayEmpty autoWidth onChange={handleFontSizeChange} inputProps={{ 'data-testid': 'selectFontSize' }}>{fontSizes.map((size) => (<MenuItem key={size} value={size}>{size}</MenuItem>))}</Select></FormControl>, width: 80 }, // Approximate width
    { id: 'divider-4', element: <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />, width: 16 },
    { id: 'bold', element: <Tooltip title="Bold"><span><IconButton sx={{ bgcolor: isBoldActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={toggleBold} data-testid="bold-button" disabled={!hasSelectedShapes}><FormatBold /></IconButton></span></Tooltip>, width: 48 },
    { id: 'italic', element: <Tooltip title="Italic"><span><IconButton sx={{ bgcolor: isItalicActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={toggleItalic} data-testid="italic-button" disabled={!hasSelectedShapes}><FormatItalic /></IconButton></span></Tooltip>, width: 48 },
    { id: 'underline', element: <Tooltip title="Underline"><span><IconButton sx={{ bgcolor: isUnderlinedActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={toggleUnderlined} data-testid="underline-button" disabled={!hasSelectedShapes}><FormatUnderlined /></IconButton></span></Tooltip>, width: 48 },
    { id: 'text-color', element: <Tooltip title="Text Color"><IconButton onClick={handleColorPickerClick} sx={{ color: 'inherit', borderRadius: 0 }}><FormatColorTextOutlined /></IconButton></Tooltip>, width: 48 },
    { id: 'divider-5', element: <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />, width: 16 },
    { id: 'align-top', element: <Tooltip title="Align Top"><span><IconButton sx={{ bgcolor: isVerticalAlignTopActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={() => setVerticalAlign('top')} data-testid="align-top-button" disabled={!hasSelectedShapes}><VerticalAlignTop /></IconButton></span></Tooltip>, width: 48 },
    { id: 'align-middle', element: <Tooltip title="Align Middle"><span><IconButton sx={{ bgcolor: isVerticalAlignCenterActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={() => setVerticalAlign('middle')} data-testid="align-middle-button" disabled={!hasSelectedShapes}><VerticalAlignCenter /></IconButton></span></Tooltip>, width: 48 },
    { id: 'align-bottom', element: <Tooltip title="Align Bottom"><span><IconButton sx={{ bgcolor: isVerticalAlignBottomActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={() => setVerticalAlign('bottom')} data-testid="align-bottom-button" disabled={!hasSelectedShapes}><VerticalAlignBottom /></IconButton></span></Tooltip>, width: 48 },
    { id: 'divider-6', element: <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />, width: 16 },
    { id: 'align-left', element: <Tooltip title="Align Left"><span><IconButton sx={{ bgcolor: isHorizontalAlignLeftActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={() => setHorizontalAlign('left')} data-testid="align-left-button" disabled={!hasSelectedShapes}><AlignHorizontalLeft /></IconButton></span></Tooltip>, width: 48 },
    { id: 'align-center', element: <Tooltip title="Align Center"><span><IconButton sx={{ bgcolor: isHorizontalAlignCenterActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={() => setHorizontalAlign('center')} data-testid="align-center-button" disabled={!hasSelectedShapes}><AlignHorizontalCenter /></IconButton></span></Tooltip>, width: 48 },
    { id: 'align-right', element: <Tooltip title="Align Right"><span><IconButton sx={{ bgcolor: isHorizontalAlignRightActive ? '#A0A0A0' : 'transparent', color: 'inherit', borderRadius: 0 }} onClick={() => setHorizontalAlign('right')} data-testid="align-right-button" disabled={!hasSelectedShapes}><AlignHorizontalRight /></IconButton></span></Tooltip>, width: 48 },
  ], [activeSheet.clipboard, activeSheet.selectedFont, activeSheet.selectedFontSize, activeSheet.selectedShapeIds, copyShape, cutShape, handleFontChange, handleFontSizeChange, hasSelectedShapes, history.future.length, history.past.length, isBoldActive, isHorizontalAlignCenterActive, isHorizontalAlignLeftActive, isHorizontalAlignRightActive, isItalicActive, isUnderlinedActive, isVerticalAlignBottomActive, isVerticalAlignCenterActive, isVerticalAlignTopActive, pasteShape, redo, resetStore, setHorizontalAlign, setVerticalAlign, toggleBold, toggleItalic, toggleUnderlined, undo, groupShapes]);

  useEffect(() => {
    const toolbarElement = toolbarRef.current;
    if (!toolbarElement) return;

    const moreButton = toolbarElement.querySelector('#more-button');
    if (moreButton) {
      setMoreButtonWidth(moreButton.clientWidth);
    }

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === toolbarElement) {
          const availableWidth = entry.contentRect.width;
          let currentWidth = 0;
          const newVisibleTools: ToolDefinition[] = [];
          const newHiddenTools: ToolDefinition[] = [];

          for (const tool of initialTools) {
            if (currentWidth + tool.width <= availableWidth - moreButtonWidth) {
              newVisibleTools.push(tool);
              currentWidth += tool.width;
            } else {
              newHiddenTools.push(tool);
            }
          }

          setVisibleTools(newVisibleTools);
          setHiddenTools(newHiddenTools);
        }
      }
    });

    resizeObserver.observe(toolbarElement);

    return () => {
      resizeObserver.unobserve(toolbarElement);
    };
  }, [initialTools, moreButtonWidth]);



  return (
    <AppBar position="static" sx={{ borderBottom: '1px solid #e0e0e0', padding: '0 0', marginLeft: 0, boxShadow: 'none', color: 'black' }}>
      <Toolbar variant="dense" sx={{ paddingLeft: 0, marginLeft: 0 }} ref={toolbarRef}>
        {visibleTools.map(tool => <React.Fragment key={tool.id}>{tool.element}</React.Fragment>)}
        {hiddenTools.length > 0 && (
          <>
            <Tooltip title="More tools">
              <IconButton
                id="more-button"
                aria-controls={moreMenuAnchorEl ? 'more-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={moreMenuAnchorEl ? 'true' : undefined}
                onClick={handleMoreMenuClick}
                color="inherit"
                sx={{ borderRadius: 0 }}
              >
                <MoreHorizIcon />
              </IconButton>
            </Tooltip>
            <Menu
              id="more-menu"
              anchorEl={moreMenuAnchorEl}
              open={Boolean(moreMenuAnchorEl)}
              onClose={handleMoreMenuClose}
              MenuListProps={{
                'aria-labelledby': 'more-button',
              }}
            >
              {hiddenTools.map(tool => (
                <MenuItem key={tool.id} onClick={handleMoreMenuClose}>
                  {tool.element}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
        <Menu
          anchorEl={colorPickerAnchorEl}
          open={Boolean(colorPickerAnchorEl)}
          onClose={handleColorPickerClose}
        >
          <ColorPicker selectedColor={activeSheet.selectedTextColor} onColorSelect={handleColorSelect} selectedShapes={selectedShapes} />
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default ToolbarComponent;