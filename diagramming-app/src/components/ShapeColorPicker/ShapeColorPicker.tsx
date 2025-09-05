import React from 'react';
import { Grid, Box } from '@mui/material';
import { colors } from './colors';

interface ShapeColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const ShapeColorPicker: React.FC<ShapeColorPickerProps> = ({ selectedColor, onColorSelect }) => {
  return (
    <Box sx={{ p: 1 }}>
      <Grid container spacing={1}>
        {colors.map((color) => (
          <Grid item key={color}>
            <Box
              sx={{
                width: 24,
                height: 24,
                backgroundColor: color,
                cursor: 'pointer',
                border: selectedColor === color ? '2px solid #000' : '1px solid #ccc',
              }}
              onClick={() => onColorSelect(color)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ShapeColorPicker;
