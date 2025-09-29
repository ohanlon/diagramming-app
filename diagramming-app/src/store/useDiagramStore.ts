import { create } from 'zustand';
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
  ClipboardStoreActions {
  toggleSnapToGrid: () => void; // Add snapping toggle action
  saveDiagram: () => void; // Manually save to storage
  loadDiagram: () => void; // Load from storage
}

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
  isSnapToGridEnabled: false, // Correctly move snapping state here
  isDirty: false,
};

const STORAGE_KEY = 'diagram-storage';

export const useDiagramStore = create<DiagramState & DiagramStoreActions>()((set, get) => {
  // Attempt to load persisted state from localStorage during store initialization
  const loadFromStorage = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (e) {
      console.warn('Failed to parse stored diagram state:', e);
      return null;
    }
  };

  const persisted = loadFromStorage();
  const baseState: any = persisted ? { ...initialState, ...persisted, isDirty: false } : initialState;

  // Helper function for adding history
  const addHistoryFn = () => {
    const { sheets, activeSheetId } = get();
    useHistoryStore.getState().recordHistory(sheets, activeSheetId);
  };

  // Wrapped set that marks the store as dirty for any mutation
  const wrappedSet: typeof set = (fnOrPartial: any) => {
    if (typeof fnOrPartial === 'function') {
      set((state: any) => {
        const result = fnOrPartial(state);
        // Merge returned state while ensuring isDirty is set to true
        return { ...result, isDirty: true };
      });
    } else {
      set({ ...fnOrPartial, isDirty: true } as any);
    }
  };

  const saveDiagram = () => {
    const state = get();
    const toSave = {
      sheets: state.sheets,
      activeSheetId: state.activeSheetId,
      isSnapToGridEnabled: state.isSnapToGridEnabled,
      // Persist other top-level UI selections if desired
      // selectedFont, selectedFontSize, selectedTextColor, etc. could be added here
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      // Mark store as not dirty
      set((s: any) => ({ ...s, isDirty: false }));
    } catch (e) {
      console.error('Failed to save diagram to storage:', e);
    }
  };

  const loadDiagram = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      set((state: any) => ({ ...state, ...parsed, isDirty: false }));
    } catch (e) {
      console.error('Failed to load diagram from storage:', e);
    }
  };

  return {
    ...baseState,
    // Compose all modular store actions using wrappedSet so changes mark the store dirty
    ...createShapeActions(wrappedSet as any, get, addHistoryFn),
    ...createConnectorActions(wrappedSet as any, get, addHistoryFn),
    ...createSelectionActions(wrappedSet as any, get),
    ...createLayerActions(wrappedSet as any, get, addHistoryFn),
    ...createSheetActions(wrappedSet as any, get, addHistoryFn, defaultSheetId),
    ...createUIActions(wrappedSet as any, get, baseState, useHistoryStore),
    ...createClipboardActions(wrappedSet as any, get, addHistoryFn),

    // Add snapping toggle action
    toggleSnapToGrid: () => wrappedSet((state: any) => ({ isSnapToGridEnabled: !state.isSnapToGridEnabled })),
    saveDiagram,
    loadDiagram,
  } as any;
});

export type DiagramStore = ReturnType<typeof useDiagramStore>;