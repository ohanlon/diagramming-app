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
    const fetchShapeSvgs = async () => {
      if (selectedIndexEntry) {
        const shapesWithSvg = await Promise.all(
          selectedIndexEntry.shapes.map(async (shape) => {
            if (shape.shape) return shape;
            try {
              const svgResponse = await fetch(shape.path);
              let svgContent = await svgResponse.text();
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
        setSelectedIndexEntry((prev) => (prev ? { ...prev, shapes: shapesWithSvg } : null));
      }
    };
    fetchShapeSvgs();
  }, [selectedIndexEntry]);

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
            {selectedIndexEntry.shapes.map((shape) => (
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
