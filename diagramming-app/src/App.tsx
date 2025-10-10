import MainToolbar from './components/MainToolbar/MainToolbar';
import ResizableShapeStore from './components/ResizableShapeStore/ResizableShapeStore';
import Canvas from './components/Canvas/Canvas';
import ToolbarComponent from './components/Toolbar/Toolbar';
import LayerPanel from './components/LayerPanel/LayerPanel';
import StatusBar from './components/StatusBar/StatusBar';
import SheetTabs from './components/SheetTabs/SheetTabs';
import { useState, useEffect } from 'react';
import { AppBar, Box, Snackbar, Alert } from '@mui/material';
import ConflictDialog from './components/ConflictDialog/ConflictDialog';
import { BrowserRouter, Routes, Route, useParams, useSearchParams, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import useBackgroundTokenRefresh from './hooks/useBackgroundTokenRefresh';
import { getCurrentUserFromCookie } from './utils/userCookie';
import Dashboard from './pages/Dashboard';
import AdminSettings from './pages/AdminSettings';
import AdminHome from './pages/AdminHome';
import AdminRoute from './components/AdminRoute';
import SalesRoute from './components/SalesRoute';
import OnboardingPage from './pages/Onboarding';
import DiagramHistory from './pages/DiagramHistory';
import { useDiagramStore } from './store/useDiagramStore';

function MainAppLayout() {
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const params = useParams();
  const [searchParams] = useSearchParams();
  const diagramIdFromParams = (params as any)?.id;
  // Accept an id from the querystring as well (e.g. /diagram?id=<uuid>)
  const diagramIdFromQuery = searchParams.get('id') || searchParams.get('diagramId');
  const effectiveDiagramId = diagramIdFromParams || diagramIdFromQuery;
  // If there is no diagram id in path or querystring, redirect the user to the dashboard
  if (!effectiveDiagramId) return <Navigate to="/dashboard" replace />;
  const setRemoteDiagramId = useDiagramStore(state => state.setRemoteDiagramId);
  const loadDiagram = useDiagramStore(state => state.loadDiagram);

  useEffect(() => {
    // If a historyId is present in the querystring, fetch that history entry and apply it as a snapshot
    const historyId = searchParams.get('historyId');
    if (effectiveDiagramId) {
      setRemoteDiagramId(effectiveDiagramId);
      if (historyId) {
        (async () => {
          try {
            const { apiFetch } = await import('./utils/apiFetch');
            const resp = await apiFetch(`${useDiagramStore.getState().serverUrl}/diagrams/${effectiveDiagramId}/history/${historyId}`, { method: 'GET' });
            if (!resp.ok) throw new Error('Failed to fetch history entry');
            const json = await resp.json();
            if (json && json.state) {
              // Apply the snapshot locally but do not call loadDiagram to avoid overwriting with remote state
              useDiagramStore.getState().applyStateSnapshot(json.state);
              useDiagramStore.getState().setRemoteDiagramId(effectiveDiagramId);
            }
          } catch (e) {
            console.error('Failed to apply history snapshot', e);
            // Fallback: load current diagram from server
            loadDiagram(true);
          }
        })();
      } else {
        // Normal behavior: load diagram from server
        loadDiagram(true);
      }
    }
    // Open a WebSocket to receive real-time updates for this diagram
    let ws: WebSocket | null = null;
    try {
      const serverUrl = useDiagramStore.getState().serverUrl || 'http://localhost:4000';
      const wsUrl = serverUrl.replace(/^http/, 'ws') + `/ws?diagramId=${encodeURIComponent(effectiveDiagramId || '')}`;
      ws = new WebSocket(wsUrl);
      // Expose a short-lived global reference so other small UI effects can attach listeners
      (window as any)._diagramWs = ws;
      // No-op here; listeners will attach via the notification effect
    } catch (e) {
      console.warn('Failed to open diagram websocket', e);
    }

    return () => {
      if (ws) try { ws.close(); } catch (e) { }
      try { delete (window as any)._diagramWs; } catch (e) { }
    };
  }, [effectiveDiagramId, setRemoteDiagramId, loadDiagram, searchParams]);

  // Local UI state for transient update notifications
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  // Replace the earlier message handler with one that also triggers notifications
  useEffect(() => {
    const currentWs = (window as any)._diagramWs as WebSocket | undefined;
    if (!currentWs) return;
    const handler = (ev: MessageEvent) => {
      try {
        const m = JSON.parse(ev.data as string);
        if (m && m.type === 'update' && m.payload) {
          const payload = m.payload as any;
          if (payload && payload.state) {
            try {
              // Merge server state into local store but preserve svgContent for
              // any shapes that currently have svgContent locally while the
              // incoming server state may be stripped. This prevents the UI
              // from losing inline/custom SVGs when the server broadcasts
              // a stripped representation after a save.
              const local = useDiagramStore.getState();
              const incoming = payload.state as any;
              const merged: any = { ...local, ...incoming };
              // Merge sheets carefully
              merged.sheets = { ...(local.sheets || {}) };
              for (const [sheetId, incSheetRaw] of Object.entries(incoming.sheets || {})) {
                const incSheet = incSheetRaw as any;
                const localSheet = (local.sheets && local.sheets[sheetId]) || {};
                const mergedSheet: any = { ...localSheet, ...incSheet };
                // Merge shapes by id and preserve svgContent where local has it
                const mergedShapes: Record<string, any> = { ...(localSheet.shapesById || {}) };
                const incShapes: Record<string, any> = incSheet.shapesById || {};
                for (const [shapeId, incShapeRaw] of Object.entries(incShapes)) {
                  const incShape = incShapeRaw as any;
                  const localShape = (localSheet.shapesById && localSheet.shapesById[shapeId]) || null;
                  // If incoming shape lacks svgContent but local has it, preserve it
                  if ((incShape.svgContent === undefined || incShape.svgContent === null) && localShape && localShape.svgContent) {
                    mergedShapes[shapeId] = { ...incShape, svgContent: localShape.svgContent };
                  } else {
                    mergedShapes[shapeId] = { ...localShape, ...incShape };
                  }
                }
                mergedSheet.shapesById = mergedShapes;
                // Merge shapeIds (union) to avoid losing references
                const existingIds: string[] = (localSheet.shapeIds || []);
                const incomingIds: string[] = (incSheet.shapeIds || []);
                const seen = new Set(existingIds);
                const mergedIds = [...existingIds];
                for (const id of incomingIds) {
                  if (!seen.has(id)) { mergedIds.push(id); seen.add(id); }
                }
                mergedSheet.shapeIds = mergedIds;
                merged.sheets[sheetId] = mergedSheet;
              }
              // Apply merged snapshot to store and update server version
              useDiagramStore.getState().applyStateSnapshot(merged);
              useDiagramStore.setState({ serverVersion: payload.version || null } as any);
            } catch (e) {
              // Fallback: if merge fails, fall back to original snapshot apply
              useDiagramStore.getState().applyStateSnapshot(payload.state);
              useDiagramStore.setState({ serverVersion: payload.version || null } as any);
            }
          }
          const updater = payload && payload.updatedBy && payload.updatedBy.username ? payload.updatedBy.username : null;
          // Expose the metadata in the store for UI consumers (e.g. conflict dialog)
          if (payload && payload.updatedBy) useDiagramStore.setState({ conflictUpdatedBy: payload.updatedBy } as any);
          const msg = updater ? `Document updated by ${updater}` : 'Document updated';
          setNotifyMessage(msg);
          setNotifyOpen(true);
        }
      } catch (e) {
        console.warn('Failed to handle diagram websocket message', e);
      }
    };
    currentWs.addEventListener('message', handler as any);
    return () => {
      try { currentWs.removeEventListener('message', handler as any); } catch (e) { }
    };
  }, [effectiveDiagramId]);

  const isEditable = useDiagramStore(state => state.isEditable !== false);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      <AppBar position="static" color='primary' sx={{ borderBottom: '1px solid #e0e0e0', padding: '0 0', marginLeft: 0, boxShadow: 'none', color: 'black' }}>
        <MainToolbar />
        <ToolbarComponent />
      </AppBar>
      <Box sx={{ display: 'flex', flexGrow: 1, minHeight: 0 }}>
        {isEditable && <ResizableShapeStore />}
        <Canvas />
      </Box>
      {showLayerPanel && <LayerPanel showLayerPanel={showLayerPanel} setShowLayerPanel={setShowLayerPanel} />}
      <SheetTabs />
      <StatusBar showLayerPanel={showLayerPanel} setShowLayerPanel={setShowLayerPanel} />
      <ConflictDialog />
      <Snackbar open={notifyOpen} autoHideDuration={4000} onClose={() => setNotifyOpen(false)}>
        <Alert onClose={() => setNotifyOpen(false)} severity="info" sx={{ width: '100%' }}>{notifyMessage}</Alert>
      </Snackbar>
    </Box>
  );
}

