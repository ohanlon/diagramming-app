
import React, { memo } from 'react';
import type { Connector, Layer, Point } from '../../types';
import { useDiagramStore } from '../../store/useDiagramStore';
import { calculateOrthogonalPath } from '../../utils/calculateOrthogonalPath';

const getStrokeDasharray = (lineStyle: LineStyle): string => {
  switch (lineStyle) {
    case 'dashed':
      return '5, 5';
    case 'long-dash':
      return '10, 5'; // Example: longer dashes
    case 'dot-dash':
      return '2, 3, 10, 3'; // Example: dot-dash pattern
    case 'custom-1':
      return '16, 4, 1, 4, 1, 4'; // Example: custom pattern 1
    case 'custom-2':
      return '40, 10, 20, 10'; // Example: custom pattern 2
    case 'continuous':
    default:
      return 'none';
  }
};

interface ConnectorProps {
  connector: Connector;
  isSelected: boolean;
  activeLayerId: string;
  layers: { [id: string]: Layer };
}

const ConnectorComponent: React.FC<ConnectorProps> = memo(({ connector, isSelected, activeLayerId, layers }) => {
  const { sheets, activeSheetId, setSelectedConnectors, zoom } = useDiagramStore();
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

  if (path.length < 2) {
    return null;
  }

  const { lineWidth = 2 } = connector;
  const arrowLength = 5 * lineWidth;
  const shortening = arrowLength * Math.cos(Math.PI / 6);
  const dPath = [...path.map(p => ({...p}))];
  let endArrowPoints: Point[] = [];
  let startArrowPoints: Point[] = [];

  if (connector.endArrow && connector.endArrow !== 'none') {
    const lastPoint = dPath[dPath.length - 1];
    const secondLastPoint = dPath[dPath.length - 2];
    const dx = lastPoint.x - secondLastPoint.x;
    const dy = lastPoint.y - secondLastPoint.y;
    const angle = Math.atan2(dy, dx);

    lastPoint.x -= shortening * Math.cos(angle);
    lastPoint.y -= shortening * Math.sin(angle);

    const originalEndPoint = path[path.length - 1];
    const p1 = {
      x: originalEndPoint.x - arrowLength * Math.cos(angle - Math.PI / 6),
      y: originalEndPoint.y - arrowLength * Math.sin(angle - Math.PI / 6),
    };
    const p2 = {
      x: originalEndPoint.x - arrowLength * Math.cos(angle + Math.PI / 6),
      y: originalEndPoint.y - arrowLength * Math.sin(angle + Math.PI / 6),
    };
    endArrowPoints = [p1, originalEndPoint, p2];
  }

  if (connector.startArrow && connector.startArrow !== 'none') {
    const firstPoint = dPath[0];
    const secondPoint = dPath[1];
    const dx = secondPoint.x - firstPoint.x;
    const dy = secondPoint.y - firstPoint.y;
    const angle = Math.atan2(dy, dx);

    firstPoint.x += shortening * Math.cos(angle);
    firstPoint.y += shortening * Math.sin(angle);

    const originalStartPoint = path[0];
    const p1 = {
      x: originalStartPoint.x + arrowLength * Math.cos(angle - Math.PI / 6),
      y: originalStartPoint.y + arrowLength * Math.sin(angle - Math.PI / 6),
    };
    const p2 = {
      x: originalStartPoint.x + arrowLength * Math.cos(angle + Math.PI / 6),
      y: originalStartPoint.y + arrowLength * Math.sin(angle + Math.PI / 6),
    };
    startArrowPoints = [p1, originalStartPoint, p2];
  }

  const d = dPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <g style={{ opacity: isFaded ? 0.6 : 1 }}>
      <path
        d={d}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        role="presentation"
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
        strokeDasharray={getStrokeDasharray(connector.lineStyle || 'continuous')}
        onClick={() => setSelectedConnectors([connector.id])}
        onMouseEnter={(e) => (e.currentTarget.style.cursor = 'pointer')}
        onMouseLeave={(e) => (e.currentTarget.style.cursor = 'default')}
      />
      {connector.startArrow === 'polygon_arrow' && startArrowPoints.length > 0 && (
        <polygon points={startArrowPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="black" />
      )}
      {connector.startArrow === 'standard_arrow' && startArrowPoints.length > 0 && (
        <polyline points={startArrowPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="black" strokeWidth={connector.lineWidth || 2} />
      )}
      {connector.endArrow === 'polygon_arrow' && endArrowPoints.length > 0 && (
        <polygon points={endArrowPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="black" />
      )}
      {connector.endArrow === 'standard_arrow' && endArrowPoints.length > 0 && (
        <polyline points={endArrowPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="black" strokeWidth={connector.lineWidth || 2} />
      )}
      {isSelected && path.length > 0 && (
        <>
          <circle
            cx={path[0].x}
            cy={path[0].y}
            r={8}
            fill="none"
            stroke="blue"
            strokeWidth="2"
          />
          <circle
            cx={path[path.length - 1].x}
            cy={path[path.length - 1].y}
            r={8}
            fill="none"
            stroke="blue"
            strokeWidth="2"
          />
        </>
      )}
    </g>
  );
});

export default ConnectorComponent;
