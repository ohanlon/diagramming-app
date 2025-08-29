import React from 'react';
import { Box, MenuItem } from '@mui/material';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const colors = ['transparent', '#FFFFFF', '#F2F3F0', '#DFE3E0', '#CED4DB', '#979EB1', '#6F7681', '#4C5348', '#4C535D', '#3A4141', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorSelect }) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', width: '15em' }}>
      {colors.map((color) => (
        <MenuItem key={color} onClick={() => onColorSelect(color)} sx={{ p: 0 }}>
          <Box sx={{ width: 20, height: 20, backgroundColor: color, m: 0.5, border: '1px solid #ccc' }} />
        </MenuItem>
      ))}
    </Box>
  );
};

export default ColorPicker;
