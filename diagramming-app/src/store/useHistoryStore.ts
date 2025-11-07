import { create } from 'zustand';
import { CommandManager } from '../commands/CommandManager';
import type { Command } from '../commands/Command';

interface HistoryStoreState {
  commandManager: CommandManager;
}

interface HistoryStoreActions {
  executeCommand: (command: Command) => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
  clearHistory: () => void;
  getHistorySize: () => { undo: number; redo: number };
}

export const useHistoryStore = create<HistoryStoreState & HistoryStoreActions>()((_, get) => ({
  commandManager: new CommandManager({ maxHistorySize: 500 }),

  executeCommand: (command: Command) => {
    get().commandManager.executeCommand(command);
  },

  undo: () => {
    return get().commandManager.undo();
  },

  redo: () => {
    return get().commandManager.redo();
  },

  canUndo: () => {
    return get().commandManager.canUndo();
  },

  canRedo: () => {
    return get().commandManager.canRedo();
  },

  getUndoDescription: () => {
    return get().commandManager.getUndoDescription();
  },

  getRedoDescription: () => {
    return get().commandManager.getRedoDescription();
  },

  clearHistory: () => {
    get().commandManager.clear();
  },

  getHistorySize: () => {
    return get().commandManager.getHistorySize();
  },
}));
