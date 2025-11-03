import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
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
  useShapeCategories,
  useShapeSubcategories,
} from '../api';

const AdminImagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [categoryFeedback, setCategoryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [subcategoryFeedback, setSubcategoryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const createCategory = useCreateShapeCategory();
  const createSubcategory = useCreateShapeSubcategory();

  const handleCategorySelect = (event: SelectChangeEvent<string>) => {
    const nextId = event.target.value || null;
    setSelectedCategoryId(nextId);
    setSelectedSubcategoryId(null);
    setSubcategoryFeedback(null);
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

          <Paper elevation={0} variant="outlined" sx={{ p: 3, borderStyle: 'dashed', textAlign: 'center' }}>
            <Typography variant="subtitle1" gutterBottom>
              Upload workspace (coming next)
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Multiple SVG upload and validation will live here. While we build the next step, confirm the category pairing above.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Button variant="contained" color="secondary" disabled={!canUpload}>
              Continue to upload
            </Button>
            {!canUpload && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Select a category and sub-category to enable uploads.
              </Typography>
            )}
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
};

export default AdminImagesPage;
