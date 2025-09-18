
import React, { memo } from 'react';
import type { Connector, Layer } from '../../types';
import { useDiagramStore } from '../../store/useDiagramStore';
import { calculateOrthogonalPath } from '../../utils/calculateOrthogonalPath';

interface ConnectorProps {
  connector: Connector;
  isSelected: boolean;
  activeLayerId: string;
  layers: { [id: string]: Layer };
}

const ConnectorComponent: React.FC<ConnectorProps> = memo(({ connector, isSelected, activeLayerId, layers }) => {
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

  const isFaded = startNode.layerId !== activeLayerId || !layers[startNode.layerId]?.isVisible;

  // Calculate orthogonal path
  const { path } = calculateOrthogonalPath(
    startNode,
    endNode,
    connector.startAnchorType,
    connector.endAnchorType
  );

  // Generate SVG path 'd' attribute from points
  const d = path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const standardArrowId = `arrowhead_standard_${connector.id}`;
  const polygonArrowId = `arrowhead_polygon_${connector.id}`;

  return (
    <g style={{ opacity: isFaded ? 0.6 : 1 }}>
      <defs>
        <marker
          id={standardArrowId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
        </marker>
        <marker
          id={polygonArrowId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <polygon points="0,0 10,3.5 0,7" fill="black" />
        </marker>
      </defs>
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
        markerStart={connector.startArrow === 'standard_arrow' ? `url(#${standardArrowId})` : connector.startArrow === 'polygon_arrow' ? `url(#${polygonArrowId})` : 'none'}
        markerEnd={connector.endArrow === 'standard_arrow' ? `url(#${standardArrowId})` : connector.endArrow === 'polygon_arrow' ? `url(#${polygonArrowId})` : 'none'}
        onClick={() => setSelectedConnectors([connector.id])}
        onMouseEnter={(e) => (e.currentTarget.style.cursor = 'pointer')}
        onMouseLeave={(e) => (e.currentTarget.style.cursor = 'default')}
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
