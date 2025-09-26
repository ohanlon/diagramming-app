
import React, { memo } from 'react';
import type { Connector, Layer, Point, LineStyle } from '../../types';
import { useDiagramStore } from '../../store/useDiagramStore';
import { calculateConnectionPath } from '../../utils/connectionAlgorithms';
import { CUSTOM_PATTERN_1_LINE_STYLE, CUSTOM_PATTERN_2_LINE_STYLE, DASHED_LINE_STYLE, DOT_DASH_PATTERN_LINE_STYLE, LONG_DASH_PATTERN_LINE_STYLE, LONG_DASH_SPACE_PATTERN_LINE_STYLE, LONG_SPACE_SHORT_DOT_PATTERN_STYLE } from '../../constants/constant';

const getStrokeDasharray = (lineStyle: LineStyle): string => {
  switch (lineStyle) {
    case 'dashed':
      return DASHED_LINE_STYLE;
    case 'long-dash':
      return LONG_DASH_PATTERN_LINE_STYLE; // Example: longer dashes
    case 'long-dash-space':
      return LONG_DASH_SPACE_PATTERN_LINE_STYLE; // Example: longer dashes
    case 'dot-dash':
      return DOT_DASH_PATTERN_LINE_STYLE; // Example: dot-dash pattern
    case 'custom-1':
      return CUSTOM_PATTERN_1_LINE_STYLE; // Example: custom pattern 1
    case 'custom-2':
      return CUSTOM_PATTERN_2_LINE_STYLE; // Example: custom pattern 2
    case 'long-space-short-dot':
      return LONG_SPACE_SHORT_DOT_PATTERN_STYLE; // Example: long space short dot pattern
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

  // Calculate connection path based on connection type
  const { path } = calculateConnectionPath(
    startNode,
    endNode,
    connector.startAnchorType,
    connector.endAnchorType,
    connector.connectionType || 'direct'
  );

  if (path.length < 2) {
    return null;
  }

  const { lineWidth = 2 } = connector;
  const arrowLength = 5 * lineWidth;
  const shortening = arrowLength * Math.cos(Math.PI / 6);
  const dPath = [...path.map((p: Point) => ({...p}))];
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

  // Generate path string based on connection type
  let d: string;
  if (connector.connectionType === 'bezier' && path.length > 2) {
    // For bezier curves, create a smooth curve by connecting points with smooth curves
    d = `M ${path[0].x} ${path[0].y}`;
    
    // For bezier, the path already contains the curve points, so we can use them directly
    // Connect points with smooth line segments to create the bezier effect
    for (let i = 1; i < path.length; i++) {
      d += ` L ${path[i].x} ${path[i].y}`;
    }
  } else {
    // For direct and orthogonal connections, use line segments
    d = dPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

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
