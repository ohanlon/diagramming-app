import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import Node from '../Node/Node';
import ConnectorComponent from '../Connector/Connector';
import ContextMenu from '../ContextMenu/ContextMenu';
import type { Point, AnchorType, Shape } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { getAnchorPoint } from '../../utils/getAnchorPoint';
import { calculateConnectionPath } from '../../utils/connectionAlgorithms';
import { debounce } from '../../utils/debounce';
import './Canvas.less';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const Canvas: React.FC = () => {
  const { sheets, activeSheetId, addShapeAndRecordHistory, addConnector, setPan, setZoom, setSelectedShapes, bringForward, sendBackward, bringToFront, sendToBack, updateShapePosition, updateShapePositions, recordShapeMoves, deselectAllTextBlocks, setConnectorDragTargetShapeId, deleteSelected, addSheet, undo, redo, cutShape, copyShape, pasteShape, setSelectedConnectors, selectAll } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [isDrawingConnector, setIsDrawingConnector] = useState(false);
  const [startConnectorPoint, setStartConnectorPoint] = useState<Point | null>(null);
  const [startConnectorNodeId, setStartConnectorNodeId] = useState<string | null>(null);
  const [startConnectorAnchorType, setStartConnectorAnchorType] = useState<AnchorType | null>(null);
  const [currentMousePoint, setCurrentMousePoint] = useState<Point | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; shapeId: string } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartPoint, setSelectionStartPoint] = useState<Point | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isMouseDownOnShape, setIsMouseDownOnShape] = useState<string | null>(null);
  const [mouseDownPos, setMouseDownPos] = useState<Point | null>(null);
  const [initialDragPositions, setInitialDragPositions] = useState<{ [shapeId: string]: Point } | null>(null);

  const [isYouTubeDialogOpen, setIsYouTubeDialogOpen] = useState(false);
  const [youTubeUrl, setYouTubeUrl] = useState('');
  const [youTubeShapeData, setYouTubeShapeData] = useState<Omit<Shape, 'id'> | null>(null);
  const [urlError, setUrlError] = useState(false);

  const debouncedSetCurrentMousePoint = useMemo(() => {
    const handler = (point: Point | null) => setCurrentMousePoint(point);
    return debounce(handler as (...args: unknown[]) => void, 20) as (point: Point | null) => void;
  }, []);

  const getShapeWithCalculatedTextProps = useCallback((shape: Omit<Shape, 'id'>): Omit<Shape, 'id'> => {
    // Create a temporary div to measure text dimensions
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'nowrap';
    tempDiv.style.fontFamily = shape.fontFamily || 'Open Sans';
    tempDiv.style.fontSize = `${shape.fontSize || 10}pt`;
    tempDiv.style.fontWeight = shape.isBold ? 'bold' : 'normal';
    tempDiv.style.fontStyle = shape.isItalic ? 'italic' : 'normal';
    tempDiv.style.textDecoration = shape.isUnderlined ? 'underline' : 'none';
    tempDiv.textContent = shape.text;
    document.body.appendChild(tempDiv);

    const PADDING_HORIZONTAL = 10;
    const PADDING_VERTICAL = 6;

    const newWidth = Math.round(tempDiv.scrollWidth + PADDING_HORIZONTAL);
    tempDiv.style.whiteSpace = 'normal';
    tempDiv.style.width = `${newWidth}px`;
    const newHeight = Math.round(tempDiv.scrollHeight + PADDING_VERTICAL);

    document.body.removeChild(tempDiv);

    let calculatedTextWidth = shape.textWidth;
    let calculatedTextHeight = shape.textHeight;
    let calculatedTextOffsetX = shape.textOffsetX;
    const calculatedTextOffsetY = shape.textOffsetY;

    if (shape.autosize) {
      if (shape.textPosition === 'inside') {
        // If text is inside, shape dimensions should adjust
        // For now, we'll just update text dimensions, shape dimensions will be handled by updateShapeDimensions
        calculatedTextWidth = newWidth;
        calculatedTextHeight = newHeight;
      } else {
        // If text is outside, only text dimensions adjust
        calculatedTextWidth = newWidth;
        calculatedTextHeight = newHeight;
      }

      if (shape.textPosition === 'outside' && !shape.isTextPositionManuallySet) {
        if (shape.horizontalAlign === 'center') {
          calculatedTextOffsetX = (shape.width / 2) - (newWidth / 2);
        } else if (shape.horizontalAlign === 'left') {
          calculatedTextOffsetX = 0;
        } else {
          calculatedTextOffsetX = shape.width - newWidth;
        }
      }
    }

    return {
      ...shape,
      textWidth: calculatedTextWidth,
      textHeight: calculatedTextHeight,
      textOffsetX: calculatedTextOffsetX,
      textOffsetY: calculatedTextOffsetY,
    };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeSheet) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const mouseX = (e.clientX - svgRect.left - activeSheet.pan.x) / activeSheet.zoom;
    const mouseY = (e.clientY - svgRect.top - activeSheet.pan.y) / activeSheet.zoom;

    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (isDrawingConnector) {
      debouncedSetCurrentMousePoint({ x: mouseX, y: mouseY });

      const targetElement = document.elementFromPoint(e.clientX, e.clientY);

      // Preview connector logic to be implemented

      const targetNodeG = targetElement?.closest('g[data-node-id]');
      let hoveredShapeId: string | null = null;
      if (targetNodeG) {
        hoveredShapeId = targetNodeG.getAttribute('data-node-id');
      }

      if (hoveredShapeId !== activeSheet.connectorDragTargetShapeId) {
        setConnectorDragTargetShapeId(hoveredShapeId);
      }
    } else if (isSelecting && selectionStartPoint) {
      const x = Math.min(selectionStartPoint.x, mouseX);
      const y = Math.min(selectionStartPoint.y, mouseY);
      const width = Math.abs(selectionStartPoint.x - mouseX);
      const height = Math.abs(selectionStartPoint.y - mouseY);
      setSelectionRect({ x, y, width, height });
    } else if (isMouseDownOnShape && mouseDownPos && initialDragPositions) {
        const dx = mouseX - mouseDownPos.x;
        const dy = mouseY - mouseDownPos.y;

        if (activeSheet.selectedShapeIds.length > 1) {
            const newPositions = activeSheet.selectedShapeIds.map(id => {
                const initialPos = initialDragPositions[id];
                return { id, x: initialPos.x + dx, y: initialPos.y + dy };
            });
            updateShapePositions(newPositions);
        } else {
            const initialPos = initialDragPositions[isMouseDownOnShape];
            if (initialPos) {
                updateShapePosition(isMouseDownOnShape, initialPos.x + dx, initialPos.y + dy);
            }
        }
    }
  }, [activeSheet, isPanning, startPan, setPan, isDrawingConnector, debouncedSetCurrentMousePoint, isSelecting, selectionStartPoint, isMouseDownOnShape, mouseDownPos, initialDragPositions, updateShapePositions, updateShapePosition, activeSheet.connectorDragTargetShapeId, setConnectorDragTargetShapeId]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!activeSheet) return;

    if (isPanning) {
      setIsPanning(false);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
      }
    }
    else if (isDrawingConnector) {
      setConnectorDragTargetShapeId(null);
      setIsDrawingConnector(false);
      setStartConnectorPoint(null);
      setStartConnectorNodeId(null);
      setStartConnectorAnchorType(null);
      setCurrentMousePoint(null);

      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;

      const mouseX = (e.clientX - svgRect.left - activeSheet.pan.x) / activeSheet.zoom;
      const mouseY = (e.clientY - svgRect.top - activeSheet.pan.y) / activeSheet.zoom;
      const endPoint = { x: mouseX, y: mouseY };

      const targetElement = e.target as SVGElement;
      const targetNodeG = targetElement.closest('g[data-node-id]');

      if (targetNodeG) {
        const endNodeId = targetNodeG.getAttribute('data-node-id');
        if (endNodeId && endNodeId !== startConnectorNodeId) {
          const startShape = activeSheet.shapesById[startConnectorNodeId!];
          const targetShape = activeSheet.shapesById[endNodeId];
          const startLayer = activeSheet.layers[startShape.layerId];
          const targetLayer = activeSheet.layers[targetShape.layerId];

          if (
            startShape &&
            targetShape &&
            startShape.layerId === targetShape.layerId &&
            startShape.layerId === activeSheet.activeLayerId &&
            startLayer.isVisible &&
            targetLayer.isVisible
          ) {
            const { type: endAnchorType } = getAnchorPoint(targetShape, endPoint);
            addConnector({
              id: uuidv4(),
              startNodeId: startConnectorNodeId!,
              endNodeId: endNodeId,
              startAnchorType: startConnectorAnchorType!,
              endAnchorType: endAnchorType,
            });
          }
        }
      }
    } else if (isSelecting && selectionRect) {
        const selectedIds = activeSheet.shapeIds.filter(id => {
            const shape = activeSheet.shapesById[id];
            if (!shape || shape.layerId !== activeSheet.activeLayerId) return false;

            const shapeRect = {
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height
            };

            return (
                shapeRect.x < selectionRect.x + selectionRect.width &&
                shapeRect.x + selectionRect.width > selectionRect.x &&
                shapeRect.y < selectionRect.y + selectionRect.height &&
                shapeRect.y + selectionRect.height > selectionRect.y
            );
        });
        setSelectedShapes(selectedIds);
    }

    if (isMouseDownOnShape) {
        if (activeSheet.selectedShapeIds.length > 1) {
            const finalPositions = activeSheet.selectedShapeIds.map(id => {
                const shape = activeSheet.shapesById[id];
                return { id, x: shape.x, y: shape.y };
            });
            recordShapeMoves(finalPositions);
        } else {
            const shape = activeSheet.shapesById[isMouseDownOnShape];
            if(shape) recordShapeMoves([{id: isMouseDownOnShape, x: shape.x, y: shape.y}]);
        }
    }
    setIsMouseDownOnShape(null);
    setMouseDownPos(null);
    setInitialDragPositions(null);

    setIsPanning(false);
    setIsDrawingConnector(false);
    setIsSelecting(false);
    setSelectionStartPoint(null);
    setSelectionRect(null);
  }, [activeSheet, isPanning, isDrawingConnector, startConnectorNodeId, startConnectorAnchorType, addConnector, isSelecting, selectionRect, setSelectedShapes, isMouseDownOnShape, recordShapeMoves, setConnectorDragTargetShapeId]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!activeSheet) return;
    e.preventDefault();

    if (e.ctrlKey) {
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;

      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;

      const zoomAmount = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newZoom = Math.max(0.1, Math.min(5, activeSheet.zoom * zoomAmount));

      const newPanX = mouseX - ((mouseX - activeSheet.pan.x) * (newZoom / activeSheet.zoom));
      const newPanY = mouseY - ((mouseY - activeSheet.pan.y) * (newZoom / activeSheet.zoom));

      requestAnimationFrame(() => {
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      });
    } else {
      requestAnimationFrame(() => {
        setPan({
          x: activeSheet.pan.x - e.deltaX,
          y: activeSheet.pan.y - e.deltaY,
        });
      });
    }
  }, [activeSheet, setZoom, setPan]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (svgElement) {
      svgElement.addEventListener('wheel', handleWheel, { passive: false });
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      if (svgElement) {
        svgElement.removeEventListener('wheel', handleWheel);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // If the click is inside the context menu, do nothing.
      // The menu items have their own click handlers.
      if (target.closest('.MuiMenu-paper')) { // .MuiMenu-paper is a stable class for the menu container
        return;
      }

      // If the click is on a shape, the context menu for that shape will be opened
      // by its own onContextMenu handler, so we don't need to close it here.
      // We only close it if the click is outside of any shape and outside the menu.
      const isShapeClick = target.closest('g[data-node-id]');
      if (contextMenu && !isShapeClick) {
        handleCloseContextMenu();
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu, handleCloseContextMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'Delete') {
        deleteSelected();
      } else if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        addSheet();
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        if (activeSheet.selectedShapeIds.length > 0) {
          cutShape(activeSheet.selectedShapeIds);
        }
      } else if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        if (activeSheet.selectedShapeIds.length > 0) {
          copyShape(activeSheet.selectedShapeIds);
        }
      } else if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteShape();
      } else if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteSelected, addSheet, undo, redo, cutShape, copyShape, pasteShape, activeSheet, selectAll]);

  if (!activeSheet) {
    return <div>No active sheet found.</div>;
  }

  const { shapesById, shapeIds = [], connectors, selectedShapeIds } = activeSheet;
  const selectedFont = activeSheet.selectedFont;

  const handleDrop = async (e: React.DragEvent) => { // Made async
    e.preventDefault();
    const shapeType = e.dataTransfer.getData('shapeType') || '';
    // Removed: const svgContent = e.dataTransfer.getData('svgContent');
    const textPosition = e.dataTransfer.getData('textPosition') as 'inside' | 'outside';
    const autosize = e.dataTransfer.getData('autosize') === 'true';
    const interactionData = e.dataTransfer.getData('interaction');
    const interaction = interactionData ? JSON.parse(interactionData) : undefined;
    const shapePath = e.dataTransfer.getData('shapePath'); // New: Get shapePath
    if (!shapeType || !shapePath) return; // Ensure shapePath exists

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    let fetchedSvgContent = '';
    try {
      const response = await fetch(shapePath); // Fetch SVG content using shapePath
      fetchedSvgContent = await response.text();
    } catch (error) {
      console.error('Failed to fetch SVG content:', error);
      return; // Abort if SVG content cannot be fetched
    }

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(fetchedSvgContent, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    let color = '#000000'; // default color
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

    const viewBoxMatch = fetchedSvgContent.match(/viewBox="(.*?)"/); // Use fetchedSvgContent
    let minX = 0;
    let minY = 0;
    let originalWidth = 100;
    let originalHeight = 100;
    if (viewBoxMatch && viewBoxMatch[1]) {
      const viewBox = viewBoxMatch[1].split(' ').map(Number);
      minX = viewBox[0];
      minY = viewBox[1];
      originalWidth = viewBox[2] - viewBox[0];
      originalHeight = viewBox[3] - viewBox[1];
    }

    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const fontSize = parseFloat(getComputedStyle(canvasElement).fontSize);
    const targetHeight = 5 * fontSize;

    const aspectRatio = originalWidth / originalHeight;
    const newHeight = targetHeight;
    const newWidth = newHeight * aspectRatio;

    const shapeData = {
      type: shapeType,
      x: (e.clientX - svgRect.left - activeSheet.pan.x) / activeSheet.zoom,
      y: (e.clientY - svgRect.top - activeSheet.pan.y) / activeSheet.zoom,
      width: newWidth,
      height: newHeight,
      text: shapeType,
      color: color,
      layerId: activeSheet.activeLayerId,
      svgContent: fetchedSvgContent, // Use fetchedSvgContent
      minX: minX,
      minY: minY,
      path: shapePath,
      fontFamily: selectedFont,
      textOffsetX: textPosition === 'inside' ? 0 : 0,
      textOffsetY: textPosition === 'inside' ? 0 : newHeight + 5,
      textWidth: newWidth,
      textHeight: 20,
      textPosition: textPosition,
      autosize: autosize,
      interaction: interaction,
    };

    if (interaction?.type === 'embed') {
      setYouTubeShapeData(shapeData);
      setYouTubeUrl(interaction.url);
      setIsYouTubeDialogOpen(true);
    } else {
      const finalShape = getShapeWithCalculatedTextProps(shapeData);
      addShapeAndRecordHistory({ ...finalShape, id: uuidv4() });
    }
  };

  const handleSaveYouTubeUrl = () => {
    if (youTubeUrl.startsWith('https://www.youtube.com/embed/')) {
      if (youTubeShapeData) {
        const calculatedShape = getShapeWithCalculatedTextProps({
          ...youTubeShapeData,
          interaction: { ...youTubeShapeData.interaction!, url: youTubeUrl, type: 'embed' as const },
        });
        addShapeAndRecordHistory({ ...calculatedShape, id: uuidv4() });
      }
      handleCloseYouTubeDialog();
    } else {
      setUrlError(true);
    }
  };

  const handleCloseYouTubeDialog = () => {
    setIsYouTubeDialogOpen(false);
    setYouTubeUrl('');
    setYouTubeShapeData(null);
    setUrlError(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    const shape = activeSheet.shapesById[nodeId];
    const layer = activeSheet.layers[shape.layerId];
    if (shape && layer && layer.isVisible && shape.layerId === activeSheet.activeLayerId) {
      setIsMouseDownOnShape(nodeId);
      const mouseX = (e.clientX - svgRef.current!.getBoundingClientRect().left - activeSheet.pan.x) / activeSheet.zoom;
      const mouseY = (e.clientY - svgRef.current!.getBoundingClientRect().top - activeSheet.pan.y) / activeSheet.zoom;
      setMouseDownPos({ x: mouseX, y: mouseY });

      const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
      const isSelected = activeSheet.selectedShapeIds.includes(nodeId);

      let nextSelectedIds;
      if (isMultiSelect) {
        nextSelectedIds = isSelected
          ? activeSheet.selectedShapeIds.filter((id) => id !== nodeId)
          : [...activeSheet.selectedShapeIds, nodeId];
      } else {
        if (!isSelected) {
          nextSelectedIds = [nodeId];
        } else {
          nextSelectedIds = activeSheet.selectedShapeIds;
        }
      }

      const initialPositions = nextSelectedIds.reduce((acc, id) => {
        const s = shapesById[id];
        if (s) acc[id] = { x: s.x, y: s.y };
        return acc;
      }, {} as { [shapeId: string]: Point });
      setInitialDragPositions(initialPositions);

      setIsPanning(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    if (e.button === 0 && target.dataset.id === 'canvas-background') {
      if (e.ctrlKey || e.metaKey) {
        // Panning with Ctrl/Cmd + Left Click
        e.preventDefault();
        e.stopPropagation();
        setIsPanning(true);
        setStartPan({ x: e.clientX - activeSheet.pan.x, y: e.clientY - activeSheet.pan.y });
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grabbing';
        }
      } else {
        // Selection with Left Click
        setIsSelecting(true);
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;
        const x = (e.clientX - svgRect.left - activeSheet.pan.x) / activeSheet.zoom;
        const y = (e.clientY - svgRect.top - activeSheet.pan.y) / activeSheet.zoom;
        setSelectionStartPoint({ x, y });
        setSelectionRect({ x, y, width: 0, height: 0 });
        setSelectedShapes([]);
        setSelectedConnectors([]); // Deselect connectors when clicking on canvas background
        deselectAllTextBlocks();
      }
    }
  };

  const handleConnectorStart = (nodeId: string, point: Point, anchorType: AnchorType) => {
    const shape = activeSheet.shapesById[nodeId];
    const layer = activeSheet.layers[shape.layerId];
    if (shape && layer && layer.isVisible && shape.layerId === activeSheet.activeLayerId) {
      setIsDrawingConnector(true);
      setStartConnectorNodeId(nodeId);
      setStartConnectorPoint(point);
      setStartConnectorAnchorType(anchorType);
      setCurrentMousePoint(point);
    }
  };

  const handleNodeContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedShapeIds.includes(id)) {
        setSelectedShapes([id]);
    }

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    setContextMenu({
      x: e.clientX - canvasRect.left,
      y: e.clientY - canvasRect.top,
      shapeId: id
    });
  };

  const visibleShapes = shapeIds
    .map(id => shapesById[id])
    .filter(shape => shape && activeSheet.layers[shape.layerId]?.isVisible);

  const visibleConnectors = Object.values(connectors || {}).filter(connector => {
    const startShape = shapesById[connector.startNodeId];
    const endShape = shapesById[connector.endNodeId];
    return startShape && endShape && activeSheet.layers[startShape.layerId]?.isVisible && activeSheet.layers[endShape.layerId]?.isVisible;
  });

  const backgroundSize = 100000;

  return (
    <div ref={canvasRef} className="canvas-container" style={{ backgroundColor: '#f9f9f9', cursor: 'grab' }}>
      <svg
        ref={svgRef}
        className={`canvas-svg ${isPanning ? 'panning' : ''} ${isDrawingConnector ? 'drawing-connector' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#ddd" />
          </pattern>
        </defs>
        <g transform={`translate(${activeSheet.pan.x}, ${activeSheet.pan.y}) scale(${activeSheet.zoom})`}>
        <rect
            data-id="canvas-background"
            x={-backgroundSize / 2}
            y={-backgroundSize / 2}
            width={backgroundSize}
            height={backgroundSize}
            fill="url(#grid-pattern)"
          />
          {(visibleShapes || []).map((shape) => (
            <Node key={shape.id} shape={shape} zoom={activeSheet.zoom} isInteractive={shape.layerId === activeSheet.activeLayerId} isSelected={activeSheet.selectedShapeIds.includes(shape.id)} isConnectorDragTarget={activeSheet.connectorDragTargetShapeId === shape.id} onConnectorStart={handleConnectorStart} onContextMenu={handleNodeContextMenu} onNodeMouseDown={handleNodeMouseDown} activeLayerId={activeSheet.activeLayerId} layers={activeSheet.layers} />
          ))}
          {(visibleConnectors || []).map((connector) => (
            <ConnectorComponent key={connector.id} connector={connector} isSelected={(activeSheet.selectedConnectorIds || []).includes(connector.id)} activeLayerId={activeSheet.activeLayerId} layers={activeSheet.layers} />
          ))}

          {isDrawingConnector && startConnectorPoint && currentMousePoint && (
            <path
              className="connector-path"
              d={(() => {
                if (!startConnectorNodeId || !startConnectorPoint || !currentMousePoint) return '';
                const startShape = activeSheet.shapesById[startConnectorNodeId];
                if (!startShape) return '';

                // Create a dummy target shape at the current mouse point
                const dummyTargetShape: Shape = {
                  id: 'dummy',
                  x: currentMousePoint.x,
                  y: currentMousePoint.y,
                  width: 1, // Minimal width/height for a point
                  height: 1,
                  type: 'dummy',
                  text: '',
                  color: '',
                  layerId: '',
                  svgContent: undefined,
                  minX: undefined,
                  minY: undefined,
                  fontFamily: undefined,
                  fontSize: undefined,
                  textOffsetX: 0,
                  textOffsetY: 0,
                  textWidth: 0,
                  textHeight: 0,
                  isTextSelected: undefined,
                  isBold: undefined,
                  isItalic: undefined,
                  isUnderlined: undefined,
                  verticalAlign: undefined,
                  horizontalAlign: undefined,
                  textPosition: 'inside',
                  textColor: undefined,
                  parentId: undefined,
                  autosize: false,
                  isTextPositionManuallySet: undefined,
                };

                const { path } = calculateConnectionPath(
                  startShape,
                  dummyTargetShape,
                  startConnectorAnchorType!,
                  getAnchorPoint(dummyTargetShape, currentMousePoint!).type,
                  activeSheet.selectedConnectionType || 'direct'
                );
                return path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              })()}
            />
          )}

          {isSelecting && selectionRect && (
            <rect
                className="selection-rect"
                x={selectionRect.x}
                y={selectionRect.y}
                width={selectionRect.width}
                height={selectionRect.height}
                strokeWidth={1 / activeSheet.zoom}
            />
          )}
        </g>
      </svg>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onBringForward={() => bringForward(contextMenu.shapeId)}
          onSendBackward={() => sendBackward(contextMenu.shapeId)}
          onBringToFront={() => bringToFront(contextMenu.shapeId)}
          onSendToBack={() => sendToBack(contextMenu.shapeId)}
        />
      )}
      {isYouTubeDialogOpen && (
        <Dialog open={isYouTubeDialogOpen} onClose={handleCloseYouTubeDialog} PaperProps={{ component: 'form', onSubmit: (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); handleSaveYouTubeUrl(); } }}>
          <DialogTitle>
            Set YouTube URL
            <IconButton
              aria-label="close"
              onClick={handleCloseYouTubeDialog}
              sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="url"
              label="YouTube Embed URL"
              type="url"
              fullWidth
              variant="standard"
              value={youTubeUrl}
              onChange={(e) => setYouTubeUrl(e.target.value)}
              error={urlError}
              helperText={urlError ? "URL must start with https://www.youtube.com/embed/" : ""}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseYouTubeDialog}>Cancel</Button>
            <Button onClick={handleSaveYouTubeUrl}>Save</Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export default Canvas;
