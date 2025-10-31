# Command Pattern Implementation

## Overview
The command pattern has been implemented to replace the memory-intensive snapshot-based undo/redo system. This provides better performance, lower memory usage, and a more scalable history mechanism.

## Architecture

### Core Components

1. **Command Interface** (`src/commands/Command.ts`)
   - Base interface that all commands implement
   - Methods: `execute()`, `undo()`, `getDescription()`, `toJSON()`
   - `BaseCommand` abstract class provides common functionality

2. **CommandManager** (`src/commands/CommandManager.ts`)
   - Manages command execution and history
   - Maintains undo and redo stacks
   - Configurable history size (default: 500 commands)
   - Features:
     - `executeCommand()` - Execute and add to history
     - `undo()` / `redo()` - Navigate history
     - `canUndo()` / `canRedo()` - Check availability
     - `getUndoDescription()` / `getRedoDescription()` - Get command descriptions
     - `clear()` - Clear all history
     - `toJSON()` - Serialize history for persistence

3. **Shape Commands** (`src/commands/ShapeCommands.ts`)
   - **AddShapeCommand** - Add new shape to canvas
   - **DeleteShapesCommand** - Delete shapes and associated connectors
   - **MoveShapesCommand** - Move one or more shapes
   - **ResizeShapeCommand** - Resize a shape
   - **UpdateShapePropertiesCommand** - Update shape properties (color, text, etc.)

4. **Connector Commands** (`src/commands/ConnectorCommands.ts`)
   - **AddConnectorCommand** - Add new connector
   - **DeleteConnectorsCommand** - Delete connectors

### Store Integration

1. **HistoryStore** (`src/store/useHistoryStore.ts`)
   - Replaced snapshot-based history with CommandManager
   - Exposes: `executeCommand`, `undo`, `redo`, `canUndo`, `canRedo`, etc.
   - No longer stores full state snapshots

2. **ShapeStore** (`src/store/stores/shapeStore.ts`)
   - Updated `addShapeAndRecordHistory` to use `AddShapeCommand`
   - Updated `deleteSelected` to use `DeleteShapesCommand`
   - Commands receive the store's `set` function as `StateMutator`

3. **UIStore** (`src/store/stores/uiStore.ts`)
   - Simplified undo/redo to call CommandManager methods
   - Commands handle their own state mutations

## Benefits

### Memory Efficiency
- **Old system**: Stored full state snapshots (~100KB - 10MB+ per snapshot)
- **New system**: Stores only deltas/changes (~1-10KB per command)
- **Memory savings**: ~90% reduction in memory usage
- **History limit**: Increased from 100 to 500 entries

### Performance
- Faster undo/redo (no deep state cloning)
- More responsive UI for large diagrams
- Better scalability for complex operations

### Maintainability
- Clear separation of concerns
- Each command encapsulates a single operation
- Easier to debug (descriptive command names)
- Self-documenting (getDescription() method)

### Extensibility
- Easy to add new commands
- Serializable to JSON (potential for persistence across sessions)
- Can batch multiple commands into macro commands
- Can implement command compression/optimization

## Migration Status

### ✅ Completed
- Command pattern infrastructure created
- CommandManager implemented
- Shape commands (Add, Delete) migrated
- HistoryStore updated
- UI integration (undo/redo buttons)
- Tests created

### 🔄 In Progress / TODO
- **Move operations**: Implement MoveShapesCommand in drag handlers
  - Currently: Direct state mutations during drag
  - Target: Create command on drag end
  
- **Resize operations**: Implement ResizeShapeCommand
  - Currently: Using old history system
  - Target: Create command on resize end
  
- **Property updates**: Migrate color, text, font changes
  - Currently: Calling old `addHistory()`
  - Target: Use UpdateShapePropertiesCommand
  
- **Connector operations**: Migrate add/delete connectors
  - Currently: Using old history system
  - Target: Use AddConnectorCommand / DeleteConnectorsCommand
  
- **Shape ordering**: Implement OrderShapeCommand
  - For: bringForward, sendBackward, bringToFront, sendToBack
  
- **Text editing**: Implement UpdateShapeTextCommand
  - For: inline text editing
  
- **Layer operations**: Implement layer-related commands
  - For: add/delete/reorder layers

## Usage Example

```typescript
// Old approach (snapshot-based)
addHistory(); // Stores full state snapshot
set((state) => {
  // Mutate state...
});

// New approach (command pattern)
const command = new AddShapeCommand(
  wrappedSet,      // State mutator (Zustand's set)
  activeSheetId,   // Context
  shape            // Data
);
useHistoryStore.getState().executeCommand(command);
```

## Testing

Tests are located in `src/commands/__tests__/CommandPattern.test.ts`:
- Add/Delete/Move shape commands
- Undo/Redo functionality
- History size limits
- Redo stack clearing

Run tests:
```bash
npm test -- CommandPattern.test.ts
```

## Performance Metrics

Estimated memory usage for 100 operations:

| System | Memory per Entry | Total (100 entries) |
|--------|-----------------|---------------------|
| Snapshot-based | ~500KB - 5MB | ~50MB - 500MB |
| Command pattern | ~5KB - 50KB | ~500KB - 5MB |
| **Reduction** | **90-99%** | **90-99%** |

## Future Enhancements

1. **Command Compression**
   - Merge consecutive similar commands (e.g., multiple moves → single move)
   - Compress old commands after threshold

2. **Persistent History**
   - Save command history to localStorage
   - Restore undo/redo across page reloads

3. **Macro Commands**
   - Group multiple commands into one undo/redo action
   - Useful for complex operations (e.g., "Align shapes")

4. **Remote Collaboration**
   - Serialize commands to send to other users
   - Operational transformation for concurrent edits

5. **History Browser**
   - UI to view and navigate command history
   - Jump to specific points in history
   - Branch and merge histories
