import { useRef, useCallback } from 'react';

interface UseAutoScrollProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  setPan?: (pan: { x: number; y: number }) => void;
  getPan?: () => { x: number; y: number };
}

export function useAutoScroll({ canvasRef, setPan, getPan }: UseAutoScrollProps) {
  const autoScrollInterval = useRef<number | null>(null);
  const lastMousePosition = useRef<{ clientX: number; clientY: number } | null>(null);

  const startAutoScroll = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return;

    lastMousePosition.current = { clientX, clientY };
    
    if (autoScrollInterval.current) return; // Already scrolling

    const scroll = () => {
      if (!canvasRef.current || !lastMousePosition.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const { clientX: x, clientY: y } = lastMousePosition.current;
      
      const SCROLL_MARGIN = 50;
      const SCROLL_SPEED = 10;
      
      let scrollX = 0;
      let scrollY = 0;

      if (x - rect.left < SCROLL_MARGIN) scrollX = -SCROLL_SPEED;
      else if (rect.right - x < SCROLL_MARGIN) scrollX = SCROLL_SPEED;
      
      if (y - rect.top < SCROLL_MARGIN) scrollY = -SCROLL_SPEED;
      else if (rect.bottom - y < SCROLL_MARGIN) scrollY = SCROLL_SPEED;

      if (scrollX !== 0 || scrollY !== 0) {
        // Use SVG pan if available, otherwise fall back to scroll
        if (setPan && getPan) {
          const currentPan = getPan();
          setPan({
            x: currentPan.x + scrollX,
            y: currentPan.y + scrollY,
          });
        } else {
          canvas.scrollLeft += scrollX;
          canvas.scrollTop += scrollY;
        }
        autoScrollInterval.current = requestAnimationFrame(scroll);
      } else {
        stopAutoScroll();
      }
    };

    autoScrollInterval.current = requestAnimationFrame(scroll);
  }, [canvasRef, setPan, getPan]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollInterval.current) {
      cancelAnimationFrame(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
    lastMousePosition.current = null;
  }, []);

  const updateMousePosition = useCallback((clientX: number, clientY: number) => {
    lastMousePosition.current = { clientX, clientY };
  }, []);

  return {
    startAutoScroll,
    stopAutoScroll,
    updateMousePosition,
  };
}
