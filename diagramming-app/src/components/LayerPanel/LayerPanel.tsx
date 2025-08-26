import React, { useState, useEffect, useRef } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import './LayerPanel.less';

interface LayerPanelProps {
  showLayerPanel: boolean;
  setShowLayerPanel: (show: boolean) => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({ setShowLayerPanel }) => {
  const { sheets, activeSheetId, setActiveLayer, addLayer, removeLayer, renameLayer, toggleLayerVisibility } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];

  if (!activeSheet) return null; // Should not happen

  const { layers, layerIds, activeLayerId } = activeSheet;

  const [isDragging, setIsDragging] = useState(false);
  const [startOffset, setStartOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: window.innerWidth - 200 - 20, y: window.innerHeight - (window.innerHeight * 0.6) - 20 }); // Default bottom-right, with some margin
  const panelRef = useRef<HTMLDivElement>(null);

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null); // New state
  const [editedLayerName, setEditedLayerName] = useState<string>(''); // New state
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input element

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - startOffset.x, y: e.clientY - startOffset.y });
  };

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
  }, [isDragging, startOffset]); // Add startOffset to dependencies

  const handleAddLayer = () => {
    addLayer();
  };

  // Modified handleRenameLayer to start inline editing
  const handleRenameLayer = (id: string, currentName: string) => {
    setEditingLayerId(id);
    setEditedLayerName(currentName);
  };

  // New function to handle saving the edited name
  const saveEditedName = (id: string) => {
    if (editedLayerName.trim() !== '' && editedLayerName !== layers[id]?.name) {
      renameLayer(id, editedLayerName.trim());
    }
    setEditingLayerId(null);
    setEditedLayerName('');
  };

  // New function to handle key presses in the input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      saveEditedName(id);
    } else if (e.key === 'Escape') {
      setEditingLayerId(null); // Cancel editing
      setEditedLayerName(''); // Clear temporary name
    }
  };

  // New useEffect to focus the input when editing starts
  useEffect(() => {
    if (editingLayerId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingLayerId]);

  return (
    <div
      ref={panelRef}
      className="layer-panel"
      style={{ left: position.x, top: position.y }}
    >
      <div className="layer-panel-header" onMouseDown={handleMouseDown}>
        <h3>Layers</h3>
        <button onClick={() => setShowLayerPanel(false)} className="close-button" data-testid="close-layer-panel-button">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <button onClick={handleAddLayer} className="add-layer-button" data-testid="add-layer-button">Add Layer</button>
      <div className="layers-list">
        {layerIds.map((id: string) => {
          const layer = layers[id];
          if (!layer) return null;
          const isEditing = editingLayerId === layer.id;

          return (
            <div
              key={layer.id}
              className={`layer-item ${layer.id === activeLayerId ? 'active' : ''}`}
              onClick={() => setActiveLayer(layer.id)}
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editedLayerName}
                  onChange={(e) => setEditedLayerName(e.target.value)}
                  onBlur={() => saveEditedName(layer.id)}
                  onKeyDown={(e) => handleInputKeyDown(e, layer.id)}
                />
              ) : (
                <span onDoubleClick={() => handleRenameLayer(layer.id, layer.name)}>{layer.name}</span>
              )}
              <div>
                <input
                  type="checkbox"
                  checked={layer.isVisible}
                  onChange={() => toggleLayerVisibility(layer.id)}
                  title="Toggle Visibility"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (layerIds.length > 1) {
                      removeLayer(layer.id);
                    } else {
                      alert('Cannot remove the last layer.');
                    }
                  }}
                  className="remove-layer-button"
                  title="Remove Layer"
                >
                  X
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayerPanel;