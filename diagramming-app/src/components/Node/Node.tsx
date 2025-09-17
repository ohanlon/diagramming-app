// import React, { useRef, useState, useEffect, memo, useCallback } from 'react';
// import type { Shape, Point, AnchorType, Layer } from '../../types';
// import { useDiagramStore } from '../../store/useDiagramStore';
// import './Node.less';
// import TextResizer from '../TextResizer/TextResizer';

// interface NodeProps {
//   shape: Shape;
//   zoom: number;
//   isInteractive: boolean;
//   isSelected: boolean;
//   isConnectorDragTarget: boolean;
//   onConnectorStart: (nodeId: string, point: Point, anchorType: AnchorType) => void;
//   onContextMenu: (e: React.MouseEvent, id: string) => void;
//   onNodeMouseDown: (e: React.MouseEvent, id: string) => void;
//   activeLayerId: string;
//   layers: { [id: string]: Layer };
// }

import React, { useRef, useState, useEffect, memo, useCallback } from 'react';
import type { Shape, Point, AnchorType, Layer } from '../../types';
import { useDiagramStore } from '../../store/useDiagramStore';
import './Node.less';
import TextResizer from '../TextResizer/TextResizer';

interface NodeProps {
  shape: Shape;
  zoom: number;
  isInteractive: boolean;
  isSelected: boolean;
  isConnectorDragTarget: boolean;
  onConnectorStart: (nodeId: string, point: Point, anchorType: AnchorType) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onNodeMouseDown: (e: React.MouseEvent, id: string) => void;
  activeLayerId: string;
  layers: { [id: string]: Layer };
}

