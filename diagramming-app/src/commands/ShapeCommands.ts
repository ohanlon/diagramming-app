/**
 * Shape-related commands for the Command pattern
 */

import { BaseCommand, type CommandJSON, type StateMutator } from './Command';
import type { Shape, Point } from '../types';
import { _addShapeToState } from '../store/stores/shapeStore';

/**
 * Command to add a new shape
 */
export class AddShapeCommand extends BaseCommand {
  constructor(
    private setState: StateMutator,
    private activeSheetId: string,
    private shape: Shape
  ) {
    super();
  }

  execute(): void {
    this.setState((state) => _addShapeToState(state, this.shape));
  }

  undo(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      delete newShapesById[this.shape.id];

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            shapeIds: currentSheet.shapeIds.filter((id: string) => id !== this.shape.id),
          },
        },
      };
    });
  }

  getDescription(): string {
    return `Add shape: ${this.shape.type}`;
  }

  toJSON(): CommandJSON {
    return {
      type: 'AddShape',
      data: { shape: this.shape, activeSheetId: this.activeSheetId },
      timestamp: this.timestamp,
    };
  }
}

/**
 * Command to delete shapes
 */
export class DeleteShapesCommand extends BaseCommand {
  private deletedShapes: Shape[];
  private deletedConnectors: Array<{ id: string; connector: any }>;

  constructor(
    private setState: StateMutator,
    private activeSheetId: string,
    private shapeIds: string[],
    private getCurrentShapes: () => Record<string, Shape>,
    private getCurrentConnectors: () => Record<string, any>
  ) {
    super();
    this.deletedShapes = [];
    this.deletedConnectors = [];
  }

  execute(): void {
    // Store deleted shapes for undo
    const currentShapes = this.getCurrentShapes();
    this.deletedShapes = this.shapeIds.map(id => currentShapes[id]!).filter(Boolean);

    // Store deleted connectors for undo
    const currentConnectors = this.getCurrentConnectors();
    this.deletedConnectors = Object.entries(currentConnectors)
      .filter(([_, connector]) => 
        this.shapeIds.includes(connector.startNodeId) || 
        this.shapeIds.includes(connector.endNodeId)
      )
      .map(([id, connector]) => ({ id, connector }));

    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      this.shapeIds.forEach(id => delete newShapesById[id]);

      const newConnectors = { ...currentSheet.connectors };
      this.deletedConnectors.forEach(({ id }) => delete newConnectors[id]);

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            shapeIds: currentSheet.shapeIds.filter((id: string) => !this.shapeIds.includes(id)),
            connectors: newConnectors,
            selectedShapeIds: [],
            selectedConnectorIds: [],
          },
        },
      };
    });
  }

  undo(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      this.deletedShapes.forEach(shape => {
        newShapesById[shape.id] = shape;
      });

      const newConnectors = { ...currentSheet.connectors };
      this.deletedConnectors.forEach(({ id, connector }) => {
        newConnectors[id] = connector;
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            shapeIds: [...currentSheet.shapeIds, ...this.deletedShapes.map((s: Shape) => s.id)],
            connectors: newConnectors,
          },
        },
      };
    });
  }

  getDescription(): string {
    const shapeCount = this.shapeIds.length;
    const connectorCount = this.deletedConnectors.length;
    if (connectorCount > 0) {
      return `Delete ${shapeCount} shape(s) and ${connectorCount} connector(s)`;
    }
    return `Delete ${shapeCount} shape(s)`;
  }

  toJSON(): CommandJSON {
    return {
      type: 'DeleteShapes',
      data: {
        shapes: this.deletedShapes,
        connectors: this.deletedConnectors,
        activeSheetId: this.activeSheetId,
      },
      timestamp: this.timestamp,
    };
  }
}

/**
 * Command to move shapes
 */
export class MoveShapesCommand extends BaseCommand {
  private oldPositions: Map<string, Point>;

  constructor(
    private setState: StateMutator,
    private activeSheetId: string,
    private oldShapePositions: Array<{ id: string; x: number; y: number }>,
    private newShapePositions: Array<{ id: string; x: number; y: number }>
  ) {
    super();
    this.oldPositions = new Map();
    this.oldShapePositions.forEach(({ id, x, y }) => {
      this.oldPositions.set(id, { x, y });
    });
  }

