import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import { Paper, Typography, List, ListItemText, IconButton, TextField, Button, Box, ListItemButton, Divider } from '@mui/material';
import { Add, Close, Delete, Edit, Visibility, VisibilityOff } from '@mui/icons-material';

interface LayerPanelProps {
  showLayerPanel: boolean;
  setShowLayerPanel: (show: boolean) => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({ setShowLayerPanel }) => {
  const { sheets, activeSheetId, setActiveLayer, addLayer, removeLayer, renameLayer, toggleLayerVisibility, reorderLayer } = useDiagramStore();
  const activeSheet = sheets?.[activeSheetId];
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 280, y: 100 });
  const [startOffset, setStartOffset] = useState({ x: 0, y: 0 });
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editedLayerName, setEditedLayerName] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const draggedLayerId = useRef<string | null>(null);
  const draggedOverLayerId = useRef<string | null>(null);

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

  const handleDragStart = (e: React.DragEvent, id: string) => {
    draggedLayerId.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target as HTMLElement;
    const listItem = target.closest('.MuiListItemButton-root') as HTMLElement;
    if (listItem) {
      draggedOverLayerId.current = listItem.dataset.layerId || null;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedLayerId.current && draggedOverLayerId.current) {
      const fromIndex = layerIds.indexOf(draggedLayerId.current);
      const toIndex = layerIds.indexOf(draggedOverLayerId.current);

      if (fromIndex !== -1 && toIndex !== -1) {
        reorderLayer(fromIndex, toIndex);
      }
    }
    draggedLayerId.current = null;
    draggedOverLayerId.current = null;
  };

  const handleDragEnd = () => {
    draggedLayerId.current = null;
    draggedOverLayerId.current = null;
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
      <Divider />
      <List dense>
        {layerIds.map((id: string) => {
          const layer = layers[id];
          if (!layer) return null;
          const isEditing = editingLayerId === layer.id;

          return (
            <ListItemButton
              key={layer.id}
              data-layer-id={layer.id} // Add data-layer-id for drag and drop
              selected={layer.id === activeLayerId}
              onClick={() => setActiveLayer(layer.id)}
              sx={{ paddingLeft: 0 }}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, layer.id)}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            >
              <Box
                sx={{
                  ml: 0.5,
                  width: 4,
                  height: '100%',
                  backgroundColor: layer.id === activeLayerId ? 'blue' : 'transparent',
                }}>&nbsp;</Box>
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
                  sx={{ ml: '0.5rem' }} // Add left margin to TextField
                />
              ) : (
                <ListItemText primary={layer.name} sx={{ ml: '8px', }} /> // Add left margin to ListItemText
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                <IconButton onClick={() => toggleLayerVisibility(layer.id)} size="small">
                  {layer.isVisible ? <Visibility /> : <VisibilityOff />}
                </IconButton>
                <IconButton onClick={() => handleRenameLayer(layer.id, layer.name)} size="small">
                  <Edit />
                </IconButton>
                <IconButton onClick={() => removeLayer(layer.id)} size="small" disabled={layerIds.length === 1}>
                  <Delete />
                </IconButton>
              </Box>
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <Button onClick={handleAddLayer} startIcon={<Add />} fullWidth data-testid="add-layer-button">Add Layer</Button>
    </Paper>
  );
};

export default LayerPanel;