// UI-related store actions and state
import type { DiagramState, Point } from '../../types';

export interface UIStoreActions {
  // Viewport operations
  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  
  // UI state
  toggleFullscreen: () => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  resetStore: () => void;
}

// This will be imported and used in the main store
export const createUIActions = (
  set: (fn: (state: DiagramState) => DiagramState) => void,
  _get: () => DiagramState,
  initialState: DiagramState,
  useHistoryStore: any
): UIStoreActions => ({

  setZoom: (zoom: number) => {
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            zoom: zoom,
          },
        },
      };
    });
  },

  setPan: (pan: Point) => {
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            pan: pan,
          },
        },
      };
    });
  },

  toggleFullscreen: () =>
    set((state) => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      return state;
    }),

  undo: () => {
    // Command pattern: commands manage their own state mutations
    // No need to update store state here; commands handle it via their mutator
    useHistoryStore.getState().undo();
  },

  redo: () => {
    // Command pattern: commands manage their own state mutations
    // No need to update store state here; commands handle it via their mutator
    useHistoryStore.getState().redo();
  },

  resetStore: () => {
    set(() => ({
      ...initialState,
    }));
  },
});