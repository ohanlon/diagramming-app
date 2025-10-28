import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import './TextResizer.less';
import { useTextResizer } from './useTextResizer';

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
  verticalAlign?: 'top' | 'middle' | 'bottom';
  horizontalAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  autosize?: boolean;
  shapeWidth: number;
  forceEditMode?: boolean;
  onEditComplete?: () => void;
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
  verticalAlign,
  horizontalAlign,
  textColor,
  autosize,
  shapeWidth,
  forceEditMode,
  onEditComplete,
}) => {
  const { updateShapeText, updateShapeDimensions, updateShapeTextDimensions, updateShapeTextPosition, activeSheetId } = useDiagramStore();
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const checkOverflow = useCallback(() => {
    if (textRef.current) {
      const { scrollHeight, clientHeight } = textRef.current;
      setIsOverflowing(scrollHeight > clientHeight);
    }
  }, []);

  const {
    currentTextOffsetX,
    currentTextOffsetY,
    currentTextWidth,
    currentTextHeight,
    isDraggingText,
    isResizingText,
    handleDragMouseDown,
    handleResizeMouseDown,
  } = useTextResizer({
    shapeId,
    initialTextOffsetX,
    initialTextOffsetY,
    initialTextWidth,
    initialTextHeight,
    zoom,
    isInteractive,
    autosize,
    checkOverflow,
    isEditing,
  });

  useEffect(() => {
    if (autosize && textRef.current) {
      const PADDING_HORIZONTAL = 10;
      const PADDING_VERTICAL = 6;

      const state = useDiagramStore.getState();
      const shape = state.sheets[activeSheetId].shapesById[shapeId];
      if (!shape) return;

      const { x, y, width, height, textWidth, textHeight, isTextPositionManuallySet, textOffsetY: shapeTextOffsetY, textPosition, textOffsetX } = shape;

      textRef.current.style.whiteSpace = 'nowrap';
      const newWidth = Math.round(textRef.current.scrollWidth + PADDING_HORIZONTAL);
      textRef.current.style.whiteSpace = 'normal';

      textRef.current.style.width = `${newWidth}px`;
      const newHeight = Math.round(textRef.current.scrollHeight + PADDING_VERTICAL);
      textRef.current.style.width = 'auto';

      if (textPosition === 'inside') {
        if (newWidth !== Math.round(width) || newHeight !== Math.round(height)) {
          updateShapeDimensions(shapeId, x, y, newWidth, newHeight);
        }
      } else {
        if (newWidth !== Math.round(textWidth) || newHeight !== Math.round(textHeight)) {
          updateShapeTextDimensions(shapeId, newWidth, newHeight);
        }
      }

      if (textPosition === 'outside' && !isTextPositionManuallySet) {
        let newTextOffsetX;
        if (horizontalAlign === 'center') {
          newTextOffsetX = (shapeWidth / 2) - (newWidth / 2);
        } else if (horizontalAlign === 'left') {
          newTextOffsetX = 0;
        } else {
          newTextOffsetX = shapeWidth - newWidth;
        }

        if (typeof textOffsetX === 'number' && Math.round(newTextOffsetX) !== Math.round(textOffsetX)) {
          updateShapeTextPosition(shapeId, newTextOffsetX, shapeTextOffsetY);
        }
      }
    }
    checkOverflow();
  }, [text, fontSize, fontFamily, isBold, isItalic, autosize, shapeId, horizontalAlign, shapeWidth, checkOverflow, updateShapeDimensions, updateShapeTextDimensions, updateShapeTextPosition, activeSheetId]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!isInteractive) return;
    e.stopPropagation();
    e.preventDefault();
    setIsEditing(true);
    // Use setTimeout to ensure the state update completes before focusing
    setTimeout(() => {
      if (textRef.current) {
        textRef.current.focus();
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(textRef.current);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }, 0);
  }, [isInteractive]);

  const handleTextBlur = useCallback(() => {
    if (textRef.current) {
      updateShapeText(shapeId, textRef.current.innerText);
    }
    setIsEditing(false);
    if (onEditComplete) {
      onEditComplete();
    }
  }, [shapeId, updateShapeText, onEditComplete]);

  // Enter edit mode when forceEditMode becomes true
  useEffect(() => {
    if (forceEditMode && !isEditing) {
      setIsEditing(true);
      setTimeout(() => {
        if (textRef.current) {
          textRef.current.focus();
          const range = document.createRange();
          range.selectNodeContents(textRef.current);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }, 0);
    }
  }, [forceEditMode, isEditing]);

  const handleTextInput = useCallback((e: React.FormEvent) => {
    if (!isEditing) {
      e.preventDefault();
    }
  }, [isEditing]);

  const handleTextKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isEditing) {
      e.preventDefault();
    }
  }, [isEditing]);

  return (
    <foreignObject
      x={currentTextOffsetX}
      y={currentTextOffsetY}
      width={currentTextWidth}
      height={currentTextHeight}
      className={`text-resizer-foreign-object ${isSelected && isInteractive ? 'selected' : ''} ${isDraggingText ? 'dragging' : ''} ${isResizingText ? 'resizing' : ''}`}
      onMouseDown={isEditing ? undefined : handleDragMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: isInteractive ? (isEditing ? 'text' : isDraggingText ? 'grabbing' : 'grab') : 'default', pointerEvents: isSelected ? 'auto' : 'none' }}
    >
      <div
        className="text-content"
        onBlur={handleTextBlur}
        onInput={handleTextInput}
        onKeyDown={handleTextKeyDown}
        contentEditable={true}
        suppressContentEditableWarning={true}
        ref={textRef}
        style={{
          fontFamily: fontFamily,
          fontSize: fontSize ? `${fontSize}pt` : undefined,
          textAlign: horizontalAlign === 'left' ? 'left' : horizontalAlign === 'center' ? 'center' : 'right',
          wordWrap: 'break-word',
          whiteSpace: 'normal',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          fontWeight: isBold ? 'bold' : 'normal',
          fontStyle: isItalic ? 'italic' : 'normal',
          textDecoration: isUnderlined ? 'underline' : 'none',
          alignItems: verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'middle' ? 'center' : 'flex-end',
          justifyContent: horizontalAlign === 'left' ? 'flex-start' : horizontalAlign === 'center' ? 'center' : 'flex-end',
          color: textColor,
          pointerEvents: isSelected ? 'auto' : 'none',
          userSelect: isEditing ? 'text' : 'none',
          cursor: isEditing ? 'text' : 'inherit',
        }}
      >
        {text}
      </div>

      {isOverflowing && !autosize && (
        <div className="overflow-indicator">...</div>
      )}

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
