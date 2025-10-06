import MainToolbar from './components/MainToolbar/MainToolbar';
import ResizableShapeStore from './components/ResizableShapeStore/ResizableShapeStore';
import Canvas from './components/Canvas/Canvas';
import ToolbarComponent from './components/Toolbar/Toolbar';
import LayerPanel from './components/LayerPanel/LayerPanel';
import StatusBar from './components/StatusBar/StatusBar';
import SheetTabs from './components/SheetTabs/SheetTabs';
import { useState, useEffect } from 'react';
import { AppBar, Box } from '@mui/material';
import { BrowserRouter, Routes, Route, useParams, useSearchParams, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import useBackgroundTokenRefresh from './hooks/useBackgroundTokenRefresh';
import Dashboard from './pages/Dashboard';
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
  }, [effectiveDiagramId, setRemoteDiagramId, loadDiagram, searchParams]);

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
    </Box>
  );
}

function App() {
  // Start background refresh to keep the session alive while the app is open
  useBackgroundTokenRefresh();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/diagram/:id/history" element={<ProtectedRoute><DiagramHistory /></ProtectedRoute>} />
        <Route path="/diagram/:id/*" element={<ProtectedRoute><MainAppLayout /></ProtectedRoute>} />
        <Route path="/diagram/*" element={<ProtectedRoute><MainAppLayout /></ProtectedRoute>} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;