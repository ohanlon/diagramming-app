// Custom hook for handling all Canvas events
import { useEffect, useCallback } from 'react';
import { useDiagramStore } from '../../../store/useDiagramStore';
import type { Point, Shape } from '../../../types';
import { screenToCanvas } from '../utils/canvasUtils';

interface CanvasEventsProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  activeSheet: any;
  panZoom: any;
  selection: any;
  connectorDrawing: any;
  youtube: any;
  contextMenu: any;
}

export const useCanvasEvents = ({
  canvasRef,
  activeSheet,
  panZoom,
  selection,
  connectorDrawing,
  youtube,
  contextMenu,
}: CanvasEventsProps) => {
  const {
    updateShapePositions,
    recordShapeMoves,
    setSelectedShapes,
    setSelectedConnectors,
    setConnectorDragTargetShapeId,
    deleteSelected,
    undo,
    redo,
    cutShape,
    copyShape,
    pasteShape,
    selectAll,
  } = useDiagramStore();

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const canvasPoint = screenToCanvas(
      { x: e.clientX, y: e.clientY },
      canvasRef.current,
      activeSheet.pan,
      activeSheet.zoom
    );

    // Handle panning
    if (panZoom.isPanning) {
      panZoom.handlePan({ x: e.clientX, y: e.clientY });
      return;
    }

    // Handle connector drawing
    if (connectorDrawing.isDrawingConnector) {
      connectorDrawing.updateMousePoint(canvasPoint);
      return;
    }

    // Handle shape dragging
    if (selection.isMouseDownOnShape && selection.initialDragPositions) {
      const deltaX = canvasPoint.x - (selection.mouseDownPos?.x || 0);
      const deltaY = canvasPoint.y - (selection.mouseDownPos?.y || 0);

      const newPositions = Object.entries(selection.initialDragPositions).map(([id, initialPos]) => ({
        id,
        x: (initialPos as Point).x + deltaX,
        y: (initialPos as Point).y + deltaY,
      }));

      updateShapePositions(newPositions);
      return;
    }

    // Handle selection rectangle
    if (selection.isSelecting) {
      selection.updateSelection(canvasPoint);
    }
  }, [
    canvasRef,
    activeSheet.pan,
    activeSheet.zoom,
    panZoom,
    connectorDrawing,
    selection,
    updateShapePositions,
  ]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (panZoom.isPanning) {
      panZoom.stopPanning();
      return;
    }

    if (selection.isMouseDownOnShape && selection.initialDragPositions) {
      // Record the final positions for history
      const finalPositions = Object.entries(selection.initialDragPositions).map(([id, initialPos]) => {
        const shape = activeSheet.shapesById[id];
        return {
          id,
          x: shape?.x || (initialPos as Point).x,
          y: shape?.y || (initialPos as Point).y,
        };
      });

      recordShapeMoves(finalPositions);
      selection.clearInitialDragPositions();
      selection.setMouseDownOnShape(null);
      return;
    }

    if (selection.isSelecting) {
      const selectedIds = selection.endSelection(activeSheet.shapesById);
      if (selectedIds.length > 0) {
        setSelectedShapes(selectedIds);
        setSelectedConnectors([]);
      }
    }
  }, [
    panZoom,
    selection,
    activeSheet.shapesById,
    recordShapeMoves,
    setSelectedShapes,
    setSelectedConnectors,
  ]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!canvasRef.current) return;

    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const centerPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    panZoom.handleZoom(-e.deltaY / 1000, centerPoint);
  }, [canvasRef, panZoom]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
        case 'x':
          e.preventDefault();
          if (activeSheet.selectedShapeIds.length > 0) {
            cutShape(activeSheet.selectedShapeIds);
          }
          break;
        case 'c':
          e.preventDefault();
          if (activeSheet.selectedShapeIds.length > 0) {
            copyShape(activeSheet.selectedShapeIds);
          }
          break;
        case 'v':
          e.preventDefault();
          pasteShape();
          break;
        case 'a':
          e.preventDefault();
          selectAll();
          break;
      }
    } else {
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          deleteSelected();
          break;
        case 'Escape':
          e.preventDefault();
          connectorDrawing.cancelConnectorDrawing();
          selection.cancelSelection();
          contextMenu.closeContextMenu();
          setConnectorDragTargetShapeId(null);
          break;
      }
    }
  }, [
    undo,
    redo,
    cutShape,
    copyShape,
    pasteShape,
    selectAll,
    deleteSelected,
    activeSheet.selectedShapeIds,
    connectorDrawing,
    selection,
    contextMenu,
    setConnectorDragTargetShapeId,
  ]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (canvasRef.current && !canvasRef.current.contains(event.target as Node)) {
      contextMenu.closeContextMenu();
    }
  }, [canvasRef, contextMenu]);

  // Set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleMouseMove, handleMouseUp, handleWheel, handleKeyDown, handleClickOutside]);

  return {
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleKeyDown,
    handleClickOutside,
  };
};