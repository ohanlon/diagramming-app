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
  saveDiagram: () => Promise<void>; // Manually save to storage/server
  loadDiagram: (fromRemote?: boolean) => Promise<void>; // Load from storage or server
  setServerUrl: (url: string) => void;
  setServerAuth: (user: string, pass: string) => void;
  setRemoteDiagramId: (id: string | null) => void;
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
  remoteDiagramId: null,
  serverUrl: 'http://localhost:4000',
  serverAuthUser: null,
  serverAuthPass: null,
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

  // Helper to remove svgContent from shapes in a state snapshot
  const stripSvgFromState = (stateSnapshot: any) => {
    if (!stateSnapshot || !stateSnapshot.sheets) return stateSnapshot;
    const newSheets: Record<string, any> = {};
    for (const [sheetId, sheet] of Object.entries(stateSnapshot.sheets)) {
      const s: any = { ...(sheet as any) };
      if (s.shapesById) {
        const cleanedShapes: Record<string, any> = {};
        for (const [shapeId, shape] of Object.entries(s.shapesById || {})) {
          const { svgContent, ...rest } = shape as any;
          cleanedShapes[shapeId] = rest;
        }
        s.shapesById = cleanedShapes;
      }
      newSheets[sheetId] = s;
    }
    return { ...stateSnapshot, sheets: newSheets };
  };

  const saveDiagram = async () => {
    const state = get();
    const toSaveRaw = {
      sheets: state.sheets,
      activeSheetId: state.activeSheetId,
      isSnapToGridEnabled: state.isSnapToGridEnabled,
    };
    // Strip svgContent client-side to reduce payload
    const toSave = stripSvgFromState(toSaveRaw);

    const serverUrl = state.serverUrl || 'http://localhost:4000';
    const authHeader = (state.serverAuthUser && state.serverAuthPass) ? `Basic ${btoa(`${state.serverAuthUser}:${state.serverAuthPass}`)}` : undefined;

    try {
      let resp: Response | null = null;
      const doRequest = async (method: string, url: string) => {
        return await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify({ state: toSave }),
        });
      };

      if (!state.remoteDiagramId) {
        resp = await doRequest('POST', `${serverUrl}/diagrams`);
      } else {
        resp = await doRequest('PATCH', `${serverUrl}/diagrams/${state.remoteDiagramId}`);
      }

      if (resp.status === 401) {
        // Prompt user for credentials once and retry
        const user = window.prompt('Server requires authentication. Enter username:', state.serverAuthUser || '');
        if (user !== null) {
          const pass = window.prompt('Enter password:','');
          if (pass !== null) {
            setServerAuth(user, pass);
            const retryAuth = `Basic ${btoa(`${user}:${pass}`)}`;
            const retryResp = state.remoteDiagramId
              ? await fetch(`${serverUrl}/diagrams/${state.remoteDiagramId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: retryAuth }, body: JSON.stringify({ state: toSave }) })
              : await fetch(`${serverUrl}/diagrams`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: retryAuth }, body: JSON.stringify({ state: toSave }) });
            if (!retryResp.ok) {
              const text = await retryResp.text().catch(() => `Status ${retryResp.status}`);
              wrappedSet({ lastSaveError: `Save failed after auth: ${text}` });
              return;
            }
            const created = await retryResp.json();
            if (!state.remoteDiagramId) wrappedSet({ remoteDiagramId: created.id });
            wrappedSet({ isDirty: false, lastSaveError: null });
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...toSave, remoteDiagramId: state.remoteDiagramId || created.id }));
            return;
          }
        }
        wrappedSet({ lastSaveError: 'Authentication required' });
        return;
      }

      if (!resp.ok) {
        const text = await resp.text().catch(() => `Status ${resp.status}`);
        throw new Error(text);
      }

      const result = await resp.json();
      if (!state.remoteDiagramId && result && result.id) {
        wrappedSet({ remoteDiagramId: result.id, isDirty: false, lastSaveError: null });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...toSave, remoteDiagramId: result.id }));
      } else {
        wrappedSet({ isDirty: false, lastSaveError: null });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...toSave, remoteDiagramId: state.remoteDiagramId }));
      }
    } catch (e: any) {
      console.error('Failed to save diagram to server:', e);
      wrappedSet({ lastSaveError: e?.message || String(e) });
      // Fallback: persist locally so work is not lost
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...toSave, remoteDiagramId: state.remoteDiagramId }));
        wrappedSet({ isDirty: false });
      } catch (localErr) {
        console.error('Failed to save diagram locally as fallback:', localErr);
      }
    }
  };

  const loadDiagram = async (fromRemote = false) => {
    const state = get();
    if (fromRemote && state.remoteDiagramId) {
      const serverUrl = state.serverUrl || 'http://localhost:4000';
      const authHeader = (state.serverAuthUser && state.serverAuthPass) ? `Basic ${btoa(`${state.serverAuthUser}:${state.serverAuthPass}`)}` : undefined;
      try {
        const resp = await fetch(`${serverUrl}/diagrams/${state.remoteDiagramId}`, {
          headers: {
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
        });
        if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
        const json = await resp.json();
        // Replace local state with server state (note: server strips svgContent)
        set((s: any) => ({ ...s, ...json.state, isDirty: false }));
        return;
      } catch (e) {
        console.error('Failed to load remote diagram:', e);
      }
    }

    // Fallback: load from localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      set((state: any) => ({ ...state, ...parsed, isDirty: false }));
    } catch (e) {
      console.error('Failed to load diagram from storage:', e);
    }
  };

  const setServerUrl = (url: string) => {
    wrappedSet({ serverUrl: url });
  };

  const setServerAuth = (user: string, pass: string) => {
    // store credentials in memory/state for convenience (not secure for production)
    wrappedSet({ serverAuthUser: user, serverAuthPass: pass });
  };

  const setRemoteDiagramId = (id: string | null) => {
    wrappedSet({ remoteDiagramId: id });
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
    setServerUrl,
    setServerAuth,
    setRemoteDiagramId,
  } as any;
});

export type DiagramStore = ReturnType<typeof useDiagramStore>;