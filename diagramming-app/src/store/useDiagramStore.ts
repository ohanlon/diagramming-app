import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { DiagramState, LineStyle, ConnectionType } from '../types';
import { useHistoryStore } from './useHistoryStore';

// Import modular stores
import { createShapeActions, type ShapeStoreActions } from './stores/shapeStore';
import { createConnectorActions, type ConnectorStoreActions } from './stores/connectorStore';
import { createSelectionActions, type SelectionStoreActions } from './stores/selectionStore';
import { createLayerActions, type LayerStoreActions } from './stores/layerStore';
import { createSheetActions, type SheetStoreActions } from './stores/sheetStore';
import { createUIActions, type UIStoreActions } from './stores/uiStore';
import { createClipboardActions, type ClipboardStoreActions } from './stores/clipboardStore';

// Combined interface from all modular stores
interface DiagramStoreActions extends
  ShapeStoreActions,
  ConnectorStoreActions,
  SelectionStoreActions,
  LayerStoreActions,
  SheetStoreActions,
  UIStoreActions,
  ClipboardStoreActions {}

const defaultLayerId = uuidv4();
const defaultSheetId = uuidv4();

const initialState: DiagramState = {
  sheets: {
    [defaultSheetId]: {
      id: defaultSheetId,
      name: 'Sheet 1',
      shapesById: {},
      shapeIds: [],
      connectors: {},
      selectedShapeIds: [],
      selectedConnectorIds: [],
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
      clipboard: [],
      selectedFont: 'Open Sans',
      selectedFontSize: 10,
      selectedTextColor: '#000000',
      selectedShapeColor: '#3498db',
      selectedLineStyle: 'solid' as LineStyle,
      selectedLineWidth: 2,
      selectedConnectionType: 'direct' as ConnectionType,
      connectorDragTargetShapeId: null,
    },
  },
  activeSheetId: defaultSheetId,
};

export const useDiagramStore = create<DiagramState & DiagramStoreActions>()(
  persist<DiagramState & DiagramStoreActions>(
    (set, get) => {
      // Helper function for adding history
      const addHistoryFn = () => {
        const { sheets, activeSheetId } = get();
        useHistoryStore.getState().recordHistory(sheets, activeSheetId);
      };

      return {
        ...initialState,
        // Compose all modular store actions
        ...createShapeActions(set, get, addHistoryFn),
        ...createConnectorActions(set, get, addHistoryFn),
        ...createSelectionActions(set, get),
        ...createLayerActions(set, get, addHistoryFn),
        ...createSheetActions(set, get, addHistoryFn, defaultSheetId),
        ...createUIActions(set, get, initialState, useHistoryStore),
        ...createClipboardActions(set, get, addHistoryFn),
      };
    },
    {
      name: 'diagram-storage',
      version: 1, // Add version to force migration when structure changes
      migrate: (persistedState: any, version) => {
        // If the persisted state doesn't match our structure, reset to initial state
        if (version !== 1 || !persistedState?.sheets || !persistedState?.activeSheetId) {
          console.warn('Store structure changed, resetting to initial state');
          return initialState;
        }
        return persistedState;
      },
    }
  )
);

export type DiagramStore = ReturnType<typeof useDiagramStore>;