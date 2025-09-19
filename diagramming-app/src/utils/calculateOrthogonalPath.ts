import type { Point, Shape, AnchorType, ArrowStyle } from '../types';

interface OrthogonalPathResult {
  path: Point[];
  sourceConnectionPoint: Point;
  targetConnectionPoint: Point;
}

const getConnectionPoints = (shape: Shape): { [key in AnchorType]: Point } => {
  const { x, y, width, height } = shape;
  return {
    top: { x: x + width / 2, y: y },
    right: { x: x + width, y: y + height / 2 },
    bottom: { x: x + width / 2, y: y + height },
    left: { x: x, y: y + height / 2 },
  };
};

// --- Main Orthogonal Path Calculation Function ---
export const calculateOrthogonalPath = (
  sourceShape: Shape,
  targetShape: Shape,
  startAnchorType: AnchorType,
  endAnchorType: AnchorType,
  startArrow: ArrowStyle,
  endArrow: ArrowStyle
): OrthogonalPathResult => {
  const sourceConnectionPoints = getConnectionPoints(sourceShape);
  const targetConnectionPoints = getConnectionPoints(targetShape);

  let startPoint = sourceConnectionPoints[startAnchorType] || { x: sourceShape.x + sourceShape.width / 2, y: sourceShape.y + sourceShape.height / 2 };
  let endPoint = targetConnectionPoints[endAnchorType] || { x: targetShape.x + targetShape.width / 2, y: targetShape.y + targetShape.height / 2 };

  const arrowWidth = 10;

  if (startArrow !== 'none') {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
        const ratio = arrowWidth / length;
        startPoint = {
            x: startPoint.x + dx * ratio,
            y: startPoint.y + dy * ratio,
        };
    }
  }

  if (endArrow !== 'none') {
    const dx = startPoint.x - endPoint.x;
    const dy = startPoint.y - endPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
        const ratio = arrowWidth / length;
        endPoint = {
            x: endPoint.x + dx * ratio,
            y: endPoint.y + dy * ratio,
        };
    }
  }

  const path = [startPoint, endPoint];

  return {
    path: path,
    sourceConnectionPoint: startPoint,
    targetConnectionPoint: endPoint,
  };
};
