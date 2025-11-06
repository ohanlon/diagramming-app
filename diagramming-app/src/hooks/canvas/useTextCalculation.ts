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
    const MARGIN_ALLOWANCE = 10; // Extra 10 points beyond shape width
    const TOP_OFFSET = 5; // 5 points below shape for outside text

    // Measure single-line text width
    const singleLineWidth = Math.round(tempDiv.scrollWidth + PADDING_HORIZONTAL);
    
    let calculatedTextWidth = shape.textWidth;
    let calculatedTextHeight = shape.textHeight;
    let calculatedTextOffsetX = shape.textOffsetX;
    let calculatedTextOffsetY = shape.textOffsetY;

    if (shape.textPosition === 'outside') {
      // Set vertical position to 5 points below the shape
      calculatedTextOffsetY = shape.height + TOP_OFFSET;

      // Maximum allowed width is shape width + 10 points
      const maxAllowedWidth = shape.width + MARGIN_ALLOWANCE;

      if (shape.autosize) {
        // autosize = true: Allow wrapping if text is wider than max allowed width
        if (singleLineWidth > maxAllowedWidth) {
          // Text needs to wrap
          tempDiv.style.whiteSpace = 'normal';
          tempDiv.style.width = `${maxAllowedWidth}px`;
          tempDiv.style.wordWrap = 'break-word';
          calculatedTextWidth = maxAllowedWidth;
          calculatedTextHeight = Math.round(tempDiv.scrollHeight + PADDING_VERTICAL);
        } else {
          // Text fits on one line
          calculatedTextWidth = singleLineWidth;
          tempDiv.style.whiteSpace = 'normal';
          tempDiv.style.width = `${singleLineWidth}px`;
          calculatedTextHeight = Math.round(tempDiv.scrollHeight + PADDING_VERTICAL);
        }
      } else {
        // autosize = false: Keep text on one line with ellipsis if needed
        calculatedTextWidth = Math.min(singleLineWidth, maxAllowedWidth);
        tempDiv.style.whiteSpace = 'normal';
        tempDiv.style.width = `${calculatedTextWidth}px`;
        calculatedTextHeight = Math.round(tempDiv.scrollHeight + PADDING_VERTICAL);
      }

      // Center align horizontally (text centered relative to shape)
      if (!shape.isTextPositionManuallySet) {
        calculatedTextOffsetX = (shape.width / 2) - (calculatedTextWidth / 2);
      }
    } else if (shape.textPosition === 'inside') {
      // For inside text, use existing autosize logic
      if (shape.autosize) {
        tempDiv.style.whiteSpace = 'normal';
        tempDiv.style.width = `${singleLineWidth}px`;
        calculatedTextWidth = singleLineWidth;
        calculatedTextHeight = Math.round(tempDiv.scrollHeight + PADDING_VERTICAL);
      }
    }

    document.body.removeChild(tempDiv);

    return {
      ...shape,
      textWidth: calculatedTextWidth,
      textHeight: calculatedTextHeight,
      textOffsetX: calculatedTextOffsetX,
      textOffsetY: calculatedTextOffsetY,
      horizontalAlign: shape.textPosition === 'outside' ? 'center' : shape.horizontalAlign,
      isTextPositionManuallySet: false, // Ensure auto-positioning is enabled for new shapes
    };
  }, []);

  return { getShapeWithCalculatedTextProps };
}
