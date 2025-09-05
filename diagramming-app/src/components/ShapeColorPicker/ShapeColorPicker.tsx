import React from 'react';
import { Box, MenuItem, Tooltip } from '@mui/material';
import { colors } from './colors';

interface ShapeColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const ShapeColorPicker: React.FC<ShapeColorPickerProps> = ({ selectedColor, onColorSelect }) => {
  const getBorder = (colorValue: string) => {
    if (colorValue === selectedColor) {
      return '2px solid blue';
    } else {
      return '1px solid #ccc';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', width: '15em' }}>
      {colors.map((color) => (
        <Tooltip title={color.name} placement="top" key={color.value}>
          <MenuItem onClick={() => onColorSelect(color.value)} sx={{ p: 0 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: color.value, m: 0.5, border: getBorder(color.value) }} />
          </MenuItem>
        </Tooltip>
      ))}
    </Box>
  );
};

export default ShapeColorPicker;
