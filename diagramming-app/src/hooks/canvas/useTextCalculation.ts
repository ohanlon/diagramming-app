import { useCallback } from 'react';
import type { Shape } from '../../types';

export function useTextCalculation() {
  const getShapeWithCalculatedTextProps = useCallback((shape: Omit<Shape, 'id'>): Omit<Shape, 'id'> => {
    // Create a temporary div to measure text dimensions
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'nowrap';
    tempDiv.style.fontFamily = shape.fontFamily || 'Open Sans';
    tempDiv.style.fontSize = `${shape.fontSize || 10}pt`;
    tempDiv.style.fontWeight = shape.isBold ? 'bold' : 'normal';
    tempDiv.style.fontStyle = shape.isItalic ? 'italic' : 'normal';
    tempDiv.style.textDecoration = shape.isUnderlined ? 'underline' : 'none';
    tempDiv.textContent = shape.text;
    document.body.appendChild(tempDiv);

    const PADDING_HORIZONTAL = 10;
    const PADDING_VERTICAL = 6;

    const newWidth = Math.round(tempDiv.scrollWidth + PADDING_HORIZONTAL);
    tempDiv.style.whiteSpace = 'normal';
    tempDiv.style.width = `${newWidth}px`;
    const newHeight = Math.round(tempDiv.scrollHeight + PADDING_VERTICAL);

    document.body.removeChild(tempDiv);

    let calculatedTextWidth = shape.textWidth;
    let calculatedTextHeight = shape.textHeight;
    let calculatedTextOffsetX = shape.textOffsetX;
    const calculatedTextOffsetY = shape.textOffsetY;

    if (shape.autosize) {
      if (shape.textPosition === 'inside') {
        // If text is inside, shape dimensions should adjust
        // For now, we'll just update text dimensions, shape dimensions will be handled by updateShapeDimensions
        calculatedTextWidth = newWidth;
        calculatedTextHeight = newHeight;
      } else {
        // If text is outside, only text dimensions adjust
        calculatedTextWidth = newWidth;
        calculatedTextHeight = newHeight;
      }

      if (shape.textPosition === 'outside' && !shape.isTextPositionManuallySet) {
        if (shape.horizontalAlign === 'center') {
          calculatedTextOffsetX = (shape.width / 2) - (newWidth / 2);
        } else if (shape.horizontalAlign === 'left') {
          calculatedTextOffsetX = 0;
        } else {
          calculatedTextOffsetX = shape.width - newWidth;
        }
      }
    }

    return {
      ...shape,
      textWidth: calculatedTextWidth,
      textHeight: calculatedTextHeight,
      textOffsetX: calculatedTextOffsetX,
      textOffsetY: calculatedTextOffsetY,
    };
  }, []);

  return { getShapeWithCalculatedTextProps };
}
