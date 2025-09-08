import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Close, ExpandMore as ExpandMoreIcon, PushPin as PushPinIcon, PushPinOutlined as PushPinOutlinedIcon } from '@mui/icons-material';

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
  const [pinnedCategoryIds, setPinnedCategoryIds] = useState<string[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<IndexEntry[]>([]);
  const [hoveredAccordionId, setHoveredAccordionId] = useState<string | null>(null);
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

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
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
            allIndexEntries.push({ ...subEntry, shapes: shapesInFile });
          }
        }
        setIndexEntries(allIndexEntries);

        const storedPinnedIds = localStorage.getItem('pinnedShapeCategoryIds');
        let initialPinnedIds: string[] = [];
        if (storedPinnedIds) {
          initialPinnedIds = JSON.parse(storedPinnedIds);
        }
        setPinnedCategoryIds(initialPinnedIds);

        // Initialize visible categories with pinned ones
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

  

  const filteredIndexEntries = indexEntries.filter((entry) =>
    entry.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !pinnedCategoryIds.includes(entry.id) && // Exclude already pinned categories
    !visibleCategories.some(vc => vc.id === entry.id) // Exclude already visible categories
  );

  return (
    <Box sx={{ width: 200, p: 2, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 12.5em)' }}>
      <Autocomplete
        options={indexEntries.filter(entry => !visibleCategories.some(vc => vc.id === entry.id))}
        getOptionLabel={(option) => option.name}
        value={null}
        onChange={(event, newValue) => {
          if (newValue) {
            setVisibleCategories(prev => [...prev, newValue]);
            setPinnedCategoryIds(prev => [...prev, newValue.id]);
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
              onMouseEnter={() => setHoveredAccordionId(entry.id)}
              onMouseLeave={() => setHoveredAccordionId(null)}
              sx={{
                minHeight: 48,
                '& .MuiAccordionSummary-content': {
                  margin: '12px 0',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Typography variant="subtitle1">{entry.name}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', visibility: hoveredAccordionId === entry.id ? 'visible' : 'hidden' }}>
                  <Tooltip title={pinnedCategoryIds.includes(entry.id) ? "Unpin Category" : "Pin Category"}>
                    <IconButton onClick={(e) => { e.stopPropagation(); handlePinToggle(entry); }} size="small">
                      {pinnedCategoryIds.includes(entry.id) ? <PushPinIcon sx={{ fontSize: 16 }} /> : <PushPinOutlinedIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove Category">
                    <IconButton onClick={(e) => { e.stopPropagation(); handleRemoveCategory(entry); }} size="small">
                      <Close sx={{ fontSize: 16 }} />
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
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

export default ShapeStore;