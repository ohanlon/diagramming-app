import React from 'react';
import type { ShapeType } from '../types';
import './Palette.less';

interface PaletteProps {
  onDragStart: (type: ShapeType) => void;
}

const Palette: React.FC<PaletteProps> = ({ onDragStart }) => {
  const shapes: { type: ShapeType; label: string; icon: React.ReactNode }[] = [
    {
      type: 'rectangle',
      label: 'Rectangle',
      icon: <svg width="50" height="50"><rect x="10" y="10" width="30" height="30" fill="lightblue" stroke="black" /></svg>,
    },
    {
      type: 'circle',
      label: 'Circle',
      icon: <svg width="50" height="50"><circle cx="25" cy="25" r="15" fill="lightgreen" stroke="black" /></svg>,
    },
    {
      type: 'diamond',
      label: 'Diamond',
      icon: <svg width="50" height="50"><polygon points="25,5 45,25 25,45 5,25" fill="lightcoral" stroke="black" /></svg>,
    },
    {
      type: 'text',
      label: 'Text Block',
      icon: <svg width="50" height="50"><rect x="5" y="15" width="40" height="20" fill="lightgray" stroke="black" /><text x="10" y="30" fontSize="12" fontFamily="sans-serif">Text</text></svg>,
    },
  ];

  return (
    <div className="palette">
      <h3>Shapes</h3>
      {
        shapes.map((shape) => (
          <div
            key={shape.type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('shapeType', shape.type);
              onDragStart(shape.type);
            }}
            className="shape-item"
          >
            {shape.icon}
            <span>{shape.label}</span>
          </div>
        ))
      }
    </div>
  );
};

export default Palette;