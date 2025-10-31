import { useCallback } from 'react';
import type { Point } from '../../types';

interface UseCanvasZoomProps {
  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  currentZoom: number;
  currentPan: Point;
}

export function useCanvasZoom({ setZoom, setPan, currentZoom, currentPan }: UseCanvasZoomProps) {
  const handleZoom = useCallback((
    deltaY: number,
    clientX: number,
    clientY: number,
    svgRect: DOMRect
  ) => {
    const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, currentZoom * zoomFactor));

    // Calculate mouse position in canvas coordinates
    const mouseX = (clientX - svgRect.left - currentPan.x) / currentZoom;
    const mouseY = (clientY - svgRect.top - currentPan.y) / currentZoom;

    // Adjust pan to keep mouse position stable
    const newPan = {
      x: clientX - svgRect.left - mouseX * newZoom,
      y: clientY - svgRect.top - mouseY * newZoom,
    };

    setZoom(newZoom);
    setPan(newPan);
  }, [currentZoom, currentPan, setZoom, setPan]);

  return { handleZoom };
}
