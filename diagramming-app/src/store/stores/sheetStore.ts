// Sheet-related store actions and state
import { v4 as uuidv4 } from 'uuid';
import type { DiagramState, Sheet } from '../../types';

export interface SheetStoreActions {
  // Sheet management
  addSheet: () => void;
  removeSheet: (id: string) => void;
  setActiveSheet: (id: string) => void;
  renameSheet: (id: string, name: string) => void;
  reorderSheets: (sheetId: string, newIndex: number) => void;
}

// This will be imported and used in the main store
export const createSheetActions = (
  set: (fn: (state: DiagramState) => DiagramState) => void,
  _get: () => DiagramState,
  addHistory: () => void
): SheetStoreActions => ({

  addSheet: () => {
    addHistory();
    set((state) => {
      const newSheetId = uuidv4();
      const newSheetName = `Sheet ${Object.keys(state.sheets).length + 1}`;
      const defaultLayerId = uuidv4();

      // Determine a template sheet from current active sheet or fallback to any existing sheet
      const templateSheet = state.sheets[state.activeSheetId] || Object.values(state.sheets)[0] as Sheet;

      // Calculate the next index (max existing index + 1)
      const maxIndex = Math.max(-1, ...Object.values(state.sheets).map(s => s.index ?? -1));

      const newSheet: Sheet = {
        id: newSheetId,
        name: newSheetName,
        index: maxIndex + 1,
        shapesById: {},
        shapeIds: [],
        connectors: {},
        selectedShapeIds: [],
        layers: {
          [defaultLayerId]: {
            id: defaultLayerId,
            name: 'Layer 1',
            isVisible: true,
            isLocked: false,
          },
        },
        layerIds: [defaultLayerId],
        activeLayerId: defaultLayerId,
        zoom: 1,
        pan: { x: 0, y: 0 },
        clipboard: null,
        selectedFont: templateSheet?.selectedFont ?? 'Open Sans',
        selectedFontSize: templateSheet?.selectedFontSize ?? 10,
        selectedTextColor: templateSheet?.selectedTextColor ?? '#000000',
        selectedShapeColor: templateSheet?.selectedShapeColor ?? '#3498db',
        selectedLineStyle: templateSheet?.selectedLineStyle ?? 'continuous',
        selectedLineWidth: templateSheet?.selectedLineWidth ?? 2,
        selectedConnectionType: templateSheet?.selectedConnectionType ?? 'direct',
        selectedConnectorIds: templateSheet?.selectedConnectorIds ?? [],
        connectorDragTargetShapeId: null,
      };

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [newSheetId]: newSheet,
        },
        activeSheetId: newSheetId,
      };
    });
  },

  removeSheet: (id: string) => {
    addHistory();
    set((state) => {
      const sheetIds = Object.keys(state.sheets);
      if (sheetIds.length === 1) {
        console.warn('Cannot remove the last sheet.');
        return state;
      }

      const newSheets = Object.fromEntries(
        Object.entries(state.sheets).filter(([sheetId]) => sheetId !== id)
      );

      const remainingSheetIds = sheetIds.filter((sheetId) => sheetId !== id);
      const newActiveSheetId = id === state.activeSheetId ? remainingSheetIds[0] ?? state.activeSheetId : state.activeSheetId;

      return {
        ...state,
        sheets: newSheets,
        activeSheetId: newActiveSheetId,
      };
    });
  },

  setActiveSheet: (id: string) => {
    addHistory();
    set((state) => {
      if (!state.sheets[id]) return state;
      return { ...state, activeSheetId: id };
    });
  },

  renameSheet: (id: string, name: string) => {
    addHistory();
    set((state) => {
      const sheet = state.sheets[id];
      if (!sheet) return state;
      return {
        ...state,
        sheets: {
          ...state.sheets,
          [id]: { ...sheet, name },
        },
      };
    });
  },

  reorderSheets: (sheetId: string, newIndex: number) => {
    addHistory();
    set((state) => {
      const sheet = state.sheets[sheetId];
      if (!sheet) return state;

      const oldIndex = sheet.index;
      if (oldIndex === newIndex) return state;

      // Reindex all sheets
      const updatedSheets = { ...state.sheets };
      
      // Get sorted sheet entries
      const sortedEntries = Object.entries(updatedSheets).sort(
        ([, a], [, b]) => a.index - b.index
      );

      // Remove the dragged sheet from its current position
      const draggedEntry = sortedEntries.find(([id]) => id === sheetId);
      if (!draggedEntry) return state;
      
      const filteredEntries = sortedEntries.filter(([id]) => id !== sheetId);
      
      // Insert at new position
      filteredEntries.splice(newIndex, 0, draggedEntry);
      
      // Reassign indices
      filteredEntries.forEach(([id, sheet], idx) => {
        updatedSheets[id] = { ...sheet, index: idx };
      });

      return {
        ...state,
        sheets: updatedSheets,
      };
    });
  },
});