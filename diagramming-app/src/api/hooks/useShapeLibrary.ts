import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import type { ShapeCategory, ShapeSubcategory } from '../types';

export const shapeLibraryKeys = {
  all: ['shapeLibrary'] as const,
  categories: () => ['shapeLibrary', 'categories'] as const,
  subcategories: (categoryId: string) => ['shapeLibrary', 'subcategories', categoryId] as const,
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
