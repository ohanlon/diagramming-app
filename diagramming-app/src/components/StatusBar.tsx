import React, { useState, useEffect } from 'react';
import { useDiagramStore } from '../store/useDiagramStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand, faCompress, faPlus, faMinus, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'react-tooltip';
import './StatusBar.less';

interface StatusBarProps {
  showLayerPanel: boolean;
  setShowLayerPanel: (show: boolean) => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ showLayerPanel, setShowLayerPanel }) => {
  const { sheets, activeSheetId, setZoom, toggleFullscreen } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];

  if (!activeSheet) return null; // Should not happen

  const { zoom } = activeSheet;
  const [isFullscreen, setIsFullscreen] = useState(document.fullscreenElement != null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement != null);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleZoomIn = () => {
    setZoom(Math.min(5, zoom * 1.1));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(0.1, zoom / 1.1));
  };

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className="status-bar">
      <Tooltip id="diagram-tooltip" />
      <div className="bordered-button">
        <div className="zoom-controls">
          <button onClick={handleZoomOut} className="status-bar-button" data-tooltip-id="diagram-tooltip" data-tooltip-content="Zoom out">
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className="zoom-percentage">{zoomPercentage}%</span>
          <button onClick={handleZoomIn} className="status-bar-button" data-tooltip-id="diagram-tooltip" data-tooltip-content="Zoom in">
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
      </div>
      <div className="bordered-button"> 
        <button onClick={toggleFullscreen} className="status-bar-button" data-tooltip-id="diagram-tooltip" data-tooltip-content={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
          <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
        </button>
      </div>
      <div className="bordered-button"> 
        <button onClick={() => setShowLayerPanel(!showLayerPanel)} className="status-bar-button" data-tooltip-id="diagram-tooltip" data-tooltip-content={showLayerPanel ? "Hide Layers" : "Show Layers"}>
          <FontAwesomeIcon icon={faLayerGroup} />
        </button>
      </div>
    </div>
  );
};

export default StatusBar;
