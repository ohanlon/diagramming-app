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
            useDiagramStore.getState().applyStateSnapshot(payload.state);
            useDiagramStore.setState({ serverVersion: payload.version || null } as any);
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
        <ResizableShapeStore />
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
  useEffect(() => {
    try {
      const cookie = getCurrentUserFromCookie();
      if (cookie && !useDiagramStore.getState().currentUser) {
        useDiagramStore.setState({ currentUser: cookie } as any);
        // helpful debug: uncomment if you need to trace hydration
        // console.debug('Hydrated currentUser from cookie at app mount', cookie.username);
      }
    } catch (e) {
      // non-fatal
      console.warn('App-level cookie hydration failed', e);
    }
  }, []);

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