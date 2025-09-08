import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, Tooltip, Autocomplete, TextField, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface Shape {
  id: string;
  title: string;
  path: string;
  textPosition: 'inside' | 'outside';
  shape?: string;
  autosize?: boolean;
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pinnedEntries, setPinnedEntries] = useState<IndexEntry[]>([]);

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
    const fetchShapeSvgs = async (shapes: Shape[]) => {
      const shapesToFetch = shapes.filter((shape) => !shape.shape);
      if (shapesToFetch.length === 0) return shapes;

      const shapesWithSvg = await Promise.all(
        shapesToFetch.map(async (shape) => {
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

      return shapes.map((shape) => shapesWithSvg.find((s) => s.id === shape.id) || shape);
    };

    if (pinnedEntries.length > 0) {
      pinnedEntries.forEach(entry => {
        if (entry.shapes.some(shape => !shape.shape)) { // Check if shapes need fetching
          fetchShapeSvgs(entry.shapes).then(shapes => {
            setPinnedEntries(prev => prev.map(p => p.id === entry.id ? { ...p, shapes } : p));
          });
        }
      });
    }
  }, [pinnedEntries]);

  const handleUnpin = (entry: IndexEntry) => {
    setPinnedEntries(pinnedEntries.filter(e => e.id !== entry.id));
  };

  const filteredIndexEntries = indexEntries.filter((entry) =>
    entry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ width: 200, p: 2, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 12.5em)' }}>
      <Autocomplete
        options={filteredIndexEntries}
        getOptionLabel={(option) => option.name}
        value={null}
        onChange={(event, newValue) => {
          if (newValue && !pinnedEntries.find(entry => entry.id === newValue.id)) {
            setPinnedEntries([...pinnedEntries, newValue]);
          }
          setSearchTerm('');
        }}
        inputValue={searchTerm}
        onInputChange={(event, newInputValue) => {
          setSearchTerm(newInputValue);
        }}
        renderInput={(params) => <TextField {...params} label="Search Categories" variant="outlined" size="small" />}
        sx={{ mb: 2, flexShrink: 0 }}
      />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
        {pinnedEntries.map(entry => (
          <Box key={entry.id} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>{entry.name}</Typography>
              <Tooltip title="Unpin Category">
                <IconButton onClick={() => handleUnpin(entry)} size="small">
                  <Close />
                </IconButton>
              </Tooltip>
            </Box>
            <Grid container spacing={0.625}>
              {entry.shapes.map((shape) => (
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
                        e.dataTransfer.setData('autosize', String(shape.autosize));
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
        ))}
      </Box>
    </Box>
  );
};

export default ShapeStore;