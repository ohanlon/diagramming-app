import { useState, useRef, useEffect, useCallback } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';

interface UseTextResizerProps {
  shapeId: string;
  initialTextOffsetX: number;
  initialTextOffsetY: number;
  initialTextWidth: number;
  initialTextHeight: number;
  zoom: number;
  isInteractive: boolean;
  autosize?: boolean;
  checkOverflow: () => void;
}

export const useTextResizer = ({
  shapeId,
  initialTextOffsetX,
  initialTextOffsetY,
  initialTextWidth,
  initialTextHeight,
  zoom,
  isInteractive,
  autosize,
  checkOverflow,
}: UseTextResizerProps) => {
  const { updateShapeTextPosition, updateShapeTextDimensions } = useDiagramStore();

  const [currentTextOffsetX, setCurrentTextOffsetX] = useState(initialTextOffsetX);
  const [currentTextOffsetY, setCurrentTextOffsetY] = useState(initialTextOffsetY);
  const [currentTextWidth, setCurrentTextWidth] = useState(initialTextWidth);
  const [currentTextHeight, setCurrentTextHeight] = useState(initialTextHeight);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isResizingText, setIsResizingText] = useState(false);
  const [resizeHandleType, setResizeHandleType] = useState<string | null>(null);
  const initialMousePos = useRef({ x: 0, y: 0 });
  const initialTextRect = useRef({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    setCurrentTextOffsetX(initialTextOffsetX);
    setCurrentTextOffsetY(initialTextOffsetY);
    if (!autosize) {
      setCurrentTextWidth(initialTextWidth);
      setCurrentTextHeight(initialTextHeight);
    }
  }, [initialTextOffsetX, initialTextOffsetY, initialTextWidth, initialTextHeight, autosize]);

  const snapToGrid = useCallback((value: number, gridSize: number) => {
    return Math.round(value / gridSize) * gridSize;
  }, []);

  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isInteractive) return;
    e.stopPropagation();
    setIsDraggingText(true);
    initialMousePos.current = { x: e.clientX, y: e.clientY };
    initialTextRect.current = {
      x: currentTextOffsetX,
      y: currentTextOffsetY,
      width: currentTextWidth,
      height: currentTextHeight,
    };
  }, [isInteractive, currentTextOffsetX, currentTextOffsetY, currentTextWidth, currentTextHeight]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, type: string) => {
    if (!isInteractive) return;
    e.stopPropagation();
    setIsResizingText(true);
    setResizeHandleType(type);
    initialMousePos.current = { x: e.clientX, y: e.clientY };
    initialTextRect.current = {
      x: currentTextOffsetX,
      y: currentTextOffsetY,
      width: currentTextWidth,
      height: currentTextHeight,
    };
  }, [isInteractive, currentTextOffsetX, currentTextOffsetY, currentTextWidth, currentTextHeight]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const gridSize = 10; // Define your grid size here

    if (isDraggingText) {
      const dx = (e.clientX - initialMousePos.current.x) / zoom;
      const dy = (e.clientY - initialMousePos.current.y) / zoom;

      const newX = snapToGrid(initialTextRect.current.x + dx, gridSize);
      const newY = snapToGrid(initialTextRect.current.y + dy, gridSize);

      setCurrentTextOffsetX(newX);
      setCurrentTextOffsetY(newY);
    } else if (isResizingText && resizeHandleType) {
      const dx = (e.clientX - initialMousePos.current.x) / zoom;
      const dy = (e.clientY - initialMousePos.current.y) / zoom;

      let newX = initialTextRect.current.x;
      let newY = initialTextRect.current.y;
      let newWidth = initialTextRect.current.width;
      let newHeight = initialTextRect.current.height;

      switch (resizeHandleType) {
        case 'top-left':
          newX = snapToGrid(initialTextRect.current.x + dx, gridSize);
          newY = snapToGrid(initialTextRect.current.y + dy, gridSize);
          newWidth = snapToGrid(initialTextRect.current.width - dx, gridSize);
          newHeight = snapToGrid(initialTextRect.current.height - dy, gridSize);
          break;
        case 'top':
          newY = snapToGrid(initialTextRect.current.y + dy, gridSize);
          newHeight = snapToGrid(initialTextRect.current.height - dy, gridSize);
          break;
        case 'top-right':
          newY = snapToGrid(initialTextRect.current.y + dy, gridSize);
          newWidth = snapToGrid(initialTextRect.current.width + dx, gridSize);
          newHeight = snapToGrid(initialTextRect.current.height - dy, gridSize);
          break;
        case 'left':
          newX = snapToGrid(initialTextRect.current.x + dx, gridSize);
          newWidth = snapToGrid(initialTextRect.current.width - dx, gridSize);
          break;
        case 'right':
          newWidth = snapToGrid(initialTextRect.current.width + dx, gridSize);
          break;
        case 'bottom-left':
          newX = snapToGrid(initialTextRect.current.x + dx, gridSize);
          newWidth = snapToGrid(initialTextRect.current.width - dx, gridSize);
          newHeight = snapToGrid(initialTextRect.current.height + dy, gridSize);
          break;
        case 'bottom':
          newHeight = snapToGrid(initialTextRect.current.height + dy, gridSize);
          break;
        case 'bottom-right':
          newWidth = snapToGrid(initialTextRect.current.width + dx, gridSize);
          newHeight = snapToGrid(initialTextRect.current.height + dy, gridSize);
          break;
      }

      // Ensure minimum dimensions
      newWidth = Math.max(10, newWidth);
      newHeight = Math.max(10, newHeight);

      setCurrentTextOffsetX(newX);
      setCurrentTextOffsetY(newY);
      setCurrentTextWidth(newWidth);
      setCurrentTextHeight(newHeight);
    }
  }, [isDraggingText, isResizingText, resizeHandleType, zoom, snapToGrid]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingText) {
      setIsDraggingText(false);
      updateShapeTextPosition(shapeId, currentTextOffsetX, currentTextOffsetY);
    } else if (isResizingText) {
      setIsResizingText(false);
      setResizeHandleType(null);
      updateShapeTextDimensions(shapeId, currentTextWidth, currentTextHeight);
      checkOverflow();
    }
  }, [isDraggingText, isResizingText, shapeId, currentTextOffsetX, currentTextOffsetY, currentTextWidth, currentTextHeight, updateShapeTextPosition, updateShapeTextDimensions, checkOverflow]);

  useEffect(() => {
    if (isDraggingText || isResizingText) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingText, isResizingText, handleMouseMove, handleMouseUp]);

  return {
    currentTextOffsetX,
    currentTextOffsetY,
    currentTextWidth,
    currentTextHeight,
    isDraggingText,
    isResizingText,
    handleDragMouseDown,
    handleResizeMouseDown,
  };
};