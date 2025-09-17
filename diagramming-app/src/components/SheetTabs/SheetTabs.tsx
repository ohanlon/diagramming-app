import React, { useState, useRef, useEffect } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import { Tabs, Tab, Box, TextField, Tooltip, Divider } from '@mui/material';
import { Add, Close } from '@mui/icons-material';

import './SheetTabs.less';

const SheetTabs: React.FC = () => {
  const { sheets, activeSheetId, addSheet, removeSheet, setActiveSheet, renameSheet } = useDiagramStore();
  const sheetIds = Object.keys(sheets);

  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editedSheetName, setEditedSheetName] = useState<string>('');
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

  useEffect(() => {
    if (editingSheetId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingSheetId]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', borderTop: 1, borderColor: 'divider', height: '2em' }}>
      <Tabs
        value={activeSheetId}
        onChange={(_event, newValue) => setActiveSheet(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="sheet tabs"
        sx={{ height: '2em', minHeight: '2em' }}
      >
        {sheetIds.map((id) => {
          const sheet = sheets[id];
          if (!sheet) return null;
          const isEditing = editingSheetId === sheet.id;

          return (
            <Tab
              key={sheet.id}
              sx={{
                height: '2em',
                minHeight: '2em',
                padding: '0 .625em',
                '&.Mui-selected': {
                  bgcolor: '#A0A0A0', // Background color for selected tab
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
      <Divider orientation="vertical" flexItem />
      <Tooltip title="Add New Sheet">
        <Box onClick={handleAddSheet} sx={{
          height: '2em', minHeight: '2em', width: 32,
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
