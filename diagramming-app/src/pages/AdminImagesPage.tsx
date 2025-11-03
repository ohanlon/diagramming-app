import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useNavigate } from 'react-router-dom';
import AccountMenu from '../components/AppBar/AccountMenu';
import { ApiClientError } from '../api/client';
import {
  useCreateShapeCategory,
  useCreateShapeSubcategory,
  useShapeAssets,
  useShapeCategories,
  useShapeSubcategories,
  useUpdateShapeAsset,
  useUploadShapeAssets,
} from '../api';
import type { ShapeTextPosition } from '../api/types';

const TEXT_POSITIONS: ShapeTextPosition[] = ['Inside', 'Outside', 'None'];

type DraftState = {
  title: string;
  textPosition: ShapeTextPosition;
  autosize: boolean;
  dirty: boolean;
};

const AdminImagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [categoryFeedback, setCategoryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [subcategoryFeedback, setSubcategoryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Array<{ file: string; message: string }>>([]);
  const [editFeedback, setEditFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useShapeCategories();

  useEffect(() => {
    if (!categoriesLoading && categories.length > 0 && !selectedCategoryId) {
      const firstCategory = categories[0];
      if (firstCategory) setSelectedCategoryId(firstCategory.id);
    }
  }, [categoriesLoading, categories, selectedCategoryId]);

  const {
    data: subcategories = [],
    isFetching: subcategoriesFetching,
    error: subcategoriesError,
  } = useShapeSubcategories(selectedCategoryId);

  useEffect(() => {
    if (subcategories.length > 0) {
      const firstSubcategory = subcategories[0];
      setSelectedSubcategoryId((current) => current ?? firstSubcategory?.id ?? null);
    } else {
      setSelectedSubcategoryId(null);
    }
  }, [subcategories]);

  const {
    data: shapes = [],
    isFetching: shapesFetching,
    isLoading: shapesLoading,
    error: shapesError,
  } = useShapeAssets(selectedSubcategoryId);

  const createCategory = useCreateShapeCategory();
  const createSubcategory = useCreateShapeSubcategory();
  const uploadShapes = useUploadShapeAssets();
  const updateShape = useUpdateShapeAsset();

  useEffect(() => {
    setUploadFeedback(null);
    setUploadErrors([]);
    setEditFeedback(null);
    setDrafts({});
  }, [selectedSubcategoryId]);

  useEffect(() => {
    if (!selectedSubcategoryId) {
      setDrafts({});
      return;
    }
    setDrafts((prev) => {
      const next: Record<string, DraftState> = {};
      shapes.forEach((shape) => {
        const baseTitle = shape.title?.trim().length ? shape.title : shape.originalFilename;
        const existing = prev[shape.id];
        if (existing && existing.dirty) {
          next[shape.id] = existing;
        } else {
          next[shape.id] = {
            title: baseTitle ?? '',
            textPosition: shape.textPosition,
            autosize: shape.autosize,
            dirty: false,
          };
        }
      });
      return next;
    });
  }, [shapes, selectedSubcategoryId]);

  const handleCategorySelect = (event: SelectChangeEvent<string>) => {
    const nextId = event.target.value || null;
    setSelectedCategoryId(nextId);
    setSelectedSubcategoryId(null);
    setSubcategoryFeedback(null);
    setUploadFeedback(null);
    setUploadErrors([]);
  };

  const handleSubcategorySelect = (event: SelectChangeEvent<string>) => {
    const nextId = event.target.value || null;
    setSelectedSubcategoryId(nextId);
  };

  const handleAddCategory = async () => {
    setCategoryFeedback(null);
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryFeedback({ type: 'error', message: 'Enter a category name first.' });
      return;
    }
    try {
      const created = await createCategory.mutateAsync(trimmed);
      setNewCategoryName('');
      setCategoryFeedback({ type: 'success', message: `Added category "${created.name}".` });
      setSelectedCategoryId(created.id);
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : 'Failed to add category';
      setCategoryFeedback({ type: 'error', message });
    }
  };

  const handleAddSubcategory = async () => {
    setSubcategoryFeedback(null);
    const trimmed = newSubcategoryName.trim();
    if (!selectedCategoryId) {
      setSubcategoryFeedback({ type: 'error', message: 'Select a category first.' });
      return;
    }
    if (!trimmed) {
      setSubcategoryFeedback({ type: 'error', message: 'Enter a sub-category name first.' });
      return;
    }
    try {
      const created = await createSubcategory.mutateAsync({ categoryId: selectedCategoryId, name: trimmed });
      setNewSubcategoryName('');
      setSubcategoryFeedback({ type: 'success', message: `Added sub-category "${created.name}".` });
      setSelectedSubcategoryId(created.id);
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : 'Failed to add sub-category';
      setSubcategoryFeedback({ type: 'error', message });
    }
  };

  const canUpload = useMemo(() => Boolean(selectedCategoryId && selectedSubcategoryId), [selectedCategoryId, selectedSubcategoryId]);

  const handleUploadButtonClick = () => {
    if (!selectedSubcategoryId) {
      setUploadFeedback({ type: 'error', message: 'Select a sub-category before uploading.' });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFilesSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const fileList = input.files;
    if (!fileList || fileList.length === 0) {
      input.value = '';
      return;
    }
    if (!selectedSubcategoryId) {
      setUploadFeedback({ type: 'error', message: 'Select a sub-category before uploading.' });
      input.value = '';
      return;
    }
    const files = Array.from(fileList);
    input.value = '';
    try {
      const result = await uploadShapes.mutateAsync({ subcategoryId: selectedSubcategoryId, files });
      const createdCount = result.created?.length ?? 0;
      if (createdCount > 0) {
        setUploadFeedback({ type: 'success', message: `Uploaded ${createdCount} shape${createdCount === 1 ? '' : 's'}.` });
      } else {
        setUploadFeedback({ type: 'error', message: 'No shapes were uploaded.' });
      }
      setUploadErrors(result.errors || []);
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : 'Failed to upload shapes';
      setUploadFeedback({ type: 'error', message });
    }
  }, [selectedSubcategoryId, uploadShapes]);

  const handleDraftChange = useCallback((id: string, patch: Partial<DraftState>) => {
    setEditFeedback(null);
    setDrafts((prev) => {
      const currentShape = shapes.find((shape) => shape.id === id);
      const currentTitle = currentShape ? (currentShape.title?.trim().length ? currentShape.title : currentShape.originalFilename) : '';
      const existing: DraftState = prev[id] ?? {
        title: currentTitle ?? '',
        textPosition: currentShape?.textPosition ?? 'None',
        autosize: currentShape?.autosize ?? true,
        dirty: false,
      };
      const nextDraft: DraftState = {
        ...existing,
        ...patch,
      };
      if (currentShape) {
        const dirty =
          nextDraft.title !== currentShape.title ||
          nextDraft.textPosition !== currentShape.textPosition ||
          nextDraft.autosize !== currentShape.autosize;
        nextDraft.dirty = dirty;
      } else {
        nextDraft.dirty = true;
      }
      return { ...prev, [id]: nextDraft };
    });
  }, [shapes]);

  const handleResetDraft = useCallback((id: string) => {
    const shape = shapes.find((item) => item.id === id);
    if (!shape) return;
    const baseTitle = shape.title?.trim().length ? shape.title : shape.originalFilename;
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        title: baseTitle ?? '',
        textPosition: shape.textPosition,
        autosize: shape.autosize,
        dirty: false,
      },
    }));
  }, [shapes]);

  const handleSaveDraft = useCallback(async (id: string) => {
    const draft = drafts[id];
    const shape = shapes.find((item) => item.id === id);
    if (!draft || !shape) return;
    try {
      await updateShape.mutateAsync({
        id,
        title: draft.title,
        textPosition: draft.textPosition,
        autosize: draft.autosize,
      });
      setEditFeedback({ type: 'success', message: 'Saved shape details.' });
      setDrafts((prev) => ({
        ...prev,
        [id]: {
          ...draft,
          dirty: false,
        },
      }));
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : 'Failed to update shape';
      setEditFeedback({ type: 'error', message });
    }
  }, [drafts, shapes, updateShape]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: (theme) => theme.palette.background.default }}>
      <AppBar position="static" color="primary" sx={{ padding: '0 1rem' }}>
        <Toolbar variant="dense" disableGutters>
          <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            Images Library
          </Typography>
          <Button color="inherit" onClick={() => navigate('/admin/settings')} sx={{ mr: 1 }}>
            Settings
          </Button>
          <AccountMenu />
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        <Stack spacing={3} maxWidth={760}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Prepare SVG uploads
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Choose or create a category and sub-category before uploading SVG assets. Categories help group providers (for example AWS), while sub-categories handle finer groupings such as services or icon packs. We will add the multi-file upload flow next.
            </Typography>
          </Box>

          {categoriesError && (
            <Alert severity="error">{categoriesError instanceof Error ? categoriesError.message : 'Failed to load categories'}</Alert>
          )}
          {categoryFeedback && <Alert severity={categoryFeedback.type} onClose={() => setCategoryFeedback(null)}>{categoryFeedback.message}</Alert>}

          <Paper elevation={1} sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Categories
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select an existing category or create a new one if it is missing. Category names must be unique across the library.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="category-select-label">Category</InputLabel>
                  <Select
                    labelId="category-select-label"
                    label="Category"
                    value={selectedCategoryId ?? ''}
                    onChange={handleCategorySelect}
                    disabled={categoriesLoading}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                    {categories.length === 0 && <MenuItem value="" disabled>No categories yet</MenuItem>}
                  </Select>
                </FormControl>
                {categoriesLoading && <CircularProgress size={24} />}
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <TextField
                  label="New category name"
                  size="small"
                  fullWidth
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  autoComplete="off"
                />
                <Button
                  variant="contained"
                  onClick={handleAddCategory}
                  disabled={createCategory.isPending}
                >
                  {createCategory.isPending ? 'Adding…' : 'Add category'}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {subcategoriesError && (
            <Alert severity="error">{subcategoriesError instanceof Error ? subcategoriesError.message : 'Failed to load sub-categories'}</Alert>
          )}
          {subcategoryFeedback && <Alert severity={subcategoryFeedback.type} onClose={() => setSubcategoryFeedback(null)}>{subcategoryFeedback.message}</Alert>}

          <Paper elevation={1} sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Sub-categories
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sub-categories live under a category and inherit its grouping. They should describe the collection within the provider, for example Compute, Networking, or Management.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <FormControl fullWidth size="small" disabled={!selectedCategoryId}>
                  <InputLabel id="subcategory-select-label">Sub-category</InputLabel>
                  <Select
                    labelId="subcategory-select-label"
                    label="Sub-category"
                    value={selectedSubcategoryId ?? ''}
                    onChange={handleSubcategorySelect}
                    disabled={!selectedCategoryId || subcategoriesFetching}
                  >
                    {subcategories.map((subcategory) => (
                      <MenuItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </MenuItem>
                    ))}
                    {subcategories.length === 0 && <MenuItem value="" disabled>No sub-categories yet</MenuItem>}
                  </Select>
                </FormControl>
                {subcategoriesFetching && <CircularProgress size={24} />}
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <TextField
                  label="New sub-category name"
                  size="small"
                  fullWidth
                  value={newSubcategoryName}
                  onChange={(event) => setNewSubcategoryName(event.target.value)}
                  autoComplete="off"
                  disabled={!selectedCategoryId}
                />
                <Button
                  variant="contained"
                  onClick={handleAddSubcategory}
                  disabled={!selectedCategoryId || createSubcategory.isPending}
                >
                  {createSubcategory.isPending ? 'Adding…' : 'Add sub-category'}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Shapes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload SVG files into the staging library for the selected sub-category. The filename becomes the initial title and can be edited inline below.
                </Typography>
              </Box>

              <input
                type="file"
                accept=".svg"
                multiple
                ref={fileInputRef}
                onChange={handleFilesSelected}
                style={{ display: 'none' }}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleUploadButtonClick}
                  disabled={!canUpload || uploadShapes.isPending}
                >
                  {uploadShapes.isPending ? 'Uploading…' : 'Upload SVGs'}
                </Button>
                {!canUpload && (
                  <Typography variant="caption" color="text.secondary">
                    Select a category and sub-category to enable uploads.
                  </Typography>
                )}
              </Stack>

              {uploadFeedback && (
                <Alert severity={uploadFeedback.type} onClose={() => setUploadFeedback(null)}>
                  {uploadFeedback.message}
                </Alert>
              )}

              {uploadErrors.length > 0 && (
                <Alert severity="warning" onClose={() => setUploadErrors([])}>
                  {uploadErrors.length === 1 ? 'One file could not be uploaded:' : `${uploadErrors.length} files could not be uploaded:`}
                  <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                    {uploadErrors.map((err) => (
                      <li key={`${err.file}-${err.message}`}>{err.file}: {err.message}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {shapesError && (
                <Alert severity="error">{shapesError instanceof Error ? shapesError.message : 'Failed to load shapes'}</Alert>
              )}

              {editFeedback && (
                <Alert severity={editFeedback.type} onClose={() => setEditFeedback(null)}>
                  {editFeedback.message}
                </Alert>
              )}

              <Divider />

              {(shapesLoading || shapesFetching) && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">Loading shapes…</Typography>
                </Stack>
              )}

              {!shapesLoading && !shapesFetching && shapes.length === 0 && selectedSubcategoryId && (
                <Typography variant="body2" color="text.secondary">
                  No shapes uploaded yet for this sub-category.
                </Typography>
              )}

              {shapes.length > 0 && (
                <Stack spacing={2}>
                  {shapes.map((shape) => {
                    const baseTitle = shape.title?.trim().length ? shape.title : shape.originalFilename;
                    const draft = drafts[shape.id] ?? {
                      title: baseTitle ?? '',
                      textPosition: shape.textPosition,
                      autosize: shape.autosize,
                      dirty: false,
                    };
                    return (
                      <Paper key={shape.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={2}>
                          <TextField
                            label="Title"
                            size="small"
                            value={draft.title}
                            onChange={(event) => handleDraftChange(shape.id, { title: event.target.value })}
                            fullWidth
                            autoComplete="off"
                          />
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                            <TextField
                              label="Text position"
                              select
                              size="small"
                              value={draft.textPosition}
                              onChange={(event) => handleDraftChange(shape.id, { textPosition: event.target.value as ShapeTextPosition })}
                              sx={{ minWidth: 180 }}
                            >
                              {TEXT_POSITIONS.map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                              ))}
                            </TextField>
                            <FormControlLabel
                              control={(
                                <Switch
                                  inputProps={{ 'aria-label': 'Toggle autosize' }}
                                  checked={draft.autosize}
                                  onChange={(event) => handleDraftChange(shape.id, { autosize: event.target.checked })}
                                />
                              )}
                              label="Autosize"
                            />
                            <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Path</Typography>
                              <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {shape.path}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} sx={{ ml: { md: 'auto' } }}>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleSaveDraft(shape.id)}
                                disabled={!draft.dirty || updateShape.isPending}
                              >
                                Save
                              </Button>
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => handleResetDraft(shape.id)}
                                disabled={!draft.dirty || updateShape.isPending}
                              >
                                Reset
                              </Button>
                            </Stack>
                          </Stack>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
};

export default AdminImagesPage;
