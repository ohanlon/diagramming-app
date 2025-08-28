import React, { useState, useRef, useEffect } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import { Tabs, Tab, Button, Box, TextField, Tooltip } from '@mui/material';
import { Add, Close } from '@mui/icons-material';

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
    <Box sx={{ display: 'flex', alignItems: 'center', borderTop: 1, borderColor: 'divider', height: '2.8em' }}>
      <Tabs
        value={activeSheetId}
        onChange={(event, newValue) => setActiveSheet(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="sheet tabs"
      >
        {sheetIds.map((id) => {
          const sheet = sheets[id];
          if (!sheet) return null;
          const isEditing = editingSheetId === sheet.id;

          return (
            <Tab
              key={sheet.id}
              sx={{ height: '2em' }}
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
                        sx={{ flexGrow: 1 }}
                      />
                    ) : (
                      <span onDoubleClick={() => handleRenameSheet(sheet.id, sheet.name)}>{sheet.name}</span>
                    )}
                    <Box
                      component="span"
                      onClick={(e) => handleRemoveSheet(e, sheet.id)}
                      sx={{
                        ml: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 20,
                        height: 20,
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
      <Tooltip title="Add New Sheet">
        <span style={{ display: "contents" }}>
          <Button onClick={handleAddSheet} sx={{ height: '2.5em' }} data-testid="add-sheet-button">
            <Add />
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
};

export default SheetTabs;
