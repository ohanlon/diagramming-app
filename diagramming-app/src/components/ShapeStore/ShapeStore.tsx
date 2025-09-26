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
import { type Interaction } from '../../types';
import { makeImageSVGUnique, generateShapeUniqueId } from '../../utils/svgUtils';

interface ShapeFileEntry {
  name?: string;
  title?: string;
  path?: string;
  textPosition?: 'inside' | 'outside' | 'None';
  autosize?: boolean;
}

interface Shape {
  id: string;
  name: string;
  path: string;
  textPosition: 'inside' | 'outside' | 'None';
  shape?: string;
  autosize?: boolean;
  color?: string; // Add color property
  interaction?: Interaction;
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
  provider: string;
}

interface SearchableShape {
  shape: Shape;
  category: IndexEntry;
}

const filterOptions = createFilterOptions<SearchableShape>({
  matchFrom: 'any',
  stringify: (option) => `${option.shape.name} ${option.category.name} ${option.category.provider}`
});

const ShapeStore: React.FC = () => {
  const [indexEntries, setIndexEntries] = useState<IndexEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pinnedCategoryIds, setPinnedCategoryIds] = useState<string[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<IndexEntry[]>([]);
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);

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
    // Also remove from expanded accordions when category is removed
    setExpandedAccordions(prev => prev.filter(id => id !== entry.id));
  };

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordions(prev => {
      if (isExpanded) {
        // Add panel to expanded list if not already there
        return prev.includes(panel) ? prev : [...prev, panel];
      } else {
        // Remove panel from expanded list
        return prev.filter(id => id !== panel);
      }
    });
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
            const shapesInFile: ShapeFileEntry[] = await shapesResponse.json();

            const shapesWithSvgContent: Shape[] = await Promise.all(
              shapesInFile.map(async (shape, index) => {
                const normalizedShape = { 
                  ...shape, 
                  id: shape.name || `shape_${index}`,
                  name: shape.name || shape.title || '',
                  textPosition: shape.textPosition || 'outside',
                  autosize: shape.autosize ?? true,
                  path: shape.path || ''
                };
                if (shape.path) { // Ensure path exists
                  try {
                    const svgResponse = await fetch(shape.path);
                    const svgContent = await svgResponse.text();
                    // Make SVG IDs unique to prevent conflicts in the DOM
                    const uniqueId = generateShapeUniqueId(normalizedShape.name || `shape_${index}`, index);
                    const uniqueSvgContent = makeImageSVGUnique(svgContent, uniqueId);
                    return { ...normalizedShape, shape: uniqueSvgContent }; // Assign unique SVG content
                  } catch (svgError) {
                    console.error(`Failed to load SVG for ${shape.path}:`, svgError);
                    return normalizedShape; // Return original shape if SVG fetch fails
                  }
                }
                return normalizedShape; // Return original shape if no path
              })
            );

            allIndexEntries.push({ ...subEntry, shapes: shapesWithSvgContent, provider: entry.name });
          }
        }
        setIndexEntries(allIndexEntries);

        const storedPinnedIds = localStorage.getItem('pinnedShapeCategoryIds');
        let initialPinnedIds: string[] = [];
        if (storedPinnedIds) {
          initialPinnedIds = JSON.parse(storedPinnedIds);
        }
        setPinnedCategoryIds(initialPinnedIds);

        // Load expanded accordions from localStorage
        const storedExpandedIds = localStorage.getItem('expandedShapeCategoryIds');
        let initialExpandedIds: string[] = [];
        if (storedExpandedIds) {
          initialExpandedIds = JSON.parse(storedExpandedIds);
        }
        setExpandedAccordions(initialExpandedIds);

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

  // Persist expanded accordions to localStorage
  useEffect(() => {
    localStorage.setItem('expandedShapeCategoryIds', JSON.stringify(expandedAccordions));
  }, [expandedAccordions]);

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
    <Box sx={{ 
      marginLeft: '0.5em', 
      marginTop: '0.5em', 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 12.5em)',
      overflow: 'hidden'
    }}>
      <Autocomplete
        options={searchableShapes.filter(searchable => !visibleCategories.some(vc => vc.id === searchable.category.id))}
        getOptionLabel={(option) => option.shape.name || ''}
        groupBy={(option) => `${option.category.provider}: ${option.category.name}`}
        filterOptions={filterOptions}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.shape.id}>
            {option.shape.shape && (
              <div 
                className="shape-thumbnail-container" 
                style={{ width: 24, height: 24, marginRight: 8 }} 
                dangerouslySetInnerHTML={{ 
                  __html: makeImageSVGUnique(option.shape.shape, `search_${option.shape.id}`)
                }} 
              />
            )}
            {option.shape.name || ''}
          </Box>
        )}
        value={null}
        onChange={(_event, newValue) => {
          if (newValue) {
            const categoryToAdd = indexEntries.find(entry => entry.id === newValue.category.id);
            if (categoryToAdd && !visibleCategories.some(vc => vc.id === categoryToAdd.id)) {
              setVisibleCategories(prev => [...prev, categoryToAdd]);
              setPinnedCategoryIds(prev => [...prev, categoryToAdd.id]);
              setExpandedAccordions(prev => prev.includes(categoryToAdd.id) ? prev : [...prev, categoryToAdd.id]);
            }
          }
          setSearchTerm('');
        }}
        inputValue={searchTerm}
        onInputChange={(_event, newInputValue) => {
          setSearchTerm(newInputValue);
        }}
        renderInput={(params) => <TextField {...params} label="Search Shapes & Categories" variant="outlined" size="small" />}
        sx={{ mb: 0, flexShrink: 0 }}
      />

      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        mb: 0,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#c1c1c1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#a1a1a1',
        },
      }}>
        {visibleCategories.map(entry => (
          <Accordion
            key={entry.id}
            expanded={expandedAccordions.includes(entry.id)}
            onChange={handleAccordionChange(entry.id)}
            sx={{ mb: 1, '&:before': { display: 'none' } }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${entry.id}-content`}
              id={`${entry.id}-header`}
              sx={{
                height: 32,
                minHeight: 32,
                '&.Mui-expanded': {
                  height: 32,
                  minHeight: 32,
                },
                '& .MuiAccordionSummary-content': {
                  margin: 'auto 0',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Tooltip title={`${entry.provider}: ${entry.name}`}>
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
                    <span style={{ color: 'grey' }}>{entry.provider}: </span>
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
                    <Tooltip title={shape.name || ''} placement="top">
                      <Card
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('shapeType', shape.name || '');
                          // Removed: e.dataTransfer.setData('svgContent', shape.shape);
                          if (shape.interaction) {
                            e.dataTransfer.setData('interaction', JSON.stringify(shape.interaction));
                          }
                          e.dataTransfer.setData('textPosition', shape.textPosition);
                          e.dataTransfer.setData('autosize', String(shape.autosize));
                          e.dataTransfer.setData('shapePath', shape.path); // New: Add shape.path
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