const Node: React.FC<NodeProps> = memo(({ shape, zoom, isInteractive, isSelected, isConnectorDragTarget, onConnectorStart, onContextMenu, onNodeMouseDown, activeLayerId, layers }) => {
  const { id, type, x, y, width, height, text, color, svgContent, fontFamily, fontSize, isTextSelected, isBold, isItalic, isUnderlined, verticalAlign = 'middle', horizontalAlign = 'center', textPosition = 'outside', textColor, interaction } = shape;
  const { sheets, activeSheetId, updateShapeDimensions, updateShapeDimensionsMultiple, recordShapeResize, recordShapeResizeMultiple, toggleShapeSelection, setSelectedShapes, updateShapeIsTextSelected } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];
  const [isResizing, setIsResizing] = useState(false);

  const [resizeHandleType, setResizeHandleType] = useState<string | null>(null);
  const initialMousePos = useRef({ x: 0, y: 0 });
  const initialResizeStates = useRef<{ [key: string]: { x: number; y: number; width: number; height: number } }>({});

  const textOffsetX = textPosition === 'inside' ? 0 : shape.textOffsetX;
  const textOffsetY = textPosition === 'inside' ? 0 : shape.textOffsetY;
  const textWidth = textPosition === 'inside' ? width : shape.textWidth;
  const textHeight = textPosition === 'inside' ? height : shape.textHeight;


  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !activeSheet) return;

    const dx = (e.clientX - initialMousePos.current.x) / zoom;
    const dy = (e.clientY - initialMousePos.current.y) / zoom;

    const mainInitialState = initialResizeStates.current[id];
    if (!mainInitialState) return;

    let newMainX = mainInitialState.x;
    let newMainY = mainInitialState.y;
    let newMainWidth = mainInitialState.width;
    let newMainHeight = mainInitialState.height;

    switch (resizeHandleType) {
      case 'top-left':
        newMainX += dx;
        newMainY += dy;
        newMainWidth -= dx;
        newMainHeight -= dy;
        break;
      case 'top':
        newMainY += dy;
        newMainHeight -= dy;
        break;
      case 'top-right':
        newMainY += dy;
        newMainWidth += dx;
        newMainHeight -= dy;
        break;
      case 'left':
        newMainX += dx;
        newMainWidth -= dx;
        break;
      case 'right':
        newMainWidth += dx;
        break;
      case 'bottom-left':
        newMainX += dx;
        newMainWidth -= dx;
        newMainHeight += dy;
        break;
      case 'bottom':
        newMainHeight += dy;
        break;
      case 'bottom-right':
        newMainWidth += dx;
        newMainHeight += dy;
        break;
    }

    newMainWidth = Math.max(10, newMainWidth);
    newMainHeight = Math.max(10, newMainHeight);

    if (resizeHandleType?.includes('left')) {
      newMainX = mainInitialState.x + mainInitialState.width - newMainWidth;
    }
    if (resizeHandleType?.includes('top')) {
      newMainY = mainInitialState.y + mainInitialState.height - newMainHeight;
    }

    if (Object.keys(initialResizeStates.current).length > 1) {
      const widthRatio = newMainWidth / mainInitialState.width;
      const heightRatio = newMainHeight / mainInitialState.height;

      const newDimensions = Object.entries(initialResizeStates.current).map(([shapeId, initialState]) => {
        let newWidth = initialState.width * widthRatio;
        let newHeight = initialState.height * heightRatio;
        let newX = initialState.x;
        let newY = initialState.y;

        newWidth = Math.max(10, newWidth);
        newHeight = Math.max(10, newHeight);

        if (resizeHandleType?.includes('left')) {
          newX = initialState.x + initialState.width - newWidth;
        }
        if (resizeHandleType?.includes('top')) {
          newY = initialState.y + initialState.height - newHeight;
        }

        return { id: shapeId, x: newX, y: newY, width: newWidth, height: newHeight };
      });

      updateShapeDimensionsMultiple(newDimensions);

    } else {
      updateShapeDimensions(id, newMainX, newMainY, newMainWidth, newMainHeight);
    }
  }, [isResizing, resizeHandleType, zoom, id, updateShapeDimensions, updateShapeDimensionsMultiple, activeSheet]);

  const handleResizeMouseUp = useCallback(() => {
    if (!isResizing || !activeSheet) return;
    setIsResizing(false);
    setResizeHandleType(null);

    if (Object.keys(initialResizeStates.current).length > 1) {
      const finalDimensions = activeSheet.selectedShapeIds.map(shapeId => {
        const shape = activeSheet.shapesById[shapeId];
        return { id: shapeId, x: shape.x, y: shape.y, width: shape.width, height: shape.height };
      });
      recordShapeResizeMultiple(finalDimensions);
    } else {
      recordShapeResize(id, x, y, width, height);
    }
    initialResizeStates.current = {};
  }, [isResizing, id, x, y, width, height, recordShapeResize, recordShapeResizeMultiple, activeSheet]);

  const handleDoubleClick = useCallback(() => {
    if (!isInteractive) return;
    // No longer using isEditingText state directly here
  }, [isInteractive]);



  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
    } else {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  if (!activeSheet) return null;

  const { selectedShapeIds, shapesById } = activeSheet;

  const isFaded = shape.layerId !== activeLayerId || !layers[shape.layerId]?.isVisible;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isInteractive) return;
    e.stopPropagation();

    // Check if the click originated from the TextResizer
    const target = e.target as HTMLElement;
    if (target.closest('.text-resizer-foreign-object')) {
      // If clicking on text, don't select the shape, let TextResizer handle it
      return;
    }

    const isSelected = activeSheet.selectedShapeIds.includes(id);

    // If not clicking on text, proceed with shape selection
    if (e.ctrlKey || e.metaKey || e.shiftKey) { // Check for Ctrl or Cmd key
      toggleShapeSelection(id);
    } else {
      if (!isSelected) {
        setSelectedShapes([id]);
      }
    }
    updateShapeIsTextSelected(id, false); // Deselect text when shape is clicked
    onNodeMouseDown(e, id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, type: string) => {
    if (!isInteractive) return;
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandleType(type);
    initialMousePos.current = { x: e.clientX, y: e.clientY };

    if (isSelected && selectedShapeIds.length > 1) {
      initialResizeStates.current = selectedShapeIds.reduce((acc: { [key: string]: { x: number; y: number; width: number; height: number } }, shapeId: string) => {
        const shape = shapesById[shapeId];
        if (shape) {
          acc[shapeId] = { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
        }
        return acc;
      }, {} as { [key: string]: { x: number; y: number; width: number; height: number } });
    } else {
      initialResizeStates.current = { [id]: { x, y, width, height } };
    }
  };



  const handleNodeContextMenu = (e: React.MouseEvent) => {
    if (!isInteractive) return;
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, id);
  };

  const renderShape = () => {
    const commonProps = {
      x: 0,
      y: 0,
      width: width,
      height: height,
      fill: color,
      stroke: isSelected ? 'blue' : 'black',
      strokeWidth: isSelected ? 2 : 1,
    };

    if (interaction?.type === 'embed') {
      return (
        <foreignObject x={0} y={0} width={width} height={height}>
          <iframe
            width="100%"
            height="100%"
            src={interaction.url}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={text}
          ></iframe>
        </foreignObject>
      );
    }

    if (svgContent) {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;

      // Apply shape color to SVG content
      const gradients = Array.from(svgElement.querySelectorAll('linearGradient'));
      if (gradients.length > 0) {
        // If the shape has a gradient, do not apply a solid color.
        // The user can modify the gradient later.
      } else {
        const paths = Array.from(svgElement.querySelectorAll('path'));
        paths.forEach(path => {
          if (path.getAttribute('fill')) {
            path.setAttribute('fill', color);
          }
        });
      }

      svgElement.setAttribute('width', '100%');
      svgElement.setAttribute('height', '100%');

      const serializer = new XMLSerializer();
      const scaledSvgContent = serializer.serializeToString(svgElement);

      return (
        <foreignObject x={0} y={0} width={width} height={height}>
          <div dangerouslySetInnerHTML={{ __html: scaledSvgContent }} style={{ width: '100%', height: '100%' }} />
        </foreignObject>
      );
    }

    switch (type) {
      case 'rectangle':
        return <rect {...commonProps} rx={5} ry={5} />;
      case 'circle':
        return (
          <circle
            cx={width / 2}
            cy={height / 2}
            r={Math.min(width, height) / 2}
            {...commonProps}
          />
        );
      case 'diamond':
        return (
          <polygon
            points={`
              ${width / 2},0
              ${width},${height / 2}
              ${width / 2},${height}
              0,${height / 2}
            `}
            {...commonProps}
          />
        );
      case 'text':
        return <rect {...commonProps} fill="none" stroke="none" />;
      default:
        return null;
    }
  };

  const anchorPoints: { x: number; y: number; type: AnchorType }[] = [
    { x: width / 2, y: 0, type: 'top' },
    { x: width, y: height / 2, type: 'right' },
    { x: width / 2, y: height, type: 'bottom' },
    { x: 0, y: height / 2, type: 'left' },
  ];

  const strokeColor = "#1a79eeff";
  const showAnchors = isSelected || isConnectorDragTarget;

  return (
    <g
      data-node-id={id}
      transform={`translate(${x}, ${y})`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleNodeContextMenu}
      style={{ cursor: isInteractive ? 'grab' : 'default', opacity: isFaded ? 0.6 : 1 }}
    >
      {renderShape()}

      {text && textPosition !== 'None' && (
        <TextResizer
          shapeId={id}
          text={text}
          initialTextOffsetX={textOffsetX}
          initialTextOffsetY={textOffsetY}
          initialTextWidth={textWidth}
          initialTextHeight={textHeight}
          fontFamily={fontFamily}
          fontSize={fontSize}
          zoom={zoom}
          isInteractive={isInteractive}
          isSelected={isTextSelected || false}
          onTextSelect={(selected: boolean) => updateShapeIsTextSelected(id, selected)}
          isBold={isBold}
          isItalic={isItalic}
          isUnderlined={isUnderlined}
          verticalAlign={verticalAlign}
          horizontalAlign={horizontalAlign}
          textColor={textColor}
          autosize={shape.autosize}
          shapeWidth={width}
        />
      )}

      {isSelected && isInteractive && (type !== 'text' || svgContent) && (
        <>
          <rect x={-5} y={-5} rx={2} ry={2} width={10} height={10} fill="white" stroke={strokeColor} strokeWidth="1" cursor="nwse-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')} />
          <rect x={width - 5} y={-5} rx={2} ry={2} width={10} height={10} fill="white" stroke={strokeColor} strokeWidth="1" cursor="nesw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')} />
          <rect x={-5} y={height - 5} rx={2} ry={2} width={10} height={10} fill="white" stroke={strokeColor} strokeWidth="1" cursor="nesw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')} />
          <rect x={width - 5} y={height - 5} rx={2} ry={2} width={10} height={10} fill="white" stroke={strokeColor} strokeWidth="1" cursor="nwse-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')} />
        </>
      )}
      {isInteractive && (type !== 'text' || svgContent) && (
        <g className={`anchor-points-container ${showAnchors ? 'visible' : ''}`}>
          {anchorPoints.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={5}
              fill="#9bbfeaff"
              stroke={strokeColor}
              strokeWidth="1"
              cursor="crosshair"
              onMouseDown={(e) => {
                e.stopPropagation();
                onConnectorStart(id, { x: x + point.x, y: y + point.y }, point.type);
              }}
            />
          ))}
        </g>
      )}
    </g>
  );
});

export default Node;
