import { useDiagramStore } from '../store/useDiagramStore';
import type { Sheet } from '../types';

/**
 * Hook to safely access the active sheet with fallback handling
 * Returns null if the active sheet is not available
 */
export const useActiveSheet = (): Sheet | null => {
  const { sheets, activeSheetId } = useDiagramStore();
  return sheets[activeSheetId] || null;
};

/**
 * Hook to access the active sheet with guaranteed non-null return
 * Throws an error if the active sheet is not available
 */
export const useActiveSheetRequired = (): Sheet => {
  const activeSheet = useActiveSheet();
  if (!activeSheet) {
    throw new Error('Active sheet is required but not available');
  }
  return activeSheet;
};