
import type { Point, Shape, AnchorType } from '../types';

export function getAnchorPoint(shape: Shape, targetPoint: Point): { point: Point; type: AnchorType } {
  const { x, y, width, height } = shape;

  const anchorPoints: { point: Point; type: AnchorType }[] = [
    { point: { x: x + width / 2, y: y }, type: 'top' },
    { point: { x: x + width, y: y + height / 2 }, type: 'right' },
    { point: { x: x + width / 2, y: y + height }, type: 'bottom' },
    { point: { x: x, y: y + height / 2 }, type: 'left' },
  ];

  const firstAnchor = anchorPoints[0];
  let closestAnchor = firstAnchor ?? anchorPoints[anchorPoints.length - 1] ?? { point: { x, y }, type: 'top' as AnchorType };
  let minDistance = Infinity;

  for (const anchor of anchorPoints) {
    const dist = Math.sqrt(
      Math.pow(anchor.point.x - targetPoint.x, 2) +
      Math.pow(anchor.point.y - targetPoint.y, 2)
    );
    if (dist < minDistance) {
      minDistance = dist;
      closestAnchor = anchor;
    }
  }

  return closestAnchor;
}
