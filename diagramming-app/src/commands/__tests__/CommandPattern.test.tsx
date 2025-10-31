/**
 * Tests for Command Pattern implementation
 */

import { CommandManager } from '../CommandManager';
import type { Command } from '../Command';

// Simple mock command for testing
class MockCommand implements Command {
  private executed = false;
  
  constructor(private id: string) {}
  
  execute(): void {
    this.executed = true;
  }
  
  undo(): void {
    this.executed = false;
  }
  
  getDescription(): string {
    return `Mock command ${this.id}`;
  }
  
  toJSON() {
    return {
      type: 'Mock',
      data: { id: this.id },
      timestamp: Date.now(),
    };
  }
  
  isExecuted(): boolean {
    return this.executed;
  }
}

describe('Command Pattern', () => {
  let commandManager: CommandManager;

  beforeEach(() => {
    commandManager = new CommandManager({ maxHistorySize: 10 });
  });

  describe('CommandManager', () => {
    it('should execute command and add to undo stack', () => {
      const command = new MockCommand('cmd1');
      
      commandManager.executeCommand(command);
      
      expect(command.isExecuted()).toBe(true);
      expect(commandManager.canUndo()).toBe(true);
      expect(commandManager.canRedo()).toBe(false);
    });

    it('should undo command', () => {
      const command = new MockCommand('cmd1');
      
      commandManager.executeCommand(command);
      expect(command.isExecuted()).toBe(true);
      
      const undone = commandManager.undo();
      
      expect(undone).toBe(true);
      expect(command.isExecuted()).toBe(false);
      expect(commandManager.canUndo()).toBe(false);
      expect(commandManager.canRedo()).toBe(true);
    });

    it('should redo command', () => {
      const command = new MockCommand('cmd1');
      
      commandManager.executeCommand(command);
      commandManager.undo();
      expect(command.isExecuted()).toBe(false);
      
      const redone = commandManager.redo();
      
      expect(redone).toBe(true);
      expect(command.isExecuted()).toBe(true);
      expect(commandManager.canUndo()).toBe(true);
      expect(commandManager.canRedo()).toBe(false);
    });

    it('should respect maxHistorySize', () => {
      const smallManager = new CommandManager({ maxHistorySize: 2 });
      
      // Add 3 commands (exceeds limit)
      for (let i = 1; i <= 3; i++) {
        const command = new MockCommand(`cmd${i}`);
        smallManager.executeCommand(command);
      }
      
      const historySize = smallManager.getHistorySize();
      expect(historySize.undo).toBe(2); // Should only keep last 2 commands
    });

    it('should clear redo stack when new command is executed', () => {
      const cmd1 = new MockCommand('cmd1');
      const cmd2 = new MockCommand('cmd2');
      
      // Execute, then undo
      commandManager.executeCommand(cmd1);
      commandManager.undo();
      
      expect(commandManager.canRedo()).toBe(true);
      
      // Execute new command - should clear redo
      commandManager.executeCommand(cmd2);
      
      expect(commandManager.canRedo()).toBe(false);
    });

    it('should handle multiple undo/redo operations', () => {
      const cmd1 = new MockCommand('cmd1');
      const cmd2 = new MockCommand('cmd2');
      const cmd3 = new MockCommand('cmd3');
      
      commandManager.executeCommand(cmd1);
      commandManager.executeCommand(cmd2);
      commandManager.executeCommand(cmd3);
      
      expect(commandManager.getHistorySize().undo).toBe(3);
      
      // Undo all
      commandManager.undo();
      commandManager.undo();
      commandManager.undo();
      
      expect(commandManager.getHistorySize().undo).toBe(0);
      expect(commandManager.getHistorySize().redo).toBe(3);
      
      // Redo all
      commandManager.redo();
      commandManager.redo();
      commandManager.redo();
      
      expect(commandManager.getHistorySize().undo).toBe(3);
      expect(commandManager.getHistorySize().redo).toBe(0);
    });

    it('should provide command descriptions', () => {
      const command = new MockCommand('test-cmd');
      
      commandManager.executeCommand(command);
      
      expect(commandManager.getUndoDescription()).toBe('Mock command test-cmd');
      
      commandManager.undo();
      
      expect(commandManager.getRedoDescription()).toBe('Mock command test-cmd');
    });

    it('should clear all history', () => {
      const cmd1 = new MockCommand('cmd1');
      const cmd2 = new MockCommand('cmd2');
      
      commandManager.executeCommand(cmd1);
      commandManager.executeCommand(cmd2);
      commandManager.undo();
      
      expect(commandManager.getHistorySize().undo).toBe(1);
      expect(commandManager.getHistorySize().redo).toBe(1);
      
      commandManager.clear();
      
      expect(commandManager.getHistorySize().undo).toBe(0);
      expect(commandManager.getHistorySize().redo).toBe(0);
      expect(commandManager.canUndo()).toBe(false);
      expect(commandManager.canRedo()).toBe(false);
    });

    it('should serialize to JSON', () => {
      const cmd1 = new MockCommand('cmd1');
      const cmd2 = new MockCommand('cmd2');
      
      commandManager.executeCommand(cmd1);
      commandManager.executeCommand(cmd2);
      commandManager.undo();
      
      const json = commandManager.toJSON();
      
      expect(json.undo).toHaveLength(1);
      expect(json.redo).toHaveLength(1);
      expect(json.undo[0]).toHaveProperty('type', 'Mock');
      expect(json.redo[0]).toHaveProperty('type', 'Mock');
    });
  });
});
