// Custom hook for handling connector drawing operations
import { useState, useCallback, useMemo } from 'react';
import type { Point, AnchorType } from '../../../types';
import { debounce } from '../../../utils/debounce';

export interface ConnectorDrawingState {
  isDrawingConnector: boolean;
  startConnectorPoint: Point | null;
  startConnectorNodeId: string | null;
  startConnectorAnchorType: AnchorType | null;
  currentMousePoint: Point | null;
}

export interface ConnectorDrawingActions {
  startConnectorDrawing: (nodeId: string, point: Point, anchorType: AnchorType) => void;
  updateMousePoint: (point: Point) => void;
  finishConnectorDrawing: (endNodeId: string, endPoint: Point, endAnchorType: AnchorType) => void;
  cancelConnectorDrawing: () => void;
}

export const useConnectorDrawing = (
  addConnector: (connector: any) => void
): ConnectorDrawingState & ConnectorDrawingActions => {
  const [isDrawingConnector, setIsDrawingConnector] = useState(false);
  const [startConnectorPoint, setStartConnectorPoint] = useState<Point | null>(null);
  const [startConnectorNodeId, setStartConnectorNodeId] = useState<string | null>(null);
  const [startConnectorAnchorType, setStartConnectorAnchorType] = useState<AnchorType | null>(null);
  const [currentMousePoint, setCurrentMousePoint] = useState<Point | null>(null);

  const debouncedSetCurrentMousePoint = useMemo(
    () => debounce((point: Point | null) => setCurrentMousePoint(point), 20),
    []
  );

  const startConnectorDrawing = useCallback((nodeId: string, point: Point, anchorType: AnchorType) => {
    setIsDrawingConnector(true);
    setStartConnectorNodeId(nodeId);
    setStartConnectorPoint(point);
    setStartConnectorAnchorType(anchorType);
    setCurrentMousePoint(point);
  }, []);

  const updateMousePoint = useCallback((point: Point) => {
    debouncedSetCurrentMousePoint(point);
  }, [debouncedSetCurrentMousePoint]);

  const finishConnectorDrawing = useCallback((endNodeId: string, endPoint: Point, endAnchorType: AnchorType) => {
    if (startConnectorNodeId && startConnectorAnchorType) {
      addConnector({
        id: crypto.randomUUID(),
        startNodeId: startConnectorNodeId,
        endNodeId: endNodeId,
        startAnchorType: startConnectorAnchorType,
        endAnchorType: endAnchorType,
      });
    }
    
    setIsDrawingConnector(false);
    setStartConnectorPoint(null);
    setStartConnectorNodeId(null);
    setStartConnectorAnchorType(null);
    setCurrentMousePoint(null);
  }, [startConnectorNodeId, startConnectorAnchorType, addConnector]);

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
    startConnectorDrawing,
    updateMousePoint,
    finishConnectorDrawing,
    cancelConnectorDrawing,
  };
};