/**
 * CommandManager - Manages command execution and history
 */

import type { Command } from './Command';

interface CommandManagerOptions {
  maxHistorySize?: number;
}

export class CommandManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistorySize: number;

  constructor(options: CommandManagerOptions = {}) {
    this.maxHistorySize = options.maxHistorySize ?? 500; // Much larger than snapshot-based (was 100)
  }

  /**
   * Execute a command and add it to history
   */
  executeCommand(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    
    // Limit history size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    // Clear redo stack when new command is executed
    this.redoStack = [];
  }

  /**
   * Undo the last command
   */
  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;

    command.undo();
    this.redoStack.push(command);
    return true;
  }

  /**
   * Redo the last undone command
   */
  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;

    command.execute();
    this.undoStack.push(command);
    return true;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get the description of the next undo action
   */
  getUndoDescription(): string | null {
    const command = this.undoStack[this.undoStack.length - 1];
    return command ? command.getDescription() : null;
  }

  /**
   * Get the description of the next redo action
   */
  getRedoDescription(): string | null {
    const command = this.redoStack[this.redoStack.length - 1];
    return command ? command.getDescription() : null;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get history size for debugging
   */
  getHistorySize(): { undo: number; redo: number } {
    return {
      undo: this.undoStack.length,
      redo: this.redoStack.length,
    };
  }

  /**
   * Serialize history to JSON (for persistence)
   */
  toJSON(): { undo: unknown[]; redo: unknown[] } {
    return {
      undo: this.undoStack.map(cmd => cmd.toJSON()),
      redo: this.redoStack.map(cmd => cmd.toJSON()),
    };
  }
}
