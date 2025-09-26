// Custom hook for handling canvas panning operations
import { useState, useCallback } from 'react';
import type { Point } from '../../../types';

export interface CanvasPanningState {
  isPanning: boolean;
  startPan: Point;
}

export interface CanvasPanningActions {
  handlePanStart: (clientX: number, clientY: number) => void;
  handlePanMove: (clientX: number, clientY: number) => void;
  handlePanEnd: () => void;
  resetPanning: () => void;
}

export const useCanvasPanning = (
  setPan: (pan: Point) => void,
  currentPan: Point
): CanvasPanningState & CanvasPanningActions => {
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const handlePanStart = useCallback((clientX: number, clientY: number) => {
    setIsPanning(true);
    setStartPan({ 
      x: clientX - currentPan.x, 
      y: clientY - currentPan.y 
    });
  }, [currentPan]);

  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    if (isPanning) {
      setPan({ 
        x: clientX - startPan.x, 
        y: clientY - startPan.y 
      });
    }
  }, [isPanning, startPan, setPan]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetPanning = useCallback(() => {
    setIsPanning(false);
    setStartPan({ x: 0, y: 0 });
  }, []);

  return {
    isPanning,
    startPan,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    resetPanning,
  };
};