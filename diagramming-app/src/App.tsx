import ShapeStore from './components/ShapeStore';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import LayerPanel from './components/LayerPanel';
import StatusBar from './components/StatusBar'; // Import StatusBar
import SheetTabs from './components/SheetTabs';
import type { ShapeType } from './types';
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