
import React, { memo } from 'react';
import type { Connector } from '../../types';
import { useDiagramStore } from '../../store/useDiagramStore';
import { calculateOrthogonalPath } from '../../utils/calculateOrthogonalPath';

interface ConnectorProps {
  connector: Connector;
}

const ConnectorComponent: React.FC<ConnectorProps> = memo(({ connector }) => {
  const { sheets, activeSheetId } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];

  if (!activeSheet) return null; // Should not happen if Canvas is rendering correctly

  const { shapesById } = activeSheet;
  const { startNodeId, endNodeId } = connector;

  const startNode = shapesById[startNodeId];
  const endNode = shapesById[endNodeId];

  if (!startNode || !endNode) {
    return null; // Don't render if either node is missing
  }

  // Calculate orthogonal path
  const { path, arrowDirection } = calculateOrthogonalPath(
    startNode,
    endNode,
    Object.values(shapesById), // Pass all shapes for obstacle avoidance
    connector.startAnchorType,
    connector.endAnchorType
  );

  // Generate SVG path 'd' attribute from points
  const d = path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  let markerId = "arrowhead-right"; // Default

  if (arrowDirection === 'top') {
    markerId = "arrowhead-up";
  } else if (arrowDirection === 'bottom') {
    markerId = "arrowhead-down";
  } else if (arrowDirection === 'left') {
    markerId = "arrowhead-left";
  }

  return (
    <g>
      <path
        d={d}
        stroke="black"
        strokeWidth="2"
        fill="none"
        role="graphics-symbol"
        aria-label="Connector between nodes"
        markerEnd={`url(#${markerId})`}
      />
    </g>
  );
});

export default ConnectorComponent;
