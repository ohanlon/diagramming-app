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
  saveDiagram: (thumbnailDataUrl?: string | null) => Promise<void>; // Manually save to storage/server, optional thumbnail
  loadDiagram: (fromRemote?: boolean) => Promise<void>; // Load from storage or server
  setServerUrl: (url: string) => void;
  setServerAuth: (user: string, pass: string) => void;
  setRemoteDiagramId: (id: string | null) => void;
  login: (username: string, password: string) => Promise<void>; // Login action
  register: (username: string, password: string) => Promise<void>; // Register action
  logout: () => void; // Logout action
  setShowAuthDialog: (show: boolean) => void; // Control whether auth dialog is shown
  createNewDiagram: (name?: string) => void; // Create a fresh new diagram with optional name
  setDiagramName: (name: string) => void; // Update the diagram's display name
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
      selectedLineStyle: 'continuous' as LineStyle,
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
  diagramName: 'New Diagram',
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

  const saveDiagram = async (thumbnailDataUrl?: string | null) => {
    const state = get();
    // Enforce diagram has a name; default to 'New Diagram' if missing
    const diagramName = state.diagramName && String(state.diagramName).trim() ? String(state.diagramName).trim() : 'New Diagram';
    const toSaveRaw = {
      sheets: state.sheets,
      activeSheetId: state.activeSheetId,
      isSnapToGridEnabled: state.isSnapToGridEnabled,
      diagramName,
    };
    
  // If a thumbnail wasn't supplied, attempt to generate one from the SVG in the DOM.
  try {
    if (!thumbnailDataUrl && typeof document !== 'undefined') {
      // Lazy-import thumbnail helper to avoid bundling it into non-browser environments/tests
      const { generateThumbnailFromSvgSelector } = await import('../utils/thumbnail');
      const generated = await generateThumbnailFromSvgSelector('svg.canvas-svg', 128, 98);
      if (generated) thumbnailDataUrl = generated;
    }
  } catch (e) {
    console.warn('Thumbnail generation attempt failed:', e);
  }

  if (thumbnailDataUrl) {
    (toSaveRaw as any).thumbnailDataUrl = thumbnailDataUrl; // include on save payload
  }
   // Strip svgContent client-side to reduce payload
   const toSave = stripSvgFromState(toSaveRaw);

    const serverUrl = state.serverUrl || 'http://localhost:4000';
    const basicAuthHeader = (state.serverAuthUser && state.serverAuthPass) ? `Basic ${btoa(`${state.serverAuthUser}:${state.serverAuthPass}`)}` : undefined;

    try {
      // Debug: report summary of what we're about to save
      try {
        const sheetCount = Object.keys(toSave.sheets || {}).length;
        let totalShapes = 0;
        for (const s of Object.values((toSave as any).sheets || {})) {
          totalShapes += Object.keys((s as any).shapesById || {}).length;
        }
        console.debug(`[saveDiagram] Attempting to save diagram (${state.remoteDiagramId || 'new'}): sheets=${sheetCount}, totalShapes=${totalShapes}`);
      } catch (e) {}
     let resp: Response | null = null;
      const doRequest = async (method: string, url: string, authHeader?: string | undefined) => {
        return await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify({ state: toSave }),
          credentials: 'include',
        });
      };

      if (!state.remoteDiagramId) {
        resp = await doRequest('POST', `${serverUrl}/diagrams`, basicAuthHeader);
      } else {
        // Use PUT to replace the server state with a full client snapshot to avoid partial-patch loss
        resp = await doRequest('PUT', `${serverUrl}/diagrams/${state.remoteDiagramId}`, basicAuthHeader);
      }

      if (resp.status === 401) {
        // Try to refresh the access token via refresh endpoint (send cookies)
        try {
          const refreshResp = await fetch(`${serverUrl}/auth/refresh`, { method: 'POST', credentials: 'include' });
          if (refreshResp.ok) {
            // retry original save once
            const retryResp = state.remoteDiagramId
              ? await doRequest('PATCH', `${serverUrl}/diagrams/${state.remoteDiagramId}`, basicAuthHeader)
              : await doRequest('POST', `${serverUrl}/diagrams`, basicAuthHeader);
            if (!retryResp.ok) {
              const text = await retryResp.text().catch(() => `Status ${retryResp.status}`);
              wrappedSet({ lastSaveError: `Save failed after refresh: ${text}` });
              return;
            }
            const created = await retryResp.json();
            if (!state.remoteDiagramId) wrappedSet({ remoteDiagramId: created.id });
            wrappedSet({ isDirty: false, lastSaveError: null });
            // Persist thumbnail into localStorage too
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...toSave, remoteDiagramId: state.remoteDiagramId || created.id, currentUser: state.currentUser }));
            return;
          }
        } catch (refreshErr) {
          console.warn('Refresh attempt failed', refreshErr);
        }
        // Redirect user to login page (page-based auth) when refresh fails
        wrappedSet({ lastSaveError: 'Authentication required' });
        try {
          // Use a hard redirect to ensure the login page is shown (routing is client-side)
          window.location.href = '/login';
        } catch (e) {
          console.warn('Redirect to login failed', e);
        }
        return;
      }

      if (!resp.ok) {
        const text = await resp.text().catch(() => `Status ${resp.status}`);
        console.error('[saveDiagram] Server returned error for save:', resp.status, text);
        throw new Error(text);
      }

      const result = await resp.json();
      console.debug('[saveDiagram] Save response:', result);
      if (!state.remoteDiagramId && result && result.id) {
        wrappedSet({ remoteDiagramId: result.id, isDirty: false, lastSaveError: null });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...toSave, remoteDiagramId: result.id, currentUser: state.currentUser }));
      } else {
        wrappedSet({ isDirty: false, lastSaveError: null });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...toSave, remoteDiagramId: state.remoteDiagramId, currentUser: state.currentUser }));
      }
    } catch (e: any) {
      console.error('Failed to save diagram to server:', e);
      wrappedSet({ lastSaveError: e?.message || String(e) });
      // Fallback: persist locally so work is not lost
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...toSave, remoteDiagramId: state.remoteDiagramId, currentUser: state.currentUser }));
        wrappedSet({ isDirty: false });
      } catch (localErr) {
        console.error('Failed to save diagram locally as fallback:', localErr);
      }
    }
  };

  const login = async (username: string, password: string) => {
    const state = get();
    const serverUrl = state.serverUrl || 'http://localhost:4000';
    try {
      const resp = await fetch(`${serverUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }), credentials: 'include' });
      if (!resp.ok) throw new Error('Invalid credentials');
      const json = await resp.json();
      if (json && json.user) {
        const avatar = json.settings?.avatarUrl || json.settings?.avatarDataUrl || undefined;
        wrappedSet({ currentUser: { ...json.user, avatarUrl: avatar }, lastSaveError: null, showAuthDialog: false });
        // persist user info along with other state
        const toSaveLocal = stripSvgFromState({ sheets: state.sheets, activeSheetId: state.activeSheetId, isSnapToGridEnabled: state.isSnapToGridEnabled });
        const augmentedUser = { ...json.user, avatarUrl: avatar };
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...toSaveLocal, remoteDiagramId: state.remoteDiagramId, currentUser: augmentedUser }));
      }
    } catch (e: any) {
      wrappedSet({ lastSaveError: e?.message || String(e) });
      throw e;
    }
  };

  const register = async (username: string, password: string) => {
    const state = get();
    const serverUrl = state.serverUrl || 'http://localhost:4000';
    try {
      const resp = await fetch(`${serverUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }), credentials: 'include' });
      if (!resp.ok) {
        const text = await resp.text().catch(() => `Status ${resp.status}`);
        throw new Error(text);
      }
      const json = await resp.json();
      if (json && json.user) {
        const avatar = json.settings?.avatarUrl || json.settings?.avatarDataUrl || undefined;
        wrappedSet({ currentUser: { ...json.user, avatarUrl: avatar }, lastSaveError: null, showAuthDialog: false });
        const toSaveLocal = stripSvgFromState({ sheets: state.sheets, activeSheetId: state.activeSheetId, isSnapToGridEnabled: state.isSnapToGridEnabled });
        const augmentedUser = { ...json.user, avatarUrl: avatar };
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...toSaveLocal, remoteDiagramId: state.remoteDiagramId, currentUser: augmentedUser }));
      }
    } catch (e: any) {
      wrappedSet({ lastSaveError: e?.message || String(e) });
      throw e;
    }
  };

  const logout = async () => {
    const state = get();
    const serverUrl = state.serverUrl || 'http://localhost:4000';
    try {
      await fetch(`${serverUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.warn('Logout failed on server', e);
    }
    wrappedSet({ currentUser: null, showAuthDialog: false });
    const toSaveLocal = stripSvgFromState({ sheets: state.sheets, activeSheetId: state.activeSheetId, isSnapToGridEnabled: state.isSnapToGridEnabled });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...toSaveLocal, remoteDiagramId: state.remoteDiagramId }));
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

  const setShowAuthDialog = (show: boolean) => {
    wrappedSet({ showAuthDialog: show });
  };

  const createNewDiagram = (name?: string) => {
    // Generate unique ids for layer and sheet
    const newLayerId = uuidv4();
    const newSheetId = uuidv4();

    const newSheet = {
      id: newSheetId,
      name: 'Sheet 1',
      shapesById: {},
      shapeIds: [],
      connectors: {},
      selectedShapeIds: [],
      selectedConnectorIds: [],
      layers: {
        [newLayerId]: {
          id: newLayerId,
          name: 'Layer 1',
          isVisible: true,
          isLocked: false,
        },
      },
      layerIds: [newLayerId],
      activeLayerId: newLayerId,
      zoom: 1,
      pan: { x: 0, y: 0 },
      clipboard: [],
      selectedFont: 'Open Sans',
      selectedFontSize: 10,
      selectedTextColor: '#000000',
      selectedShapeColor: '#3498db',
      selectedLineStyle: 'continuous',
      selectedLineWidth: 2,
      selectedConnectionType: 'direct',
      connectorDragTargetShapeId: null,
    };

    // Replace store with a fresh base state and clear remote diagram id
    set(() => ({
      sheets: { [newSheetId]: newSheet },
      activeSheetId: newSheetId,
      isSnapToGridEnabled: false,
      isDirty: false,
      remoteDiagramId: null,
      serverUrl: get().serverUrl || 'http://localhost:4000',
      serverAuthUser: null,
      serverAuthPass: null,
      lastSaveError: null,
      currentUser: get().currentUser || null,
      showAuthDialog: false,
      diagramName: name && String(name).trim() ? String(name).trim() : 'New Diagram',
    } as any));

    // Clear persisted local storage so accidental reload doesn't rehydrate old content
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear stored diagram on new:', e);
    }

    // Initialize history for the new diagram
    useHistoryStore.getState().initializeHistory({ [newSheetId]: newSheet } as any, newSheetId);
  };

  const loadDiagram = async (fromRemote = false) => {
    const state = get();
    if (fromRemote && state.remoteDiagramId) {
      const serverUrl = state.serverUrl || 'http://localhost:4000';
      const basicAuthHeader = (state.serverAuthUser && state.serverAuthPass) ? `Basic ${btoa(`${state.serverAuthUser}:${state.serverAuthPass}`)}` : undefined;
      try {
        const resp = await fetch(`${serverUrl}/diagrams/${state.remoteDiagramId}`, {
          headers: {
            ...(basicAuthHeader ? { Authorization: basicAuthHeader } : {}),
          },
          credentials: 'include',
        });
        if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
        const json = await resp.json();
        try {
          const sheetCount = json.state && json.state.sheets ? Object.keys(json.state.sheets).length : 0;
          let totalShapes = 0;
          if (json.state && json.state.sheets) {
            for (const s of Object.values(json.state.sheets)) {
              totalShapes += Object.keys((s as any).shapesById || {}).length;
            }
          }
          console.debug(`[loadDiagram] Fetched diagram ${state.remoteDiagramId} from server: sheets=${sheetCount}, totalShapes=${totalShapes}`);
        } catch (e) {}
         // Replace local state with server state (note: server strips svgContent)
         set((s: any) => ({ ...s, ...json.state, isDirty: false }));
        // Log resulting local state's counts
        try {
          const newState = get();
          const sheetCountLocal = newState.sheets ? Object.keys(newState.sheets).length : 0;
          let totalShapesLocal = 0;
          if (newState.sheets) {
            for (const s of Object.values(newState.sheets)) {
              totalShapesLocal += Object.keys((s as any).shapesById || {}).length;
            }
          }
          console.debug(`[loadDiagram] After applying server state to store: sheets=${sheetCountLocal}, totalShapes=${totalShapesLocal}`);
        } catch (e) {}
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

  const setDiagramName = (name: string) => {
    wrappedSet({ diagramName: name });
  };

  return {
    ...baseState,
    // Compose all modular store actions using wrappedSet so changes mark the store dirty
    ...createShapeActions(wrappedSet as any, get, addHistoryFn),
    ...createConnectorActions(wrappedSet as any, get, addHistoryFn),
    ...createSelectionActions(wrappedSet as any, get),
    ...createLayerActions(wrappedSet as any, get, addHistoryFn),
    ...createSheetActions(wrappedSet as any, get, addHistoryFn),
    ...createUIActions(wrappedSet as any, get, baseState, useHistoryStore),
    ...createClipboardActions(wrappedSet as any, get, addHistoryFn),

    // Add snapping toggle action
    toggleSnapToGrid: () => wrappedSet((state: any) => ({ isSnapToGridEnabled: !state.isSnapToGridEnabled })),
    saveDiagram,
    loadDiagram,
    setServerUrl,
    setServerAuth,
    setRemoteDiagramId,
    // New auth actions
    login,
    register,
    logout,
    setShowAuthDialog,
    createNewDiagram,
    setDiagramName,
  } as any;
});

export type DiagramStore = ReturnType<typeof useDiagramStore>;