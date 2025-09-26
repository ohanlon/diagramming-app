// Selection-related store actions and state
import type { DiagramState } from '../../types';

export interface SelectionStoreActions {
  // Shape selection
  setSelectedShapes: (ids: string[]) => void;
  toggleShapeSelection: (id: string) => void;
  
  // Connector selection  
  setSelectedConnectors: (ids: string[]) => void;
  
  // Multi-select operations
  selectAll: () => void;
  selectShapes: () => void;
  selectConnectors: () => void;
}

// This will be imported and used in the main store
export const createSelectionActions = (
  set: (fn: (state: DiagramState) => DiagramState) => void,
  _get: () => DiagramState
): SelectionStoreActions => ({

  setSelectedShapes: (ids: string[]) =>
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedShapeIds: ids,
            selectedConnectorIds: [],
          },
        },
      };
    }),

  toggleShapeSelection: (id: string) => {
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const selectedShapeIds = currentSheet.selectedShapeIds.includes(id)
        ? currentSheet.selectedShapeIds.filter((shapeId) => shapeId !== id)
        : [...currentSheet.selectedShapeIds, id];

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedShapeIds: selectedShapeIds,
          },
        },
      };
    });
  },

  setSelectedConnectors: (ids: string[]) => {
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedConnectorIds: ids,
          },
        },
      };
    });
  },

  selectAll: () => {
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedShapeIds: currentSheet.shapeIds,
            selectedConnectorIds: Object.keys(currentSheet.connectors),
          },
        },
      };
    });
  },

  selectShapes: () => {
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedShapeIds: currentSheet.shapeIds,
            selectedConnectorIds: [],
          },
        },
      };
    });
  },

  selectConnectors: () => {
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedConnectorIds: Object.keys(currentSheet.connectors),
            selectedShapeIds: [],
          },
        },
      };
    });
  },
});