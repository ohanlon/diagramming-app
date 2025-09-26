// Canvas coordinate transformation utilities
import type { Point, Shape } from '../../../types';

/**
 * Convert screen coordinates to canvas coordinates
 */
export const screenToCanvas = (
  screenPoint: Point,
  canvasElement: HTMLElement,
  pan: Point,
  zoom: number
): Point => {
  const rect = canvasElement.getBoundingClientRect();
  return {
    x: (screenPoint.x - rect.left - pan.x) / zoom,
    y: (screenPoint.y - rect.top - pan.y) / zoom,
  };
};

/**
 * Convert canvas coordinates to screen coordinates
 */
export const canvasToScreen = (
  canvasPoint: Point,
  canvasElement: HTMLElement,
  pan: Point,
  zoom: number
): Point => {
  const rect = canvasElement.getBoundingClientRect();
  return {
    x: canvasPoint.x * zoom + pan.x + rect.left,
    y: canvasPoint.y * zoom + pan.y + rect.top,
  };
};

/**
 * Calculate shape dimensions based on text content
 */
export const calculateShapeWithTextProps = (shape: Omit<Shape, 'id'>): Omit<Shape, 'id'> => {
  // Create a temporary div to measure text dimensions
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.visibility = 'hidden';
  tempDiv.style.whiteSpace = 'nowrap';
  tempDiv.style.fontFamily = shape.fontFamily || 'Open Sans';
  tempDiv.style.fontSize = `${shape.fontSize || 10}pt`;
  tempDiv.style.fontWeight = shape.isBold ? 'bold' : 'normal';
  tempDiv.style.fontStyle = shape.isItalic ? 'italic' : 'normal';
  tempDiv.textContent = shape.text || '';

  document.body.appendChild(tempDiv);

  // Get computed dimensions
  // const computedStyle = window.getComputedStyle(tempDiv);
  const textWidth = tempDiv.offsetWidth;
  const textHeight = tempDiv.offsetHeight;
  // const lineHeight = parseFloat(computedStyle.lineHeight) || textHeight;

  document.body.removeChild(tempDiv);

  // Calculate shape dimensions based on content
  const padding = 20;
  const minWidth = 120;
  const minHeight = 60;

  const shapeWidth = Math.max(minWidth, textWidth + padding);
  const shapeHeight = Math.max(minHeight, textHeight + padding);

  return {
    ...shape,
    width: shapeWidth,
    height: shapeHeight,
    textWidth,
    textHeight,
    textPosition: shape.textPosition || 'inside',
  };
};

/**
 * Check if a point is inside a rectangle
 */
export const isPointInRect = (
  point: Point,
  rect: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};

/**
 * Check if two rectangles intersect
 */
export const doRectsIntersect = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

/**
 * Get shapes within a selection rectangle
 */
export const getShapesInSelection = (
  shapesById: Record<string, Shape>,
  selectionRect: { x: number; y: number; width: number; height: number }
): string[] => {
  return Object.values(shapesById)
    .filter(shape => doRectsIntersect(shape, selectionRect))
    .map(shape => shape.id);
};