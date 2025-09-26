// Custom hook for handling shape selection operations
import { useState, useCallback } from 'react';
import type { Point, Shape } from '../../../types';

export interface SelectionState {
  isSelecting: boolean;
  selectionStartPoint: Point | null;
  selectionRect: { x: number; y: number; width: number; height: number } | null;
  isMouseDownOnShape: string | null;
  mouseDownPos: Point | null;
  initialDragPositions: { [shapeId: string]: Point } | null;
}

export interface SelectionActions {
  startSelection: (point: Point) => void;
  updateSelection: (point: Point) => void;
  endSelection: (shapesById: Record<string, Shape>) => string[];
  cancelSelection: () => void;
  setMouseDownOnShape: (shapeId: string | null, mousePos?: Point) => void;
  setInitialDragPositions: (positions: { [shapeId: string]: Point }) => void;
  clearInitialDragPositions: () => void;
}

export const useShapeSelection = (): SelectionState & SelectionActions => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartPoint, setSelectionStartPoint] = useState<Point | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isMouseDownOnShape, setIsMouseDownOnShape] = useState<string | null>(null);
  const [mouseDownPos, setMouseDownPos] = useState<Point | null>(null);
  const [initialDragPositions, setInitialDragPositionsState] = useState<{ [shapeId: string]: Point } | null>(null);

  const startSelection = useCallback((point: Point) => {
    setIsSelecting(true);
    setSelectionStartPoint(point);
    setSelectionRect(null);
  }, []);

  const updateSelection = useCallback((point: Point) => {
    if (!selectionStartPoint) return;
    
    const rect = {
      x: Math.min(selectionStartPoint.x, point.x),
      y: Math.min(selectionStartPoint.y, point.y),
      width: Math.abs(point.x - selectionStartPoint.x),
      height: Math.abs(point.y - selectionStartPoint.y),
    };
    
    setSelectionRect(rect);
  }, [selectionStartPoint]);

  const endSelection = useCallback((shapesById: Record<string, Shape>): string[] => {
    if (!selectionRect) {
      setIsSelecting(false);
      setSelectionStartPoint(null);
      return [];
    }
    
    const selectedIds = Object.values(shapesById).filter(shape => {
      return (
        shape.x < selectionRect.x + selectionRect.width &&
        shape.x + shape.width > selectionRect.x &&
        shape.y < selectionRect.y + selectionRect.height &&
        shape.y + shape.height > selectionRect.y
      );
    }).map(shape => shape.id);
    
    setIsSelecting(false);
    setSelectionStartPoint(null);
    setSelectionRect(null);
    
    return selectedIds;
  }, [selectionRect]);

  const cancelSelection = useCallback(() => {
    setIsSelecting(false);
    setSelectionStartPoint(null);
    setSelectionRect(null);
  }, []);

  const setMouseDownOnShape = useCallback((shapeId: string | null, mousePos?: Point) => {
    setIsMouseDownOnShape(shapeId);
    if (mousePos) {
      setMouseDownPos(mousePos);
    }
  }, []);

  const setInitialDragPositions = useCallback((positions: { [shapeId: string]: Point }) => {
    setInitialDragPositionsState(positions);
  }, []);

  const clearInitialDragPositions = useCallback(() => {
    setInitialDragPositionsState(null);
  }, []);

  return {
    isSelecting,
    selectionStartPoint,
    selectionRect,
    isMouseDownOnShape,
    mouseDownPos,
    initialDragPositions,
    startSelection,
    updateSelection,
    endSelection,
    cancelSelection,
    setMouseDownOnShape,
    setInitialDragPositions,
    clearInitialDragPositions,
  };
};