import type { Point, Shape, AnchorType } from '../types';

interface OrthogonalPathResult {
  path: Point[];
  sourceConnectionPoint: Point;
  targetConnectionPoint: Point;
  arrowDirection: AnchorType;
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
  allShapes: Shape[],
  startAnchorType: AnchorType,
  endAnchorType: AnchorType
): OrthogonalPathResult => {
  const sourceConnectionPoints = getConnectionPoints(sourceShape);
  const targetConnectionPoints = getConnectionPoints(targetShape);

  const startPoint = sourceConnectionPoints[startAnchorType] || { x: sourceShape.x + sourceShape.width / 2, y: sourceShape.y + sourceShape.height / 2 };
  const endPoint = targetConnectionPoints[endAnchorType] || { x: targetShape.x + targetShape.width / 2, y: targetShape.y + targetShape.height / 2 };

  const path = [startPoint, endPoint];

  // Determine arrow direction based on the last segment of the best path
  let arrowDirection: AnchorType = 'right'; // Default
  if (path.length >= 2) {
    const lastPoint = path[path.length - 1];
    const secondLastPoint = path[path.length - 2];

    if (Math.abs(lastPoint.x - secondLastPoint.x) > Math.abs(lastPoint.y - secondLastPoint.y)) {
      if (lastPoint.x > secondLastPoint.x) {
        arrowDirection = 'right';
      } else {
        arrowDirection = 'left';
      }
    } else {
      if (lastPoint.y > secondLastPoint.y) {
        arrowDirection = 'bottom';
      } else {
        arrowDirection = 'top';
      }
    }
  }

  return {
    path: path,
    sourceConnectionPoint: startPoint,
    targetConnectionPoint: endPoint,
    arrowDirection,
  };
};
