
import React, { memo } from 'react';
import type { Connector, Point, Shape, AnchorType } from '../../types';
import { calculateBezierPath } from '../../utils/calculateBezierPath';
import { useDiagramStore } from '../../store/useDiagramStore';

// Helper function to get the absolute point of an anchor on a shape
const getPointFromAnchorType = (shape: Shape, anchorType: AnchorType): Point => {
  const { x, y, width, height } = shape;
  switch (anchorType) {
    case 'top':
      return { x: x + width / 2, y: y };
    case 'right':
      return { x: x + width, y: y + height / 2 };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x: x, y: y + height / 2 };
  }
};

interface ConnectorProps {
  connector: Connector;
}

const ConnectorComponent: React.FC<ConnectorProps> = memo(({ connector }) => {
  const { sheets, activeSheetId } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];

  if (!activeSheet) return null; // Should not happen if Canvas is rendering correctly

  const { shapesById } = activeSheet;
  const { startNodeId, endNodeId, startAnchorType, endAnchorType } = connector;

  const startNode = shapesById[startNodeId];
  const endNode = shapesById[endNodeId];

  if (!startNode || !endNode) {
    return null; // Don't render if either node is missing
  }

  // Calculate dynamic start and end points for the connector based on anchor types
  const startPoint = getPointFromAnchorType(startNode, startAnchorType);
  const endPoint = getPointFromAnchorType(endNode, endAnchorType);

  const d = calculateBezierPath(startPoint, endPoint);

  return (
    <g>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="0"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="black" />
        </marker>
      </defs>
      <path
        d={d}
        stroke="black"
        strokeWidth="2"
        fill="none"
        role="graphics-symbol"
        aria-label="Connector between nodes"
        markerEnd="url(#arrowhead)"
      />
    </g>
  );
});

export default ConnectorComponent;
