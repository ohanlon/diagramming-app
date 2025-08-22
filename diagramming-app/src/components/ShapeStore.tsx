import React from 'react';
import { shapeStore } from '../store/shapeStore';
import './ShapeStore.less';
import { Tooltip } from 'react-tooltip';

const ShapeStore: React.FC = () => {
  return (
    <div className="shape-store">
      <Tooltip id="diagram-shapestore-tooltip" />
      {shapeStore.categories.map((category) => (
        <div key={category.name} className="category">
          <h3>{category.name}</h3>
          <div className="shapes">
            {category.shapes.map((shape) => (
              <div
                data-tooltip-id="diagram-shapestore-tooltip" data-tooltip-content={shape.title}
                key={shape.title}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('shapeType', shape.title);
                  e.dataTransfer.setData('svgContent', shape.shape);
                }}
                className="shape-item"
                dangerouslySetInnerHTML={{ __html: shape.shape }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShapeStore;