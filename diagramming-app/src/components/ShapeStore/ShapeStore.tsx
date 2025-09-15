import React, { useState, useEffect, useMemo } from 'react';
import './ShapeStore.less';
import {
  Box,
  Typography,
  Grid,
  Card,
  Tooltip,
  Autocomplete,
  TextField,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  createFilterOptions,
} from '@mui/material';
import { Close, ExpandMore as ExpandMoreIcon, PushPin as PushPinIcon, PushPinOutlined as PushPinOutlinedIcon } from '@mui/icons-material';

interface Shape {
  id: string;
  title: string;
  path: string;
  textPosition: 'inside' | 'outside';
  shape?: string;
  autosize?: boolean;
  color?: string; // Add color property
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

interface SearchableShape {
  shape: Shape;
  category: IndexEntry;
}

const filterOptions = createFilterOptions<SearchableShape>({
  matchFrom: 'any',
  stringify: (option) => `${option.shape.title} ${option.category.name}`,
});

const ShapeStore: React.FC = () => {
  const [indexEntries, setIndexEntries] = useState<IndexEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pinnedCategoryIds, setPinnedCategoryIds] = useState<string[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<IndexEntry[]>([]);
  const [expanded, setExpanded] = useState<string | false>(false);

  const handlePinToggle = (entry: IndexEntry) => {
    setPinnedCategoryIds(prevPinnedIds => {
      const isPinned = prevPinnedIds.includes(entry.id);
      if (isPinned) {
        return prevPinnedIds.filter(id => id !== entry.id);
      } else {
        return [...prevPinnedIds, entry.id];
      }
    });
  };

  const handleRemoveCategory = (entry: IndexEntry) => {
    setVisibleCategories(prevVisibleCategories => prevVisibleCategories.filter(cat => cat.id !== entry.id));
  };

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

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

            const shapesWithSvgContent: Shape[] = await Promise.all(
              shapesInFile.map(async (shape) => {
                if (shape.path) { // Ensure path exists
                  try {
                    const svgResponse = await fetch(shape.path);
                    const svgContent = await svgResponse.text();
                    return { ...shape, shape: svgContent }; // Assign SVG content to 'shape' property
                  } catch (svgError) {
                    console.error(`Failed to load SVG for ${shape.path}:`, svgError);
                    return shape; // Return original shape if SVG fetch fails
                  }
                }
                return shape; // Return original shape if no path
              })
            );

            allIndexEntries.push({ ...subEntry, shapes: shapesWithSvgContent });
          }
        }
        setIndexEntries(allIndexEntries);

        const storedPinnedIds = localStorage.getItem('pinnedShapeCategoryIds');
        let initialPinnedIds: string[] = [];
        if (storedPinnedIds) {
          initialPinnedIds = JSON.parse(storedPinnedIds);
        }
        setPinnedCategoryIds(initialPinnedIds);

        const initialVisibleCategories = allIndexEntries.filter(entry =>
          initialPinnedIds.includes(entry.id)
        );
        setVisibleCategories(initialVisibleCategories);

      } catch (error) {
        console.error('Failed to load shapes:', error);
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    localStorage.setItem('pinnedShapeCategoryIds', JSON.stringify(pinnedCategoryIds));
  }, [pinnedCategoryIds]);

  const searchableShapes = useMemo<SearchableShape[]>(() => {
    const allShapes: SearchableShape[] = [];
    indexEntries.forEach(category => {
      if (category.shapes) {
        category.shapes.forEach(shape => {
          allShapes.push({ shape, category });
        });
      }
    });
    return allShapes;
  }, [indexEntries]);

  return (
    <Box sx={{ width: 200, p: 2, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 12.5em)' }}>
      <Autocomplete
        options={searchableShapes.filter(searchable => !visibleCategories.some(vc => vc.id === searchable.category.id))}
        getOptionLabel={(option) => option.shape.title}
        groupBy={(option) => option.category.name}
        filterOptions={filterOptions}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.shape.id}>
            {option.shape.shape && <div className="shape-thumbnail-container" style={{ width: 24, height: 24, marginRight: 8 }} dangerouslySetInnerHTML={{ __html: option.shape.shape }} />}
            {option.shape.title}
          </Box>
        )}
        value={null}
        onChange={(_event, newValue) => {
          if (newValue) {
            const categoryToAdd = indexEntries.find(entry => entry.id === newValue.category.id);
            if (categoryToAdd && !visibleCategories.some(vc => vc.id === categoryToAdd.id)) {
              setVisibleCategories(prev => [...prev, categoryToAdd]);
              setPinnedCategoryIds(prev => [...prev, categoryToAdd.id]);
              setExpanded(categoryToAdd.id);
            }
          }
          setSearchTerm('');
        }}
        inputValue={searchTerm}
        onInputChange={(_event, newInputValue) => {
          setSearchTerm(newInputValue);
        }}
        renderInput={(params) => <TextField {...params} label="Search Shapes & Categories" variant="outlined" size="small" />}
        sx={{ mb: 2, flexShrink: 0 }}
      />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
        {visibleCategories.map(entry => (
          <Accordion
            key={entry.id}
            expanded={expanded === entry.id}
            onChange={handleAccordionChange(entry.id)}
            sx={{ mb: 1, '&:before': { display: 'none' } }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${entry.id}-content`}
              id={`${entry.id}-header`}
              sx={{
                minHeight: 48,
                '& .MuiAccordionSummary-content': {
                  margin: '12px 0',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Tooltip title={entry.name}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: '1 1 auto',
                    minWidth: 0,
                      width: '6.25rem'
                    }}
                  >
                    {entry.name}
                  </Typography>
                </Tooltip>
                <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <Tooltip title={pinnedCategoryIds.includes(entry.id) ? "Unpin Category" : "Pin Category"}>
                    <IconButton component="span" onClick={(e) => { e.stopPropagation(); handlePinToggle(entry); }} size="small">
                      {pinnedCategoryIds.includes(entry.id) ? <PushPinIcon sx={{ fontSize: '1em'}} /> : <PushPinOutlinedIcon sx={{ fontSize: '1em' }} />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove Category">
                    <IconButton component="span" onClick={(e) => { e.stopPropagation(); handleRemoveCategory(entry); }} size="small">
                      <Close sx={{ fontSize: '1em' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={0.625}>
                {entry.shapes.map((shape) => (
                  <Grid
                    key={shape.id}
                    sx={{
                      // flexBasis: '15%',
                      maxWidth: '20%',
                      padding: '6px',
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

                        {shape.shape && <div className="shape-thumbnail-container" dangerouslySetInnerHTML={{ __html: shape.shape }} />}
                      </Card>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

export default ShapeStore;