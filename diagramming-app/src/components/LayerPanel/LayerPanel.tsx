import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import { Paper, Typography, List, ListItem, ListItemText, IconButton, TextField, Button, Box } from '@mui/material';
import { Add, Close, Delete, Edit, Visibility, VisibilityOff } from '@mui/icons-material';

interface LayerPanelProps {
  showLayerPanel: boolean;
  setShowLayerPanel: (show: boolean) => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({ setShowLayerPanel }) => {
  const { sheets, activeSheetId, setActiveLayer, addLayer, removeLayer, renameLayer, toggleLayerVisibility } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 280, y: 100 });
  const [startOffset, setStartOffset] = useState({ x: 0, y: 0 });
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editedLayerName, setEditedLayerName] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - startOffset.x, y: e.clientY - startOffset.y });
  }, [isDragging, startOffset]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  useEffect(() => {
    if (editingLayerId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingLayerId]);

  if (!activeSheet) return null;

  const { layers, layerIds, activeLayerId } = activeSheet;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleAddLayer = () => {
    addLayer();
  };

  const handleRenameLayer = (id: string, currentName: string) => {
    setEditingLayerId(id);
    setEditedLayerName(currentName);
  };

  const saveEditedName = (id: string) => {
    if (editedLayerName.trim() !== '' && editedLayerName !== layers[id]?.name) {
      renameLayer(id, editedLayerName.trim());
    }
    setEditingLayerId(null);
    setEditedLayerName('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      saveEditedName(id);
    } else if (e.key === 'Escape') {
      setEditingLayerId(null);
      setEditedLayerName('');
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: 250,
        zIndex: 1200,
      }}
    >
      <Box
        sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'move' }}
        onMouseDown={handleMouseDown}
      >
        <Typography variant="h6">Layers</Typography>
        <IconButton onClick={() => setShowLayerPanel(false)} size="small" data-testid="close-layer-panel-button">
          <Close />
        </IconButton>
      </Box>
      <Button onClick={handleAddLayer} startIcon={<Add />} fullWidth data-testid="add-layer-button">Add Layer</Button>
      <List dense>
        {layerIds.map((id: string) => {
          const layer = layers[id];
          if (!layer) return null;
          const isEditing = editingLayerId === layer.id;

          return (
            <ListItem
              key={layer.id}
              selected={layer.id === activeLayerId}
              onClick={() => setActiveLayer(layer.id)}
              secondaryAction={
                <>
                  <IconButton onClick={() => toggleLayerVisibility(layer.id)} size="small">
                    {layer.isVisible ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                  <IconButton onClick={() => handleRenameLayer(layer.id, layer.name)} size="small">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => removeLayer(layer.id)} size="small" disabled={layerIds.length === 1}>
                    <Delete />
                  </IconButton>
                </>
              }
            >
              {isEditing ? (
                <TextField
                  inputRef={inputRef}
                  value={editedLayerName}
                  onChange={(e) => setEditedLayerName(e.target.value)}
                  onBlur={() => saveEditedName(layer.id)}
                  onKeyDown={(e) => handleInputKeyDown(e as React.KeyboardEvent<HTMLInputElement>, layer.id)}
                  size="small"
                  variant="standard"
                  fullWidth
                />
              ) : (
                <ListItemText primary={layer.name} />
              )}
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};

export default LayerPanel;