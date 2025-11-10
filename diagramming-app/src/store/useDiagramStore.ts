import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { DiagramState } from '../types';
import { useHistoryStore } from './useHistoryStore';

// Import modular stores
import { createShapeActions, type ShapeStoreActions } from './stores/shapeStore';
import { getCurrentUserFromCookie, setCurrentUserCookie, clearCurrentUserCookie } from '../utils/userCookie';
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
  saveDiagram: (thumbnailDataUrl?: string | null, force?: boolean) => Promise<void>; // Manually save to storage/server, optional thumbnail
  saveDiagramViaQuery?: (force?: boolean) => Promise<any>; // React Query-based save function
  resolveConflictAcceptServer: () => void;
  resolveConflictForceOverwrite: () => Promise<void>;
  dismissConflict: () => void;
  loadDiagram: (fromRemote?: boolean) => Promise<void>; // Load from storage or server
  setServerUrl: (url: string) => void;
  setServerAuth: (user: string, pass: string) => void;
  setRemoteDiagramId: (id: string | null) => void;
  login: (username: string, password: string) => Promise<void>; // Login action
  register: (username: string, password: string, firstName?: string, lastName?: string) => Promise<void>; // Register action
  logout: () => void; // Logout action
  setShowAuthDialog: (show: boolean) => void; // Control whether auth dialog is shown
  createNewDiagram: (name?: string) => void; // Create a fresh new diagram with optional name
  setDiagramName: (name: string) => void; // Update the diagram's display name
  applyStateSnapshot: (snapshot: any) => void; // Apply a full state snapshot (used for opening history entries)
  setThemeMode: (mode: 'light' | 'dark') => void;
  clearCache: (diagramId: string) => void; // Clear cached version of a diagram
  loadCachedVersion: () => void; // Load the cached version of current diagram
  dismissCacheDialog: () => void; // Dismiss the cache dialog
}

const defaultLayerId = uuidv4();
const defaultSheetId = uuidv4();

const initialState: DiagramState = {
  sheets: {
    [defaultSheetId]: {
      id: defaultSheetId,
      name: 'Default Sheet',
      index: 0,
      shapesById: {},
      shapeIds: [],
      connectors: {},
      selectedShapeIds: [],
      selectedConnectorIds: [],
      layers: {
        [defaultLayerId]: {
          id: defaultLayerId,
          name: 'Default Layer',
          isVisible: true,
          isLocked: false,
        },
      },
      clipboard: null, // Added clipboard field
      connectorDragTargetShapeId: null,
      layerIds: [defaultLayerId], // Added missing field
      activeLayerId: defaultLayerId, // Added missing field
      zoom: 1, // Added missing field
      pan: { x: 0, y: 0 }, // Added missing field
      selectedFont: 'Arial', // Added missing field
      selectedFontSize: 12, // Added missing field
      selectedTextColor: '#000000', // Added missing field
      selectedShapeColor: '#FFFFFF', // Added missing field
      selectedLineStyle: 'continuous', // Updated to a valid LineStyle value
      selectedLineWidth: 1, // Added missing field
      selectedConnectionType: 'direct', // Updated to a valid ConnectionType value
    },
  },
  activeSheetId: defaultSheetId,
  isSnapToGridEnabled: false, // Correctly move snapping state here
  isDirty: false,
  remoteDiagramId: null,
  serverUrl: 'http://localhost:4000',
  serverAuthUser: null,
  serverAuthPass: null,
  serverVersion: null,
  conflictServerState: null,
  conflictServerVersion: null,
  conflictUpdatedBy: null,
  conflictOpen: false,
  conflictLocalState: null,
  diagramName: 'New Diagram',
  // Whether the currently opened diagram is editable by the current user.
  // Defaults to true for locally-created diagrams; this will be set by
  // loadDiagram when a remote diagram is loaded.
  isEditable: true,
  // Default theme mode
  themeMode: 'light',
  // Cache-related state
  cachedDiagramData: null as any | null,
  showCacheDialog: false,
  cacheWarningMessage: null as string | null,
};

