import { Toolbar, IconButton, Tooltip, type SelectChangeEvent, Menu, MenuItem } from '@mui/material';
import { MoreHoriz as MoreHorizIcon } from '@mui/icons-material';
import { useDiagramStore } from '../../store/useDiagramStore';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { debounce } from '../../utils/debounce';
import type { LineStyle, ArrowStyle } from '../../types';
import ColorPicker from '../ColorPicker/ColorPicker';
import ShapeColorPicker from '../ShapeColorPicker/ShapeColorPicker';
import { colors as shapeColors } from '../ShapeColorPicker/colors';
import { findClosestColor } from '../../utils/colorUtils';
import { getInitialTools, type ToolDefinition } from './Toolbar.definitions';

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
    setSelectedStartArrow,
    setSelectedEndArrow,
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
  const [currentStartArrow, setCurrentStartArrow] = useState<ArrowStyle>('none');
  const [currentEndArrow, setCurrentEndArrow] = useState<ArrowStyle>('standard_arrow');

  useEffect(() => {
    if (!activeSheet || activeSheet.selectedConnectorIds === undefined) return;

    let newLineStyle = activeSheet.selectedLineStyle;
    let newLineWidth = activeSheet.selectedLineWidth;
    let newStartArrow: ArrowStyle = 'none';
    let newEndArrow: ArrowStyle = 'standard_arrow';

    if (activeSheet.selectedConnectorIds.length > 0) {
      const firstSelectedConnector = activeSheet.connectors[activeSheet.selectedConnectorIds[0]];
      if (firstSelectedConnector) {
        newLineStyle = firstSelectedConnector.lineStyle || 'continuous';
        newLineWidth = firstSelectedConnector.lineWidth || 1;
        newStartArrow = firstSelectedConnector.startArrow || 'none';
        newEndArrow = firstSelectedConnector.endArrow || 'standard_arrow';
      }
    }

    if (currentLineStyle !== newLineStyle) {
      setCurrentLineStyle(newLineStyle);
    }
    if (currentLineWidth !== newLineWidth) {
      setCurrentLineWidth(newLineWidth);
    }
    if (currentStartArrow !== newStartArrow) {
      setCurrentStartArrow(newStartArrow);
    }
    if (currentEndArrow !== newEndArrow) {
      setCurrentEndArrow(newEndArrow);
    }
  }, [activeSheet, activeSheet.selectedConnectorIds, activeSheet.connectors, activeSheet.selectedLineStyle, activeSheet.selectedLineWidth, currentLineStyle, currentLineWidth, currentStartArrow, currentEndArrow]);



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

  const selectedShapes = useMemo(() => activeSheet.selectedShapeIds.map(id => activeSheet.shapesById[id]).filter(Boolean), [activeSheet.selectedShapeIds, activeSheet.shapesById]);
  const hasSelectedShapes = selectedShapes.length > 0;
  const hasSelectedConnectors = activeSheet.selectedConnectorIds.length > 0;

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
        const newColor = findClosestColor(color, shapeColors.map(c => c.value));
        if (currentShapeColor !== newColor) {
          setCurrentShapeColor(newColor);
        }
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
  }, [selectedShapes, hasSelectedShapes, currentShapeColor, currentTextColor]);

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

  const handleStartArrowChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedStartArrow(event.target.value as ArrowStyle);
  }, [setSelectedStartArrow]);

  const handleEndArrowChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedEndArrow(event.target.value as ArrowStyle);
  }, [setSelectedEndArrow]);

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
      hasSelectedConnectors,
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
      currentStartArrow,
      currentEndArrow,
      handleColorPickerClick,
      handleShapeColorPickerClick,
      handleFontChange,
      handleFontSizeChange,
      handleLineStyleChange,
      handleLineWidthChange,
      handleStartArrowChange,
      handleEndArrowChange,
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
      onToolClick: handleMoreMenuClose,
    });
  }, [
    activeSheet,
    canUndo,
    canRedo,
    hasSelectedShapes,
    hasSelectedConnectors,
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
    currentStartArrow,
    currentEndArrow,
    handleColorPickerClick,
    handleShapeColorPickerClick,
    handleFontChange,
    handleFontSizeChange,
    handleLineStyleChange,
    handleLineWidthChange,
    handleStartArrowChange,
    handleEndArrowChange,
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

  const handleSetTools = useCallback((newVisibleTools: ToolDefinition[], newHiddenTools: ToolDefinition[]) => {
    setVisibleTools(newVisibleTools);
    setHiddenTools(newHiddenTools);
  }, []);

  const debouncedSetTools = useMemo(() => debounce(handleSetTools, 100), [handleSetTools]);

  useEffect(() => {
    const toolbarElement = toolbarRef.current;
    if (!toolbarElement) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === toolbarElement) {
          const availableWidth = entry.contentRect.width;
          let currentWidth = 0;
          const newVisibleTools: ToolDefinition[] = [];
          const newHiddenTools: ToolDefinition[] = [];
          const moreButton = toolbarElement.querySelector('#more-button');
          const moreButtonWidth = moreButton?.clientWidth ?? 0;

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
      if (debouncedSetTools.cancel) { debouncedSetTools.cancel(); } // Cancel any pending debounced calls
    };
  }, [initialTools, debouncedSetTools]);



  return (
    <Toolbar disableGutters variant="dense" sx={{ paddingLeft: 0, marginLeft: 0 }} ref={toolbarRef}>
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
                <React.Fragment>{tool.element}</React.Fragment>
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
  );
};

export default ToolbarComponent;
