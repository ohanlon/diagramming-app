import MainToolbar from './components/MainToolbar/MainToolbar';
import ShapeStore from './components/ShapeStore/ShapeStore';
import Canvas from './components/Canvas/Canvas';
import ToolbarComponent from './components/Toolbar/Toolbar';
import LayerPanel from './components/LayerPanel/LayerPanel';
import StatusBar from './components/StatusBar/StatusBar';
import SheetTabs from './components/SheetTabs/SheetTabs';
import { useState } from 'react';
import { Box, Divider } from '@mui/material';

function App() {
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
      <MainToolbar />
      <Divider />
      <ToolbarComponent />
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <ShapeStore />
        <Canvas />
      </Box>
      {showLayerPanel && <LayerPanel showLayerPanel={showLayerPanel} setShowLayerPanel={setShowLayerPanel} />}
      <SheetTabs />
      <StatusBar showLayerPanel={showLayerPanel} setShowLayerPanel={setShowLayerPanel} />
    </Box>
  );
}

export default App;