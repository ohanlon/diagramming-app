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
  get: () => DiagramState, 
  addHistory: () => void
): ClipboardStoreActions => ({

  cutShape: (ids: string[]) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shapesToCut = ids.map((id) => currentSheet.shapesById[id]).filter(Boolean);
      if (shapesToCut.length === 0) return state;

      const newShapesById = { ...currentSheet.shapesById };
      ids.forEach((id) => delete newShapesById[id]);

      const newShapeIds = currentSheet.shapeIds.filter((id) => !ids.includes(id));

      const newConnectors = Object.fromEntries(
        Object.entries(currentSheet.connectors).filter(
          ([, conn]) => !ids.includes(conn.startNodeId) && !ids.includes(conn.endNodeId)
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

      const shapesToCopy = ids.map((id) => currentSheet.shapesById[id]).filter(Boolean);
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

      let pasteX = 0;
      let pasteY = 0;

      if (selectedShapeIds.length > 0) {
        const selectedShape = shapesById[selectedShapeIds[0]];
        if (selectedShape) {
          pasteX = selectedShape.x + 10;
          pasteY = selectedShape.y + 10;
        }
      } else {
        // Calculate center of the visible canvas area
        const canvasWidth = window.innerWidth; // Assuming canvas takes full window width
        const canvasHeight = window.innerHeight; // Assuming canvas takes full window height

        // Adjust for current pan and zoom to get the center in diagram coordinates
        pasteX = (canvasWidth / 2 - pan.x) / zoom;
        pasteY = (canvasHeight / 2 - pan.y) / zoom;

        // Adjust for the first shape's own offset from its group's top-left
        // This assumes clipboard[0] is the reference point for the group
        pasteX -= clipboard[0].x;
        pasteY -= clipboard[0].y;
      }

      const newShapes: Shape[] = [];
      const newShapeIds: string[] = [];
      const newShapesById = { ...shapesById };

      clipboard.forEach((shape) => {
        const newShapeId = uuidv4();
        const newShape = {
          ...shape,
          id: newShapeId,
          x: pasteX + (shape.x - clipboard[0].x),
          y: pasteY + (shape.y - clipboard[0].y),
          layerId: currentSheet.activeLayerId,
        };
        newShapes.push(newShape);
        newShapeIds.push(newShapeId);
        newShapesById[newShapeId] = newShape;
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            shapeIds: [...currentSheet.shapeIds, ...newShapeIds],
            selectedShapeIds: newShapeIds,
          },
        },
      };
    });
  },
});