// Selection overlay component for canvas
import React from 'react';
import type { Point } from '../../../types';

interface SelectionOverlayProps {
  isSelecting: boolean;
  selectionRect: { x: number; y: number; width: number; height: number } | null;
  zoom: number;
  pan: Point;
}

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  isSelecting,
  selectionRect,
  zoom,
  pan,
}) => {
  if (!isSelecting || !selectionRect) {
    return null;
  }

  return (
    <div
      className="selection-overlay"
      style={{
        position: 'absolute',
        left: selectionRect.x * zoom + pan.x,
        top: selectionRect.y * zoom + pan.y,
        width: selectionRect.width * zoom,
        height: selectionRect.height * zoom,
        border: '1px dashed #007acc',
        backgroundColor: 'rgba(0, 122, 204, 0.1)',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  );
};

export default SelectionOverlay;