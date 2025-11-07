// Layer-related store actions and state
import { v4 as uuidv4 } from 'uuid';
import type { DiagramState } from '../../types';

export interface LayerStoreActions {
  // Layer management
  addLayer: () => void;
  removeLayer: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  toggleLayerVisibility: (id: string) => void;
  setActiveLayer: (id: string) => void;
  reorderLayer: (fromIndex: number, toIndex: number) => void;
}

// This will be imported and used in the main store
export const createLayerActions = (
  set: (fn: (state: DiagramState) => DiagramState) => void,
  _get: () => DiagramState,
  addHistory: () => void
): LayerStoreActions => ({

  addLayer: () => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newLayerId = uuidv4();
      const newLayerName = `Layer ${currentSheet.layerIds.length + 1}`;
      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            layers: {
              ...currentSheet.layers,
              [newLayerId]: {
                id: newLayerId,
                name: newLayerName,
                isVisible: true,
                isLocked: false,
              },
            },
            layerIds: [newLayerId, ...currentSheet.layerIds],
            activeLayerId: newLayerId,
          },
        },
      };
    });
  },

  removeLayer: (id: string) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      if (currentSheet.layerIds.length === 1) {
        console.warn('Cannot remove the last layer.');
        return state;
      }

      const newLayers = Object.fromEntries(
        Object.entries(currentSheet.layers).filter(([layerId]) => layerId !== id)
      );

      const newLayerIds = currentSheet.layerIds.filter((layerId) => layerId !== id);

      const newActiveLayerId =
        currentSheet.activeLayerId === id
          ? newLayerIds[0] ?? currentSheet.activeLayerId
          : currentSheet.activeLayerId;

      const newShapesById = Object.fromEntries(
        Object.entries(currentSheet.shapesById).filter(
          ([, shape]) => shape?.layerId !== id
        )
      );
      const newShapeIds = currentSheet.shapeIds.filter(
        (shapeId) => newShapesById[shapeId]
      );
      const newConnectors = Object.fromEntries(
        Object.entries(currentSheet.connectors).filter(
          ([, conn]) =>
            newShapesById[conn.startNodeId] && newShapesById[conn.endNodeId]
        )
      );
      const newSelectedShapeIds = currentSheet.selectedShapeIds.filter(
        (shapeId) => newShapesById[shapeId]
      );

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            layers: newLayers,
            layerIds: newLayerIds,
            activeLayerId: newActiveLayerId,
            shapesById: newShapesById,
            shapeIds: newShapeIds,
            connectors: newConnectors,
            selectedShapeIds: newSelectedShapeIds,
          },
        },
      };
    });
  },

  renameLayer: (id: string, name: string) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const layer = currentSheet.layers[id];
      if (!layer) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            layers: { ...currentSheet.layers, [id]: { ...layer, name } },
          },
        },
      };
    });
  },

  toggleLayerVisibility: (id: string) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const layer = currentSheet.layers[id];
      if (!layer) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            layers: {
              ...currentSheet.layers,
              [id]: { ...layer, isVisible: !layer.isVisible },
            },
          },
        },
      };
    });
  },

  setActiveLayer: (id: string) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet || !currentSheet.layers[id]) return state;
      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            activeLayerId: id,
          },
        },
      };
    });
  },

  reorderLayer: (fromIndex: number, toIndex: number) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newLayerIds = [...currentSheet.layerIds];
      const [movedLayerId] = newLayerIds.splice(fromIndex, 1);
      if (!movedLayerId) {
        return state;
      }

      const safeToIndex = Math.max(0, Math.min(newLayerIds.length, toIndex));
      newLayerIds.splice(safeToIndex, 0, movedLayerId);

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            layerIds: newLayerIds,
          },
        },
      };
    });
  },
});