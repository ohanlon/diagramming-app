import MainToolbar from './components/MainToolbar/MainToolbar';
import ResizableShapeStore from './components/ResizableShapeStore/ResizableShapeStore';
import Canvas from './components/Canvas/Canvas';
import ToolbarComponent from './components/Toolbar/Toolbar';
import LayerPanel from './components/LayerPanel/LayerPanel';
import StatusBar from './components/StatusBar/StatusBar';
import SheetTabs from './components/SheetTabs/SheetTabs';
import { useState } from 'react';
import { AppBar, Box } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

function MainAppLayout() {
  const [showLayerPanel, setShowLayerPanel] = useState(true);
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
      <AppBar position="static" sx={{ borderBottom: '1px solid #e0e0e0', padding: '0 0', marginLeft: 0, boxShadow: 'none', color: 'black' }}>
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedRoute><MainAppLayout /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;