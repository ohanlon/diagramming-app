/**
 * Hook to sync diagram state between Zustand (client state) and React Query (server state)
 * This bridges local editing state with server persistence
 */

import { useEffect, useCallback, useRef } from 'react';
import { useDiagram, useSaveDiagram } from '../api/hooks';
import { useDiagramStore } from '../store/useDiagramStore';
import { useQueryClient } from '@tanstack/react-query';

interface UseDiagramSyncOptions {
  diagramId: string | null;
  autoSaveInterval?: number; // Auto-save interval in ms (default: 30000 = 30s)
  enabled?: boolean;
}

export function useDiagramSync({
  diagramId,
  autoSaveInterval = 30000,
  enabled = true,
}: UseDiagramSyncOptions) {
  const queryClient = useQueryClient();
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedServerDiagram = useRef(false);
  // React Query hooks
  const { data: serverDiagram, isLoading, error } = useDiagram(diagramId);
  const saveMutation = useSaveDiagram();
  
  // Zustand store selectors - only subscribe to isDirty for auto-save triggering
  const isDirty = useDiagramStore(state => state.isDirty);

  // Reset the loaded flag when diagramId changes
  useEffect(() => {
    hasLoadedServerDiagram.current = false;
  }, [diagramId]);

  /**
   * Load server diagram into Zustand store
   * Only load if we have valid server data with sheets
   */
  useEffect(() => {
    if (!enabled || !serverDiagram || !serverDiagram.sheets) return;

    // Only load server diagram once per diagramId to avoid overwriting user edits
    if (hasLoadedServerDiagram.current) return;
    hasLoadedServerDiagram.current = true;

    // Apply server state to Zustand
    useDiagramStore.setState({
      sheets: serverDiagram.sheets,
      activeSheetId: serverDiagram.activeSheetId,
      diagramName: serverDiagram.name,
      remoteDiagramId: serverDiagram.id,
      serverVersion: serverDiagram.version,
      isDirty: false,
    });
  }, [serverDiagram, enabled]);

  /**
   * Save current diagram to server
   */
  const saveToServer = useCallback(async (force = false) => {
    if (!enabled) return;

    // Get current state values
    const state = useDiagramStore.getState();
    const currentSheets = state.sheets;
    const currentDiagramName = state.diagramName;
    const currentActiveSheetId = state.activeSheetId;
    const currentIsSnapToGridEnabled = state.isSnapToGridEnabled;
    const currentServerVersion = state.serverVersion;

    // Prepare diagram data from Zustand state
    const sheetsToSave: any = {};
    for (const [sheetId, sheet] of Object.entries(currentSheets || {})) {
      const { clipboard, ...sheetWithoutClipboard } = sheet as any;
      sheetsToSave[sheetId] = sheetWithoutClipboard;
    }

    const diagramData = {
      name: currentDiagramName || 'New Diagram',
      sheets: sheetsToSave,
      activeSheetId: currentActiveSheetId,
      isSnapToGridEnabled: currentIsSnapToGridEnabled,
      version: force ? undefined : currentServerVersion,
    };

    try {
      // Generate thumbnail if possible
      let thumbnailDataUrl: string | null = null;
      try {
        if (typeof document !== 'undefined') {
          const { generateThumbnailFromSvgSelector } = await import('../utils/thumbnail');
          thumbnailDataUrl = await generateThumbnailFromSvgSelector('svg.canvas-svg', 128, 98);
        }
      } catch (e) {
        console.warn('Thumbnail generation failed:', e);
      }

      // Save via React Query mutation
      const result = await saveMutation.mutateAsync({
        diagramId,
        data: {
          ...diagramData,
          ...(thumbnailDataUrl ? { thumbnailDataUrl } : {}),
        } as any,
      });

      // Update Zustand with new server state
      useDiagramStore.setState({
        remoteDiagramId: result.id,
        serverVersion: result.version,
        isDirty: false,
        lastSaveError: null,
      });

      return result;
    } catch (error: any) {
      // Handle conflict (version mismatch)
      if (error.status === 412) {
        // Fetch latest version and show conflict dialog
        const latestDiagram = await queryClient.fetchQuery({
          queryKey: ['diagrams', diagramId],
        });
        
        useDiagramStore.setState({
          conflictServerState: (latestDiagram as any)?.state,
          conflictServerVersion: (latestDiagram as any)?.version,
          conflictOpen: true,
          conflictLocalState: diagramData,
        } as any);
      }

      useDiagramStore.setState({
        lastSaveError: error.message || 'Save failed',
      });

      throw error;
    }
  }, [diagramId, enabled, saveMutation, queryClient]);

  /**
   * Manual save function
   */
  const save = useCallback((force = false) => {
    return saveToServer(force);
  }, [saveToServer]);

  /**
   * Expose save function to Zustand store for legacy compatibility
   */
  useEffect(() => {
    useDiagramStore.setState({ 
      saveDiagramViaQuery: save 
    } as any);
    
    return () => {
      useDiagramStore.setState({ 
        saveDiagramViaQuery: undefined 
      } as any);
    };
  }, [save]);

  /**
   * Auto-save when diagram is dirty
   */
  useEffect(() => {
    if (!enabled || !isDirty || !diagramId) {
      // Clear timer if auto-save is disabled or diagram is clean
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      return;
    }

    // Set up auto-save timer
    autoSaveTimerRef.current = setTimeout(() => {
      console.log('[useDiagramSync] Auto-saving...');
      saveToServer().catch(err => {
        console.error('[useDiagramSync] Auto-save failed:', err);
      });
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [isDirty, diagramId, enabled, autoSaveInterval, saveToServer]);

  return {
    isLoading,
    error,
    isSaving: saveMutation.isPending,
    isDirty,
    save,
    saveError: saveMutation.error,
  };
}
