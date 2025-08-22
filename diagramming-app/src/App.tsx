import Palette from './components/Palette';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import LayerPanel from './components/LayerPanel';
import StatusBar from './components/StatusBar'; // Import StatusBar
import SheetTabs from './components/SheetTabs';
import type { ShapeType } from './types';
import { useState } from 'react';

function App() {
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const handleDragStart = (type: ShapeType) => {
    // This function can be used if any specific logic is needed when drag starts from palette
    console.log(`Dragging shape type: ${type}`);
  };

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
        <Palette onDragStart={handleDragStart} />
        <Canvas />
      </div>
      {showLayerPanel && <LayerPanel showLayerPanel={showLayerPanel} setShowLayerPanel={setShowLayerPanel} />}
      <SheetTabs />
      <StatusBar showLayerPanel={showLayerPanel} setShowLayerPanel={setShowLayerPanel} /> {/* Render StatusBar at the bottom */}
    </div>
  );
}

export default App;