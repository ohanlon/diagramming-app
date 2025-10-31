import { useState, useCallback } from 'react';
import type { Point } from '../../types';

interface UseCanvasPanProps {
  setPan: (pan: Point) => void;
  currentPan: Point;
}

export function useCanvasPan({ setPan, currentPan }: UseCanvasPanProps) {
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const handlePanStart = useCallback((clientX: number, clientY: number) => {
    setIsPanning(true);
    setStartPan({ x: clientX - currentPan.x, y: clientY - currentPan.y });
  }, [currentPan]);

  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    if (!isPanning) return;
    setPan({
      x: clientX - startPan.x,
      y: clientY - startPan.y,
    });
  }, [isPanning, startPan, setPan]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  return {
    isPanning,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
  };
}
