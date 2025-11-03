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
      const response = await api.get<any>(`/diagrams/${diagramId}`);
      
      // Transform server response format to expected Diagram format
      // Server returns: { id, state: { sheets, activeSheetId, diagramName, ... }, version }
      // We need: { id, sheets, activeSheetId, name, version }
      return {
        id: response.id,
        name: response.state?.diagramName || response.name || 'Untitled',
        version: response.version,
        sheets: response.state?.sheets || {},
        activeSheetId: response.state?.activeSheetId || '',
        createdAt: response.created_at,
        updatedAt: response.updated_at,
      };
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
      // Transform data to server format
      // Server expects: { state: { diagramName, sheets, activeSheetId, ... } }
      // We provide: { name, sheets, activeSheetId, version }
      const serverPayload = {
        state: {
          diagramName: data.name || 'Untitled Diagram',
          sheets: data.sheets,
          activeSheetId: data.activeSheetId,
          isSnapToGridEnabled: (data as any).isSnapToGridEnabled,
        },
      };

      console.log('[useSaveDiagram] Saving diagram:', { diagramId, payload: serverPayload });

      let serverResponse: any;

      if (diagramId) {
        // Update existing diagram with version check
        const headers: Record<string, string> = {};
        if (data.version !== undefined) {
          headers['If-Match'] = `"v${data.version}"`;
        }
        serverResponse = await api.put<any>(`/diagrams/${diagramId}`, serverPayload, headers);
      } else {
        // Create new diagram
        serverResponse = await api.post<any>('/diagrams', serverPayload);
      }

      // Transform server response to expected format
      // Server returns: { id, version, state, ... }
      // We need: { id, version }
      return {
        id: serverResponse.id,
        version: serverResponse.version,
      };
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
