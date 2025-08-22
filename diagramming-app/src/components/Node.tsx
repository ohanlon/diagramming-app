import React, { useRef, useState, useEffect, memo } from 'react';
import type { Shape, Point, AnchorType } from '../types';
import { useDiagramStore } from '../store/useDiagramStore';
import './Node.less';

interface NodeProps {
  shape: Shape;
  zoom: number;
  isInteractive: boolean;
  isSelected: boolean;
  onConnectorStart: (nodeId: string, point: Point, anchorType: AnchorType) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

const Node: React.FC<NodeProps> = memo(({ shape, zoom, isInteractive, isSelected, onConnectorStart, onContextMenu }) => {
  const { id, type, x, y, width, height, text, color, svgContent } = shape; // Removed minX, minY
  const { sheets, activeSheetId, updateShapeDimensions, updateShapeDimensionsMultiple, recordShapeResize, recordShapeResizeMultiple, updateShapeText, toggleShapeSelection, setSelectedShapes } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];

  if (!activeSheet) return null; // Should not happen

  const { selectedShapeIds, shapesById } = activeSheet;

  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandleType, setResizeHandleType] = useState<string | null>(null);
  const initialMousePos = useRef({ x: 0, y: 0 }); // For mouse down position
  const initialResizeStates = useRef<{ [key: string]: { x: number; y: number; width: number; height: number } }>({}); // For multi-resizing
  const [isEditingText, setIsEditingText] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isInteractive) return;

    // Handle selection directly in Node.tsx
    if (e.shiftKey) {
      toggleShapeSelection(id);
    } else {
      setSelectedShapes([id]);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, type: string) => {
    if (!isInteractive) return;
    e.stopPropagation(); // Prevent node dragging
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

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

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
  };

  const handleResizeMouseUp = () => {
    if (!isResizing) return;
    setIsResizing(false);
    setResizeHandleType(null);

    if (Object.keys(initialResizeStates.current).length > 1) {
        const finalDimensions = selectedShapeIds.map(shapeId => {
            const shape = shapesById[shapeId];
            return { id: shapeId, x: shape.x, y: shape.y, width: shape.width, height: shape.height };
        });
        recordShapeResizeMultiple(finalDimensions);
    } else {
        recordShapeResize(id, x, y, width, height);
    }
    initialResizeStates.current = {};
  };

  const handleDoubleClick = () => {
    if (!isInteractive) return;
    setIsEditingText(true);
  };

  const handleTextBlur = () => {
    if (textRef.current) {
      updateShapeText(id, textRef.current.innerText);
    }
    setIsEditingText(false);
  };

  const handleNodeContextMenu = (e: React.MouseEvent) => { // Renamed to avoid conflict with prop
    if (!isInteractive) return;
    e.preventDefault(); // Prevent default browser context menu
    e.stopPropagation(); // Prevent canvas context menu
    onContextMenu(e, id); // Call the prop
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
    } else {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  const renderShape = () => {
    if (svgContent) {
      // Inject width="100%" and height="100%" into the SVG tag
      const scaledSvgContent = svgContent.replace(
        /<svg([^>]*)>/,
        '<svg$1 width="100%" height="100%">'
      );

      return (
        <foreignObject x={0} y={0} width={width} height={height}> {/* Changed x, y to 0,0 as foreignObject is relative to g */}
          <div dangerouslySetInnerHTML={{ __html: scaledSvgContent }} style={{ width: '100%', height: '100%' }} />
        </foreignObject>
      );
    }

    const commonProps = {
      x: 0,
      y: 0,
      width: width,
      height: height,
      fill: color,
      stroke: isSelected ? 'blue' : 'black',
      strokeWidth: isSelected ? 2 : 1,
    };

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

  // Calculate new text foreignObject dimensions and position
  const textForeignObjectWidth = width + 40;
  const textForeignObjectX = (width - textForeignObjectWidth) / 2; // Center horizontally relative to shape's width
  const textForeignObjectY = height + 5; // 5 pixels below the shape
  const textForeignObjectHeight = 50; // A reasonable height, can be adjusted or made dynamic

  return (
    <g
      data-node-id={id}
      transform={`translate(${x}, ${y})`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => handleNodeContextMenu(e)} // Call the new handler
      style={{ cursor: isInteractive ? 'grab' : 'default' }}
    >
      {renderShape()}

      {/* New foreignObject for text below the shape */}
      {text && (
        <foreignObject
          x={textForeignObjectX}
          y={textForeignObjectY}
          width={textForeignObjectWidth}
          height={textForeignObjectHeight}
        >
          <div
            ref={textRef}
            contentEditable={isEditingText}
            onBlur={handleTextBlur}
            suppressContentEditableWarning={true}
            className={`shape-text-below ${isEditingText ? 'editing' : ''}`}
            style={{
              textAlign: 'center',
              wordWrap: 'break-word',
              whiteSpace: 'normal',
              overflow: 'hidden',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {text}
          </div>
        </foreignObject>
      )}

      {isSelected && isInteractive && (type !== 'text' || svgContent) && (
        <>
          {/* Resize handles */}
          {/* Top-left corner */}
          <rect x={-5} y={-5} width={10} height={10} fill="blue" stroke="red" strokeWidth="2" cursor="nwse-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')} />
          {/* Top-middle edge */}
          <rect x={width / 2 - 5} y={-5} width={10} height={10} fill="blue" stroke="red" strokeWidth="2" cursor="ns-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'top')} />
          {/* Top-right corner */}
          <rect x={width - 5} y={-5} width={10} height={10} fill="blue" stroke="red" strokeWidth="2" cursor="nesw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')} />
          {/* Middle-left edge */}
          <rect x={-5} y={height / 2 - 5} width={10} height={10} fill="blue" stroke="red" strokeWidth="2" cursor="ew-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'left')} />
          {/* Middle-right edge */}
          <rect x={width - 5} y={height / 2 - 5} width={10} height={10} fill="blue" stroke="red" strokeWidth="2" cursor="ew-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'right')} />
          {/* Bottom-left corner */}
          <rect x={-5} y={height - 5} width={10} height={10} fill="blue" stroke="red" strokeWidth="2" cursor="nesw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')} />
          {/* Bottom-middle edge */}
          <rect x={width / 2 - 5} y={height - 5} width={10} height={10} fill="blue" stroke="red" strokeWidth="2" cursor="ns-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')} />
          {/* Bottom-right corner */}
          <rect x={width - 5} y={height - 5} width={10} height={10} fill="blue" stroke="red" strokeWidth="2" cursor="nwse-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')} />

          {/* Anchor points */}
          {anchorPoints.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={5} // Radius of the anchor point
              fill="green"
              stroke="red"
              strokeWidth="2"
              cursor="crosshair"
              onMouseDown={(e) => {
                e.stopPropagation(); // Prevent node dragging
                onConnectorStart(id, { x: x + point.x, y: y + point.y }, point.type);
              }}
            />
          ))}
        </>
      )}
    </g>
  );
});

export default Node;