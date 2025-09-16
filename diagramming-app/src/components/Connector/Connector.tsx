
import React, { memo } from 'react';
import type { Connector } from '../../types';
import { useDiagramStore } from '../../store/useDiagramStore';
import { calculateOrthogonalPath } from '../../utils/calculateOrthogonalPath';

interface ConnectorProps {
  connector: Connector;
  isSelected: boolean;
}

const ConnectorComponent: React.FC<ConnectorProps> = memo(({ connector, isSelected }) => {
  const { sheets, activeSheetId, setSelectedConnectors } = useDiagramStore();
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
  const { path, arrowAngle } = calculateOrthogonalPath(
    startNode,
    endNode,
    connector.startAnchorType,
    connector.endAnchorType
  );

  // Generate SVG path 'd' attribute from points
  const d = path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const lastPoint = path[path.length - 1];

  return (
    <g>
      <path
        d={d}
        stroke="transparent"
        strokeWidth="12" // Wider transparent stroke for easier clicking
        fill="none"
        role="presentation" // This path is for interaction, not visual
        onClick={() => setSelectedConnectors([connector.id])}
        onMouseEnter={(e) => (e.currentTarget.style.cursor = 'pointer')}
        onMouseLeave={(e) => (e.currentTarget.style.cursor = 'default')}
      />
      <path
        d={d}
        stroke="black"
        strokeWidth={connector.lineWidth || 2}
        fill="none"
        role="graphics-symbol"
        aria-label="Connector between nodes"
        strokeDasharray={connector.lineStyle === 'dashed' ? '8, 4' : connector.lineStyle === 'long-dash' ? '16 8' : connector.lineStyle === 'dot-dash' ? '8 4 1 4' : connector.lineStyle === 'custom-1' ? '16 4 1 4 1 4' : connector.lineStyle === 'custom-2' ? '40 10 20 10' : 'none'}
        onClick={() => setSelectedConnectors([connector.id])}
        onMouseEnter={(e) => (e.currentTarget.style.cursor = 'pointer')}
        onMouseLeave={(e) => (e.currentTarget.style.cursor = 'default')}
      />
      <polygon
        points="0,0 10,3.5 0,7"
        fill="black"
        transform={`translate(${lastPoint.x}, ${lastPoint.y}) rotate(${arrowAngle}) translate(-10, -3.5)`}
      />
      {isSelected && path.length > 0 && (
        <>
          <circle
            cx={path[0].x}
            cy={path[0].y}
            r={8} // Radius of the circle
            fill="none" // Make it hollow
            stroke="blue"
            strokeWidth="2"
          />
          <circle
            cx={path[path.length - 1].x}
            cy={path[path.length - 1].y}
            r={8} // Radius of the circle
            fill="none" // Make it hollow
            stroke="blue"
            strokeWidth="2"
          />
        </>
      )}
    </g>
  );
});

export default ConnectorComponent;
