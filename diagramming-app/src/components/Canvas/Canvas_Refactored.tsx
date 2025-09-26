// Refactored Canvas component using modular hooks and components
import React, { useRef } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import { useActiveSheet } from '../../hooks/useActiveSheet';
import Node from '../Node/Node';
import ConnectorComponent from '../Connector/Connector';
import ContextMenu from '../ContextMenu/ContextMenu';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// Import our custom hooks
import { useConnectorDrawing } from './hooks/useConnectorDrawing';
import { usePanZoom } from './hooks/usePanZoom';
import { useShapeSelection } from './hooks/useShapeSelection';
import { useYouTubeDialog } from './hooks/useYouTubeDialog';
import { useCanvasEvents } from './hooks/useCanvasEvents';

// Import our components
import SelectionOverlay from './components/SelectionOverlay';
import ConnectorPreview from './components/ConnectorPreview';

// Import utilities
import { calculateShapeWithTextProps } from './utils/canvasUtils';

import './Canvas.less';
import type { Point, AnchorType, Shape } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { getAnchorPoint } from '../../utils/getAnchorPoint';

const Canvas: React.FC = () => {
  // Store and refs
  const {
    addShapeAndRecordHistory,
    addConnector,
    setPan,
    setZoom,
    setSelectedShapes,
    updateShapePositions,
    recordShapeMoves,
    setConnectorDragTargetShapeId,
    setSelectedConnectors,
  } = useDiagramStore();
  
  const activeSheet = useActiveSheet();
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Early return if no active sheet
  if (!activeSheet) {
    return <div>Loading...</div>;
  }

  // Initialize custom hooks
  const connectorDrawing = useConnectorDrawing(addConnector);
  const panZoom = usePanZoom(activeSheet.pan, activeSheet.zoom, setPan, setZoom);
  const selection = useShapeSelection();
  const youtube = useYouTubeDialog();

  // Context menu state (simplified for this refactor)
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; shapeId: string } | null>(null);
  
  const contextMenuActions = {
    closeContextMenu: () => setContextMenu(null),
  };

  // Canvas events
  useCanvasEvents({
    canvasRef,
    activeSheet,
    panZoom,
    selection,
    connectorDrawing,
    youtube,
    contextMenu: contextMenuActions,
  });

  // Event handlers
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left - activeSheet.pan.x) / activeSheet.zoom;
    const canvasY = (e.clientY - rect.top - activeSheet.pan.y) / activeSheet.zoom;

    const shapeData = JSON.parse(e.dataTransfer.getData('application/json'));
    const selectedFont = activeSheet.selectedFont;
    const selectedFontSize = activeSheet.selectedFontSize;

    // Handle YouTube shapes
    if (shapeData.isYouTube) {
      const newShape: Omit<Shape, 'id'> = {
        type: shapeData.type,
        x: canvasX,
        y: canvasY,
        width: 320,
        height: 180,
        text: shapeData.name,
        color: activeSheet.selectedShapeColor,
        layerId: activeSheet.activeLayerId,
        svgContent: shapeData.svgContent,
        fontFamily: selectedFont,
        fontSize: selectedFontSize,
        textOffsetX: 0,
        textOffsetY: 0,
        textWidth: 0,
        textHeight: 0,
        interaction: { type: 'embed', url: '' },
        textPosition: 'inside',
      };

      youtube.openYouTubeDialog(newShape);
      return;
    }

    // Handle regular shapes
    const targetHeight = 5 * selectedFontSize;
    const aspectRatio = shapeData.width / shapeData.height;
    const targetWidth = targetHeight * aspectRatio;

    const newShape: Omit<Shape, 'id'> = {
      type: shapeData.type,
      x: canvasX,
      y: canvasY,
      width: Math.max(targetWidth, 60),
      height: Math.max(targetHeight, 40),
      text: shapeData.name,
      color: activeSheet.selectedShapeColor,
      layerId: activeSheet.activeLayerId,
      svgContent: shapeData.svgContent,
      fontFamily: selectedFont,
      fontSize: selectedFontSize,
      textOffsetX: 0,
      textOffsetY: 0,
      textWidth: 0,
      textHeight: 0,
      textPosition: 'inside',
    };

    const finalShape = calculateShapeWithTextProps({ ...newShape, id: uuidv4() });
    addShapeAndRecordHistory(finalShape);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();

    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mousePos = {
      x: (e.clientX - rect.left - activeSheet.pan.x) / activeSheet.zoom,
      y: (e.clientY - rect.top - activeSheet.pan.y) / activeSheet.zoom,
    };

    selection.setMouseDownOnShape(nodeId, mousePos);

    // Set initial positions for all selected shapes
    const shapesToDrag = activeSheet.selectedShapeIds.includes(nodeId) 
      ? activeSheet.selectedShapeIds 
      : [nodeId];

    const initialPositions: { [shapeId: string]: Point } = {};
    shapesToDrag.forEach(id => {
      const shape = activeSheet.shapesById[id];
      if (shape) {
        initialPositions[id] = { x: shape.x, y: shape.y };
      }
    });

    selection.setInitialDragPositions(initialPositions);

    if (!activeSheet.selectedShapeIds.includes(nodeId)) {
      setSelectedShapes([nodeId]);
      setSelectedConnectors([]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const canvasPoint = {
      x: (e.clientX - rect.left - activeSheet.pan.x) / activeSheet.zoom,
      y: (e.clientY - rect.top - activeSheet.pan.y) / activeSheet.zoom,
    };

    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse button or Ctrl+click for panning
      panZoom.startPanning({ x: e.clientX, y: e.clientY });
    } else if (e.button === 0) {
      // Left mouse button for selection
      selection.startSelection(canvasPoint);
      setSelectedShapes([]);
      setSelectedConnectors([]);
    }
  };

  const handleConnectorStart = (nodeId: string, point: Point, anchorType: AnchorType) => {
    connectorDrawing.startConnectorDrawing(nodeId, point, anchorType);
  };

  const handleNodeContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      shapeId: id,
    });
  };

  return (
    <div className="canvas-container">
      <div
        ref={canvasRef}
        className="canvas"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onMouseDown={handleMouseDown}
        style={{ 
          cursor: panZoom.isPanning ? 'grabbing' : connectorDrawing.isDrawingConnector ? 'crosshair' : 'default',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* Selection Overlay */}
        <SelectionOverlay
          isSelecting={selection.isSelecting}
          selectionRect={selection.selectionRect}
          zoom={activeSheet.zoom}
          pan={activeSheet.pan}
        />

        {/* Connector Preview */}
        <ConnectorPreview
          isDrawingConnector={connectorDrawing.isDrawingConnector}
          startPoint={connectorDrawing.startConnectorPoint}
          currentPoint={connectorDrawing.currentMousePoint}
          connectionType={activeSheet.selectedConnectionType}
          zoom={activeSheet.zoom}
          pan={activeSheet.pan}
        />

        {/* Main SVG Canvas */}
        <svg
          ref={svgRef}
          className="canvas-svg"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <g transform={`translate(${activeSheet.pan.x}, ${activeSheet.pan.y}) scale(${activeSheet.zoom})`}>
            {/* Render connectors */}
            {Object.values(activeSheet.connectors).map((connector) => (
              <ConnectorComponent key={connector.id} connector={connector} />
            ))}
          </g>
        </svg>

        {/* Render shapes */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translate(${activeSheet.pan.x}px, ${activeSheet.pan.y}px) scale(${activeSheet.zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {activeSheet.shapeIds.map((shapeId) => {
            const shape = activeSheet.shapesById[shapeId];
            if (!shape || !activeSheet.layers[shape.layerId]?.isVisible) return null;

            return (
              <Node
                key={shape.id}
                shape={shape}
                isSelected={activeSheet.selectedShapeIds.includes(shape.id)}
                onMouseDown={(e) => handleNodeMouseDown(e, shape.id)}
                onContextMenu={(e) => handleNodeContextMenu(e, shape.id)}
                onConnectorStart={handleConnectorStart}
                connectorDragTargetShapeId={activeSheet.connectorDragTargetShapeId}
              />
            );
          })}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            shapeId={contextMenu.shapeId}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>

      {/* YouTube URL Dialog */}
      <Dialog open={youtube.isYouTubeDialogOpen} onClose={youtube.closeYouTubeDialog}>
        <DialogTitle>
          Enter YouTube URL
          <IconButton
            aria-label="close"
            onClick={youtube.closeYouTubeDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="YouTube URL"
            fullWidth
            variant="outlined"
            value={youtube.youTubeUrl}
            onChange={(e) => youtube.setYouTubeUrl(e.target.value)}
            error={youtube.urlError}
            helperText={youtube.urlError ? "Please enter a valid YouTube URL" : ""}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={youtube.closeYouTubeDialog}>Cancel</Button>
          <Button onClick={() => youtube.validateAndSave(addShapeAndRecordHistory)} variant="contained">
            Add Shape
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Canvas;