  execute(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      this.newShapePositions.forEach(({ id, x, y }) => {
        const shape = newShapesById[id];
        if (shape) {
          newShapesById[id] = { ...shape, x, y };
        }
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
          },
        },
      };
    });
  }

  undo(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      this.oldPositions.forEach((pos, id) => {
        const shape = newShapesById[id];
        if (shape) {
          newShapesById[id] = { ...shape, x: pos.x, y: pos.y };
        }
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
          },
        },
      };
    });
  }

  getDescription(): string {
    return `Move ${this.newShapePositions.length} shape(s)`;
  }

  toJSON(): CommandJSON {
    return {
      type: 'MoveShapes',
      data: {
        oldPositions: this.oldShapePositions,
        newPositions: this.newShapePositions,
        activeSheetId: this.activeSheetId,
      },
      timestamp: this.timestamp,
    };
  }
}

/**
 * Command to resize shapes
 */
export class ResizeShapeCommand extends BaseCommand {
  private oldDimensions: { x: number; y: number; width: number; height: number };

  constructor(
    private setState: StateMutator,
    private activeSheetId: string,
    private shapeId: string,
    private newX: number,
    private newY: number,
    private newWidth: number,
    private newHeight: number,
    getCurrentShape: () => Shape | undefined
  ) {
    super();
    const shape = getCurrentShape();
    this.oldDimensions = shape
      ? { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
      : { x: 0, y: 0, width: 0, height: 0 };
  }

  execute(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const shape = currentSheet.shapesById[this.shapeId];
      if (!shape) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapesById: {
              ...currentSheet.shapesById,
              [this.shapeId]: {
                ...shape,
                x: this.newX,
                y: this.newY,
                width: this.newWidth,
                height: this.newHeight,
              },
            },
          },
        },
      };
    });
  }

  undo(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const shape = currentSheet.shapesById[this.shapeId];
      if (!shape) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapesById: {
              ...currentSheet.shapesById,
              [this.shapeId]: {
                ...shape,
                x: this.oldDimensions.x,
                y: this.oldDimensions.y,
                width: this.oldDimensions.width,
                height: this.oldDimensions.height,
              },
            },
          },
        },
      };
    });
  }

  getDescription(): string {
    return `Resize shape`;
  }

  toJSON(): CommandJSON {
    return {
      type: 'ResizeShape',
      data: {
        shapeId: this.shapeId,
        newDimensions: { x: this.newX, y: this.newY, width: this.newWidth, height: this.newHeight },
        oldDimensions: this.oldDimensions,
        activeSheetId: this.activeSheetId,
      },
      timestamp: this.timestamp,
    };
  }
}

/**
 * Command to update shape properties
 */
export class UpdateShapePropertiesCommand extends BaseCommand {
  private oldProperties: Partial<Shape>;

  constructor(
    private setState: StateMutator,
    private activeSheetId: string,
    private shapeId: string,
    private newProperties: Partial<Shape>,
    getCurrentShape: () => Shape | undefined
  ) {
    super();
    const shape = getCurrentShape();
    this.oldProperties = {};
    if (shape) {
      Object.keys(newProperties).forEach(key => {
        (this.oldProperties as any)[key] = (shape as any)[key];
      });
    }
  }

  execute(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const shape = currentSheet.shapesById[this.shapeId];
      if (!shape) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapesById: {
              ...currentSheet.shapesById,
              [this.shapeId]: {
                ...shape,
                ...this.newProperties,
              },
            },
          },
        },
      };
    });
  }

  undo(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const shape = currentSheet.shapesById[this.shapeId];
      if (!shape) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapesById: {
              ...currentSheet.shapesById,
              [this.shapeId]: {
                ...shape,
                ...this.oldProperties,
              },
            },
          },
        },
      };
    });
  }

  getDescription(): string {
    return `Update shape properties`;
  }

  toJSON(): CommandJSON {
    return {
      type: 'UpdateShapeProperties',
      data: {
        shapeId: this.shapeId,
        newProperties: this.newProperties,
        oldProperties: this.oldProperties,
        activeSheetId: this.activeSheetId,
      },
      timestamp: this.timestamp,
    };
  }
}

/**
 * Command to reorder shapes (bring forward, send backward, etc.)
 */
export class ReorderShapesCommand extends BaseCommand {
  private oldShapeIds: string[];

  constructor(
    private setState: StateMutator,
    private activeSheetId: string,
    private newShapeIds: string[],
    getCurrentShapeIds: () => string[]
  ) {
    super();
    this.oldShapeIds = getCurrentShapeIds();
  }

  execute(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapeIds: this.newShapeIds,
          },
        },
      };
    });
  }

  undo(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapeIds: this.oldShapeIds,
          },
        },
      };
    });
  }

  getDescription(): string {
    return `Reorder shapes`;
  }

  toJSON(): CommandJSON {
    return {
      type: 'ReorderShapes',
      data: {
        newShapeIds: this.newShapeIds,
        oldShapeIds: this.oldShapeIds,
        activeSheetId: this.activeSheetId,
      },
      timestamp: this.timestamp,
    };
  }
}

