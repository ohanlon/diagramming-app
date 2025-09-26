import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import type { Point } from '../../types';

interface ConnectorTextLabelProps {
  connectorId: string;
  text: string;
  position: number; // 0-1 along the path
  offset: { x: number; y: number };
  pathPoints: Point[];
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  isSelected?: boolean;
  zoom: number;
  isInteractive: boolean;
}

// Function to get point on path at given position (0-1)
const getPointOnPath = (points: Point[], position: number): Point => {
  if (points.length < 2) return points[0] || { x: 0, y: 0 };
  
  // Calculate total path length
  let totalLength = 0;
  const segments: { start: Point; end: Point; length: number }[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    segments.push({ start, end, length });
    totalLength += length;
  }
  
  // Find position along path
  const targetLength = totalLength * position;
  let currentLength = 0;
  
  for (const segment of segments) {
    if (currentLength + segment.length >= targetLength) {
      const segmentPosition = (targetLength - currentLength) / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * segmentPosition,
        y: segment.start.y + (segment.end.y - segment.start.y) * segmentPosition,
      };
    }
    currentLength += segment.length;
  }
  
  return points[points.length - 1];
};

const ConnectorTextLabel: React.FC<ConnectorTextLabelProps> = ({
  connectorId,
  text,
  position,
  offset,
  pathPoints,
  fontSize = 12,
  fontFamily = 'Arial',
  textColor = '#000000',
  isSelected = false,
  zoom,
  isInteractive,
}) => {
  const { updateConnectorText, updateConnectorTextPosition, setConnectorTextSelected } = useDiagramStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Point>({ x: 0, y: 0 });
  const [initialOffset, setInitialOffset] = useState<Point>({ x: 0, y: 0 });
  const textRef = useRef<HTMLDivElement>(null);

  // Calculate position on path
  const pathPoint = getPointOnPath(pathPoints, position);
  const finalX = pathPoint.x + offset.x;
  const finalY = pathPoint.y + offset.y;

  const handleDoubleClick = useCallback(() => {
    if (!isInteractive) return;
    setIsEditing(true);
    setConnectorTextSelected(connectorId, true);
  }, [isInteractive, connectorId, setConnectorTextSelected]);

  const handleTextBlur = useCallback(() => {
    if (textRef.current) {
      const newText = textRef.current.innerText;
      if (newText !== text) {
        updateConnectorText(connectorId, newText);
      }
    }
    setIsEditing(false);
    setConnectorTextSelected(connectorId, false);
  }, [connectorId, text, updateConnectorText, setConnectorTextSelected]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isInteractive || isEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setInitialOffset({ ...offset });
    setConnectorTextSelected(connectorId, true);
  }, [isInteractive, isEditing, offset, connectorId, setConnectorTextSelected]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const dx = (e.clientX - dragStartPos.x) / zoom;
    const dy = (e.clientY - dragStartPos.y) / zoom;
    
    const newOffset = {
      x: initialOffset.x + dx,
      y: initialOffset.y + dy,
    };

    updateConnectorTextPosition(connectorId, position, newOffset);
  }, [isDragging, dragStartPos, zoom, initialOffset, position, connectorId, updateConnectorTextPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTextBlur();
    }
  }, [handleTextBlur]);

  if (!text && !isEditing) return null;

  return (
    <foreignObject
      x={finalX - 50}
      y={finalY - 10}
      width={100}
      height={20}
      style={{ 
        cursor: isInteractive ? (isDragging ? 'grabbing' : 'grab') : 'default',
        pointerEvents: isSelected || isInteractive ? 'auto' : 'none',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div
        ref={textRef}
        contentEditable={isEditing}
        suppressContentEditableWarning={true}
        onBlur={handleTextBlur}
        onKeyDown={handleKeyDown}
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          color: textColor,
          background: isSelected ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
          border: isSelected ? '1px solid #2196f3' : 'none',
          borderRadius: '2px',
          padding: '2px 4px',
          minWidth: '20px',
          minHeight: '16px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          outline: 'none',
          userSelect: isEditing ? 'text' : 'none',
        }}
      >
        {text || (isEditing ? 'Label' : '')}
      </div>
    </foreignObject>
  );
};

export default ConnectorTextLabel;