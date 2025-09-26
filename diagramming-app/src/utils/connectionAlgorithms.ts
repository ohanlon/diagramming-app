import type { Point, Shape, AnchorType, ConnectionType } from '../types';

interface ConnectionResult {
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

// Direct line connection (straight line)
const calculateDirectPath = (
  sourceShape: Shape,
  targetShape: Shape,
  startAnchorType: AnchorType,
  endAnchorType: AnchorType
): ConnectionResult => {
  const sourceConnectionPoints = getConnectionPoints(sourceShape);
  const targetConnectionPoints = getConnectionPoints(targetShape);

  const startPoint = sourceConnectionPoints[startAnchorType];
  const endPoint = targetConnectionPoints[endAnchorType];

  return {
    path: [startPoint, endPoint],
    sourceConnectionPoint: startPoint,
    targetConnectionPoint: endPoint,
  };
};

// Orthogonal connection with 90-degree angles
const calculateOrthogonalPathInternal = (
  sourceShape: Shape,
  targetShape: Shape,
  startAnchorType: AnchorType,
  endAnchorType: AnchorType
): ConnectionResult => {
  const sourceConnectionPoints = getConnectionPoints(sourceShape);
  const targetConnectionPoints = getConnectionPoints(targetShape);

  const startPoint = sourceConnectionPoints[startAnchorType];
  const endPoint = targetConnectionPoints[endAnchorType];

  const path: Point[] = [startPoint];

  // Calculate intermediate points to create orthogonal (90-degree) segments
  const midDistance = 50; // Minimum distance for intermediate segments

  // Determine the routing based on anchor positions
  if (startAnchorType === 'right' && endAnchorType === 'left') {
    // Right to left - horizontal then vertical then horizontal
    const midX = startPoint.x + Math.max(midDistance, (endPoint.x - startPoint.x) / 2);
    path.push({ x: midX, y: startPoint.y });
    path.push({ x: midX, y: endPoint.y });
  } else if (startAnchorType === 'left' && endAnchorType === 'right') {
    // Left to right - horizontal then vertical then horizontal
    const midX = startPoint.x - Math.max(midDistance, (startPoint.x - endPoint.x) / 2);
    path.push({ x: midX, y: startPoint.y });
    path.push({ x: midX, y: endPoint.y });
  } else if (startAnchorType === 'bottom' && endAnchorType === 'top') {
    // Bottom to top - vertical then horizontal then vertical
    const midY = startPoint.y + Math.max(midDistance, (endPoint.y - startPoint.y) / 2);
    path.push({ x: startPoint.x, y: midY });
    path.push({ x: endPoint.x, y: midY });
  } else if (startAnchorType === 'top' && endAnchorType === 'bottom') {
    // Top to bottom - vertical then horizontal then vertical
    const midY = startPoint.y - Math.max(midDistance, (startPoint.y - endPoint.y) / 2);
    path.push({ x: startPoint.x, y: midY });
    path.push({ x: endPoint.x, y: midY });
  } else if ((startAnchorType === 'right' || startAnchorType === 'left') && 
             (endAnchorType === 'top' || endAnchorType === 'bottom')) {
    // Horizontal start to vertical end
    path.push({ x: endPoint.x, y: startPoint.y });
  } else if ((startAnchorType === 'top' || startAnchorType === 'bottom') && 
             (endAnchorType === 'right' || endAnchorType === 'left')) {
    // Vertical start to horizontal end
    path.push({ x: startPoint.x, y: endPoint.y });
  } else {
    // For same-side or complex cases, create a simple L-shaped path
    if (Math.abs(endPoint.x - startPoint.x) > Math.abs(endPoint.y - startPoint.y)) {
      // Go horizontal first
      path.push({ x: endPoint.x, y: startPoint.y });
    } else {
      // Go vertical first
      path.push({ x: startPoint.x, y: endPoint.y });
    }
  }

  path.push(endPoint);

  return {
    path,
    sourceConnectionPoint: startPoint,
    targetConnectionPoint: endPoint,
  };
};

// Bezier curve connection with smooth curves
const calculateBezierPath = (
  sourceShape: Shape,
  targetShape: Shape,
  startAnchorType: AnchorType,
  endAnchorType: AnchorType
): ConnectionResult => {
  const sourceConnectionPoints = getConnectionPoints(sourceShape);
  const targetConnectionPoints = getConnectionPoints(targetShape);

  const startPoint = sourceConnectionPoints[startAnchorType];
  const endPoint = targetConnectionPoints[endAnchorType];

  // Calculate control points based on anchor directions
  const distance = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2));
  const controlDistance = Math.min(distance * 0.4, 150); // Adaptive control point distance

  let controlPoint1: Point;
  let controlPoint2: Point;

  // Calculate control points based on anchor types for natural curves
  switch (startAnchorType) {
    case 'right':
      controlPoint1 = { x: startPoint.x + controlDistance, y: startPoint.y };
      break;
    case 'left':
      controlPoint1 = { x: startPoint.x - controlDistance, y: startPoint.y };
      break;
    case 'bottom':
      controlPoint1 = { x: startPoint.x, y: startPoint.y + controlDistance };
      break;
    case 'top':
      controlPoint1 = { x: startPoint.x, y: startPoint.y - controlDistance };
      break;
  }

  switch (endAnchorType) {
    case 'right':
      controlPoint2 = { x: endPoint.x + controlDistance, y: endPoint.y };
      break;
    case 'left':
      controlPoint2 = { x: endPoint.x - controlDistance, y: endPoint.y };
      break;
    case 'bottom':
      controlPoint2 = { x: endPoint.x, y: endPoint.y + controlDistance };
      break;
    case 'top':
      controlPoint2 = { x: endPoint.x, y: endPoint.y - controlDistance };
      break;
  }

  // Generate bezier curve points
  const bezierPoints: Point[] = [];
  const numPoints = 20; // Number of points to generate along the curve

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const point = calculateBezierPoint(startPoint, controlPoint1, controlPoint2, endPoint, t);
    bezierPoints.push(point);
  }

  return {
    path: bezierPoints,
    sourceConnectionPoint: startPoint,
    targetConnectionPoint: endPoint,
  };
};

// Calculate a point on a cubic bezier curve
const calculateBezierPoint = (
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point => {
  const invT = 1 - t;
  const invT2 = invT * invT;
  const invT3 = invT2 * invT;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: invT3 * p0.x + 3 * invT2 * t * p1.x + 3 * invT * t2 * p2.x + t3 * p3.x,
    y: invT3 * p0.y + 3 * invT2 * t * p1.y + 3 * invT * t2 * p2.y + t3 * p3.y,
  };
};

// Main function to calculate path based on connection type
export const calculateConnectionPath = (
  sourceShape: Shape,
  targetShape: Shape,
  startAnchorType: AnchorType,
  endAnchorType: AnchorType,
  connectionType: ConnectionType = 'direct'
): ConnectionResult => {
  switch (connectionType) {
    case 'orthogonal':
      return calculateOrthogonalPathInternal(sourceShape, targetShape, startAnchorType, endAnchorType);
    case 'bezier':
      return calculateBezierPath(sourceShape, targetShape, startAnchorType, endAnchorType);
    case 'direct':
    default:
      return calculateDirectPath(sourceShape, targetShape, startAnchorType, endAnchorType);
  }
};

// Keep the original export for backward compatibility
export const calculateOrthogonalPath = calculateOrthogonalPathInternal;