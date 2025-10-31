import React, { memo, useCallback } from 'react';
import type { Connector, Layer, Point, LineStyle } from '../../types';
import { useDiagramStore } from '../../store/useDiagramStore';
import { calculateConnectionPath } from '../../utils/connectionAlgorithms';
import { CUSTOM_PATTERN_1_LINE_STYLE, CUSTOM_PATTERN_2_LINE_STYLE, DASHED_LINE_STYLE, DOT_DASH_PATTERN_LINE_STYLE, LONG_DASH_PATTERN_LINE_STYLE, LONG_DASH_SPACE_PATTERN_LINE_STYLE, LONG_SPACE_SHORT_DOT_PATTERN_STYLE } from '../../constants/constant';
import ConnectorTextLabel from '../ConnectorTextLabel/ConnectorTextLabel';

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
  const { sheets, activeSheetId, setSelectedConnectors, updateConnectorText, setConnectorTextSelected } = useDiagramStore();
  const activeSheet = sheets?.[activeSheetId];

  if (!activeSheet) return null; // Should not happen if Canvas is rendering correctly

  const { shapesById } = activeSheet;
  const { startNodeId, endNodeId } = connector;

  const startNode = shapesById[startNodeId];
  const endNode = shapesById[endNodeId];

  if (!startNode || !endNode) {
    return null; // Don't render if either node is missing
  }

  const isFaded = startNode.layerId !== activeLayerId || !layers[startNode.layerId]?.isVisible;

  const handleDoubleClick = useCallback(() => {
    // Add text if it doesn't exist, or select if it does
    if (!connector.text) {
      updateConnectorText(connector.id, 'Label');
    }
    setConnectorTextSelected(connector.id, true);
  }, [connector.id, connector.text, updateConnectorText, setConnectorTextSelected]);

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
  let endCircleCenter: Point | null = null;
  let startCircleCenter: Point | null = null;
  const CIRCLE_DIAMETER_BASE = 10; // base diameter at lineWidth = 1
  const circleRadius = (CIRCLE_DIAMETER_BASE * lineWidth) / 2; // scales with line width; zoom will scale via Canvas group's transform

  if (connector.endArrow && connector.endArrow !== 'none') {
    const lastPoint = dPath[dPath.length - 1];
    const secondLastPoint = dPath[dPath.length - 2];
    const dx = lastPoint.x - secondLastPoint.x;
    const dy = lastPoint.y - secondLastPoint.y;
    const angle = Math.atan2(dy, dx);

    const originalEndPoint = path[path.length - 1];
    if (connector.endArrow === 'circle') {
      // Shorten by the circle radius so the circle sits at the tip without overlapping the path
      lastPoint.x -= circleRadius * Math.cos(angle);
      lastPoint.y -= circleRadius * Math.sin(angle);
      endCircleCenter = originalEndPoint;
    } else {
      lastPoint.x -= shortening * Math.cos(angle);
      lastPoint.y -= shortening * Math.sin(angle);
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
  }

  if (connector.startArrow && connector.startArrow !== 'none') {
    const firstPoint = dPath[0];
    const secondPoint = dPath[1];
    const dx = secondPoint.x - firstPoint.x;
    const dy = secondPoint.y - firstPoint.y;
    const angle = Math.atan2(dy, dx);

    const originalStartPoint = path[0];
    if (connector.startArrow === 'circle') {
      firstPoint.x += circleRadius * Math.cos(angle);
      firstPoint.y += circleRadius * Math.sin(angle);
      startCircleCenter = originalStartPoint;
    } else {
      firstPoint.x += shortening * Math.cos(angle);
      firstPoint.y += shortening * Math.sin(angle);
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
        onDoubleClick={handleDoubleClick}
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
        onDoubleClick={handleDoubleClick}
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
      {connector.endArrow === 'circle' && endCircleCenter && (
        <circle cx={endCircleCenter.x} cy={endCircleCenter.y} r={circleRadius} fill="black" />
      )}
      {connector.startArrow === 'circle' && startCircleCenter && (
        <circle cx={startCircleCenter.x} cy={startCircleCenter.y} r={circleRadius} fill="black" />
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
      
      {/* Connector Text Label */}
      {(connector.text || connector.isTextSelected) && (
        <ConnectorTextLabel
          connectorId={connector.id}
          text={connector.text || ''}
          position={connector.textPosition || 0.5}
          offset={connector.textOffset || { x: 0, y: 0 }}
          pathPoints={path}
          fontSize={connector.fontSize || 12}
          fontFamily={connector.fontFamily || 'Arial'}
          textColor={connector.textColor || '#000000'}
          isSelected={connector.isTextSelected || false}
          zoom={activeSheet.zoom}
          isInteractive={true}
        />
      )}
    </g>
  );
});

export default ConnectorComponent;
