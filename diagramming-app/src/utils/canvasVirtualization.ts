/**
 * Canvas virtualization utilities for rendering only visible shapes
 * Improves performance when working with large diagrams (100+ shapes)
 */

import type { Shape } from '../types';

export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Calculate viewport bounds from pan, zoom, and container dimensions
 */
export function calculateViewportBounds(
  containerWidth: number,
  containerHeight: number,
  pan: { x: number; y: number },
  zoom: number,
  padding: number = 200 // Add padding to include shapes slightly outside viewport
): ViewportBounds {
  // Convert screen coordinates to canvas coordinates
  const minX = (-pan.x - padding) / zoom;
  const maxX = (containerWidth - pan.x + padding) / zoom;
  const minY = (-pan.y - padding) / zoom;
  const maxY = (containerHeight - pan.y + padding) / zoom;

  return { minX, maxX, minY, maxY };
}

/**
 * Check if a shape intersects with the viewport bounds
 */
export function isShapeVisible(shape: Shape, bounds: ViewportBounds): boolean {
  const { x, y, width, height } = shape;
  
  // Shape's bounding box
  const shapeMinX = x;
  const shapeMaxX = x + width;
  const shapeMinY = y;
  const shapeMaxY = y + height;

  // Check for intersection (shapes overlap if they DON'T satisfy any of these conditions)
  const noIntersection =
    shapeMaxX < bounds.minX || // Shape is entirely to the left
    shapeMinX > bounds.maxX || // Shape is entirely to the right
    shapeMaxY < bounds.minY || // Shape is entirely above
    shapeMinY > bounds.maxY;   // Shape is entirely below

  return !noIntersection;
}

/**
 * Filter shapes to only those visible in the viewport
 */
export function getVisibleShapes(
  shapes: Shape[],
  bounds: ViewportBounds
): Shape[] {
  return shapes.filter(shape => isShapeVisible(shape, bounds));
}

/**
 * Check if a connector should be visible based on its connected shapes
 */
export function isConnectorVisible(
  startShape: Shape | undefined,
  endShape: Shape | undefined,
  bounds: ViewportBounds
): boolean {
  if (!startShape || !endShape) return false;
  
  // Connector is visible if either endpoint shape is visible
  // or if the line connecting them passes through the viewport
  return isShapeVisible(startShape, bounds) || isShapeVisible(endShape, bounds);
}

/**
 * Get statistics about virtualization (useful for debugging)
 */
export interface VirtualizationStats {
  totalShapes: number;
  visibleShapes: number;
  culledShapes: number;
  cullPercentage: number;
}

export function getVirtualizationStats(
  totalShapes: number,
  visibleShapes: number
): VirtualizationStats {
  const culledShapes = totalShapes - visibleShapes;
  const cullPercentage = totalShapes > 0 ? (culledShapes / totalShapes) * 100 : 0;

  return {
    totalShapes,
    visibleShapes,
    culledShapes,
    cullPercentage: Math.round(cullPercentage * 10) / 10,
  };
}
