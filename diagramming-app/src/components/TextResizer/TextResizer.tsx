import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import './TextResizer.less';

interface TextResizerProps {
  shapeId: string;
  text: string;
  initialTextOffsetX: number;
  initialTextOffsetY: number;
  initialTextWidth: number;
  initialTextHeight: number;
  fontFamily?: string;
  fontSize?: number;
  zoom: number;
  isInteractive: boolean;
  isSelected: boolean;
  onTextSelect?: (selected: boolean) => void;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderlined?: boolean;
}

const TextResizer: React.FC<TextResizerProps> = ({
  shapeId,
  text,
  initialTextOffsetX,
  initialTextOffsetY,
  initialTextWidth,
  initialTextHeight,
  fontFamily,
  fontSize,
  zoom,
  isInteractive,
  isSelected,
  isBold,
  isItalic,
  isUnderlined,
}) => {
  const { updateShapeTextPosition, updateShapeTextDimensions, updateShapeText } = useDiagramStore();
  const [currentTextOffsetX, setCurrentTextOffsetX] = useState(initialTextOffsetX);
  const [currentTextOffsetY, setCurrentTextOffsetY] = useState(initialTextOffsetY);
  const [currentTextWidth, setCurrentTextWidth] = useState(initialTextWidth);
  const [currentTextHeight, setCurrentTextHeight] = useState(initialTextHeight);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isResizingText, setIsResizingText] = useState(false);
  const [resizeHandleType, setResizeHandleType] = useState<string | null>(null);
  const initialMousePos = useRef({ x: 0, y: 0 });
  const initialTextRect = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  const textRef = useRef<HTMLDivElement>(null);

  // Update state when props change (e.g., when shape is moved or resized by other means)
  useEffect(() => {
    setCurrentTextOffsetX(initialTextOffsetX);
    setCurrentTextOffsetY(initialTextOffsetY);
    setCurrentTextWidth(initialTextWidth);
    setCurrentTextHeight(initialTextHeight);
  }, [initialTextOffsetX, initialTextOffsetY, initialTextWidth, initialTextHeight]);

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
    }
  }, [isDraggingText, isResizingText, shapeId, currentTextOffsetX, currentTextOffsetY, currentTextWidth, currentTextHeight, updateShapeTextPosition, updateShapeTextDimensions]);

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

  const handleDoubleClick = useCallback(() => {
    if (!isInteractive) return;
    // No longer using isEditingText state directly here
  }, [isInteractive]);

  const handleTextBlur = useCallback(() => {
    if (textRef.current) {
      updateShapeText(shapeId, textRef.current.innerText);
    }
    // No longer using isEditingText state directly here
  }, [shapeId, updateShapeText]);

  return (
    <foreignObject
      x={currentTextOffsetX}
      y={currentTextOffsetY}
      width={currentTextWidth}
      height={currentTextHeight}
      className={`text-resizer-foreign-object ${isSelected && isInteractive ? 'selected' : ''} ${isDraggingText ? 'dragging' : ''} ${isResizingText ? 'resizing' : ''}`}
      onMouseDown={handleDragMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: isInteractive ? (isDraggingText ? 'grabbing' : 'grab') : 'default' }}
    >
      <div
        className="text-content"
        onBlur={handleTextBlur}
        contentEditable={true}
        suppressContentEditableWarning={true}
        ref={textRef}
        style={{
          fontFamily: fontFamily,
          fontSize: fontSize ? `${fontSize}pt` : undefined,
          textAlign: 'center',
          wordWrap: 'break-word',
          whiteSpace: 'normal',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: isBold ? 'bold' : 'normal',
          fontStyle: isItalic ? 'italic' : 'normal',
          textDecoration: isUnderlined ? 'underline' : 'none',
        }}
      >
        {text}
      </div>

      {isSelected && isInteractive && (
        <>
          {/* Resize Handles */}
          <div className="resize-handle top-left" onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')} />
          <div className="resize-handle top" onMouseDown={(e) => handleResizeMouseDown(e, 'top')} />
          <div className="resize-handle top-right" onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')} />
          <div className="resize-handle left" onMouseDown={(e) => handleResizeMouseDown(e, 'left')} />
          <div className="resize-handle right" onMouseDown={(e) => handleResizeMouseDown(e, 'right')} />
          <div className="resize-handle bottom-left" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')} />
          <div className="resize-handle bottom" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')} />
          <div className="resize-handle bottom-right" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')} />
        </>
      )}
    </foreignObject>
  );
};

export default TextResizer;