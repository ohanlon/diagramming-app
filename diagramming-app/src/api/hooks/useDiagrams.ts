/**
 * Diagram API hooks using React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import type { Diagram, SaveDiagramRequest, SaveDiagramResponse } from '../types';

export const diagramKeys = {
  all: ['diagrams'] as const,
  detail: (id: string) => ['diagrams', id] as const,
  list: () => ['diagrams', 'list'] as const,
};

/**
 * Load a diagram by ID
 */
export function useDiagram(diagramId: string | null) {
  return useQuery({
    queryKey: diagramKeys.detail(diagramId || ''),
    queryFn: async (): Promise<Diagram> => {
      if (!diagramId) {
        throw new Error('No diagram ID provided');
      }
      return api.get<Diagram>(`/diagrams/${diagramId}`);
    },
    enabled: !!diagramId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Save/update diagram mutation
 */
export function useSaveDiagram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      diagramId,
      data,
    }: {
      diagramId: string | null;
      data: SaveDiagramRequest;
    }): Promise<SaveDiagramResponse> => {
      if (diagramId) {
        // Update existing diagram
        return api.put<SaveDiagramResponse>(`/diagrams/${diagramId}`, data);
      } else {
        // Create new diagram
        return api.post<SaveDiagramResponse>('/diagrams', data);
      }
    },
    onSuccess: (response, variables) => {
      // Invalidate and refetch the diagram
      queryClient.invalidateQueries({ queryKey: diagramKeys.detail(response.id) });
      
      // If it was a create, also invalidate the list
      if (!variables.diagramId) {
        queryClient.invalidateQueries({ queryKey: diagramKeys.list() });
      }
    },
  });
}

/**
 * List all diagrams for current user
 */
export function useDiagrams() {
  return useQuery({
    queryKey: diagramKeys.list(),
    queryFn: async (): Promise<Diagram[]> => {
      const response = await api.get<{ diagrams: Diagram[] }>('/diagrams');
      return response.diagrams || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Delete diagram mutation
 */
export function useDeleteDiagram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (diagramId: string): Promise<void> => {
      await api.delete(`/diagrams/${diagramId}`);
    },
    onSuccess: (_data, diagramId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: diagramKeys.detail(diagramId) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: diagramKeys.list() });
    },
  });
}
