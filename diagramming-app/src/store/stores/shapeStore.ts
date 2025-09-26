// Shape-related store actions and state
import type { Shape, Point } from '../../types';

export interface ShapeStoreState {
  // Shape state will be managed in the main store
}

export interface ShapeStoreActions {
  // Shape CRUD operations
  addShapeAndRecordHistory: (shape: Shape) => void;
  updateShapeSvgContent: (id: string, svgContent: string) => void;
  updateShapeText: (id: string, text: string) => void;
  deleteSelected: () => void;
  
  // Shape positioning and dimensions
  updateShapePosition: (id: string, newX: number, newY: number) => void;
  updateShapePositions: (positions: { id: string; x: number; y: number }[]) => void;
  recordShapeMove: (id: string, newX: number, newY: number) => void;
  recordShapeMoves: (positions: { id: string; x: number; y: number }[]) => void;
  updateShapeDimensions: (id: string, newX: number, newY: number, newWidth: number, newHeight: number) => void;
  updateShapeHeight: (id: string, height: number) => void;
  updateShapeDimensionsMultiple: (dimensions: { id: string; x: number; y: number; width: number; height: number }[]) => void;
  recordShapeResize: (id: string, finalX: number, finalY: number, finalWidth: number, finalHeight: number) => void;
  recordShapeResizeMultiple: (dimensions: { id: string; x: number; y: number; width: number; height: number }[]) => void;
  
  // Shape styling
  setSelectedShapeColor: (color: string) => void;
  
  // Shape text and formatting
  updateShapeTextPosition: (id: string, textOffsetX: number, textOffsetY: number) => void;
  updateShapeTextDimensions: (id: string, textWidth: number, textHeight: number) => void;
  updateShapeIsTextSelected: (id: string, isTextSelected: boolean) => void;
  deselectAllTextBlocks: () => void;
  setSelectedFont: (font: string) => void;
  setSelectedFontSize: (size: number) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderlined: () => void;
  setVerticalAlign: (alignment: 'top' | 'middle' | 'bottom') => void;
  setHorizontalAlign: (alignment: 'left' | 'center' | 'right') => void;
  setSelectedTextColor: (color: string) => void;
  
  // Shape ordering
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  
  // Shape grouping and interactions
  groupShapes: (ids: string[]) => void;
  updateShapeInteractionUrl: (shapeId: string, url: string) => void;
}

// This will be imported and used in the main store
export const createShapeActions = (set: any, get: any, addHistory: any): ShapeStoreActions => ({
  // Implementation will be moved from useDiagramStore.ts
  addShapeAndRecordHistory: (shape: Shape) => {
    // Implementation here
  },
  
  updateShapeSvgContent: (id: string, svgContent: string) => {
    // Implementation here  
  },
  
  // ... other implementations
  
  // Placeholder implementations - will be moved from main store
  updateShapeText: () => {},
  deleteSelected: () => {},
  updateShapePosition: () => {},
  updateShapePositions: () => {},
  recordShapeMove: () => {},
  recordShapeMoves: () => {},
  updateShapeDimensions: () => {},
  updateShapeHeight: () => {},
  updateShapeDimensionsMultiple: () => {},
  recordShapeResize: () => {},
  recordShapeResizeMultiple: () => {},
  setSelectedShapeColor: () => {},
  updateShapeTextPosition: () => {},
  updateShapeTextDimensions: () => {},
  updateShapeIsTextSelected: () => {},
  deselectAllTextBlocks: () => {},
  setSelectedFont: () => {},
  setSelectedFontSize: () => {},
  toggleBold: () => {},
  toggleItalic: () => {},
  toggleUnderlined: () => {},
  setVerticalAlign: () => {},
  setHorizontalAlign: () => {},
  setSelectedTextColor: () => {},
  bringForward: () => {},
  sendBackward: () => {},
  bringToFront: () => {},
  sendToBack: () => {},
  groupShapes: () => {},
  updateShapeInteractionUrl: () => {},
});