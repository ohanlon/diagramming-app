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

  return (
    <DashboardLayout
      toolbar={<ToolbarComponent />}
      sidebar={<ShapeStore />}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%' }}>
        <Canvas />
        <SheetTabs />
        <StatusBar showLayerPanel={showLayerPanel} setShowLayerPanel={setShowLayerPanel} />
      </Box>
      {showLayerPanel && <LayerPanel showLayerPanel={showLayerPanel} setShowLayerPanel={setShowLayerPanel} />}
    </DashboardLayout>
  );
}

export default App;