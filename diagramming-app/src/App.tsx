import React, { useState } from 'react';
import ShapeStore from './components/ShapeStore/ShapeStore';
import Canvas from './components/Canvas/Canvas';
import ToolbarComponent from './components/Toolbar/Toolbar';
import LayerPanel from './components/LayerPanel/LayerPanel';
import StatusBar from './components/StatusBar/StatusBar';
import SheetTabs from './components/SheetTabs/SheetTabs';
import DashboardLayout from './components/DashboardLayout/DashboardLayout';
import { Box } from '@mui/material';

function App() {
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const [showShapeStore, setShowShapeStore] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <DashboardLayout
        toolbar={<ToolbarComponent />}
        onShowComponents={() => setShowShapeStore(true)}
      >
        <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
          {showShapeStore && <ShapeStore />}
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%' }}>
            <Canvas />
            <SheetTabs />
          </Box>
        </Box>
        {showLayerPanel && <LayerPanel showLayerPanel={showLayerPanel} setShowLayerPanel={setShowLayerPanel} />}
      </DashboardLayout>
      <StatusBar showLayerPanel={showLayerPanel} setShowLayerPanel={setShowLayerPanel} />
    </Box>
  );
}

export default App;