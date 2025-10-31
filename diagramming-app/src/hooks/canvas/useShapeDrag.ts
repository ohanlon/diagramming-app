import { useState, useCallback } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import type { Point } from '../../types';

interface UseShapeDragProps {
  activeSheetId: string;
  sheets: any;
}

export function useShapeDrag({ activeSheetId, sheets }: UseShapeDragProps) {
  const [isMouseDownOnShape, setIsMouseDownOnShape] = useState<string | null>(null);
  const [mouseDownPos, setMouseDownPos] = useState<Point | null>(null);
  const [initialDragPositions, setInitialDragPositions] = useState<{ [shapeId: string]: Point } | null>(null);
  const [hasDragStarted, setHasDragStarted] = useState(false);
  
  const { updateShapePosition, updateShapePositions, recordShapeMoves } = useDiagramStore();

  const handleDragStart = useCallback((mousePos: Point, nodeId: string, selectedShapeIds: string[], shapesById: any) => {
    setIsMouseDownOnShape(nodeId);
    document.body.style.userSelect = 'none';
    setMouseDownPos(mousePos);

    const initialPositions = selectedShapeIds.reduce((acc, id) => {
      const shape = shapesById[id];
      if (shape) acc[id] = { x: shape.x, y: shape.y };
      return acc;
    }, {} as { [shapeId: string]: Point });
    
    setInitialDragPositions(initialPositions);
    setHasDragStarted(false);
  }, []);

  const handleDragMove = useCallback((mouseX: number, mouseY: number, selectedShapeIds: string[], snapToGrid: (value: number, gridSize: number) => number, gridSize: number, isSnapEnabled: boolean) => {
    if (!isMouseDownOnShape || !mouseDownPos || !initialDragPositions) return;

    const dx = mouseX - mouseDownPos.x;
    const dy = mouseY - mouseDownPos.y;

    // TODO: Implement command pattern for drag operations
    // For now, mark drag as started when movement exceeds threshold
    if (!hasDragStarted && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
      setHasDragStarted(true);
    }

    if (selectedShapeIds.length > 1) {
      const newPositions = selectedShapeIds.map(id => {
        const initialPos = initialDragPositions[id];
        if (!initialPos) return { id, x: 0, y: 0 }; // Fallback for safety
        return {
          id,
          x: isSnapEnabled ? snapToGrid(initialPos.x + dx, gridSize) : initialPos.x + dx,
          y: isSnapEnabled ? snapToGrid(initialPos.y + dy, gridSize) : initialPos.y + dy,
        };
      });
      updateShapePositions(newPositions);
    } else {
      const initialPos = initialDragPositions[isMouseDownOnShape];
      if (initialPos) {
        updateShapePosition(
          isMouseDownOnShape,
          isSnapEnabled ? snapToGrid(initialPos.x + dx, gridSize) : initialPos.x + dx,
          isSnapEnabled ? snapToGrid(initialPos.y + dy, gridSize) : initialPos.y + dy
        );
      }
    }
  }, [isMouseDownOnShape, mouseDownPos, initialDragPositions, hasDragStarted, sheets, activeSheetId, updateShapePosition, updateShapePositions]);

  const handleDragEnd = useCallback((shapesById: any, selectedShapeIds: string[]) => {
    if (isMouseDownOnShape && initialDragPositions) {
      if (selectedShapeIds.length > 1) {
        const oldPositions = selectedShapeIds.map(id => {
          const initialPos = initialDragPositions[id];
          return { id, x: initialPos?.x || 0, y: initialPos?.y || 0 };
        });
        const finalPositions = selectedShapeIds.map(id => {
          const shape = shapesById[id];
          return { id, x: shape.x, y: shape.y };
        });
        recordShapeMoves(oldPositions, finalPositions);
      } else {
        const initialPos = initialDragPositions[isMouseDownOnShape];
        const shape = shapesById[isMouseDownOnShape];
        if (shape && initialPos) {
          recordShapeMoves(
            [{ id: isMouseDownOnShape, x: initialPos.x, y: initialPos.y }],
            [{ id: isMouseDownOnShape, x: shape.x, y: shape.y }]
          );
        }
      }
    }

    setIsMouseDownOnShape(null);
    setMouseDownPos(null);
    setInitialDragPositions(null);
    setHasDragStarted(false);
    document.body.style.userSelect = '';
  }, [isMouseDownOnShape, initialDragPositions, recordShapeMoves]);

  return {
    isMouseDownOnShape,
    mouseDownPos,
    initialDragPositions,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
}
