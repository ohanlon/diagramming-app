import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Tooltip } from '@mui/material';

interface Shape {
  title: string;
  shape: string;
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
      const categoryPath = '/shapes/aws-database';

      try {
        const jsonResponse = await fetch(`${categoryPath}/shapes.json`);
        const shapesData: { title: string; path: string }[] = await jsonResponse.json();

        const flowchartShapes: Shape[] = [];
        for (const shapeData of shapesData) {
          const svgResponse = await fetch(shapeData.path);
          let svgContent = await svgResponse.text();

          const svgTagRegex = /<svg([^>]*)>/;
          const match = svgTagRegex.exec(svgContent);

          if (match && match[1]) {
            let attributes = match[1];
            attributes = attributes.replace(/\swidth="[^"]*"/g, '');
            attributes = attributes.replace(/\sheight="[^"]*"/g, '');
            svgContent = `<svg${attributes}>${svgContent.substring(match[0].length)}`;
          }

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
  }, []);

  return (
    <Box sx={{ width: 200, p: 2, borderRight: 1, borderColor: 'divider' }}>
      {categories.map((category) => (
        <Box key={category.name} sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>{category.name}</Typography>
          <Grid container spacing={0.625}>
            {category.shapes.map((shape) => (
              <Grid
                key={shape.title}
                sx={{
                  flexBasis: '15%',
                  maxWidth: '20%',
                  padding: '4px', // Adjust padding to simulate spacing
                }}
              >
                <Tooltip title={shape.title} placement="top">
                  <Card
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('shapeType', shape.title);
                      e.dataTransfer.setData('svgContent', shape.shape);
                    }}
                    sx={{ cursor: 'grab', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: shape.shape }} style={{ width: '100%', height: '100%' }} />
                  </Card>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default ShapeStore;
