import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import Node from '../Node/Node';
import ConnectorComponent from '../Connector/Connector';
import ContextMenu from '../ContextMenu/ContextMenu';
import type { Point, AnchorType } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { getAnchorPoint } from '../../utils/getAnchorPoint';
import { calculateBezierPath } from '../../utils/calculateBezierPath';
import './Canvas.less';

const Canvas: React.FC = () => {
  const { sheets, activeSheetId, addShape, addConnector, setPan, setZoom, setSelectedShapes, bringForward, sendBackward, bringToFront, sendToBack, updateShapePosition, updateShapePositions, recordShapeMoves, deselectAllTextBlocks } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan] = useState({ x: 0, y: 0 });
  const [isDrawingConnector, setIsDrawingConnector] = useState(false);
  const [startConnectorPoint, setStartConnectorPoint] = useState<Point | null>(null);
  const [startConnectorNodeId, setStartConnectorNodeId] = useState<string | null>(null);
  const [startConnectorAnchorType, setStartConnectorAnchorType] = useState<AnchorType | null>(null);
  const [currentMousePoint, setCurrentMousePoint] = useState<Point | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; shapeId: string } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartPoint, setSelectionStartPoint] = useState<Point | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isMouseDownOnShape, setIsMouseDownOnShape] = useState<string | null>(null);
  const [mouseDownPos, setMouseDownPos] = useState<Point | null>(null);
  const [initialDragPositions, setInitialDragPositions] = useState<{ [shapeId: string]: Point } | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeSheet) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const mouseX = (e.clientX - svgRect.left - activeSheet.pan.x) / activeSheet.zoom;
    const mouseY = (e.clientY - svgRect.top - activeSheet.pan.y) / activeSheet.zoom;

    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (isDrawingConnector) {
      setCurrentMousePoint({ x: mouseX, y: mouseY });
    } else if (isSelecting && selectionStartPoint) {
      const x = Math.min(selectionStartPoint.x, mouseX);
      const y = Math.min(selectionStartPoint.y, mouseY);
      const width = Math.abs(selectionStartPoint.x - mouseX);
      const height = Math.abs(selectionStartPoint.y - mouseY);
      setSelectionRect({ x, y, width, height });
    } else if (isMouseDownOnShape && mouseDownPos && initialDragPositions) {
        const dx = mouseX - mouseDownPos.x;
        const dy = mouseY - mouseDownPos.y;

        if (activeSheet.selectedShapeIds.length > 1) {
            const newPositions = activeSheet.selectedShapeIds.map(id => {
                const initialPos = initialDragPositions[id];
                return { id, x: initialPos.x + dx, y: initialPos.y + dy };
            });
            updateShapePositions(newPositions);
        } else {
            const initialPos = initialDragPositions[isMouseDownOnShape];
            if (initialPos) {
                updateShapePosition(isMouseDownOnShape, initialPos.x + dx, initialPos.y + dy);
            }
        }
    }
  }, [activeSheet, isPanning, startPan, setPan, isDrawingConnector, isSelecting, selectionStartPoint, isMouseDownOnShape, mouseDownPos, initialDragPositions, updateShapePositions, updateShapePosition]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!activeSheet) return;

    if (isPanning) {
      setIsPanning(false);
    }
    else if (isDrawingConnector) {
      setIsDrawingConnector(false);
      setStartConnectorPoint(null);
      setStartConnectorNodeId(null);
      setStartConnectorAnchorType(null);
      setCurrentMousePoint(null);

      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;

      const mouseX = (e.clientX - svgRect.left - activeSheet.pan.x) / activeSheet.zoom;
      const mouseY = (e.clientY - svgRect.top - activeSheet.pan.y) / activeSheet.zoom;
      const endPoint = { x: mouseX, y: mouseY };

      const targetElement = e.target as SVGElement;
      const targetNodeG = targetElement.closest('g[data-node-id]');

      if (targetNodeG) {
        const endNodeId = targetNodeG.getAttribute('data-node-id');
        if (endNodeId && endNodeId !== startConnectorNodeId) {
          const startShape = activeSheet.shapesById[startConnectorNodeId!];
          const targetShape = activeSheet.shapesById[endNodeId];
          const startLayer = activeSheet.layers[startShape.layerId];
          const targetLayer = activeSheet.layers[targetShape.layerId];

          if (
            startShape &&
            targetShape &&
            startShape.layerId === targetShape.layerId &&
            startShape.layerId === activeSheet.activeLayerId &&
            startLayer.isVisible &&
            targetLayer.isVisible
          ) {
            const { type: endAnchorType } = getAnchorPoint(targetShape, endPoint);
            addConnector({
              id: uuidv4(),
              startNodeId: startConnectorNodeId!,
              endNodeId: endNodeId,
              startAnchorType: startConnectorAnchorType!,
              endAnchorType: endAnchorType,
            });
          }
        }
      }
    } else if (isSelecting && selectionRect) {
        const selectedIds = activeSheet.shapeIds.filter(id => {
            const shape = activeSheet.shapesById[id];
            if (!shape || shape.layerId !== activeSheet.activeLayerId) return false;

            const shapeRect = {
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height
            };

            return (
                shapeRect.x < selectionRect.x + selectionRect.width &&
                shapeRect.x + selectionRect.width > selectionRect.x &&
                shapeRect.y < selectionRect.y + selectionRect.height &&
                shapeRect.y + selectionRect.height > selectionRect.y
            );
        });
        setSelectedShapes(selectedIds);
    }

    if (isMouseDownOnShape) {
        if (activeSheet.selectedShapeIds.length > 1) {
            const finalPositions = activeSheet.selectedShapeIds.map(id => {
                const shape = activeSheet.shapesById[id];
                return { id, x: shape.x, y: shape.y };
            });
            recordShapeMoves(finalPositions);
        } else {
            const shape = activeSheet.shapesById[isMouseDownOnShape];
            if(shape) recordShapeMoves([{id: isMouseDownOnShape, x: shape.x, y: shape.y}]);
        }
    }
    setIsMouseDownOnShape(null);
    setMouseDownPos(null);
    setInitialDragPositions(null);

    setIsPanning(false);
    setIsDrawingConnector(false);
    setIsSelecting(false);
    setSelectionStartPoint(null);
    setSelectionRect(null);
  }, [activeSheet, isPanning, isDrawingConnector, startConnectorNodeId, startConnectorAnchorType, addConnector, isSelecting, selectionRect, setSelectedShapes, isMouseDownOnShape, recordShapeMoves]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!activeSheet) return;
    e.preventDefault();
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;

    const zoomAmount = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newZoom = Math.max(0.1, Math.min(5, activeSheet.zoom * zoomAmount));

    const newPanX = mouseX - ((mouseX - activeSheet.pan.x) * (newZoom / activeSheet.zoom));
    const newPanY = mouseY - ((mouseY - activeSheet.pan.y) * (newZoom / activeSheet.zoom));

    requestAnimationFrame(() => {
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    });
  }, [activeSheet, setZoom, setPan]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (svgElement) {
      svgElement.addEventListener('wheel', handleWheel, { passive: false });
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      if (svgElement) {
        svgElement.removeEventListener('wheel', handleWheel);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && contextMenuRef.current.contains(event.target as Node)) {
        return;
      }

      const target = event.target as HTMLElement;
      const isShapeClick = target.closest('g[data-node-id]');

      if (contextMenu && !isShapeClick) {
        handleCloseContextMenu();
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu, handleCloseContextMenu]);

  if (!activeSheet) {
    return <div>No active sheet found.</div>;
  }

  const { shapesById, shapeIds, connectors, selectedShapeIds } = activeSheet;
  const selectedFont = activeSheet.selectedFont;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const shapeType = e.dataTransfer.getData('shapeType');
    const svgContent = e.dataTransfer.getData('svgContent');
    const textPosition = e.dataTransfer.getData('textPosition') as 'inside' | 'outside';
    if (!shapeType) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const viewBoxMatch = svgContent.match(/viewBox="(.*?)"/);
    let minX = 0;
    let minY = 0;
    let width = 100;
    let height = 100;
    if (viewBoxMatch && viewBoxMatch[1]) {
      const viewBox = viewBoxMatch[1].split(' ').map(Number);
      minX = viewBox[0];
      minY = viewBox[1];
      width = viewBox[2] - viewBox[0];
      height = viewBox[3] - viewBox[1];
    }

    const newShape = {
      id: uuidv4(),
      type: shapeType,
      x: (e.clientX - svgRect.left - activeSheet.pan.x) / activeSheet.zoom,
      y: (e.clientY - svgRect.top - activeSheet.pan.y) / activeSheet.zoom,
      width: width,
      height: height,
      text: shapeType,
      color: '#f0f0f0',
      layerId: activeSheet.activeLayerId,
      svgContent: svgContent,
      minX: minX,
      minY: minY,
      fontFamily: selectedFont,
      textOffsetX: 0,
      textOffsetY: height + 5,
      textWidth: width,
      textHeight: 20,
      textPosition: textPosition,
    };
    addShape(newShape);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    const shape = activeSheet.shapesById[nodeId];
    const layer = activeSheet.layers[shape.layerId];
    if (shape && layer && layer.isVisible && shape.layerId === activeSheet.activeLayerId) {
      setIsMouseDownOnShape(nodeId);
      const mouseX = (e.clientX - svgRef.current!.getBoundingClientRect().left - activeSheet.pan.x) / activeSheet.zoom;
      const mouseY = (e.clientY - svgRef.current!.getBoundingClientRect().top - activeSheet.pan.y) / activeSheet.zoom;
      setMouseDownPos({ x: mouseX, y: mouseY });

      const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
      const isSelected = activeSheet.selectedShapeIds.includes(nodeId);

      let nextSelectedIds;
      if (isMultiSelect) {
        nextSelectedIds = isSelected
          ? activeSheet.selectedShapeIds.filter((id) => id !== nodeId)
          : [...activeSheet.selectedShapeIds, nodeId];
      } else {
        if (!isSelected) {
          nextSelectedIds = [nodeId];
        } else {
          nextSelectedIds = activeSheet.selectedShapeIds;
        }
      }

      const initialPositions = nextSelectedIds.reduce((acc, id) => {
        const s = shapesById[id];
        if (s) acc[id] = { x: s.x, y: s.y };
        return acc;
      }, {} as { [shapeId: string]: Point });
      setInitialDragPositions(initialPositions);

      setIsPanning(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsSelecting(true);
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;
      const x = (e.clientX - svgRect.left - activeSheet.pan.x) / activeSheet.zoom;
      const y = (e.clientY - svgRect.top - activeSheet.pan.y) / activeSheet.zoom;
      setSelectionStartPoint({ x, y });
      setSelectionRect({ x, y, width: 0, height: 0 });
      setSelectedShapes([]);
      deselectAllTextBlocks();
    }
  };

  const handleConnectorStart = (nodeId: string, point: Point, anchorType: AnchorType) => {
    const shape = activeSheet.shapesById[nodeId];
    const layer = activeSheet.layers[shape.layerId];
    if (shape && layer && layer.isVisible && shape.layerId === activeSheet.activeLayerId) {
      setIsDrawingConnector(true);
      setStartConnectorNodeId(nodeId);
      setStartConnectorPoint(point);
      setStartConnectorAnchorType(anchorType);
      setCurrentMousePoint(point);
    }
  };

  const handleNodeContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedShapeIds.includes(id)) {
        setSelectedShapes([id]);
    }

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    setContextMenu({
      x: e.clientX - canvasRect.left,
      y: e.clientY - canvasRect.top,
      shapeId: id
    });
  };

  const visibleShapes = shapeIds
    .map(id => shapesById[id])
    .filter(shape => shape && activeSheet.layers[shape.layerId]?.isVisible);

  const visibleConnectors = Object.values(connectors).filter(connector => {
    const startShape = shapesById[connector.startNodeId];
    const endShape = shapesById[connector.endNodeId];
    return startShape && endShape && activeSheet.layers[startShape.layerId]?.isVisible && activeSheet.layers[endShape.layerId]?.isVisible;
  });

  return (
    <div ref={canvasRef} className="canvas-container">
      <svg
        ref={svgRef}
        className={`canvas-svg ${isPanning ? 'panning' : ''} ${isDrawingConnector ? 'drawing-connector' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        <g transform={`translate(${activeSheet.pan.x}, ${activeSheet.pan.y}) scale(${activeSheet.zoom})`}>
          {visibleShapes.map((shape) => (
            <Node key={shape.id} shape={shape} zoom={activeSheet.zoom} isInteractive={shape.layerId === activeSheet.activeLayerId} isSelected={activeSheet.selectedShapeIds.includes(shape.id)} onConnectorStart={handleConnectorStart} onContextMenu={handleNodeContextMenu} onNodeMouseDown={handleNodeMouseDown} />
          ))}
          {visibleConnectors.map((connector) => (
            <ConnectorComponent key={connector.id} connector={connector} />
          ))}

          {isDrawingConnector && startConnectorPoint && currentMousePoint && (
            <path
              className="connector-path"
              d={calculateBezierPath(startConnectorPoint, currentMousePoint)}
            />
          )}

          {isSelecting && selectionRect && (
            <rect
                className="selection-rect"
                x={selectionRect.x}
                y={selectionRect.y}
                width={selectionRect.width}
                height={selectionRect.height}
                strokeWidth={1 / activeSheet.zoom}
            />
          )}
        </g>
      </svg>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onBringForward={() => bringForward(contextMenu.shapeId)}
          onSendBackward={() => sendBackward(contextMenu.shapeId)}
          onBringToFront={() => bringToFront(contextMenu.shapeId)}
          onSendToBack={() => sendToBack(contextMenu.shapeId)}
        />
      )}
    </div>
  );
};

export default Canvas;
