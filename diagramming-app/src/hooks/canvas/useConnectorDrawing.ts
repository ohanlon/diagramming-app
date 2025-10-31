import { useState, useCallback, useMemo } from 'react';
import { debounce } from '../../utils/debounce';
import type { Point, AnchorType } from '../../types';

export function useConnectorDrawing() {
  const [isDrawingConnector, setIsDrawingConnector] = useState(false);
  const [startConnectorPoint, setStartConnectorPoint] = useState<Point | null>(null);
  const [startConnectorNodeId, setStartConnectorNodeId] = useState<string | null>(null);
  const [startConnectorAnchorType, setStartConnectorAnchorType] = useState<AnchorType | null>(null);
  const [currentMousePoint, setCurrentMousePoint] = useState<Point | null>(null);

  const debouncedSetCurrentMousePoint = useMemo(() => {
    const handler = (point: Point | null) => setCurrentMousePoint(point);
    return debounce(handler as (...args: unknown[]) => void, 20) as (point: Point | null) => void;
  }, []);

  const handleConnectorStart = useCallback((
    nodeId: string,
    anchorPoint: Point,
    anchorType: AnchorType
  ) => {
    setIsDrawingConnector(true);
    setStartConnectorPoint(anchorPoint);
    setStartConnectorNodeId(nodeId);
    setStartConnectorAnchorType(anchorType);
  }, []);

  const handleConnectorMove = useCallback((point: Point | null) => {
    if (!isDrawingConnector) return;
    debouncedSetCurrentMousePoint(point);
  }, [isDrawingConnector, debouncedSetCurrentMousePoint]);

  const handleConnectorEnd = useCallback((
    endNodeId: string | null,
    endAnchorType: AnchorType | null,
    addConnector: (startNodeId: string, endNodeId: string, startAnchor: AnchorType, endAnchor: AnchorType) => void
  ) => {
    if (isDrawingConnector && startConnectorNodeId && startConnectorAnchorType && endNodeId && endAnchorType) {
      addConnector(startConnectorNodeId, endNodeId, startConnectorAnchorType, endAnchorType);
    }

    setIsDrawingConnector(false);
    setStartConnectorPoint(null);
    setStartConnectorNodeId(null);
    setStartConnectorAnchorType(null);
    setCurrentMousePoint(null);
  }, [isDrawingConnector, startConnectorNodeId, startConnectorAnchorType]);

  const cancelConnectorDrawing = useCallback(() => {
    setIsDrawingConnector(false);
    setStartConnectorPoint(null);
    setStartConnectorNodeId(null);
    setStartConnectorAnchorType(null);
    setCurrentMousePoint(null);
  }, []);

  return {
    isDrawingConnector,
    startConnectorPoint,
    startConnectorNodeId,
    startConnectorAnchorType,
    currentMousePoint,
    handleConnectorStart,
    handleConnectorMove,
    handleConnectorEnd,
    cancelConnectorDrawing,
  };
}
