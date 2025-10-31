import { useState, useCallback } from 'react';
import type { Point } from '../../types';

export function useBoxSelection() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartPoint, setSelectionStartPoint] = useState<Point | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleSelectionStart = useCallback((point: Point) => {
    setIsSelecting(true);
    setSelectionStartPoint(point);
    setSelectionRect(null);
  }, []);

  const handleSelectionMove = useCallback((currentPoint: Point) => {
    if (!isSelecting || !selectionStartPoint) return;

    const x = Math.min(selectionStartPoint.x, currentPoint.x);
    const y = Math.min(selectionStartPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - selectionStartPoint.x);
    const height = Math.abs(currentPoint.y - selectionStartPoint.y);
    
    setSelectionRect({ x, y, width, height });
  }, [isSelecting, selectionStartPoint]);

  const handleSelectionEnd = useCallback((shapesById: any, setSelectedShapes: (ids: string[]) => void) => {
    if (isSelecting && selectionRect) {
      const selectedIds = Object.keys(shapesById).filter((id) => {
        const shape = shapesById[id];
        const shapeRect = {
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
        };
        return (
          shapeRect.x < selectionRect.x + selectionRect.width &&
          shapeRect.x + shapeRect.width > selectionRect.x &&
          shapeRect.y < selectionRect.y + selectionRect.height &&
          shapeRect.y + shapeRect.height > selectionRect.y
        );
      });
      setSelectedShapes(selectedIds);
    }

    setIsSelecting(false);
    setSelectionStartPoint(null);
    setSelectionRect(null);
  }, [isSelecting, selectionRect]);

  return {
    isSelecting,
    selectionRect,
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
  };
}
