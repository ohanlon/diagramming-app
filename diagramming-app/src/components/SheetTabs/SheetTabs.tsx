import React, { useState, useRef, useEffect } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import { Tabs, Tab, Box, TextField, Tooltip, Divider } from '@mui/material';
import { Add, Close } from '@mui/icons-material';

import './SheetTabs.less';

const SheetTabs: React.FC = () => {
  const { sheets, activeSheetId, addSheet, removeSheet, setActiveSheet, renameSheet, reorderSheets } = useDiagramStore();
  // Sort sheets by index to maintain proper ordering
  const sheetIds = Object.keys(sheets).sort((a, b) => {
    const indexA = sheets[a]?.index ?? 0;
    const indexB = sheets[b]?.index ?? 0;
    return indexA - indexB;
  });

  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editedSheetName, setEditedSheetName] = useState<string>('');
  const [draggedSheetId, setDraggedSheetId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddSheet = () => {
    addSheet();
  };

  const handleRemoveSheet = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (sheetIds.length > 1) {
      removeSheet(id);
    } else {
      alert('Cannot remove the last sheet.');
    }
  };

  const handleRenameSheet = (id: string, currentName: string) => {
    setEditingSheetId(id);
    setEditedSheetName(currentName);
  };

  const saveEditedName = (id: string) => {
    if (editedSheetName.trim() !== '' && editedSheetName !== sheets[id]?.name) {
      renameSheet(id, editedSheetName.trim());
    }
    setEditingSheetId(null);
    setEditedSheetName('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      saveEditedName(id);
    } else if (e.key === 'Escape') {
      setEditingSheetId(null);
      setEditedSheetName('');
    }
  };

  const handleDragStart = (e: React.DragEvent, sheetId: string) => {
    setDraggedSheetId(sheetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSheetId && draggedSheetId !== sheetIds[targetIndex]) {
      reorderSheets(draggedSheetId, targetIndex);
    }
    setDraggedSheetId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedSheetId(null);
    setDragOverIndex(null);
  };

  useEffect(() => {
    if (editingSheetId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingSheetId]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', borderTop: 1, borderColor: 'divider', height: '2em', backgroundColor: 'background.paper' }}>
      <Tabs
        value={activeSheetId}
        onChange={(_event, newValue) => setActiveSheet(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="sheet tabs"
        sx={{ height: '2em', minHeight: '2em' }}
      >
        {sheetIds.map((id, index) => {
          const sheet = sheets[id];
          if (!sheet) return null;
          const isEditing = editingSheetId === sheet.id;
          const isDragging = draggedSheetId === sheet.id;
          const isDropTarget = dragOverIndex === index;

          return (
            <Tab
              key={sheet.id}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, sheet.id)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              sx={{
                height: '2em',
                minHeight: '2em',
                padding: '0 .625em',
                opacity: isDragging ? 0.5 : 1,
                cursor: isEditing ? 'text' : 'grab',
                borderLeft: isDropTarget ? '2px solid #1976d2' : 'none',
                '&.Mui-selected': {
                  bgcolor: '#f7ededff', // Background color for selected tab
                },
                '&:active': {
                  cursor: isEditing ? 'text' : 'grabbing',
                },
              }}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  {isEditing ? (
                    <TextField
                      inputRef={inputRef}
                      value={editedSheetName}
                      onChange={(e) => setEditedSheetName(e.target.value)}
                      onBlur={() => saveEditedName(sheet.id)}
                      onKeyDown={(e) => handleInputKeyDown(e as React.KeyboardEvent<HTMLInputElement>, sheet.id)}
                      size="small"
                      variant="standard"
                      sx={{ flexGrow: 1, maxWidth: '200px' }}
                    />
                  ) : (
                    <span onDoubleClick={() => handleRenameSheet(sheet.id, sheet.name)} className="textSpan">{sheet.name}</span>
                  )}
                  <Box
                    component="span"
                    onClick={(e) => handleRemoveSheet(e, sheet.id)}
                    sx={{
                      ml: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                      },
                      visibility: sheetIds.length === 1 ? 'hidden' : 'visible',
                    }}
                  >
                    <Close fontSize="small" />
                  </Box>
                </Box>
              }
              value={sheet.id}
            />
          );
        })}
      </Tabs>
      <Divider orientation="vertical" flexItem  />
      <Tooltip title="Add New Sheet">
        <Box onClick={handleAddSheet} sx={{
          height: '2em', minHeight: '2em', width: '2rem', color: 'text.secondary', 
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.04)',
          },
        }} data-testid="add-sheet-button">
          <Add />
        </Box>
      </Tooltip>
    </Box>
  );
};

export default SheetTabs;
