import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import Node from '../Node/Node';
import ConnectorComponent from '../Connector/Connector';
import ContextMenu from '../ContextMenu/ContextMenu';
import type { Point, AnchorType, Shape } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { getAnchorPoint } from '../../utils/getAnchorPoint';
import { calculateConnectionPath } from '../../utils/connectionAlgorithms';
import './Canvas.less';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import {
  useShapeDrag,
  useCanvasPan,
  useCanvasZoom,
  useBoxSelection,
  useConnectorDrawing,
  useAutoScroll,
  useContextMenu,
  useCanvasKeyboard,
  useTextCalculation,
} from '../../hooks/canvas';

const Canvas: React.FC = () => {
  const {
    sheets,
    activeSheetId,
    addShapeAndRecordHistory,
    addConnector,
    setPan,
    setZoom,
    setSelectedShapes,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    deselectAllTextBlocks,
    setConnectorDragTargetShapeId,
    deleteSelected,
    undo,
    redo,
    cutShape,
    copyShape,
    pasteShape,
    setSelectedConnectors,
    selectAll,
    isSnapToGridEnabled,
  } = useDiagramStore();

  const activeSheet = sheets[activeSheetId];
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [editingTextShapeId, setEditingTextShapeId] = useState<string | null>(null);
  const [isYouTubeDialogOpen, setIsYouTubeDialogOpen] = useState(false);
  const [youTubeUrl, setYouTubeUrl] = useState('');
  const [youTubeShapeData, setYouTubeShapeData] = useState<Omit<Shape, 'id'> | null>(null);
  const [urlError, setUrlError] = useState(false);

  const { getShapeWithCalculatedTextProps } = useTextCalculation();

  // Custom hooks for canvas interactions
  const { startAutoScroll, stopAutoScroll, updateMousePosition } = useAutoScroll({ canvasRef });
  
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();
  
  const shapeDrag = useShapeDrag({ activeSheetId, sheets });
  
  const canvasPan = useCanvasPan({
    setPan,
    currentPan: activeSheet?.pan || { x: 0, y: 0 },
  });
  
  const { handleZoom } = useCanvasZoom({
    setZoom,
    setPan,
    currentZoom: activeSheet?.zoom || 1,
    currentPan: activeSheet?.pan || { x: 0, y: 0 },
  });
  
  const boxSelection = useBoxSelection();
  
  const connectorDrawing = useConnectorDrawing();

  // Keyboard shortcuts
  useCanvasKeyboard({
    deleteSelected,
    undo,
    redo,
    cutShape,
    copyShape,
    pasteShape,
    selectAll,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    deselectAllTextBlocks,
    selectedShapeIds: activeSheet?.selectedShapeIds || [],
  });

  const snapToGrid = (value: number, gridSize: number) => {
    return Math.round(value / gridSize) * gridSize;
  };

  const GRID_SIZE = 20;

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!activeSheet) return;

      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;

      const mouseX = (e.clientX - svgRect.left - activeSheet.pan.x) / activeSheet.zoom;
      const mouseY = (e.clientY - svgRect.top - activeSheet.pan.y) / activeSheet.zoom;

      if (canvasPan.isPanning) {
        canvasPan.handlePanMove(e.clientX, e.clientY);
      } else if (connectorDrawing.isDrawingConnector) {
        connectorDrawing.handleConnectorMove({ x: mouseX, y: mouseY });

        const targetElement = document.elementFromPoint(e.clientX, e.clientY);
        const targetNodeG = targetElement?.closest('g[data-node-id]');
        const hoveredShapeId = targetNodeG ? targetNodeG.getAttribute('data-node-id') : null;

        if (hoveredShapeId !== activeSheet.connectorDragTargetShapeId) {
          setConnectorDragTargetShapeId(hoveredShapeId);
        }
      } else if (boxSelection.isSelecting) {
        boxSelection.handleSelectionMove({ x: mouseX, y: mouseY });
      } else if (shapeDrag.isMouseDownOnShape && shapeDrag.mouseDownPos) {
        shapeDrag.handleDragMove(
          mouseX,
          mouseY,
          activeSheet.selectedShapeIds,
          snapToGrid,
          GRID_SIZE,
          isSnapToGridEnabled
        );

        // Auto-scroll
        updateMousePosition(e.clientX, e.clientY);
        const SCROLL_MARGIN = 50;
        const isNearEdge =
          e.clientX - svgRect.left < SCROLL_MARGIN ||
          svgRect.right - e.clientX < SCROLL_MARGIN ||
          e.clientY - svgRect.top < SCROLL_MARGIN ||
          svgRect.bottom - e.clientY < SCROLL_MARGIN;

        if (isNearEdge) {
          startAutoScroll(e.clientX, e.clientY);
        } else {
          stopAutoScroll();
        }
      }
    },
    [
      activeSheet,
      canvasPan,
      connectorDrawing,
      boxSelection,
      shapeDrag,
      isSnapToGridEnabled,
      setConnectorDragTargetShapeId,
      updateMousePosition,
      startAutoScroll,
      stopAutoScroll,
    ]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!activeSheet) return;

      if (canvasPan.isPanning) {
        canvasPan.handlePanEnd();
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grab';
        }
      } else if (connectorDrawing.isDrawingConnector) {
        const targetElement = e.target as SVGElement;
        const targetNodeG = targetElement.closest('g[data-node-id]');
        const endNodeId = targetNodeG ? targetNodeG.getAttribute('data-node-id') : null;
        const endShape = endNodeId ? activeSheet.shapesById[endNodeId] : undefined;
        const endAnchorType = endShape ? getAnchorPoint(endShape, { x: 0, y: 0 }).type : null;

        connectorDrawing.handleConnectorEnd(endNodeId, endAnchorType, (startNodeId, endNodeId, startAnchor, endAnchor) => {
          addConnector({
            id: uuidv4(),
            startNodeId,
            endNodeId,
            startAnchorType: startAnchor,
            endAnchorType: endAnchor,
          });
        });
        setConnectorDragTargetShapeId(null);
      } else if (boxSelection.isSelecting) {
        boxSelection.handleSelectionEnd(activeSheet.shapesById, setSelectedShapes);
      }

      if (shapeDrag.isMouseDownOnShape) {
        shapeDrag.handleDragEnd(activeSheet.shapesById, activeSheet.selectedShapeIds);
      }

      stopAutoScroll();
    },
    [
      activeSheet,
      canvasPan,
      connectorDrawing,
      boxSelection,
      shapeDrag,
      addConnector,
      setConnectorDragTargetShapeId,
      setSelectedShapes,
      stopAutoScroll,
    ]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!activeSheet) return;
      e.preventDefault();

      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;

      if (e.ctrlKey) {
        handleZoom(e.deltaY, e.clientX, e.clientY, svgRect);
      } else {
        setPan({
          x: activeSheet.pan.x - e.deltaX,
          y: activeSheet.pan.y - e.deltaY,
        });
      }
    },
    [activeSheet, handleZoom, setPan]
  );

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

  if (!activeSheet) {
    return <div>No active sheet found.</div>;
  }

  const { shapesById, shapeIds = [], connectors, selectedShapeIds } = activeSheet;
  const selectedFont = activeSheet.selectedFont;
  const serverUrl = useDiagramStore((state) => state.serverUrl) || 'http://localhost:4000';

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const shapeType = e.dataTransfer.getData('shapeType') || '';
    const textPosition = e.dataTransfer.getData('textPosition') as 'inside' | 'outside';
    const autosize = e.dataTransfer.getData('autosize') === 'true';
    const interactionData = e.dataTransfer.getData('interaction');
    const interaction = interactionData ? JSON.parse(interactionData) : undefined;
    const shapePath = e.dataTransfer.getData('shapePath');
    if (!shapeType || !shapePath) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    let fetchUrl = shapePath;
    if (!fetchUrl.startsWith('http://') && !fetchUrl.startsWith('https://')) {
      if (fetchUrl.startsWith('/')) {
        fetchUrl = `${serverUrl}${fetchUrl}`;
      } else {
        fetchUrl = `${serverUrl}/shapes/${fetchUrl.replace(/^\//, '')}`;
      }
    }

    let fetchedSvgContent = '';
    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        const text = await response.text().catch(() => '<failed to read response text>');
        console.error(`Failed to fetch SVG content from ${fetchUrl}: ${response.status} ${response.statusText} - ${text}`);
        return;
      }
      fetchedSvgContent = await response.text();
    } catch (error) {
      console.error('Failed to fetch SVG content:', error);
      return;
    }

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(fetchedSvgContent, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    let color = '#000000';
    const gradients = Array.from(svgElement.querySelectorAll('linearGradient'));
    if (gradients.length > 0 && gradients[0]) {
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

    const viewBoxMatch = fetchedSvgContent.match(/viewBox="(.*?)"/);  
    let minX = 0;
    let minY = 0;
    let originalWidth = 100;
    let originalHeight = 100;
    if (viewBoxMatch && viewBoxMatch[1]) {
      const viewBox = viewBoxMatch[1].split(' ').map(Number);
      if (viewBox.length === 4 && viewBox[0] !== undefined && viewBox[1] !== undefined && viewBox[2] !== undefined && viewBox[3] !== undefined) {
        minX = viewBox[0];
        minY = viewBox[1];
        originalWidth = viewBox[2] - viewBox[0];
        originalHeight = viewBox[3] - viewBox[1];
      }
    }    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempSvg.setAttribute('style', 'position: absolute; visibility: hidden;');
    tempSvg.setAttribute('width', String(originalWidth));
    tempSvg.setAttribute('height', String(originalHeight));
    tempSvg.innerHTML = svgElement.innerHTML;
    document.body.appendChild(tempSvg);

    let actualBBox = { x: minX, y: minY, width: originalWidth, height: originalHeight };
    try {
      if (tempSvg.children.length > 0) {
        const firstChild = tempSvg.children[0] as SVGGraphicsElement;
        if (firstChild && typeof firstChild.getBBox === 'function') {
          const bbox = firstChild.getBBox();
          if (bbox && bbox.width > 0 && bbox.height > 0) {
            actualBBox = bbox;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to get SVG bounding box, using viewBox dimensions', e);
    }
    document.body.removeChild(tempSvg);

    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const fontSize = parseFloat(getComputedStyle(canvasElement).fontSize);
    const targetHeight = 5 * fontSize;

    const aspectRatio = actualBBox.width / actualBBox.height;
    const newHeight = targetHeight;
    const newWidth = newHeight * aspectRatio;

    minX = actualBBox.x;
    minY = actualBBox.y;

    const shapeData = {
      type: shapeType,
      x: (e.clientX - svgRect.left - activeSheet.pan.x) / activeSheet.zoom,
      y: (e.clientY - svgRect.top - activeSheet.pan.y) / activeSheet.zoom,
      width: newWidth,
      height: newHeight,
      text: shapeType,
      color: color,
      layerId: activeSheet.activeLayerId,
      svgContent: fetchedSvgContent,
      minX: minX,
      minY: minY,
      path: fetchUrl,
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
    if (youTubeUrl.startsWith('https://www.youtube.com/')) {
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
    if (!shape) return;
    const layer = activeSheet.layers[shape.layerId];
    if (shape && layer && layer.isVisible && shape.layerId === activeSheet.activeLayerId) {
      const mouseX = (e.clientX - svgRef.current!.getBoundingClientRect().left - activeSheet.pan.x) / activeSheet.zoom;
      const mouseY = (e.clientY - svgRef.current!.getBoundingClientRect().top - activeSheet.pan.y) / activeSheet.zoom;

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

      shapeDrag.handleDragStart({ x: mouseX, y: mouseY }, nodeId, nextSelectedIds, shapesById);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    if (e.button === 0 && target.dataset.id === 'canvas-background') {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        canvasPan.handlePanStart(e.clientX, e.clientY);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grabbing';
        }
      } else {
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;
        const x = (e.clientX - svgRect.left - activeSheet.pan.x) / activeSheet.zoom;
        const y = (e.clientY - svgRect.top - activeSheet.pan.y) / activeSheet.zoom;
        boxSelection.handleSelectionStart({ x, y });
        setSelectedShapes([]);
        setSelectedConnectors([]);
        deselectAllTextBlocks();
      }
    }
  };

  const handleConnectorStart = (nodeId: string, point: Point, anchorType: AnchorType) => {
    const shape = activeSheet.shapesById[nodeId];
    if (!shape) return;
    const layer = activeSheet.layers[shape.layerId];
    if (shape && layer && layer.isVisible && shape.layerId === activeSheet.activeLayerId) {
      connectorDrawing.handleConnectorStart(nodeId, point, anchorType);
    }
  };

  const handleNodeContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedShapeIds.includes(id)) {
      setSelectedShapes([id]);
    }

    handleContextMenu(e.clientX, e.clientY, id);
  };

  const visibleShapes = shapeIds
    .map((id) => shapesById[id])
    .filter((shape): shape is Shape => !!shape && (activeSheet.layers[shape.layerId]?.isVisible ?? false));

  const visibleConnectors = Object.values(connectors || {}).filter((connector) => {
    const startShape = shapesById[connector.startNodeId];
    const endShape = shapesById[connector.endNodeId];
    return startShape && endShape && activeSheet.layers[startShape.layerId]?.isVisible && activeSheet.layers[endShape.layerId]?.isVisible;
  });

  const backgroundSize = 100000;

  return (
    <div ref={canvasRef} className="canvas-container" style={{ backgroundColor: '#f9f9f9', cursor: 'grab' }}>
      <svg
        ref={svgRef}
        className={`canvas-svg ${canvasPan.isPanning ? 'panning' : ''} ${connectorDrawing.isDrawingConnector ? 'drawing-connector' : ''}`}
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
          <rect data-id="canvas-background" x={-backgroundSize / 2} y={-backgroundSize / 2} width={backgroundSize} height={backgroundSize} fill="url(#grid-pattern)" />
          {(visibleShapes || []).map((shape) => (
            <Node
              key={shape.id}
              shape={shape}
              zoom={activeSheet.zoom}
              isInteractive={shape.layerId === activeSheet.activeLayerId}
              isSelected={activeSheet.selectedShapeIds.includes(shape.id)}
              isConnectorDragTarget={activeSheet.connectorDragTargetShapeId === shape.id}
              onConnectorStart={handleConnectorStart}
              onContextMenu={handleNodeContextMenu}
              onNodeMouseDown={handleNodeMouseDown}
              activeLayerId={activeSheet.activeLayerId}
              layers={activeSheet.layers}
              isEditingText={editingTextShapeId === shape.id}
              onTextEditComplete={() => setEditingTextShapeId(null)}
            />
          ))}
          {(visibleConnectors || []).map((connector) => (
            <ConnectorComponent key={connector.id} connector={connector} isSelected={(activeSheet.selectedConnectorIds || []).includes(connector.id)} activeLayerId={activeSheet.activeLayerId} layers={activeSheet.layers} />
          ))}

          {connectorDrawing.isDrawingConnector && connectorDrawing.startConnectorPoint && connectorDrawing.currentMousePoint && (
            <path
              className="connector-path"
              d={(() => {
                if (!connectorDrawing.startConnectorNodeId || !connectorDrawing.startConnectorPoint || !connectorDrawing.currentMousePoint) return '';
                const startShape = activeSheet.shapesById[connectorDrawing.startConnectorNodeId];
                if (!startShape) return '';

                const dummyTargetShape: Shape = {
                  id: 'dummy',
                  x: connectorDrawing.currentMousePoint.x,
                  y: connectorDrawing.currentMousePoint.y,
                  width: 1,
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
                  connectorDrawing.startConnectorAnchorType!,
                  getAnchorPoint(dummyTargetShape, connectorDrawing.currentMousePoint!).type,
                  activeSheet.selectedConnectionType || 'direct'
                );
                return path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              })()}
            />
          )}

          {boxSelection.isSelecting && boxSelection.selectionRect && (
            <rect className="selection-rect" x={boxSelection.selectionRect.x} y={boxSelection.selectionRect.y} width={boxSelection.selectionRect.width} height={boxSelection.selectionRect.height} strokeWidth={1 / activeSheet.zoom} />
          )}
        </g>
      </svg>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onBringForward={() => bringForward(contextMenu.shapeId)}
          onSendBackward={() => sendBackward(contextMenu.shapeId)}
          onBringToFront={() => bringToFront(contextMenu.shapeId)}
          onSendToBack={() => sendToBack(contextMenu.shapeId)}
          onCut={() => cutShape(activeSheet.selectedShapeIds)}
          onCopy={() => copyShape(activeSheet.selectedShapeIds)}
          onPaste={pasteShape}
          onUndo={undo}
          onRedo={redo}
          onEditDescription={() => setEditingTextShapeId(contextMenu.shapeId)}
        />
      )}
      {isYouTubeDialogOpen && (
        <Dialog
          open={isYouTubeDialogOpen}
          onClose={handleCloseYouTubeDialog}
          PaperProps={{
            component: 'form',
            onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              handleSaveYouTubeUrl();
            },
          }}
        >
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
              helperText={urlError ? 'URL must start with https://www.youtube.com/embed/' : ''}
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
