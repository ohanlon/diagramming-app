// Connector preview component for canvas
import React from 'react';
import type { Point, AnchorType } from '../../../types';
import { calculateConnectionPath } from '../../../utils/connectionAlgorithms';

interface ConnectorPreviewProps {
  isDrawingConnector: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  connectionType: 'direct' | 'orthogonal' | 'bezier';
  zoom: number;
  pan: Point;
}

const ConnectorPreview: React.FC<ConnectorPreviewProps> = ({
  isDrawingConnector,
  startPoint,
  currentPoint,
  connectionType,
  zoom,
  pan,
}) => {
  if (!isDrawingConnector || !startPoint || !currentPoint) {
    return null;
  }

  // Create temporary shapes for path calculation
  const startShape = {
    id: 'temp-start',
    type: 'rectangle',
    x: startPoint.x - 5,
    y: startPoint.y - 5,
    width: 10,
    height: 10,
    text: '',
    color: '',
    layerId: '',
    textPosition: 'inside' as const,
    textOffsetX: 0,
    textOffsetY: 0,
    textWidth: 0,
    textHeight: 0,
  };

  const endShape = {
    id: 'temp-end',
    type: 'rectangle',
    x: currentPoint.x - 5,
    y: currentPoint.y - 5,
    width: 10,
    height: 10,
    text: '',
    color: '',
    layerId: '',
    textPosition: 'inside' as const,
    textOffsetX: 0,
    textOffsetY: 0,
    textWidth: 0,
    textHeight: 0,
  };

  const result = calculateConnectionPath(
    startShape,
    endShape,
    'right' as AnchorType,
    'left' as AnchorType,
    connectionType
  );

  // Convert path points to SVG path string
  const pathData = result.path.reduce((acc, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    } else {
      return `${acc} L ${point.x} ${point.y}`;
    }
  }, '');

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    >
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        <path
          d={pathData}
          stroke="#007acc"
          strokeWidth={2}
          fill="none"
          strokeDasharray="5,5"
        />
      </g>
    </svg>
  );
};

export default ConnectorPreview;