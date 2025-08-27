import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { useDiagramStore } from '../../store/useDiagramStore';
import { ZoomIn, ZoomOut, Layers, Fullscreen, FullscreenExit } from '@mui/icons-material';

interface StatusBarProps {
  showLayerPanel: boolean;
  setShowLayerPanel: (show: boolean) => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ showLayerPanel, setShowLayerPanel }) => {
  const { sheets, activeSheetId, setZoom, toggleFullscreen } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];
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

  if (!activeSheet) return null;

  const { zoom } = activeSheet;

  const handleZoomIn = () => {
    setZoom(Math.min(5, zoom * 1.1));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(0.1, zoom / 1.1));
  };

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        p: 1,
        bgcolor: 'background.paper',
        borderTop: '1px solid #e0e0e0',
        height: '1em',
        alignItems: 'center',
      }}
    >
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Zoom Out">
          <IconButton onClick={handleZoomOut} size="small">
            <ZoomOut />
          </IconButton>
        </Tooltip>
        <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
          {zoomPercentage}%
        </Typography>
        <Tooltip title="Zoom In">
          <IconButton onClick={handleZoomIn} size="small">
            <ZoomIn />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
          <IconButton onClick={toggleFullscreen} size="small">
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Tooltip>
        <Tooltip title={showLayerPanel ? "Hide Layers" : "Show Layers"}>
          <IconButton onClick={() => setShowLayerPanel(!showLayerPanel)} size="small" data-testid="toggle-layer-panel-button">
            <Layers />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default StatusBar;
