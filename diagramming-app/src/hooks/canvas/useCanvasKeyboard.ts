import { useEffect, useCallback } from 'react';

interface UseCanvasKeyboardProps {
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  cutShape: (ids: string[]) => void;
  copyShape: (ids: string[]) => void;
  pasteShape: () => void;
  selectAll: () => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  deselectAllTextBlocks: () => void;
  selectedShapeIds: string[];
}

export function useCanvasKeyboard({
  deleteSelected,
  undo,
  redo,
  cutShape,
  copyShape,
  pasteShape,
  selectAll,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  deselectAllTextBlocks,
  selectedShapeIds,
}: UseCanvasKeyboardProps) {
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't handle keyboard shortcuts when typing in input fields
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    // Delete
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteSelected();
    }
    // Undo
    else if (modifier && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    // Redo
    else if (modifier && e.shiftKey && e.key === 'z') {
      e.preventDefault();
      redo();
    }
    // Cut
    else if (modifier && e.key === 'x') {
      e.preventDefault();
      cutShape(selectedShapeIds);
    }
    // Copy
    else if (modifier && e.key === 'c') {
      e.preventDefault();
      copyShape(selectedShapeIds);
    }
    // Paste
    else if (modifier && e.key === 'v') {
      e.preventDefault();
      pasteShape();
    }
    // Select All
    else if (modifier && e.key === 'a') {
      e.preventDefault();
      selectAll();
    }
    // Bring Forward (Ctrl/Cmd + ])
    else if (modifier && e.key === ']' && selectedShapeIds.length === 1) {
      e.preventDefault();
      bringForward(selectedShapeIds[0]);
    }
    // Send Backward (Ctrl/Cmd + [)
    else if (modifier && e.key === '[' && selectedShapeIds.length === 1) {
      e.preventDefault();
      sendBackward(selectedShapeIds[0]);
    }
    // Bring to Front (Ctrl/Cmd + Shift + ])
    else if (modifier && e.shiftKey && e.key === '}' && selectedShapeIds.length === 1) {
      e.preventDefault();
      bringToFront(selectedShapeIds[0]);
    }
    // Send to Back (Ctrl/Cmd + Shift + [)
    else if (modifier && e.shiftKey && e.key === '{' && selectedShapeIds.length === 1) {
      e.preventDefault();
      sendToBack(selectedShapeIds[0]);
    }
    // Escape - deselect all text blocks
    else if (e.key === 'Escape') {
      e.preventDefault();
      deselectAllTextBlocks();
    }
  }, [deleteSelected, undo, redo, cutShape, copyShape, pasteShape, selectAll, bringForward, sendBackward, bringToFront, sendToBack, deselectAllTextBlocks, selectedShapeIds]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
