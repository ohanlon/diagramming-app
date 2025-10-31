import { useState, useCallback, useEffect } from 'react';

interface ContextMenuState {
  x: number;
  y: number;
  shapeId: string;
}

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleContextMenu = useCallback((clientX: number, clientY: number, shapeId: string) => {
    setContextMenu({ x: clientX, y: clientY, shapeId });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Close context menu when clicking outside
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.context-menu')) {
        closeContextMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu, closeContextMenu]);

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu,
  };
}
