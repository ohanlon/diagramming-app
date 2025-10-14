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
import { useDiagramStore } from '../../store/useDiagramStore';
import { debounce } from '../../utils/debounce';

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
  const [serverSearchResults, setServerSearchResults] = useState<SearchableShape[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchCache = React.useRef<Map<string, SearchableShape[]>>(new Map());

  // Server configuration and current user from the central store
  const serverUrl = useDiagramStore(state => state.serverUrl) || 'http://localhost:4000';
  const currentUser = useDiagramStore(state => state.currentUser);

  const DEFAULT_VISIBLE_COUNT = 6;

  const handlePinToggle = async (entry: IndexEntry) => {
    // compute new pinned ids synchronously so we can persist immediately
    const prevPinned = pinnedCategoryIds;
    const isPinned = prevPinned.includes(entry.id);
    const newPinned = isPinned ? prevPinned.filter(id => id !== entry.id) : [...prevPinned, entry.id];
    setPinnedCategoryIds(newPinned);

    // Ensure the category is visible when pinned
    setVisibleCategories(prev => {
      if (prev.some(c => c.id === entry.id)) return prev;
      return [...prev, entry];
    });

    // Persist immediately: server when signed in, otherwise localStorage
    if (currentUser) {
      try {
        const { apiFetch } = await import('../../utils/apiFetch');
        const resp = await apiFetch(`${serverUrl}/users/me/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: { pinnedShapeCategoryIds: newPinned } }) });
        if (!resp.ok) {
          const text = await resp.text().catch(() => `<no response text>`);
          console.warn('Failed to persist pinned categories to server:', resp.status, text);
        }
      } catch (e) {
        console.warn('Failed to persist pinned categories to server', e);
      }
    } else {
      try {
        localStorage.setItem('pinnedShapeCategoryIds', JSON.stringify(newPinned));
      } catch (e) {
        console.warn('Failed to persist pinned categories to localStorage', e);
      }
    }
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
        const catalogResponse = await fetch(`${serverUrl}/shapes/catalog.json`);
        const catalog: CatalogEntry[] = await catalogResponse.json();
        const allIndexEntries: IndexEntry[] = [];

        for (const entry of catalog) {
          // Normalize entry.path to server URL to ensure we fetch from backend
          const entryIndexPath = entry.path && entry.path.startsWith('/') ? `${serverUrl}${entry.path}` : `${serverUrl}/shapes/${entry.path.replace(/^\//, '')}`;
          let indexRaw: string;
          try {
            const indexResponse = await fetch(entryIndexPath);
            if (!indexResponse.ok) {
              const text = await indexResponse.text().catch(() => `<failed to read response text>`);
              throw new Error(`Failed to fetch provider index ${entryIndexPath}: ${indexResponse.status} ${indexResponse.statusText} - ${text}`);
            }
            indexRaw = await indexResponse.text();
          } catch (err) {
            console.error('Failed to fetch provider index at', entryIndexPath, err);
            // skip this provider
            continue;
          }
          let index: IndexEntry[];
          try {
            index = JSON.parse(indexRaw) as IndexEntry[];
          } catch (err) {
            console.error('Failed to parse provider index JSON from', entryIndexPath, err);
            continue;
          }

          for (const subEntry of index) {
            // Normalize path: if subEntry.path starts with '/', treat as server absolute path
            const subPath = subEntry.path && subEntry.path.startsWith('/') ? `${serverUrl}${subEntry.path}` : `${serverUrl}/shapes/${subEntry.path.replace(/^\//, '')}`;
            const shapesResponse = await fetch(subPath);
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
                    const svgPath = shape.path.startsWith('/') ? `${serverUrl}${shape.path}` : `${serverUrl}/shapes/${shape.path.replace(/^\//, '')}`;
                    const svgResponse = await fetch(svgPath);
                    if (!svgResponse.ok) {
                      const text = await svgResponse.text().catch(() => '<no response text>');
                      throw new Error(`Failed to fetch SVG ${svgPath}: ${svgResponse.status} ${svgResponse.statusText} - ${text}`);
                    }
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

        // Load pinned category IDs from localStorage or server
        let initialPinnedIds: string[] = [];
        if (currentUser) {
          // Load from server
          try {
            const resp = await (await import('../../utils/apiFetch')).apiFetch(`${serverUrl}/users/me/settings`, { method: 'GET' });
            if (resp.ok) {
              const json = await resp.json();
              initialPinnedIds = json.settings?.pinnedShapeCategoryIds || [];
            }
          } catch (e) {
            console.warn('Failed to load pinned categories from server', e);
          }
        } else {
          // Load from localStorage
          try {
            const storedPinnedIds = localStorage.getItem('pinnedShapeCategoryIds');
            if (storedPinnedIds) {
              initialPinnedIds = JSON.parse(storedPinnedIds);
            }
          } catch (e) {
            console.warn('Failed to load pinned categories from localStorage', e);
          }
        }
        setPinnedCategoryIds(initialPinnedIds);

        // Load expanded accordions from localStorage
        const storedExpandedIds = localStorage.getItem('expandedShapeCategoryIds');
        let initialExpandedIds: string[] = [];
        if (storedExpandedIds) {
          initialExpandedIds = JSON.parse(storedExpandedIds);
        }
        setExpandedAccordions(initialExpandedIds);

        // If the user has no pinned categories, show no categories until they search/select one.
        // Otherwise show pinned categories plus a small number of default unpinned categories.
        if (!initialPinnedIds || initialPinnedIds.length === 0) {
          setVisibleCategories([]);
        } else {
          const pinnedEntries = allIndexEntries.filter(entry => initialPinnedIds.includes(entry.id));
          const unpinnedDefaults = allIndexEntries.filter(entry => !initialPinnedIds.includes(entry.id)).slice(0, DEFAULT_VISIBLE_COUNT);
          setVisibleCategories([...pinnedEntries, ...unpinnedDefaults]);
        }

      } catch (error) {
        console.error('Failed to load shapes:', error);
      }
    };
    fetchAllData();
  }, []);

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

  // Server-side search function (debounced caller will use this)
  const performServerSearch = async (query: string) => {
    const q = query.trim();
    if (!q) {
      setServerSearchResults(null);
      setIsSearching(false);
      return;
    }

    const cached = searchCache.current.get(q);
    if (cached) {
      setServerSearchResults(cached);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const resp = await fetch(`${serverUrl}/shapes/search?q=${encodeURIComponent(q)}`);
      if (!resp.ok) {
        // Read server response text for diagnostics (helps debug 500 HTML/stack trace responses)
        const text = await resp.text().catch(() => '<failed to read response text>');
        console.warn(`Server search returned non-OK status ${resp.status} ${resp.statusText}: ${text}`);
        setServerSearchResults(null);
        setIsSearching(false);
        return;
      }
      const json = await resp.json();
      const results = (json.results || []).map((r: any) => {
        // Normalize to SearchableShape shape
        const shape: Shape = { id: r.shapeId || r.name || 'unknown', name: r.name || '', path: r.path || '', textPosition: 'outside' };
        const category: IndexEntry = { id: r.categoryId || `${r.provider}:${r.category}`, name: r.category || '', path: r.path || '', shapes: [], provider: r.provider || '' };
        return { shape, category } as SearchableShape;
      });
      searchCache.current.set(q, results);
      setServerSearchResults(results);
    } catch (e) {
      console.warn('Server search failed', e);
      setServerSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedServerSearch = React.useMemo(() => debounce((...args: any[]) => { void performServerSearch(String(args[0] || '')); }, 250), [serverUrl]);

  useEffect(() => {
    return () => {
      debouncedServerSearch.cancel && debouncedServerSearch.cancel();
    };
  }, [debouncedServerSearch]);

  return (
    <Box sx={{
      backgroundColor: 'background', // match toolbar / AppBar background
      color: 'primary.contrastText' // ensure readable text over the primary background
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        // height: 'calc(100vh - 12.5em)',
        overflow: 'hidden',
        marginLeft: '0.5em',
        marginTop: '0.5em',
      }}>
        <Autocomplete
          options={(searchTerm && serverSearchResults) ? serverSearchResults : searchableShapes.filter(searchable => !visibleCategories.some(vc => vc.id === searchable.category.id))}
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
                // Add visible but do NOT pin by default
                setVisibleCategories(prev => [...prev, categoryToAdd]);
                setExpandedAccordions(prev => prev.includes(categoryToAdd.id) ? prev : [...prev, categoryToAdd.id]);
              }
            }
            setSearchTerm('');
          }}
          inputValue={searchTerm}
          onInputChange={(_event, newInputValue) => {
            setSearchTerm(newInputValue);
            // If a server search is desired, call it debounced
            if (newInputValue && newInputValue.trim().length > 1) {
              debouncedServerSearch(newInputValue);
            } else {
              // if short or empty, clear server results
              setServerSearchResults(null);
            }
          }}
          renderInput={(params) => <TextField {...params} label={isSearching ? 'Searching...' : 'Search Shapes & Categories'} variant="outlined" size="small" />}
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
            // background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            // background: '#c1c1c1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            // background: '#a1a1a1',
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
                        {pinnedCategoryIds.includes(entry.id) ? <PushPinIcon sx={{ fontSize: '1em' }} /> : <PushPinOutlinedIcon sx={{ fontSize: '1em' }} />}
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
                            // Normalize shape.path into a fully-qualified server URL so Canvas can fetch it directly
                            const normalizedSvgPath = shape.path
                              ? (shape.path.startsWith('/') ? `${serverUrl}${shape.path}` : `${serverUrl}/shapes/${shape.path.replace(/^\//, '')}`)
                              : '';
                            e.dataTransfer.setData('shapePath', normalizedSvgPath);
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
    </Box>
  );
};

export default ShapeStore;