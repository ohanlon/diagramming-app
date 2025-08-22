import React, { useState, useEffect } from 'react';
import './ShapeStore.less';
import { Tooltip } from 'react-tooltip';

interface Shape {
  title: string;
  shape: string; // SVG content
}

interface Category {
  name: string;
  shapes: Shape[];
}

const ShapeStore: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchShapes = async () => {
      const fetchedCategories: Category[] = [];

      const categoryName = 'AWS Database';
      const categoryPath = '/shapes/aws-database'; // Base path for the category

      try {
        // Fetch the combined flowchart.json file
        const jsonResponse = await fetch(`${categoryPath}/shapes.json`);
        const shapesData: { title: string; path: string }[] = await jsonResponse.json();

        const flowchartShapes: Shape[] = [];
        for (const shapeData of shapesData) {
          const svgResponse = await fetch(shapeData.path);
          const svgContent = await svgResponse.text();

          flowchartShapes.push({
            title: shapeData.title,
            shape: svgContent,
          });
        }

        fetchedCategories.push({
          name: categoryName,
          shapes: flowchartShapes,
        });

        setCategories(fetchedCategories);
      } catch (error) {
        console.error(`Failed to load shapes for ${categoryName}:`, error);
      }
    };

    fetchShapes();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="shape-store">
      <Tooltip id="diagram-shapestore-tooltip" />
      {categories.map((category) => (
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