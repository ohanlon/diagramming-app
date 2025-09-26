// Custom hook for handling canvas pan and zoom operations
import { useState, useCallback } from 'react';
import type { Point } from '../../../types';

export interface PanZoomState {
  isPanning: boolean;
  startPan: Point;
}

export interface PanZoomActions {
  startPanning: (point: Point) => void;
  stopPanning: () => void;
  handlePan: (currentPoint: Point) => Point;
  handleZoom: (delta: number, centerPoint: Point) => { zoom: number; pan: Point };
}

export const usePanZoom = (
  currentPan: Point,
  currentZoom: number,
  setPan: (pan: Point) => void,
  setZoom: (zoom: number) => void
): PanZoomState & PanZoomActions => {
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<Point>({ x: 0, y: 0 });

  const startPanning = useCallback((point: Point) => {
    setIsPanning(true);
    setStartPan({ x: point.x - currentPan.x, y: point.y - currentPan.y });
  }, [currentPan]);

  const stopPanning = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handlePan = useCallback((currentPoint: Point): Point => {
    if (!isPanning) return currentPan;
    
    const newPan = {
      x: currentPoint.x - startPan.x,
      y: currentPoint.y - startPan.y,
    };
    
    setPan(newPan);
    return newPan;
  }, [isPanning, startPan, currentPan, setPan]);

  const handleZoom = useCallback((delta: number, centerPoint: Point): { zoom: number; pan: Point } => {
    const zoomFactor = 0.1;
    const newZoom = Math.max(0.1, Math.min(5, currentZoom + delta * zoomFactor));
    
    // Calculate new pan to zoom towards the center point
    const zoomRatio = newZoom / currentZoom;
    const newPan = {
      x: centerPoint.x - (centerPoint.x - currentPan.x) * zoomRatio,
      y: centerPoint.y - (centerPoint.y - currentPan.y) * zoomRatio,
    };
    
    setZoom(newZoom);
    setPan(newPan);
    
    return { zoom: newZoom, pan: newPan };
  }, [currentZoom, currentPan, setZoom, setPan]);

  return {
    isPanning,
    startPan,
    startPanning,
    stopPanning,
    handlePan,
    handleZoom,
  };
};