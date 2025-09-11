import { Box, MenuItem, Tooltip } from '@mui/material';
import type { Shape } from '../../types';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  selectedShapes: Shape[];
}

const colors = [
  { name: 'Transparent', value: 'transparent' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Summer cloud', value: '#F2F3F0' },
  { name: 'Moon', value: '#DFE3E0' },
  { name: 'Foggy day', value: '#CED4DB' },
  { name: 'Grey', value: '#979EB1' },
  { name: 'Dark Grey', value: '#6F7681' },
  { name: 'Noir', value: '#4C5348' },
  { name: 'Charcoal', value: '#4C535D' },
  { name: 'Midnight', value: '#3A4141' },
  { name: 'Black', value: '#000000' },
  { name: 'Iris', value: '#F2F2F0' },
  { name: 'Lavender', value: '#E6E0F8' },
  { name: 'Periwinkle', value: '#D9D0F8' },
  { name: 'Violet', value: '#BFA0F8' },
  { name: 'Purple', value: '#A070F8' },
  { name: 'Grape', value: '#9060F8' },
  { name: 'Indigo', value: '#8050F8' },
  { name: 'Blueberry', value: '#6050F8' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Sky', value: '#E0F7FF' },
  { name: 'Ice', value: '#C2F0FF' },
  { name: 'Seafoam', value: '#A3E8FF' },
  { name: 'Turquoise', value: '#7FE0FF' },
  { name: 'Cyan', value: '#4FD0FF' },
  { name: 'Ocean', value: '#1FB8FF' },
  { name: 'Blue Ocean', value: '#0096FF' },
  { name: 'Teal', value: '#0080FF' },
  { name: 'Mint', value: '#E0FFF2' },
  { name: 'Aqua', value: '#C2FFE4' },
  { name: 'Aquamarine', value: '#A3FFD6' },
  { name: 'Light Green', value: '#7FFFCA' },
  { name: 'Medium Green', value: '#4FFFBF' },
  { name: 'Green', value: '#1FFFAC' },
  { name: 'Emerald', value: '#00FF96' },
  { name: 'Jade', value: '#00E07F' },
  { name: 'Forest', value: '#00C060' },
  { name: 'Pine', value: '#00A050' },
  { name: 'Olive', value: '#F7FFF0' },
  { name: 'Lime', value: '#E6FFDF' },
  { name: 'Spring', value: '#D4FFC2' },
  { name: 'Light Yellow', value: '#C0FF9E' },
  { name: 'Yellow', value: '#A8FF7F' },
  { name: 'Gold', value: '#90FF60' },
  { name: 'Mustard', value: '#78FF40' },
  { name: 'Amber', value: '#60FF1F' },
  { name: 'Orange', value: '#FFB300' },
  { name: 'Peach', value: '#FFF0E0' },
  { name: 'Apricot', value: '#FFE0C2' },
  { name: 'Melon', value: '#FFD1A3' },
  { name: 'Light Coral', value: '#FFB780' },
  { name: 'Coral', value: '#FF9E60' },
  { name: 'Salmon', value: '#FF8640' },
  { name: 'Dark Salmon', value: '#FF6F20' },
  { name: 'Red', value: '#FF3D00' },
  { name: 'Ruby', value: '#F80000' },
  { name: 'Cranberry', value: '#E00000' },
  { name: 'Burgundy', value: '#C00000' },
  { name: 'Wine', value: '#A00000' },
  { name: 'Pink', value: '#FFF0F8' },
  { name: 'Blush', value: '#FFD1E6' },  
  // { name: 'Red', value: '#FF0000' },
  // { name: 'Green', value: '#00FF00' },
  // { name: 'Blue', value: '#0000FF' },
  // { name: 'Yellow', value: '#FFFF00' },
  // { name: 'Magenta', value: '#FF00FF' },
  // { name: 'Cyan', value: '#00FFFF' },
];

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorSelect, selectedShapes }) => {
  const selectedTextColors = selectedShapes.map(shape => shape.textColor);

  const getBorder = (colorValue: string) => {
    if (selectedTextColors.includes(colorValue)) {
      return '2px solid blue';
    } else if (colorValue === selectedColor) {
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

export default ColorPicker;