function App() {
  // Start background refresh to keep the session alive while the app is open
  useBackgroundTokenRefresh();

  // Centralized cookie hydration: read the lightweight current-user cookie once
  // at app startup and populate the in-memory store. This avoids races where
  // route-level guards attempt to hydrate from the cookie independently and may
  // run in different mount orders, which can produce transient `currentUser`
  // being null while navigating between routes (observed when navigating to
  // /onboarding). Centralizing here ensures all route guards see the same
  // hydrated store value.
  // sessionChecked prevents ProtectedRoute from redirecting prematurely on
  // page refresh when the server may hold HttpOnly auth cookies we cannot
  // inspect from JS. We attempt a silent /auth/me check when no lightweight
  // cookie is available so the UI remains logged in across reloads.
  const [sessionChecked, setSessionChecked] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cookie = getCurrentUserFromCookie();
        const currentUser = useDiagramStore.getState().currentUser;
        if (cookie && !currentUser) {
          useDiagramStore.setState({ currentUser: cookie } as any);
          if (mounted) setSessionChecked(true);
          return;
        }

        if (!cookie && !currentUser) {
          // Perform a silent /auth/me check to let the server validate any
          // HttpOnly auth cookies and return user info if session is valid.
          try {
            const serverUrl = useDiagramStore.getState().serverUrl || 'http://localhost:4000';
            const meResp = await fetch(`${serverUrl}/auth/me`, { method: 'GET', credentials: 'include' });
            if (meResp.ok) {
              const json = await meResp.json().catch(() => null);
              if (json && json.user && mounted) {
                useDiagramStore.setState({ currentUser: json.user } as any);
              }
            }
          } catch (e) {
            // ignore network errors; user will be treated as unauthenticated
          }
        }
      } catch (e) {
        console.warn('App-level session hydration failed', e);
      } finally {
        if (mounted) setSessionChecked(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Dev-only: subscribe to currentUser changes to detect unexpected clears.
  // Enabled when NODE_ENV !== 'production' OR when the URL contains ?dev_watch=1
  // OR when localStorage 'dev_watch_currentUser' is set to '1'. This allows
  // enabling the watcher in environments that resemble production.
  useEffect(() => {
    // Maintain a tiny in-memory 'lastKnownUser' so route guards can avoid
    // transient false-negatives while the store or cookie hydrates.
    try {
      if (typeof window !== 'undefined') {
        (window as any).__lastKnownUser = useDiagramStore.getState().currentUser || getCurrentUserFromCookie() || null;
      }
    } catch (e) {}
    const unsubLast = useDiagramStore.subscribe((s) => {
      const u = s.currentUser;
      try { if (typeof window !== 'undefined') (window as any).__lastKnownUser = u || null; } catch (e) {}
      return u;
    });
    const isDevMode = process.env.NODE_ENV !== 'production';
    const urlFlag = typeof window !== 'undefined' && new URL(window.location.href).searchParams.get('dev_watch') === '1';
    const lsFlag = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('dev_watch_currentUser') === '1';
    const enabled = isDevMode || urlFlag || lsFlag;
    if (!enabled) return;
    try {
      let prev: any = useDiagramStore.getState().currentUser;
      const pushDevEvent = (evt: any) => {
        try {
          const key = 'dev_user_events';
          const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
          const arr = raw ? JSON.parse(raw) : [];
          arr.push(evt);
          // Keep a bounded history
          if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(arr.slice(-200)));
        } catch (e) {
          // ignore
        }
      };

      // On startup, surface any pending events left behind by prior navigations.
      try {
        const key = 'dev_user_events';
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
        if (raw) {
          const arr = JSON.parse(raw || '[]');
          if (arr && arr.length) {
            // eslint-disable-next-line no-console
            console.warn('[dev-watch] pending events from prior navigation', arr);
            try { if (typeof window !== 'undefined') window.localStorage.removeItem(key); } catch (e) {}
          }
        }
      } catch (e) {
        // ignore
      }
      // Wrap setState so we reliably detect any code path that clears currentUser
      // (including mutations performed inside functional setState calls).
      try {
        const storeRef: any = useDiagramStore as any;
        const origSetState = storeRef.setState?.bind(storeRef);
        if (origSetState) {
          storeRef.setState = (fnOrPartial: any, replace?: boolean) => {
            try {
              const before = storeRef.getState().currentUser;
              const res = origSetState(fnOrPartial, replace);
              const after = storeRef.getState().currentUser;
              if (before && !after) {
                    try {
                      const evt = { type: 'setState_cleared', time: new Date().toISOString(), url: typeof window !== 'undefined' ? window.location.href : 'unknown', before };
                      // eslint-disable-next-line no-console
                      console.warn('[dev-watch] setState cleared currentUser', evt);
                      // eslint-disable-next-line no-console
                      console.warn(new Error('setState cleared currentUser stack').stack);
                      pushDevEvent(evt);
                    } catch (e) {}
                  }
              return res;
            } catch (e) {
              return origSetState(fnOrPartial, replace);
            }
          };
        }
      } catch (e) {
        console.warn('Dev-watch failed to wrap setState', e);
      }

      const unsub = useDiagramStore.subscribe((s) => {
        try {
          const newUser: any = s.currentUser;
          if (newUser === prev) return;
          const oldUser: any = prev;
          prev = newUser;
          const info = {
            time: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
            oldUser: oldUser ? { id: oldUser.id, username: oldUser.username, roles: oldUser.roles } : null,
            newUser: newUser ? { id: newUser.id, username: newUser.username, roles: newUser.roles } : null,
          };
          // Use warn so the message is visible by default in many consoles
          // even when debug-level messages are filtered.
          // eslint-disable-next-line no-console
          console.warn('[dev-watch] currentUser change', info);
          pushDevEvent({ type: 'sub_change', ...info });
          // If the user was cleared unexpectedly, capture a stack to help track the origin
          if (!newUser && oldUser) {
            // eslint-disable-next-line no-console
            console.warn('[dev-watch] currentUser cleared unexpectedly — stack follows');
            const stack = new Error('currentUser cleared').stack;
            // eslint-disable-next-line no-console
            console.warn(stack);
          }
        } catch (inner) {
          console.warn('[dev-watch] error while logging currentUser change', inner);
        }
      });

      // Also watch the cookie directly (polling) to catch cookie clears that
      // happen before our store subscription is active. Polling interval is
      // intentionally low frequency to minimize overhead.
      let prevCookie: string | null = null;
      if (typeof document !== 'undefined') {
        try {
          prevCookie = document.cookie || null;
        } catch (e) {
          prevCookie = null;
        }
      }
      const cookiePollInterval = 1000; // 1s
      const pollTimer = typeof window !== 'undefined' ? window.setInterval(() => {
        try {
          const currentCookie = typeof document !== 'undefined' ? (document.cookie || null) : null;
          if (currentCookie !== prevCookie) {
            const evt = { type: 'cookie_changed', time: new Date().toISOString(), url: typeof window !== 'undefined' ? window.location.href : 'unknown' };
            // eslint-disable-next-line no-console
            console.warn('[dev-watch] document.cookie changed', evt);
            pushDevEvent(evt);
            prevCookie = currentCookie;
          }
        } catch (e) {
          // ignore
        }
      }, cookiePollInterval) : null;

      // Intercept navigation APIs to capture who is triggering navigations
      const wrapNavigation = () => {
        try {
          const pushStateOrig = history.pushState.bind(history);
          history.pushState = function (state: any, title: string, url?: string | null) {
            try {
              const evt = { type: 'history.pushState', time: new Date().toISOString(), url: String(url || window.location.href), stack: (new Error('pushState called')).stack };
              pushDevEvent(evt);
              // eslint-disable-next-line no-console
              console.warn('[dev-watch] history.pushState', evt);
            } catch (e) {}
            return pushStateOrig(state, title, url);
          };
        } catch (e) {}
        try {
          const replaceStateOrig = history.replaceState.bind(history);
          history.replaceState = function (state: any, title: string, url?: string | null) {
            try {
              const evt = { type: 'history.replaceState', time: new Date().toISOString(), url: String(url || window.location.href), stack: (new Error('replaceState called')).stack };
              pushDevEvent(evt);
              // eslint-disable-next-line no-console
              console.warn('[dev-watch] history.replaceState', evt);
            } catch (e) {}
            return replaceStateOrig(state, title, url);
          };
        } catch (e) {}
        try {
          const assignOrig = (window.location as any).assign?.bind(window.location);
          if (assignOrig) {
            (window.location as any).assign = function (url: string) {
              try {
                const evt = { type: 'location.assign', time: new Date().toISOString(), url: String(url), stack: (new Error('location.assign called')).stack };
                pushDevEvent(evt);
                console.warn('[dev-watch] location.assign', evt);
              } catch (e) {}
              return assignOrig(url);
            };
          }
        } catch (e) {}
        try {
          const replaceOrig = (window.location as any).replace?.bind(window.location);
          if (replaceOrig) {
            (window.location as any).replace = function (url: string) {
              try {
                const evt = { type: 'location.replace', time: new Date().toISOString(), url: String(url), stack: (new Error('location.replace called')).stack };
                pushDevEvent(evt);
                console.warn('[dev-watch] location.replace', evt);
              } catch (e) {}
              return replaceOrig(url);
            };
          }
        } catch (e) {}
      };
      try { wrapNavigation(); } catch (e) { console.warn('dev-watch: wrapNavigation failed', e); }

      // Track hard navigations/unloads and persist context so it survives reloads
      const beforeUnload = () => {
        try {
          const evt = { type: 'beforeunload', time: new Date().toISOString(), url: typeof window !== 'undefined' ? window.location.href : 'unknown', currentUser: useDiagramStore.getState().currentUser || null };
          pushDevEvent(evt);
        } catch (e) {}
      };
      if (typeof window !== 'undefined') window.addEventListener('beforeunload', beforeUnload);

      return () => {
        try { unsub(); } catch (e) {}
        try { if (pollTimer) clearInterval(pollTimer); } catch (e) {}
        try { if (typeof window !== 'undefined') window.removeEventListener('beforeunload', beforeUnload); } catch (e) {}
        try { unsubLast?.(); } catch (e) {}
      };
    } catch (e) {
      console.warn('Dev currentUser watcher failed to subscribe', e);
    }
  }, []);

  // Avoid rendering routes until sessionChecked is true so ProtectedRoute
  // does not redirect on a cold reload when the server may validate session
  // using HttpOnly cookies we can't read from JS.
  if (!sessionChecked) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/diagram/:id/history" element={<ProtectedRoute><DiagramHistory /></ProtectedRoute>} />
        <Route path="/diagram/:id/*" element={<ProtectedRoute><MainAppLayout /></ProtectedRoute>} />
        <Route path="/diagram/*" element={<ProtectedRoute><MainAppLayout /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminHome /></AdminRoute></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><SalesRoute><OnboardingPage /></SalesRoute></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><AdminRoute><AdminSettings /></AdminRoute></ProtectedRoute>} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;