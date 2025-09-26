// Sheet-related store actions and state
import { v4 as uuidv4 } from 'uuid';
import type { DiagramState, Sheet } from '../../types';

export interface SheetStoreActions {
  // Sheet management
  addSheet: () => void;
  removeSheet: (id: string) => void;
  setActiveSheet: (id: string) => void;
  renameSheet: (id: string, name: string) => void;
}

// This will be imported and used in the main store
export const createSheetActions = (
  set: (fn: (state: DiagramState) => DiagramState) => void, 
  get: () => DiagramState, 
  addHistory: () => void,
  defaultSheetId: string
): SheetStoreActions => ({

  addSheet: () => {
    addHistory();
    set((state) => {
      const newSheetId = uuidv4();
      const newSheetName = `Sheet ${Object.keys(state.sheets).length + 1}`;
      const defaultLayerId = uuidv4();

      const newSheet: Sheet = {
        id: newSheetId,
        name: newSheetName,
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
        selectedFont: state.sheets[defaultSheetId].selectedFont,
        selectedFontSize: state.sheets[defaultSheetId].selectedFontSize,
        selectedTextColor: state.sheets[defaultSheetId].selectedTextColor,
        selectedShapeColor: state.sheets[defaultSheetId].selectedShapeColor,
        selectedLineStyle: state.sheets[defaultSheetId].selectedLineStyle,
        selectedLineWidth: state.sheets[defaultSheetId].selectedLineWidth,
        selectedConnectionType: state.sheets[defaultSheetId].selectedConnectionType,
        selectedConnectorIds: state.sheets[defaultSheetId].selectedConnectorIds,
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

      const newActiveSheetId = id === state.activeSheetId ? sheetIds.filter((sheetId) => sheetId !== id)[0] : state.activeSheetId;

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
});