// Cache helper functions (outside store to avoid circular refs)
const saveToCache = (diagramId: string, data: any) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cacheKey = `diagram_cache_${diagramId}`;
      window.localStorage.setItem(cacheKey, JSON.stringify(data));
      console.debug(`[cache] Saved diagram ${diagramId} to cache`);
    }
  } catch (e) {
    console.warn('[cache] Failed to save to cache:', e);
  }
};

const loadFromCache = (diagramId: string): any | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cacheKey = `diagram_cache_${diagramId}`;
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (e) {
    console.warn('[cache] Failed to load from cache:', e);
  }
  return null;
};

const clearCacheHelper = (diagramId: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cacheKey = `diagram_cache_${diagramId}`;
      window.localStorage.removeItem(cacheKey);
      console.debug(`[cache] Cleared cache for diagram ${diagramId}`);
    }
  } catch (e) {
    console.warn('[cache] Failed to clear cache:', e);
  }
};

export const useDiagramStore = create<DiagramState & DiagramStoreActions>()((set, get) => {
  // We intentionally do NOT persist full diagram state locally; the database is
  // the source of truth. Only hydrate the lightweight currentUser from cookie.
  const baseState: any = { ...initialState };
  baseState.currentUser = getCurrentUserFromCookie() || null;
  // Attempt to initialize themeMode from localStorage for users who have previously selected a theme
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('themeMode');
      if (stored === 'dark' || stored === 'light') baseState.themeMode = stored as 'light'|'dark';
    }
  } catch (e) {}

  // Helper function for adding history (deprecated - use commands instead)
  // This is kept as a no-op for actions not yet migrated to command pattern
  const addHistoryFn = () => {
    // No-op: history is now managed by CommandManager through commands
    // Actions should create and execute commands instead of calling this
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
        const augmentedUser = { ...json.user, avatarUrl: avatar };
        try { setCurrentUserCookie(augmentedUser); } catch (e) {}
        // Refresh token now stored in httpOnly cookie; nothing to persist client-side.
      }
    } catch (e: any) {
      wrappedSet({ lastSaveError: e?.message || String(e) });
      throw e;
    }
  };

  // Wrapped set that marks the store as dirty for any mutation
  const wrappedSet: typeof set = (fnOrPartial: any) => {
    if (typeof fnOrPartial === 'function') {
      set((state: any) => {
        const result = fnOrPartial(state);
        const isObjectResult = result && typeof result === 'object';
        try {
          if (!isObjectResult) {
            const newState = { ...state, isDirty: true };
            return newState;
          }
          if (Object.prototype.hasOwnProperty.call(result, 'isDirty')) {
            // If caller explicitly changed isDirty (different from previous state), respect it.
            if ((result as any).isDirty !== state.isDirty) {
              return result;
            }
            // Otherwise it's likely an accidental copy from spreading state; treat as not-explicit.
            const newState = { ...result, isDirty: true };
            return newState;
          }
          const newState = { ...result, isDirty: true };
          return newState;
        } catch (err) {
          return { ...state, isDirty: true };
        }
      });
    } else {
      // If the caller explicitly provided isDirty, respect it. Otherwise mark dirty.
      if (Object.prototype.hasOwnProperty.call(fnOrPartial, 'isDirty')) {
        set({ ...fnOrPartial } as any);
      } else {
        set({ ...fnOrPartial, isDirty: true } as any);
      }
    }
  };

  // Previously we stripped svgContent before saving to reduce payloads.
  // The product decision changed: we now persist svgContent so saves include
  // inline/custom SVGs. Therefore we no longer strip svg content client-side.

  const saveDiagram = async (thumbnailDataUrl?: string | null, force: boolean = false) => {
    const state = get();
    // Enforce diagram has a name; default to 'New Diagram' if missing
    const diagramName = state.diagramName && String(state.diagramName).trim() ? String(state.diagramName).trim() : 'New Diagram';
    
    // Clone sheets and remove clipboard (legacy field no longer needed)
    const sheetsToSave: any = {};
    for (const [sheetId, sheet] of Object.entries(state.sheets || {})) {
      const { clipboard, ...sheetWithoutClipboard } = sheet as any;
      sheetsToSave[sheetId] = sheetWithoutClipboard;
    }
    
    const toSaveRaw = {
      sheets: sheetsToSave,
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
  // Persist full state including svgContent
  const toSave = toSaveRaw;

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
        const headers: any = {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        };
        const sv = state.serverVersion;
        // If the caller has explicitly requested a forced overwrite, do not send If-Match
        if (!force && sv !== undefined && sv !== null) headers['If-Match'] = `"v${sv}"`;
        return await fetch(url, {
          method,
          headers,
          body: JSON.stringify({ state: toSave }),
          credentials: 'include',
        });
      };

      if (!state.remoteDiagramId) {
        resp = await doRequest('POST', `${serverUrl}/diagrams`, basicAuthHeader);
      } else {
        // Use PATCH to merge incoming changes into server state. PATCH avoids accidental
        // data loss if the client snapshot omits fields (server will merge shapes and ids).
        resp = await doRequest('PATCH', `${serverUrl}/diagrams/${state.remoteDiagramId}`, basicAuthHeader);
      }

    if (resp.status === 401) {
        // Cache current state before trying refresh
        if (state.remoteDiagramId) {
          saveToCache(state.remoteDiagramId, {
            state: get(),
            version: state.serverVersion,
            timestamp: Date.now(),
          });
        }
        
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
            return;
          }
        } catch (refreshErr) {
          console.warn('Refresh attempt failed', refreshErr);
        }
        // Redirect user to login page (page-based auth) when refresh fails
        wrappedSet({ lastSaveError: 'Authentication required' });
        try {
          const nav = (window as any).reactRouterNavigate as ((p: string) => void) | undefined;
          if (nav) {
            nav('/login');
          } else {
            window.location.assign('/login');
          }
        } catch (e) { console.warn('Redirect to login failed', e); }
        return;
      }

      if (!resp.ok) {
        // Handle optimistic concurrency failure (412)
        if (resp.status === 412) {
          // Fetch the latest server version and present a conflict resolution UI instead
          try {
            const latest = await fetch(`${serverUrl}/diagrams/${state.remoteDiagramId}`, { credentials: 'include' });
            if (latest.ok) {
              const latestJson = await latest.json();
              if (latestJson && latestJson.state) {
                // Do not auto-apply server state. Instead, present a conflict UI so user can choose.
                wrappedSet({
                  conflictServerState: latestJson.state,
                  conflictServerVersion: latestJson.version || null,
                  conflictUpdatedBy: null, // server GET doesn't include updatedBy; will be populated by WS if available
                  conflictOpen: true,
                  conflictLocalState: toSave,
                } as any);
              }
            }
          } catch (e) { }
          const text = await resp.text().catch(() => `Status ${resp.status}`);
          wrappedSet({ lastSaveError: `Save failed due to concurrent update: ${text}` });
          return;
        }
        const text = await resp.text().catch(() => `Status ${resp.status}`);
        console.error('[saveDiagram] Server returned error for save:', resp.status, text);
        throw new Error(text);
      }

      const result = await resp.json();
      
      if (!state.remoteDiagramId && result && result.id) {
        wrappedSet({ remoteDiagramId: result.id, isDirty: false, lastSaveError: null, serverVersion: result.version || null });
      } else {
        wrappedSet({ isDirty: false, lastSaveError: null, serverVersion: result.version || null });
      }
    } catch (e: any) {
      console.error('Failed to save diagram to server:', e);
      wrappedSet({ lastSaveError: e?.message || String(e) });
      // Fallback: persist locally so work is not lost
      // Do not persist full diagram locally; rely on the server/database as the source of truth.
      wrappedSet({ isDirty: false });
    }
  };

  const register = async (username: string, password: string, firstName?: string, lastName?: string) => {
    const state = get();
    const serverUrl = state.serverUrl || 'http://localhost:4000';
    try {
      const body: any = { username, password };
      if (firstName) body.firstName = firstName;
      if (lastName) body.lastName = lastName;
      const resp = await fetch(`${serverUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' });
      if (!resp.ok) {
        // Provide a helpful message for common registration failure modes
        if (resp.status === 409) {
          // Email/username already exists
          // Try to parse server message but default to a friendly suggestion
          let parsed: any = null;
          try { parsed = await resp.json(); } catch (e) { /* ignore parse errors */ }
          const serverError = parsed && parsed.error ? String(parsed.error) : '';
          // Normalize server messaging to a friendly UX string
          const friendly = serverError && /username|email/i.test(serverError) ? 'Email address already in use. Try logging in instead.' : 'Email address already in use. Try logging in instead.';
          throw new Error(friendly);
        }
        // Other failures: surface server-provided message when possible
        try {
          const txt = await resp.text();
          throw new Error(txt || `Registration failed with status ${resp.status}`);
        } catch (e) {
          throw new Error(`Registration failed with status ${resp.status}`);
        }
      }
      const json = await resp.json();
      if (json && json.user) {
        const avatar = json.settings?.avatarUrl || json.settings?.avatarDataUrl || undefined;
        wrappedSet({ currentUser: { ...json.user, avatarUrl: avatar }, lastSaveError: null, showAuthDialog: false });
  // Persist user in a cookie (do not store it inside localStorage with diagram sheets)
  const augmentedUser = { ...json.user, avatarUrl: avatar };
  try { setCurrentUserCookie(augmentedUser); } catch (e) {}
        // Refresh token now stored in httpOnly cookie; nothing to persist client-side.
      }
    } catch (e: any) {
      wrappedSet({ lastSaveError: e?.message || String(e) });
      throw e;
    }
  };

  // register (username,password,firstName?,lastName?) is defined above and used by UI

  const logout = async () => {
    const state = get();
    const serverUrl = state.serverUrl || 'http://localhost:4000';
    try {
      await fetch(`${serverUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.warn('Logout failed on server', e);
    }
  try { clearCurrentUserCookie(); } catch (e) {}
  wrappedSet({ currentUser: null, showAuthDialog: false });
  // Do not persist full diagram locally on logout.
  };

  const setServerUrl = (url: string) => {
    // serverUrl is an environment/connection setting, not a user edit to the diagram
    // so do not mark the diagram as dirty when this changes.
    set({ serverUrl: url } as any);
  };

  const setServerAuth = (user: string, pass: string) => {
    // store credentials in memory/state for convenience (not secure for production)
    // This does not represent a diagram content change.
    set({ serverAuthUser: user, serverAuthPass: pass } as any);
  };

  const setRemoteDiagramId = (id: string | null) => {
    // Setting the remote diagram id is a navigation/loader concern, not a
    // content mutation. Do not mark the diagram dirty when we set this.
    set({ remoteDiagramId: id } as any);
  };

  const setShowAuthDialog = (show: boolean) => {
    // UI visibility toggles are not diagram edits
    set({ showAuthDialog: show } as any);
  };

  const createNewDiagram = (name?: string) => {
    // Generate unique ids for layer and sheet
    const newLayerId = uuidv4();
    const newSheetId = uuidv4();

    const newSheet = {
      id: newSheetId,
      name: 'Sheet 1',
      index: 0,
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
      clipboard: null, // Added clipboard field
      connectorDragTargetShapeId: null,
      layerIds: [newLayerId], // Added missing field
      activeLayerId: newLayerId, // Added missing field
      zoom: 1, // Added missing field
      pan: { x: 0, y: 0 }, // Added missing field
      selectedFont: 'Arial', // Added missing field
      selectedFontSize: 12, // Added missing field
      selectedTextColor: '#000000', // Added missing field
      selectedShapeColor: '#FFFFFF', // Added missing field
      selectedLineStyle: 'continuous', // Updated to a valid LineStyle value
      selectedLineWidth: 1, // Added missing field
      selectedConnectionType: 'direct', // Updated to a valid ConnectionType value
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

    // Do not persist full diagram locally; nothing to clear here.

    // Clear command history for the new diagram
    useHistoryStore.getState().clearHistory();
  };

  // Create a new diagram locally and save it immediately to the server so a remote id exists.
  const createAndSaveNewDiagram = async (name?: string) => {
    // Create local state first
    createNewDiagram(name);
    // Persist immediately so remoteDiagramId is assigned by the server
    try {
      await saveDiagram();
    } catch (e) {
      console.error('createAndSaveNewDiagram: save failed', e);
    }
    return get().remoteDiagramId || null;
  };

  const loadDiagram = async (fromRemote = false) => {
    const state = get();
    if (fromRemote && state.remoteDiagramId) {
      // Check for cached version first
      const cachedData = loadFromCache(state.remoteDiagramId);
      
      const serverUrl = state.serverUrl || 'http://localhost:4000';
      const basicAuthHeader = (state.serverAuthUser && state.serverAuthPass) ? `Basic ${btoa(`${state.serverAuthUser}:${state.serverAuthPass}`)}` : undefined;
      try {
        const resp = await fetch(`${serverUrl}/diagrams/${state.remoteDiagramId}`, {
          headers: {
            ...(basicAuthHeader ? { Authorization: basicAuthHeader } : {}),
          },
          credentials: 'include',
        });
        
        // Handle 401 - redirect to login
        if (resp.status === 401) {
          console.warn('[loadDiagram] 401 Unauthorized - redirecting to login');
          // Cache current state before redirecting
          if (state.remoteDiagramId) {
            saveToCache(state.remoteDiagramId, {
              state: get(),
              version: state.serverVersion,
              timestamp: Date.now(),
            });
          }
          try {
            const nav = (window as any).reactRouterNavigate as ((p: string) => void) | undefined;
            if (nav) {
              nav('/login');
            } else {
              window.location.assign('/login');
            }
          } catch (e2) { console.warn('Login redirect failed', e2); }
          return;
        }
        
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
         // Also set isEditable based on whether the current user is the owner,
         // an admin, or the shared entry grants 'edit' permission.
         const currentUser = get().currentUser as any;
         let editable = true;
         try {
           if (json.owner_user_id) {
             if (currentUser && currentUser.id === json.owner_user_id) {
               editable = true;
             } else if (currentUser && Array.isArray(currentUser.roles) && currentUser.roles.includes('admin')) {
               editable = true;
             } else if (json.current_user_permission && String(json.current_user_permission).toLowerCase() === 'edit') {
               editable = true;
             } else {
               editable = false;
             }
           } else {
             // Diagram has no owner (maybe created by system) - default to editable
             editable = true;
           }
         } catch (e) {
           editable = true;
         }
         // Check if there's a cached version and compare versions
         if (cachedData) {
           const serverVersion = json.version || 0;
           const cachedVersion = cachedData.version || 0;
           
           if (cachedVersion > serverVersion) {
             // Cached version is newer - prompt user
             set((s: any) => ({
               ...s,
               cachedDiagramData: cachedData,
               showCacheDialog: true,
               cacheWarningMessage: null,
             }));
             return;
           } else if (cachedVersion === serverVersion) {
             // Same version - warn that server may have been updated
             set((s: any) => ({
               ...s,
               cachedDiagramData: cachedData,
               showCacheDialog: true,
               cacheWarningMessage: 'The document on the server has the same version number. It may have been updated by another user.',
             }));
             return;
           } else {
             // Server version is newer - clear cache and use server version
             clearCacheHelper(state.remoteDiagramId);
           }
         }
         
         set((s: any) => ({ ...s, ...json.state, serverVersion: json.version || null, isDirty: false, isEditable: editable }));
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

    // No local fallback load. If remote load fails, leave the current in-memory state intact.
  };

  const setDiagramName = (name: string) => {
    wrappedSet({ diagramName: name });
  };

  const applyStateSnapshot = (snapshot: any) => {
    if (!snapshot) return;
    try {
        // Replace local store state with provided snapshot but preserve serverUrl and do
        // not accept currentUser from the snapshot (user info is stored in a cookie).
      set((s: any) => ({
        ...s,
        ...snapshot,
        serverUrl: s.serverUrl || snapshot.serverUrl || 'http://localhost:4000',
        currentUser: s.currentUser || getCurrentUserFromCookie() || null,
        remoteDiagramId: s.remoteDiagramId || snapshot.remoteDiagramId || null,
        isDirty: false,
      }));
      // Clear command history when loading a snapshot
      try {
        useHistoryStore.getState().clearHistory();
      } catch (e) {
        console.warn('Failed to clear history from snapshot', e);
      }
    } catch (e) {
      console.error('applyStateSnapshot failed', e);
    }
  };

  return {
    ...baseState,
  // Compose all modular store actions. For shape actions we pass both the
  // raw `set` and `wrappedSet` so shapeStore can choose whether to mark
  // a mutation as dirty (wrappedSet) or perform hydration-only patches (set).
  ...createShapeActions(set as any, wrappedSet as any, get),
  ...createConnectorActions(wrappedSet as any, get, addHistoryFn),
  ...createSelectionActions(set as any, get),
  ...createLayerActions(wrappedSet as any, get, addHistoryFn),
  ...createSheetActions(wrappedSet as any, get, addHistoryFn),
  ...createUIActions(set as any, get, baseState, useHistoryStore),
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
    createAndSaveNewDiagram,
    applyStateSnapshot,
    setDiagramName,
    // Theme control
    setThemeMode: (mode: 'light' | 'dark') => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('themeMode', mode);
      } catch (e) {}
      set({ themeMode: mode } as any);
      // If user is logged in, persist preference server-side in their settings
      try {
        const currentUser = get().currentUser;
        if (currentUser) {
          (async () => {
            try {
              const { apiFetch } = await import('../utils/apiFetch');
              const serverUrl = get().serverUrl;
              const existingResp = await apiFetch(`${serverUrl}/users/me/settings`, { method: 'GET' });
              const existingJson = existingResp.ok ? await existingResp.json() : { settings: {} };
              await apiFetch(`${serverUrl}/users/me/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: { ...(existingJson.settings || {}), themeMode: mode } }) });
            } catch (e) { /* ignore server-side persistence failures */ }
          })();
        }
      } catch (e) {}
    },
    resolveConflictAcceptServer: () => {
      const s = get();
      if (!s.conflictServerState) {
        // Nothing to accept
        wrappedSet({ conflictOpen: false, conflictServerState: null, conflictServerVersion: null, conflictUpdatedBy: null, conflictLocalState: null });
        return;
      }
      // Apply server snapshot and clear conflict
      set((state: any) => ({ ...state, ...s.conflictServerState, serverVersion: s.conflictServerVersion || null, isDirty: false, conflictOpen: false, conflictServerState: null, conflictServerVersion: null, conflictUpdatedBy: null, conflictLocalState: null }));
    },
    resolveConflictForceOverwrite: async () => {
      // Retry save with force=true to overwrite server state with local changes
      try {
        await saveDiagram(undefined, true);
        // Clear conflict state on success
        wrappedSet({ conflictOpen: false, conflictServerState: null, conflictServerVersion: null, conflictUpdatedBy: null, conflictLocalState: null });
      } catch (e) {
        console.error('Force-overwrite save failed', e);
        wrappedSet({ lastSaveError: String(e) });
      }
    },
    dismissConflict: () => {
      wrappedSet({ conflictOpen: false, conflictServerState: null, conflictServerVersion: null, conflictUpdatedBy: null, conflictLocalState: null });
    },
    // Cache-related actions
    clearCache: (diagramId: string) => {
      clearCacheHelper(diagramId);
      set((s: any) => ({
        ...s,
        showCacheDialog: false,
        cachedDiagramData: null,
        cacheWarningMessage: null,
      }));
    },
    loadCachedVersion: () => {
      const state = get();
      if (state.cachedDiagramData && state.cachedDiagramData.state) {
        // Clear the cache from localStorage after restoring
        if (state.remoteDiagramId) {
          clearCacheHelper(state.remoteDiagramId);
        }
        set((s: any) => ({
          ...s,
          ...state.cachedDiagramData.state,
          showCacheDialog: false,
          cachedDiagramData: null,
          cacheWarningMessage: null,
          isDirty: true,
        }));
        console.debug('[cache] Loaded cached version and cleared cache');
      }
    },
    dismissCacheDialog: () => {
      const state = get();
      if (state.remoteDiagramId && state.cachedDiagramData) {
        clearCacheHelper(state.remoteDiagramId);
      }
      set((s: any) => ({
        ...s,
        showCacheDialog: false,
        cachedDiagramData: null,
        cacheWarningMessage: null,
      }));
    },
  } as any;
});

export type DiagramStore = ReturnType<typeof useDiagramStore>;