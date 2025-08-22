
import type { Point } from '../types';

export function calculateBezierPath(
  start: Point,
  end: Point,
  controlPoint1?: Point,
  controlPoint2?: Point
): string {
  // Default control points for a straight line or simple curve
  const cp1 = controlPoint1 || { x: (start.x + end.x) / 2, y: start.y };
  const cp2 = controlPoint2 || { x: (start.x + end.x) / 2, y: end.y };

  return `M${start.x},${start.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${end.x},${end.y}`;
}
