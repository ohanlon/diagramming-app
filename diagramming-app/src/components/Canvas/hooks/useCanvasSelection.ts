// Custom hook for handling canvas selection operations
import { useState, useCallback } from 'react';
import type { Point } from '../../../types';

export interface CanvasSelectionState {
  isSelecting: boolean;
  selectionStartPoint: Point | null;
  selectionRect: { x: number; y: number; width: number; height: number } | null;
}

export interface CanvasSelectionActions {
  startSelection: (point: Point) => void;
  updateSelection: (currentPoint: Point) => void;
  finishSelection: (shapeIds: string[], getShapeById: (id: string) => any) => string[];
  cancelSelection: () => void;
}

export const useCanvasSelection = (
  setSelectedShapes: (ids: string[]) => void
): CanvasSelectionState & CanvasSelectionActions => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartPoint, setSelectionStartPoint] = useState<Point | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const startSelection = useCallback((point: Point) => {
    setIsSelecting(true);
    setSelectionStartPoint(point);
    setSelectionRect({ x: point.x, y: point.y, width: 0, height: 0 });
  }, []);

  const updateSelection = useCallback((currentPoint: Point) => {
    if (selectionStartPoint) {
      const x = Math.min(selectionStartPoint.x, currentPoint.x);
      const y = Math.min(selectionStartPoint.y, currentPoint.y);
      const width = Math.abs(currentPoint.x - selectionStartPoint.x);
      const height = Math.abs(currentPoint.y - selectionStartPoint.y);
      setSelectionRect({ x, y, width, height });
    }
  }, [selectionStartPoint]);

  const finishSelection = useCallback((shapeIds: string[], getShapeById: (id: string) => any): string[] => {
    if (!selectionRect) return [];

    const selectedIds = shapeIds.filter(id => {
      const shape = getShapeById(id);
      if (!shape) return false;

      // Check if shape intersects with selection rectangle
      return (
        shape.x < selectionRect.x + selectionRect.width &&
        shape.x + shape.width > selectionRect.x &&
        shape.y < selectionRect.y + selectionRect.height &&
        shape.y + shape.height > selectionRect.y
      );
    });

    setSelectedShapes(selectedIds);
    
    setIsSelecting(false);
    setSelectionStartPoint(null);
    setSelectionRect(null);
    
    return selectedIds;
  }, [selectionRect, setSelectedShapes]);

  const cancelSelection = useCallback(() => {
    setIsSelecting(false);
    setSelectionStartPoint(null);
    setSelectionRect(null);
  }, []);

  return {
    isSelecting,
    selectionStartPoint,
    selectionRect,
    startSelection,
    updateSelection,
    finishSelection,
    cancelSelection,
  };
};