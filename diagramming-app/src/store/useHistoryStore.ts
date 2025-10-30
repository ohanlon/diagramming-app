import { create } from 'zustand';
import type { HistoryState, Sheet } from '../types';

interface HistoryStoreState {
  history: {
    past: HistoryState[];
    future: HistoryState[];
  };
}

interface HistoryStoreActions {
  recordHistory: (sheets: { [key: string]: Sheet }, activeSheetId: string) => void;
  undo: (currentSheets: { [key: string]: Sheet }, currentActiveSheetId: string) => HistoryState | undefined;
  redo: (currentSheets: { [key: string]: Sheet }, currentActiveSheetId: string) => HistoryState | undefined;
  initializeHistory: (sheets: { [key: string]: Sheet }, activeSheetId: string) => void;
}

const MAX_HISTORY_SIZE = 100;

export const useHistoryStore = create<HistoryStoreState & HistoryStoreActions>()((set, get) => ({
  history: {
    past: [],
    future: [],
  },

  recordHistory: (sheets, activeSheetId) => {
    set((state) => {
      const newPast = [...state.history.past, { sheets, activeSheetId }];

      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift();
      }

      return {
        history: { past: newPast, future: [] },
      };
    });
  },

  undo: (currentSheets, currentActiveSheetId) => {
    const { past, future } = get().history;
    if (past.length === 0) return undefined;

    const previousState = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    const currentStateForFuture = { sheets: currentSheets, activeSheetId: currentActiveSheetId };

    set({
      history: {
        past: newPast,
        future: [currentStateForFuture, ...future],
      },
    });
    return previousState;
  },

  redo: (currentSheets, currentActiveSheetId) => {
    const { past, future } = get().history;
    if (future.length === 0) return undefined;

    const nextState = future[0];
    const newFuture = future.slice(1);

    const currentStateForPast = { sheets: currentSheets, activeSheetId: currentActiveSheetId };

    set({
      history: {
        past: [...past, currentStateForPast],
        future: newFuture,
      },
    });
    return nextState;
  },

  initializeHistory: (sheets, activeSheetId) => {
    set({
      history: {
        past: [{ sheets, activeSheetId }],
        future: [],
      },
    });
  },
}));
