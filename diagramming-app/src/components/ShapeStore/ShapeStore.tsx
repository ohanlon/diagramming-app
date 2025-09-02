import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, Tooltip, Autocomplete, TextField } from '@mui/material';

interface Shape {
  id: string;
  title: string;
  path: string;
  textPosition: 'inside' | 'outside';
  shape?: string;
}

interface CatalogEntry {
  id: string;
  name: string;
  path: string;
}

interface IndexEntry {
  id: string;
  name: string;
  path: string;
  shapes: Shape[];
}

const ShapeStore: React.FC = () => {
  const [indexEntries, setIndexEntries] = useState<IndexEntry[]>([]);
  const [selectedIndexEntry, setSelectedIndexEntry] = useState<IndexEntry | null>(null);
  const [selectedShapes, setSelectedShapes] = useState<Shape[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const catalogResponse = await fetch('/shapes/catalog.json');
        const catalog: CatalogEntry[] = await catalogResponse.json();
        const allIndexEntries: IndexEntry[] = [];

        for (const entry of catalog) {
          const indexResponse = await fetch(entry.path);
          const index: IndexEntry[] = await indexResponse.json();

          for (const subEntry of index) {
            const shapesResponse = await fetch(subEntry.path);
            const shapesInFile: Shape[] = await shapesResponse.json();
            allIndexEntries.push({ ...subEntry, shapes: shapesInFile });
          }
        }
        setIndexEntries(allIndexEntries);
      } catch (error) {
        console.error('Failed to load shapes:', error);
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedIndexEntry) {
      // Deep copy the shapes to prevent any mutation of the original data
      setSelectedShapes(JSON.parse(JSON.stringify(selectedIndexEntry.shapes)));
    } else {
      setSelectedShapes([]);
    }
  }, [selectedIndexEntry]);

  useEffect(() => {
    const fetchShapeSvgs = async () => {
      const shapesToFetch = selectedShapes.filter((shape) => !shape.shape);
      if (shapesToFetch.length === 0) return;

      const shapesWithSvg = await Promise.all(
        shapesToFetch.map(async (shape) => {
          try {
            const svgResponse = await fetch(shape.path);
            let svgContent = await svgResponse.text();
            const uniqueSuffix = shape.id.replace(/-/g, '');

            // Make all IDs within the SVG unique by appending the shape's ID.
            // This prevents ID collisions when multiple SVGs are on the page.
            svgContent = svgContent.replace(/id="([^"]+)"/g, (_, id) => `id="${id}_${uniqueSuffix}"`);
            svgContent = svgContent.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${id}_${uniqueSuffix})`);
            svgContent = svgContent.replace(/xlink:href="#([^"]+)"/g, (_, id) => `xlink:href="#${id}_${uniqueSuffix}"`);

            const svgTagRegex = /<svg([^>]*)>/;
            const match = svgTagRegex.exec(svgContent);
            if (match && match[1]) {
              let attributes = match[1];
              attributes = attributes.replace(/\swidth="[^"]*"/g, '');
              attributes = attributes.replace(/\sheight="[^"]*"/g, '');
              svgContent = `<svg${attributes}>${svgContent.substring(match[0].length)}`;
            }
            return { ...shape, shape: svgContent };
          } catch (error) {
            console.error(`Failed to load SVG for ${shape.title}:`, error);
            return shape;
          }
        })
      );

      setSelectedShapes((prevShapes) =>
        prevShapes.map((shape) => {
          const newShape = shapesWithSvg.find((s) => s.id === shape.id);
          return newShape || shape;
        })
      );
    };

    if (selectedShapes.length > 0) {
      fetchShapeSvgs();
    }
  }, [selectedShapes]);

  const filteredIndexEntries = indexEntries.filter((entry) =>
    entry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ width: 200, p: 2, borderRight: 1, borderColor: 'divider' }}>
      <Autocomplete
        options={filteredIndexEntries}
        getOptionLabel={(option) => option.name}
        value={selectedIndexEntry}
        onChange={(event, newValue) => {
          setSelectedIndexEntry(newValue);
        }}
        inputValue={searchTerm}
        onInputChange={(event, newInputValue) => {
          setSearchTerm(newInputValue);
        }}
        renderInput={(params) => <TextField {...params} label="Search Categories" variant="outlined" size="small" />}
        sx={{ mb: 2 }}
      />

      {selectedIndexEntry && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>{selectedIndexEntry.name}</Typography>
          <Grid container spacing={0.625}>
            {selectedShapes.map((shape) => (
              <Grid
                key={shape.id}
                sx={{
                  flexBasis: '15%',
                  maxWidth: '20%',
                  padding: '4px',
                }}
              >
                <Tooltip title={shape.title} placement="top">
                  <Card
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('shapeType', shape.title);
                      if (shape.shape) {
                        e.dataTransfer.setData('svgContent', shape.shape);
                      }
                      e.dataTransfer.setData('textPosition', shape.textPosition);
                    }}
                    sx={{ cursor: 'grab', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    data-testid={shape.id}
                  >
                    {shape.shape && <div dangerouslySetInnerHTML={{ __html: shape.shape }} style={{ width: '100%', height: '100%' }} />}
                  </Card>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ShapeStore;
