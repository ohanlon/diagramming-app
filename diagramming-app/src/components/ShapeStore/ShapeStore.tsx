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

interface ShapeLibraryResponse {
  categories?: ShapeLibraryCategory[];
}

interface ShapeLibraryCategory {
  id: string;
  name: string;
  subcategories?: ShapeLibrarySubcategory[];
}

interface ShapeLibrarySubcategory {
  id: string;
  name: string;
  shapes?: ShapeLibraryShape[];
}

interface ShapeLibraryShape {
  id?: string;
  title?: string;
  path?: string;
  textPosition?: string;
  autosize?: boolean;
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

const normalizeTextPositionValue = (value?: string | null): 'inside' | 'outside' | 'None' => {
  if (!value) return 'outside';
  if (value === 'None') return 'None';
  const lower = value.toLowerCase();
  if (lower === 'inside' || lower === 'outside') {
    return lower;
  }
  return 'outside';
};

const normalizeShapePath = (rawPath?: string | null): string => {
  if (!rawPath) return '';
  let trimmed = rawPath.trim().replace(/\\/g, '/');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('/public/')) {
    trimmed = trimmed.slice('/public/'.length);
  } else if (trimmed.startsWith('public/')) {
    trimmed = trimmed.slice('public/'.length);
  }
  if (trimmed.startsWith('/shapes/')) {
    return trimmed;
  }
  if (trimmed.startsWith('shapes/')) {
    return `/${trimmed}`;
  }
  if (trimmed.startsWith('/')) {
    return `/shapes/${trimmed.replace(/^\/+/, '')}`;
  }
  return `/shapes/${trimmed}`;
};

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

  // Default unpinned count was removed in favor of showing only pinned
  // categories when a user has pinned entries; keep constant here for
  // future configurability if needed.

  const handlePinToggle = async (entry: IndexEntry) => {
    // compute new pinned ids synchronously so we can persist immediately
    const prevPinned = pinnedCategoryIds;
    const isPinned = prevPinned.includes(entry.id);
    const newPinned = isPinned ? prevPinned.filter(id => id !== entry.id) : [...prevPinned, entry.id];
    setPinnedCategoryIds(newPinned);

    // Ensure the category is visible when pinned; when unpinning remove it
    setVisibleCategories(prev => {
      if (isPinned) {
        // We are unpinning -> remove from visible list
        return prev.filter(c => c.id !== entry.id);
      }
      // We are pinning -> add to visible list if not already present
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
    let cancelled = false;

    const fetchAllData = async () => {
      try {
        const response = await fetch(`${serverUrl}/shapes/library`);
        if (!response.ok) {
          const text = await response.text().catch(() => '<no response text>');
          throw new Error(`Failed to load shapes library: ${response.status} ${response.statusText} - ${text}`);
        }
        const library = (await response.json()) as ShapeLibraryResponse;
        const categories = Array.isArray(library?.categories) ? library.categories : [];
        const allIndexEntries: IndexEntry[] = [];

        for (const category of categories) {
          const subcategories = Array.isArray(category?.subcategories) ? category.subcategories : [];
          for (const subcategory of subcategories) {
            const shapes = Array.isArray(subcategory?.shapes) ? subcategory.shapes : [];
            const shapesWithSvgContent: Shape[] = await Promise.all(
              shapes.map(async (shape, index) => {
                const normalizedPath = normalizeShapePath(shape.path);
                let svgContent: string | undefined;
                if (normalizedPath) {
                  let svgUrl = normalizedPath;
                  if (!/^https?:\/\//i.test(svgUrl)) {
                    svgUrl = `${serverUrl}${svgUrl}`;
                  }
                  try {
                    const svgResponse = await fetch(svgUrl);
                    if (!svgResponse.ok) {
                      const text = await svgResponse.text().catch(() => '<no response text>');
                      throw new Error(`Failed to fetch SVG ${svgUrl}: ${svgResponse.status} ${svgResponse.statusText} - ${text}`);
                    }
                    const svgRaw = await svgResponse.text();
                    const uniqueId = generateShapeUniqueId(shape.id || shape.title || subcategory.id, index);
                    svgContent = makeImageSVGUnique(svgRaw, uniqueId);
                  } catch (svgError) {
                    console.warn(`Failed to load SVG for ${normalizedPath}:`, svgError);
                  }
                }

                const fallbackName = shape.title?.trim() || shape.id?.trim() || `Shape ${index + 1}`;
                const normalized: Shape = {
                  id: shape.id || `${subcategory.id}_${index}`,
                  name: fallbackName,
                  path: normalizedPath,
                  textPosition: normalizeTextPositionValue(shape.textPosition),
                  autosize: shape.autosize ?? true,
                };
                if (svgContent) {
                  normalized.shape = svgContent;
                }
                return normalized;
              })
            );

            allIndexEntries.push({
              id: subcategory.id,
              name: subcategory.name,
              path: subcategory.id,
              shapes: shapesWithSvgContent,
              provider: category.name,
            });
          }
        }

        if (cancelled) return;

        setIndexEntries(allIndexEntries);

        let initialPinnedIds: string[] = [];
        if (currentUser) {
          try {
            const { apiFetch } = await import('../../utils/apiFetch');
            const resp = await apiFetch(`${serverUrl}/users/me/settings`, { method: 'GET' });
            if (resp.ok) {
              const json = await resp.json();
              initialPinnedIds = json.settings?.pinnedShapeCategoryIds || [];
            } else {
              const text = await resp.text().catch(() => '<no response text>');
              console.warn('Failed to load pinned categories from server:', resp.status, text);
            }
          } catch (e) {
            console.warn('Failed to load pinned categories from server', e);
          }
        } else {
          try {
            const storedPinnedIds = localStorage.getItem('pinnedShapeCategoryIds');
            if (storedPinnedIds) {
              initialPinnedIds = JSON.parse(storedPinnedIds);
            }
          } catch (e) {
            console.warn('Failed to load pinned categories from localStorage', e);
          }
        }

        if (cancelled) return;

        setPinnedCategoryIds(initialPinnedIds);

        const storedExpandedIds = localStorage.getItem('expandedShapeCategoryIds');
        let initialExpandedIds: string[] = [];
        if (storedExpandedIds) {
          try {
            initialExpandedIds = JSON.parse(storedExpandedIds);
          } catch (e) {
            console.warn('Failed to parse expanded shape category ids from localStorage', e);
          }
        }

        if (cancelled) return;

        setExpandedAccordions(initialExpandedIds);

        if (!initialPinnedIds || initialPinnedIds.length === 0) {
          setVisibleCategories([]);
        } else {
          const pinnedEntries = allIndexEntries.filter(entry => initialPinnedIds.includes(entry.id));
          setVisibleCategories(pinnedEntries);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load shapes:', error);
        }
      }
    };

    fetchAllData();

    return () => {
      cancelled = true;
    };
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
        const normalizedPath = normalizeShapePath(r.path);
        const shape: Shape = {
          id: r.shapeId || r.name || 'unknown',
          name: r.name || '',
          path: normalizedPath,
          textPosition: normalizeTextPositionValue(r.textPosition),
          autosize: typeof r.autosize === 'boolean' ? r.autosize : true,
        };
        const category: IndexEntry = {
          id: r.categoryId || `${r.provider}:${r.category}`,
          name: r.category || '',
          path: normalizedPath,
          shapes: [],
          provider: r.provider || '',
        };
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
      // backgroundColor: 'primary.main', // match toolbar / AppBar background
      color: 'primary.contrastText' // ensure readable text over the primary background
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 12.5em)', // constrain height so inner area can scroll
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
              sx={{
                mb: 1,
                '&:before': { display: 'none' },
                '&:hover': {
                  // backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                },
              }}
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