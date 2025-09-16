import type { Point, Shape, AnchorType } from '../types';

interface OrthogonalPathResult {
  path: Point[];
  sourceConnectionPoint: Point;
  targetConnectionPoint: Point;
  arrowAngle: number;
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
  endAnchorType: AnchorType
): OrthogonalPathResult => {
  const sourceConnectionPoints = getConnectionPoints(sourceShape);
  const targetConnectionPoints = getConnectionPoints(targetShape);

  const startPoint = sourceConnectionPoints[startAnchorType] || { x: sourceShape.x + sourceShape.width / 2, y: sourceShape.y + sourceShape.height / 2 };
  const endPoint = targetConnectionPoints[endAnchorType] || { x: targetShape.x + targetShape.width / 2, y: targetShape.y + targetShape.height / 2 };

  const path = [startPoint, endPoint];

  let arrowAngle: number = 0; // Default to 0 degrees

  if (path.length >= 2) {
    const lastPoint = path[path.length - 1];
    const secondLastPoint = path[path.length - 2];

    const deltaX = lastPoint.x - secondLastPoint.x;
    const deltaY = lastPoint.y - secondLastPoint.y;

    arrowAngle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
  }

  return {
    path: path,
    sourceConnectionPoint: startPoint,
    targetConnectionPoint: endPoint,
    arrowAngle,
  };
};