/**
 * Command to group shapes
 */
export class GroupShapesCommand extends BaseCommand {
  private groupId: string;
  private oldShapes: Record<string, Shape>;

  constructor(
    private setState: StateMutator,
    private activeSheetId: string,
    private shapeIds: string[],
    private groupShape: Shape,
    getCurrentShapes: () => Record<string, Shape>
  ) {
    super();
    this.groupId = groupShape.id;
    const currentShapes = getCurrentShapes();
    this.oldShapes = {};
    shapeIds.forEach(id => {
      if (currentShapes[id]) {
        this.oldShapes[id] = { ...currentShapes[id] };
      }
    });
  }

  execute(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      
      // Update grouped shapes
      this.shapeIds.forEach(id => {
        const shape = newShapesById[id];
        if (shape) {
          const minX = this.groupShape.x;
          const minY = this.groupShape.y;
          newShapesById[id] = {
            ...shape,
            parentId: this.groupId,
            x: shape.x - minX,
            y: shape.y - minY,
          };
        }
      });
      
      // Add group shape
      newShapesById[this.groupId] = this.groupShape;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            shapeIds: [...currentSheet.shapeIds, this.groupId],
            selectedShapeIds: [this.groupId],
          },
        },
      };
    });
  }

  undo(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      
      // Restore original shapes
      this.shapeIds.forEach(id => {
        if (this.oldShapes[id]) {
          newShapesById[id] = this.oldShapes[id];
        }
      });
      
      // Remove group shape
      delete newShapesById[this.groupId];

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            shapeIds: currentSheet.shapeIds.filter((id: string) => id !== this.groupId),
            selectedShapeIds: this.shapeIds,
          },
        },
      };
    });
  }

  getDescription(): string {
    return `Group ${this.shapeIds.length} shapes`;
  }

  toJSON(): CommandJSON {
    return {
      type: 'GroupShapes',
      data: {
        shapeIds: this.shapeIds,
        groupShape: this.groupShape,
        oldShapes: this.oldShapes,
        activeSheetId: this.activeSheetId,
      },
      timestamp: this.timestamp,
    };
  }
}

export class UngroupShapesCommand extends BaseCommand {
  private groupShape: Shape;
  private childShapes: Record<string, Shape>;
  private childIds: string[];

  constructor(
    private setState: StateMutator,
    private activeSheetId: string,
    private groupId: string,
    getCurrentShapes: () => Record<string, Shape>
  ) {
    super();
    const currentShapes = getCurrentShapes();
    const group = currentShapes[groupId];
    if (!group || group.type !== 'Group') {
      throw new Error('Invalid group shape');
    }
    
    this.groupShape = { ...group };
    this.childShapes = {};
    this.childIds = [];
    
    // Find all children of this group
    Object.entries(currentShapes).forEach(([id, shape]) => {
      if (shape.parentId === groupId) {
        this.childShapes[id] = { ...shape };
        this.childIds.push(id);
      }
    });
  }

  execute(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      
      // Remove group shape
      delete newShapesById[this.groupId];
      
      // Restore children to absolute positions and remove parentId
      this.childIds.forEach(id => {
        const child = newShapesById[id];
        if (child) {
          newShapesById[id] = {
            ...child,
            x: child.x + this.groupShape.x,
            y: child.y + this.groupShape.y,
            parentId: undefined,
          };
        }
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            shapeIds: currentSheet.shapeIds.filter((id: string) => id !== this.groupId),
            selectedShapeIds: this.childIds,
          },
        },
      };
    });
  }

  undo(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      
      // Add group shape back
      newShapesById[this.groupId] = this.groupShape;
      
      // Restore children to relative positions with parentId
      this.childIds.forEach(id => {
        if (this.childShapes[id]) {
          newShapesById[id] = this.childShapes[id];
        }
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            shapeIds: [...currentSheet.shapeIds, this.groupId],
            selectedShapeIds: [this.groupId],
          },
        },
      };
    });
  }

  getDescription(): string {
    return `Ungroup ${this.childIds.length} shapes`;
  }

  toJSON(): CommandJSON {
    return {
      type: 'UngroupShapes',
      data: {
        groupId: this.groupId,
        groupShape: this.groupShape,
        childShapes: this.childShapes,
        childIds: this.childIds,
        activeSheetId: this.activeSheetId,
      },
      timestamp: this.timestamp,
    };
  }
}

