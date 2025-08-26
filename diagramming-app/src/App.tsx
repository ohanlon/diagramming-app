import ShapeStore from './components/ShapeStore/ShapeStore';
import Canvas from './components/Canvas/Canvas';
import Toolbar from './components/Toolbar/Toolbar';
import LayerPanel from './components/LayerPanel/LayerPanel';
import StatusBar from './components/StatusBar/StatusBar'; // Import StatusBar
import SheetTabs from './components/SheetTabs/SheetTabs';
import { useState } from 'react';

function App() {
  const [showLayerPanel, setShowLayerPanel] = useState(true);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        fontFamily: 'sans-serif',
        overflow: 'hidden',
      }}
    >
      <Toolbar />
      <div style={{ display: 'flex', flexGrow: 1 }}>
        <ShapeStore />
        <Canvas />
      </div>
      {showLayerPanel && <LayerPanel showLayerPanel={showLayerPanel} setShowLayerPanel={setShowLayerPanel} />}
      <SheetTabs />
      <StatusBar showLayerPanel={showLayerPanel} setShowLayerPanel={setShowLayerPanel} /> {/* Render StatusBar at the bottom */}
    </div>
  );
}

export default App;