// Clipboard-related store actions and state
import { v4 as uuidv4 } from 'uuid';
import type { DiagramState, Shape } from '../../types';

export interface ClipboardStoreActions {
  // Clipboard operations
  cutShape: (ids: string[]) => void;
  copyShape: (ids: string[]) => void;
  pasteShape: () => void;
}

// This will be imported and used in the main store
export const createClipboardActions = (
  set: (fn: (state: DiagramState) => DiagramState) => void,
  _get: () => DiagramState,
  addHistory: () => void
): ClipboardStoreActions => ({

  cutShape: (ids: string[]) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shapesById = currentSheet.shapesById;
      const allIdsToCollect = new Set<string>();

      const processId = (id: string) => {
        if (allIdsToCollect.has(id)) return;
        allIdsToCollect.add(id);
        Object.values(shapesById).forEach(s => {
          if (s.parentId === id) processId(s.id);
        });
      };

      ids.forEach(id => processId(id));
      const finalIds = Array.from(allIdsToCollect);

      const shapesToCut = finalIds
        .map((id) => shapesById[id])
        .filter((shape): shape is Shape => Boolean(shape));
      if (shapesToCut.length === 0) return state;

      const newShapesById = { ...currentSheet.shapesById };
      finalIds.forEach((id) => delete newShapesById[id]);

      const newShapeIds = currentSheet.shapeIds.filter((id) => !finalIds.includes(id));

      const newConnectors = Object.fromEntries(
        Object.entries(currentSheet.connectors).filter(
          ([, conn]) => !finalIds.includes(conn.startNodeId) && !finalIds.includes(conn.endNodeId)
        )
      );

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            shapeIds: newShapeIds,
            connectors: newConnectors,
            selectedShapeIds: [],
            clipboard: shapesToCut,
          },
        },
      };
    });
  },

  copyShape: (ids: string[]) => {
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shapesById = currentSheet.shapesById;
      const allIdsToCollect = new Set<string>();

      const processId = (id: string) => {
        if (allIdsToCollect.has(id)) return;
        allIdsToCollect.add(id);
        Object.values(shapesById).forEach(s => {
          if (s.parentId === id) processId(s.id);
        });
      };

      ids.forEach(id => processId(id));
      const finalIds = Array.from(allIdsToCollect);

      const shapesToCopy = finalIds
        .map((id) => shapesById[id])
        .filter((shape): shape is Shape => Boolean(shape));
      if (shapesToCopy.length === 0) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            clipboard: shapesToCopy,
          },
        },
      };
    });
  },

  pasteShape: () => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const { clipboard, selectedShapeIds, shapesById, pan, zoom } = currentSheet;
      if (!clipboard || clipboard.length === 0) return state;

      // Find the reference shape (the one that was selected when copied)
      // Usually it's the first one in the list that doesn't have a parent in the clipboard
      const rootShapesInClipboard = clipboard.filter(s =>
        !s.parentId || !clipboard.some(other => other.id === s.parentId)
      );
      const referenceShape = rootShapesInClipboard[0] || clipboard[0];
      if (!referenceShape) return state;

      let pasteX = 0;
      let pasteY = 0;

      if (selectedShapeIds.length > 0) {
        const firstSelectedId = selectedShapeIds[0];
        const selectedShape = firstSelectedId ? shapesById[firstSelectedId] : undefined;
        if (selectedShape) {
          pasteX = selectedShape.x + 10;
          pasteY = selectedShape.y + 10;
        }
      } else {
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;
        pasteX = (canvasWidth / 2 - pan.x) / zoom - referenceShape.width / 2;
        pasteY = (canvasHeight / 2 - pan.y) / zoom - referenceShape.height / 2;
      }

      const idMap = new Map<string, string>();
      clipboard.forEach(s => idMap.set(s.id, uuidv4()));

      const newShapesById = { ...shapesById };
      const newPastedShapeIds: string[] = [];

      clipboard.forEach((shape) => {
        const newShapeId = idMap.get(shape.id)!;
        const newParentId = shape.parentId ? idMap.get(shape.parentId) : undefined;

        const newShape = {
          ...shape,
          id: newShapeId,
          x: pasteX + (shape.x - referenceShape.x),
          y: pasteY + (shape.y - referenceShape.y),
          parentId: newParentId || shape.parentId, // Keep existing if not remapped (though usually it should be remapped or removed)
          layerId: currentSheet.activeLayerId,
        };

        // If parent was NOT in clipboard, we should probably clear parentId
        if (shape.parentId && !idMap.has(shape.parentId)) {
          newShape.parentId = undefined;
        }

        newShapesById[newShapeId] = newShape;
        newPastedShapeIds.push(newShapeId);
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            shapeIds: [...currentSheet.shapeIds, ...newPastedShapeIds],
            selectedShapeIds: newPastedShapeIds,
          },
        },
      };
    });
  },
});