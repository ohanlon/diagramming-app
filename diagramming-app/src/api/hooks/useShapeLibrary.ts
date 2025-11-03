import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiRequest } from '../client';
import type { DeleteShapeResponse, PromoteShapesResponse, ShapeAsset, ShapeCategory, ShapeSubcategory, ShapeTextPosition } from '../types';

export const shapeLibraryKeys = {
  all: ['shapeLibrary'] as const,
  categories: () => ['shapeLibrary', 'categories'] as const,
  subcategories: (categoryId: string) => ['shapeLibrary', 'subcategories', categoryId] as const,
  shapes: (subcategoryId: string) => ['shapeLibrary', 'shapes', subcategoryId] as const,
};

export function useShapeCategories() {
  return useQuery({
    queryKey: shapeLibraryKeys.categories(),
    queryFn: async (): Promise<ShapeCategory[]> => {
      const response = await api.get<{ categories: ShapeCategory[] }>('/admin/images/categories');
      return response?.categories ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateShapeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<ShapeCategory> => {
      const response = await api.post<{ category: ShapeCategory }>('/admin/images/categories', { name });
      return response.category;
    },
    onSuccess: (createdCategory) => {
      queryClient.setQueryData<ShapeCategory[]>(shapeLibraryKeys.categories(), (prev) => {
        const existing = prev ?? [];
        const withoutDupes = existing.filter((category) => category.id !== createdCategory.id);
        const next = [...withoutDupes, createdCategory];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
    },
  });
}

export function useShapeSubcategories(categoryId: string | null) {
  return useQuery({
    queryKey: shapeLibraryKeys.subcategories(categoryId ?? 'none'),
    enabled: Boolean(categoryId),
    queryFn: async (): Promise<ShapeSubcategory[]> => {
      if (!categoryId) return [];
      const response = await api.get<{ subcategories: ShapeSubcategory[] }>(`/admin/images/categories/${categoryId}/subcategories`);
      return response?.subcategories ?? [];
    },
    staleTime: 0,
  });
}

export function useCreateShapeSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ categoryId, name }: { categoryId: string; name: string }): Promise<ShapeSubcategory> => {
      const response = await api.post<{ subcategory: ShapeSubcategory }>(
        `/admin/images/categories/${categoryId}/subcategories`,
        { name },
      );
      return response.subcategory;
    },
    onSuccess: (createdSubcategory) => {
      queryClient.invalidateQueries({
        queryKey: shapeLibraryKeys.subcategories(createdSubcategory.categoryId),
      });
    },
  });
}

export function useShapeAssets(subcategoryId: string | null) {
  return useQuery({
    queryKey: shapeLibraryKeys.shapes(subcategoryId ?? 'none'),
    enabled: Boolean(subcategoryId),
    queryFn: async (): Promise<ShapeAsset[]> => {
      if (!subcategoryId) return [];
      const response = await api.get<{ shapes: ShapeAsset[] }>(`/admin/images/subcategories/${subcategoryId}/shapes`);
      return response?.shapes ?? [];
    },
  });
}

export function useUploadShapeAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ subcategoryId, files }: { subcategoryId: string; files: File[] }): Promise<{ created: ShapeAsset[]; errors: Array<{ file: string; message: string }> }> => {
      const form = new FormData();
      files.forEach((file) => {
        form.append('files', file);
      });
      const response = await apiRequest<{ created: ShapeAsset[]; errors: Array<{ file: string; message: string }> }>(
        `/admin/images/subcategories/${subcategoryId}/shapes/upload`,
        {
          method: 'POST',
          body: form,
        }
      );
      return response;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: shapeLibraryKeys.shapes(variables.subcategoryId) });
    },
  });
}

export function useUpdateShapeAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      textPosition,
      autosize,
    }: {
      id: string;
      title?: string;
      textPosition?: ShapeTextPosition;
      autosize?: boolean;
    }): Promise<ShapeAsset> => {
      const response = await api.patch<{ shape: ShapeAsset }>(`/admin/images/shapes/${id}`, {
        title,
        textPosition,
        autosize,
      });
      return response.shape;
    },
    onSuccess: (shape) => {
      queryClient.invalidateQueries({ queryKey: shapeLibraryKeys.shapes(shape.subcategoryId) });
    },
  });
}

export function usePromoteShapeAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subcategoryId: _subcategoryId,
      shapeIds,
    }: {
      subcategoryId: string;
      shapeIds: string[];
    }): Promise<PromoteShapesResponse> => {
      const response = await api.post<PromoteShapesResponse>('/admin/images/shapes/promote', {
        shapeIds,
      });
      return response;
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: shapeLibraryKeys.shapes(variables.subcategoryId) });
    },
  });
}

export function useDeleteShapeAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subcategoryId: _subcategoryId,
      shapeId,
    }: {
      subcategoryId: string;
      shapeId: string;
    }): Promise<DeleteShapeResponse> => {
      const response = await api.delete<DeleteShapeResponse>(`/admin/images/shapes/${shapeId}`);
      return response;
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: shapeLibraryKeys.shapes(variables.subcategoryId) });
    },
  });
}
