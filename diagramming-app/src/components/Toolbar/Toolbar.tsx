import { AppBar, Toolbar, IconButton, Tooltip, FormControl, MenuItem, type SelectChangeEvent, Divider, Menu, TextField } from '@mui/material';
import Select from '@mui/material/Select';
import { Undo, Redo, ContentCut, ContentCopy, ContentPaste, FormatBold, FormatItalic, FormatUnderlined, NoteAdd, VerticalAlignBottom, VerticalAlignCenter, VerticalAlignTop, AlignHorizontalLeft, AlignHorizontalCenter, AlignHorizontalRight, FormatColorTextOutlined, MoreHoriz as MoreHorizIcon, GroupAdd, FormatColorFill } from '@mui/icons-material';
import { useDiagramStore } from '../../store/useDiagramStore';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { debounce } from '../../utils/debounce';
import { googleFonts, fontSizes } from './Fonts';
import type { LineStyle } from '../../types';
import ColorPicker from '../ColorPicker/ColorPicker';
import ShapeColorPicker from '../ShapeColorPicker/ShapeColorPicker';
import { colors as shapeColors } from '../ShapeColorPicker/colors';
import { findClosestColor } from '../../utils/colorUtils';

const LINE_STYLE_SVG = {
  continuous: `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2"/></svg>`,
  dashed: `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="5 5"/></svg>`,
  'long-dash': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="10 5"/></svg>`,
  'dot-dash': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="2 3 10 3"/></svg>`,
  'custom-1': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="16 4 1 4 1 4"/></svg>`,
  'custom-2': `<svg width="80" height="2" viewBox="0 0 80 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H80" stroke="black" stroke-width="2" stroke-dasharray="40 10 20 10"/></svg>`,
};

const lineStyles: { name: string, value: LineStyle }[] = [
  { name: 'Continuous', value: 'continuous' },
  { name: 'Dashed', value: 'dashed' },
  { name: 'Long Dash', value: 'long-dash' },
  { name: 'Dot Dash', value: 'dot-dash' },
  { name: 'Custom 1', value: 'custom-1' },
  { name: 'Custom 2', value: 'custom-2' },
];

interface ToolDefinition {
  id: string;
  element: React.ReactNode;
  width: number;
}

interface GetInitialToolsProps {
  activeSheet: Sheet;
  canUndo: boolean;
  canRedo: boolean;
  hasSelectedShapes: boolean;
  isBoldActive: boolean;
  isItalicActive: boolean;
  isUnderlinedActive: boolean;
  isVerticalAlignTopActive: boolean;
  isVerticalAlignCenterActive: boolean;
  isVerticalAlignBottomActive: boolean;
  isHorizontalAlignLeftActive: boolean;
  isHorizontalAlignCenterActive: boolean;
  isHorizontalAlignRightActive: boolean;
  currentTextColor: string;
  currentShapeColor: string;
  currentLineStyle: LineStyle;
  currentLineWidth: number;
  handleFontChange: (event: SelectChangeEvent<string>) => void;
  handleFontSizeChange: (event: SelectChangeEvent<string>) => void;
  handleLineStyleChange: (event: SelectChangeEvent<string>) => void;
  handleLineWidthChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  resetStore: () => void;
  undo: () => void;
  redo: () => void;
  cutShape: (ids: string[]) => void;
  copyShape: (ids: string[]) => void;
  pasteShape: () => void;
  groupShapes: (ids: string[]) => void;
  setVerticalAlign: (alignment: 'top' | 'middle' | 'bottom') => void;
  setHorizontalAlign: (alignment: 'left' | 'center' | 'right') => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderlined: () => void;
}

const getInitialTools = ({
  activeSheet,
  canUndo,
  canRedo,
  hasSelectedShapes,
  isBoldActive,
  isItalicActive,
  isUnderlinedActive,
  isVerticalAlignTopActive,
  isVerticalAlignCenterActive,
  isVerticalAlignBottomActive,
  isHorizontalAlignLeftActive,
  isHorizontalAlignCenterActive,
  isHorizontalAlignRightActive,
  currentTextColor,
  currentShapeColor,
  currentLineStyle,
  currentLineWidth,
  handleColorPickerClick,
  handleShapeColorPickerClick,
  handleFontChange,
  handleFontSizeChange,
  handleLineStyleChange,
  handleLineWidthChange,
  resetStore,
  undo,
  redo,
  cutShape,
  copyShape,
  pasteShape,
  groupShapes,
  setVerticalAlign,
  setHorizontalAlign,
  toggleBold,
  toggleItalic,
  toggleUnderlined,
}: GetInitialToolsProps): ToolDefinition[] => {
  const selectedShapeIds = activeSheet.selectedShapeIds;

  return [
    {
      id: 'undo',
      element: (
        <Tooltip title="Undo">
          <IconButton onClick={undo} color="inherit" disabled={!canUndo} sx={{ borderRadius: 0 }}>
            <Undo />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'redo',
      element: (
        <Tooltip title="Redo">
          <IconButton onClick={redo} color="inherit" disabled={!canRedo} sx={{ borderRadius: 0 }}>
            <Redo />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'divider-1',
      element: <Divider orientation="vertical" flexItem sx={{ margin: '0 4px' }} />,
      width: 16,
    },
    {
      id: 'cut',
      element: (
        <Tooltip title="Cut">
          <IconButton onClick={() => cutShape(selectedShapeIds)} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0 }}>
            <ContentCut />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'copy',
      element: (
        <Tooltip title="Copy">
          <IconButton onClick={() => copyShape(selectedShapeIds)} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0 }}>
            <ContentCopy />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'paste',
      element: (
        <Tooltip title="Paste">
          <IconButton onClick={pasteShape} color="inherit" sx={{ borderRadius: 0 }}>
            <ContentPaste />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'divider-2',
      element: <Divider orientation="vertical" flexItem sx={{ margin: '0 4px' }} />,
      width: 16,
    },
    {
      id: 'font-family',
      element: (
        <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
          <Select
            value={activeSheet.selectedFont}
            onChange={handleFontChange}
            displayEmpty
            inputProps={{ 'aria-label': 'Without label' }}
            sx={{ '.MuiSelect-select': { padding: '8px 12px' } }}
          >
            {googleFonts.map((font) => (
              <MenuItem key={font.value} value={font.value} sx={{ fontFamily: font.value }}>
                {font.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ),
      width: 140,
    },
    {
      id: 'font-size',
      element: (
        <FormControl variant="standard" sx={{ m: 1, minWidth: 60 }}>
          <Select
            value={activeSheet.selectedFontSize.toString()}
            onChange={handleFontSizeChange}
            displayEmpty
            inputProps={{ 'aria-label': 'Without label' }}
            sx={{ '.MuiSelect-select': { padding: '8px 12px' } }}
          >
            {fontSizes.map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ),
      width: 80,
    },
    {
      id: 'bold',
      element: (
        <Tooltip title="Bold">
          <IconButton onClick={toggleBold} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isBoldActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
            <FormatBold />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'italic',
      element: (
        <Tooltip title="Italic">
          <IconButton onClick={toggleItalic} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isItalicActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
            <FormatItalic />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'underline',
      element: (
        <Tooltip title="Underline">
          <IconButton onClick={toggleUnderlined} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isUnderlinedActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
            <FormatUnderlined />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'text-color',
      element: (
        <Tooltip title="Text Color">
          <IconButton onClick={handleColorPickerClick} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0 }}>
            <FormatColorTextOutlined sx={{ color: currentTextColor }} />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'shape-color',
      element: (
        <Tooltip title="Shape Color">
          <IconButton onClick={handleShapeColorPickerClick} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0 }}>
            <FormatColorFill sx={{ color: currentShapeColor }} />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'divider-3',
      element: <Divider orientation="vertical" flexItem sx={{ margin: '0 4px' }} />,
      width: 16,
    },
    {
      id: 'line-style',
      element: (
        <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
          <Select
            value={currentLineStyle}
            onChange={handleLineStyleChange}
            displayEmpty
            inputProps={{ 'aria-label': 'Line Style' }}
            sx={{ '.MuiSelect-select': { padding: '8px 12px' } }}
            renderValue={(selected) => (
              <span dangerouslySetInnerHTML={{ __html: LINE_STYLE_SVG[selected] }} />
            )}
          >
            {lineStyles.map((style) => (
              <MenuItem key={style.value} value={style.value}>
                <span dangerouslySetInnerHTML={{ __html: LINE_STYLE_SVG[style.value] }} />
                <span style={{ marginLeft: '8px' }}>{style.name}</span>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ),
      width: 140,
    },
    {
      id: 'line-width',
      element: (
        <TextField
          label="Width"
          type="number"
          value={currentLineWidth}
          onChange={handleLineWidthChange}
          inputProps={{ min: 1, max: 12, step: 1 }}
          sx={{ width: 70, margin: '8px' }}
          variant="standard"
        />
      ),
      width: 90,
    },
    {
      id: 'divider-4',
      element: <Divider orientation="vertical" flexItem sx={{ margin: '0 4px' }} />,
      width: 16,
    },
    {
      id: 'align-top',
      element: (
        <Tooltip title="Align Top">
          <IconButton onClick={() => setVerticalAlign('top')} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isVerticalAlignTopActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
            <VerticalAlignTop />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'align-middle',
      element: (
        <Tooltip title="Align Middle">
          <IconButton onClick={() => setVerticalAlign('middle')} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isVerticalAlignCenterActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
            <VerticalAlignCenter />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'align-bottom',
      element: (
        <Tooltip title="Align Bottom">
          <IconButton onClick={() => setVerticalAlign('bottom')} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isVerticalAlignBottomActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
            <VerticalAlignBottom />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'divider-5',
      element: <Divider orientation="vertical" flexItem sx={{ margin: '0 4px' }} />,
      width: 16,
    },
    {
      id: 'align-left',
      element: (
        <Tooltip title="Align Left">
          <IconButton onClick={() => setHorizontalAlign('left')} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isHorizontalAlignLeftActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
            <AlignHorizontalLeft />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'align-center',
      element: (
        <Tooltip title="Align Center">
          <IconButton onClick={() => setHorizontalAlign('center')} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isHorizontalAlignCenterActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
            <AlignHorizontalCenter />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'align-right',
      element: (
        <Tooltip title="Align Right">
          <IconButton onClick={() => setHorizontalAlign('right')} color="inherit" disabled={!hasSelectedShapes} sx={{ borderRadius: 0, backgroundColor: isHorizontalAlignRightActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
            <AlignHorizontalRight />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'divider-6',
      element: <Divider orientation="vertical" flexItem sx={{ margin: '0 4px' }} />,
      width: 16,
    },
    {
      id: 'group',
      element: (
        <Tooltip title="Group">
          <IconButton onClick={() => groupShapes(selectedShapeIds)} color="inherit" disabled={selectedShapeIds.length < 2} sx={{ borderRadius: 0 }}>
            <GroupAdd />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'add-note',
      element: (
        <Tooltip title="Add Note">
          <IconButton onClick={() => { /* Implement add note logic */ }} color="inherit" sx={{ borderRadius: 0 }}>
            <NoteAdd />
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
    {
      id: 'reset-store',
      element: (
        <Tooltip title="Reset Store">
          <IconButton onClick={resetStore} color="inherit" sx={{ borderRadius: 0 }}>
            Reset
          </IconButton>
        </Tooltip>
      ),
      width: 48,
    },
  ];
};

const ToolbarComponent: React.FC = () => {
  const {
    setSelectedFont,
    setSelectedFontSize,
    sheets,
    activeSheetId,
    setSelectedTextColor,
    setSelectedShapeColor,
    updateShapeSvgContent,
    setSelectedLineStyle,
    setSelectedLineWidth,
    undo,
    redo,
    cutShape,
    copyShape,
    pasteShape,
    resetStore,
    toggleBold,
    toggleItalic,
    toggleUnderlined,
    setVerticalAlign,
    setHorizontalAlign,
    groupShapes,
    history, // Add history here
  } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];
  const canUndo = history.past.length > 0; // Corrected access
  const canRedo = history.future.length > 0; // Corrected access


  const [colorPickerAnchorEl, setColorPickerAnchorEl] = React.useState<null | HTMLElement>(null);
  const [shapeColorPickerAnchorEl, setShapeColorPickerAnchorEl] = React.useState<null | HTMLElement>(null);
  const [currentShapeColor, setCurrentShapeColor] = useState('#000000');
  const [currentTextColor, setCurrentTextColor] = useState('#000000');
  const [currentLineStyle, setCurrentLineStyle] = useState<LineStyle>(activeSheet.selectedLineStyle);
  const [currentLineWidth, setCurrentLineWidth] = useState<number>(activeSheet.selectedLineWidth);

  useEffect(() => {
    if (!activeSheet || activeSheet.selectedConnectorIds === undefined) return;

    let newLineStyle = activeSheet.selectedLineStyle;
    let newLineWidth = activeSheet.selectedLineWidth;

    if (activeSheet.selectedConnectorIds.length > 0) {
      const firstSelectedConnector = activeSheet.connectors[activeSheet.selectedConnectorIds[0]];
      if (firstSelectedConnector) {
        newLineStyle = firstSelectedConnector.lineStyle || 'continuous';
        newLineWidth = firstSelectedConnector.lineWidth || 1;
      }
    }

    if (currentLineStyle !== newLineStyle) {
      setCurrentLineStyle(newLineStyle);
    }
    if (currentLineWidth !== newLineWidth) {
      setCurrentLineWidth(newLineWidth);
    }
  }, [activeSheet, activeSheet.selectedConnectorIds, activeSheet.connectors, activeSheet.selectedLineStyle, activeSheet.selectedLineWidth, currentLineStyle, currentLineWidth]);

  

  const handleColorPickerClose = () => {
    setColorPickerAnchorEl(null);
  };

  

  const handleShapeColorPickerClose = () => {
    setShapeColorPickerAnchorEl(null);
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

  const handleShapeColorSelect = (color: string) => {
    setSelectedShapeColor(color);
    const selectedShapes = activeSheet.selectedShapeIds.map(id => activeSheet.shapesById[id]).filter(Boolean);
    selectedShapes.forEach(shape => {
      if (shape.svgContent) {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(shape.svgContent, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        const gradients = Array.from(svgElement.querySelectorAll('linearGradient'));
        if (gradients.length > 0) {
          gradients.forEach(gradient => {
            const stops = Array.from(gradient.querySelectorAll('stop'));
            stops.forEach(stop => {
              stop.setAttribute('stop-color', color);
            });
          });
        } else {
          const paths = Array.from(svgElement.querySelectorAll('path'));
          paths.forEach(path => {
            if (path.getAttribute('fill')) {
              path.setAttribute('fill', color);
            }
          });
        }

        const serializer = new XMLSerializer();
        const newSvgContent = serializer.serializeToString(svgElement);
        updateShapeSvgContent(shape.id, newSvgContent);
      }
    });
    handleShapeColorPickerClose();
  };

  const selectedShapes = activeSheet.selectedShapeIds.map(id => activeSheet.shapesById[id]).filter(Boolean);
  const hasSelectedShapes = selectedShapes.length > 0;

  useEffect(() => {
    if (hasSelectedShapes) {
      const firstShape = selectedShapes[0];
      if (firstShape.svgContent) {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(firstShape.svgContent, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        let color = '#000000';
        const gradients = Array.from(svgElement.querySelectorAll('linearGradient'));
        if (gradients.length > 0) {
          const lastStop = gradients[0].querySelector('stop[offset="100%"]') || gradients[0].querySelector('stop:last-child');
          if (lastStop) {
            color = lastStop.getAttribute('stop-color') || '#000000';
          }
        } else {
          const path = svgElement.querySelector('path');
          if (path) {
            color = path.getAttribute('fill') || '#000000';
          }
        }
        setCurrentShapeColor(findClosestColor(color, shapeColors.map(c => c.value)));
      }
      else if (currentShapeColor !== findClosestColor(firstShape.color, shapeColors.map(c => c.value))) {
        setCurrentShapeColor(findClosestColor(firstShape.color, shapeColors.map(c => c.value)));
      }

      if (firstShape.textColor && currentTextColor !== firstShape.textColor) {
        setCurrentTextColor(firstShape.textColor);
      }

    } else if (currentShapeColor !== '#000000' || currentTextColor !== '#000000') {
        setCurrentShapeColor('#000000');
        setCurrentTextColor('#000000');
    }
  }, [selectedShapes, hasSelectedShapes]);

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

  const handleLineStyleChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedLineStyle(event.target.value as LineStyle);
  }, [setSelectedLineStyle]);

  const handleLineWidthChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!isNaN(value) && value >= 1 && value <= 12) {
      setSelectedLineWidth(value);
    }
  }, [setSelectedLineWidth]);

  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleColorPickerClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setColorPickerAnchorEl(event.currentTarget);
  }, [setColorPickerAnchorEl]);

  const handleShapeColorPickerClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setShapeColorPickerAnchorEl(event.currentTarget);
  }, [setShapeColorPickerAnchorEl]);

  const initialTools = useMemo(() => {
    return getInitialTools({
      activeSheet,
      canUndo,
      canRedo,
      hasSelectedShapes,
      isBoldActive,
      isItalicActive,
      isUnderlinedActive,
      isVerticalAlignTopActive,
      isVerticalAlignCenterActive,
      isVerticalAlignBottomActive,
      isHorizontalAlignLeftActive,
      isHorizontalAlignCenterActive,
      isHorizontalAlignRightActive,
      currentTextColor,
      currentShapeColor,
      currentLineStyle,
      currentLineWidth,
      handleColorPickerClick,
      handleShapeColorPickerClick,
      handleFontChange,
      handleFontSizeChange,
      handleLineStyleChange,
      handleLineWidthChange,
      resetStore,
      undo,
      redo,
      cutShape,
      copyShape,
      pasteShape,
      groupShapes,
      setVerticalAlign,
      setHorizontalAlign,
      toggleBold,
      toggleItalic,
      toggleUnderlined,
    });
  }, [
    activeSheet,
    canUndo,
    canRedo,
    hasSelectedShapes,
    isBoldActive,
    isItalicActive,
    isUnderlinedActive,
    isVerticalAlignTopActive,
    isVerticalAlignCenterActive,
    isVerticalAlignBottomActive,
    isHorizontalAlignLeftActive,
    isHorizontalAlignCenterActive,
    isHorizontalAlignRightActive,
    currentTextColor,
    currentShapeColor,
    currentLineStyle,
    currentLineWidth,
    handleColorPickerClick,
    handleShapeColorPickerClick,
    handleFontChange,
    handleFontSizeChange,
    handleLineStyleChange,
    handleLineWidthChange,
    resetStore,
    undo,
    redo,
    cutShape,
    copyShape,
    pasteShape,
    groupShapes,
    setVerticalAlign,
    setHorizontalAlign,
    toggleBold,
    toggleItalic,
    toggleUnderlined,
  ]);
  const [visibleTools, setVisibleTools] = useState<ToolDefinition[]>([]);
  const [hiddenTools, setHiddenTools] = useState<ToolDefinition[]>([]);
  const [moreButtonWidth, setMoreButtonWidth] = useState(0);

  

  const handleSetTools = useCallback((newVisibleTools: ToolDefinition[], newHiddenTools: ToolDefinition[]) => {
    setVisibleTools(newVisibleTools);
    setHiddenTools(newHiddenTools);
  }, []);

  const debouncedSetTools = useMemo(() => debounce(handleSetTools, 100), [handleSetTools]);

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

          debouncedSetTools(newVisibleTools, newHiddenTools);
        }
      }
    });

    resizeObserver.observe(toolbarElement);

    return () => {
      resizeObserver.unobserve(toolbarElement);
      debouncedSetTools.cancel && debouncedSetTools.cancel(); // Cancel any pending debounced calls
    };
  }, [initialTools, moreButtonWidth, debouncedSetTools]);



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
        <Menu
          anchorEl={shapeColorPickerAnchorEl}
          open={Boolean(shapeColorPickerAnchorEl)}
          onClose={handleShapeColorPickerClose}
        >
          <ShapeColorPicker selectedColor={currentShapeColor} onColorSelect={handleShapeColorSelect} />
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default ToolbarComponent;