// Shape-related store actions and state
import { v4 as uuidv4 } from 'uuid';
import type { Shape, DiagramState } from '../../types';
import {
  AddShapeCommand,
  DeleteShapesCommand,
  MoveShapesCommand,
  ResizeShapeCommand,
  UpdateShapePropertiesCommand,
  ReorderShapesCommand,
  GroupShapesCommand
} from '../../commands';
import { useHistoryStore } from '../useHistoryStore';

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
  recordShapeMoves: (oldPositions: { id: string; x: number; y: number }[], newPositions: { id: string; x: number; y: number }[]) => void;
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

// Helper function to add shape to state (extracted from main store)
export const _addShapeToState = (state: DiagramState, shape: Shape): DiagramState => {
  const currentSheet = state.sheets[state.activeSheetId];
  if (!currentSheet) return state;

  const newShape = { ...shape };

  if (newShape.svgContent) {
    const uniqueSuffix = newShape.id.replace(/-/g, '');
    let svgContent = newShape.svgContent;
    svgContent = svgContent.replace(/id="([^"]+)"/g, (_, id) => `id="${id}_${uniqueSuffix}"`);
    svgContent = svgContent.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${id}_${uniqueSuffix})`);
    svgContent = svgContent.replace(/xlink:href="#([^"]+)"/g, (_, id) => `xlink:href="#${id}_${uniqueSuffix}"`);
    newShape.svgContent = svgContent;
  }

  // Calculate text dimensions
  const PADDING_HORIZONTAL = 10;
  const PADDING_VERTICAL = 6;
  const fontSize = newShape.fontSize || currentSheet.selectedFontSize;
  const fontFamily = newShape.fontFamily || currentSheet.selectedFont;
  const isBold = newShape.isBold || false;
  const isItalic = newShape.isItalic || false;

  // Create a temporary element to measure text dimensions
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.visibility = 'hidden';
  tempDiv.style.fontFamily = fontFamily;
  tempDiv.style.fontSize = `${fontSize}pt`; // Use pt to match TextResizer
  tempDiv.style.fontWeight = isBold ? 'bold' : 'normal';
  tempDiv.style.fontStyle = isItalic ? 'italic' : 'normal';
  tempDiv.style.whiteSpace = 'nowrap'; // Measure single-line width first
  tempDiv.style.wordWrap = 'break-word';
  tempDiv.textContent = newShape.text || '';
  document.body.appendChild(tempDiv);

  const singleLineWidth = Math.round(tempDiv.scrollWidth + PADDING_HORIZONTAL);
  
  // Now measure multi-line height if text position is outside and width is constrained
  if (newShape.textPosition === 'outside' && !newShape.autosize) {
    // For outside text, constrain to a reasonable width based on shape
    const maxWidth = Math.max(newShape.width * 3, 200); // Allow up to 3x shape width
    tempDiv.style.whiteSpace = 'normal';
    tempDiv.style.width = `${Math.min(singleLineWidth, maxWidth)}px`;
  }
  
  const textWidth = newShape.autosize ? singleLineWidth : Math.min(singleLineWidth, newShape.width * 3.2);
  const textHeight = Math.round(tempDiv.scrollHeight + PADDING_VERTICAL);
  document.body.removeChild(tempDiv);

  // Calculate initial text offset for centered text (only for outside positioning)
  let initialTextOffsetX = 0;
  if (newShape.textPosition === 'outside' && newShape.horizontalAlign === 'center') {
    initialTextOffsetX = (newShape.width / 2) - (textWidth / 2);
  }

  return {
    ...state,
    sheets: {
      ...state.sheets,
      [state.activeSheetId]: {
        ...currentSheet,
        shapesById: {
          ...currentSheet.shapesById,
          [newShape.id]: {
            ...newShape,
            layerId: currentSheet.activeLayerId,
            fontSize,
            textOffsetX: initialTextOffsetX,
            textOffsetY: newShape.textPosition === 'inside' ? 0 : newShape.height + 5,
            textWidth: textWidth,
            textHeight: textHeight,
            isBold,
            isItalic,
            isUnderlined: newShape.isUnderlined || false,
            verticalAlign: 'middle',
            horizontalAlign: 'center',
            textColor: currentSheet.selectedTextColor,
            autosize: newShape.autosize || true,
            isTextPositionManuallySet: false,
            minX: newShape.minX,
            minY: newShape.minY,
            path: newShape.path,
          },
        },
        shapeIds: [...(currentSheet.shapeIds || []), newShape.id],
        selectedShapeIds: [newShape.id],
        selectedConnectorIds: [],
      },
    },
  };
};

// This will be imported and used in the main store
export const createShapeActions = (
  set: (fn: (state: DiagramState) => DiagramState) => void,
  wrappedSet: (fnOrPartial: any) => void,
  _get: () => DiagramState
): ShapeStoreActions => ({

  addShapeAndRecordHistory: (shape: Shape) => {
    const state = _get();
    const command = new AddShapeCommand(
      wrappedSet,
      state.activeSheetId,
      shape
    );
    useHistoryStore.getState().executeCommand(command);
  },

  // Hydration-only update: do not mark the diagram dirty when we patch svgContent
  // during initial load or merge from server. Use the raw `set` so wrappedSet
  // (which forces isDirty=true) is not invoked.
  updateShapeSvgContent: (id: string, svgContent: string) => {
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shape = currentSheet.shapesById[id];
      if (!shape) return state;

      // If svgContent is identical, return state unchanged to avoid unnecessary updates
      if (shape.svgContent === svgContent) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: {
              ...currentSheet.shapesById,
              [id]: { ...shape, svgContent },
            },
          },
        },
      };
    });
  },

  updateShapeText: (id: string, text: string) => {
    const state = _get();
    const command = new UpdateShapePropertiesCommand(
      wrappedSet,
      state.activeSheetId,
      id,
      { text, isTextPositionManuallySet: false },
      () => _get().sheets[state.activeSheetId]?.shapesById[id]
    );
    useHistoryStore.getState().executeCommand(command);
  },

  updateShapePosition: (id: string, newX: number, newY: number) => {
    wrappedSet((state: any) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shape = currentSheet.shapesById[id];
      if (!shape) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: {
              ...currentSheet.shapesById,
              [id]: { ...shape, x: newX, y: newY },
            },
          },
        },
      };
    });
  },

  updateShapePositions: (positions: { id: string; x: number; y: number }[]) =>
    wrappedSet((state: any) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      positions.forEach(({ id, x, y }) => {
        const shape = newShapesById[id];
        if (shape) {
          newShapesById[id] = { ...shape, x, y };
        }
      });
      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
          },
        },
      };
    }),

  recordShapeMove: (id: string, newX: number, newY: number) => {
    // History is now recorded at the start of drag in Canvas.tsx, not here
    // Finalizing a move should mark the diagram dirty. Use wrappedSet so
    // isDirty becomes true.
    wrappedSet((state: any) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: {
              ...currentSheet.shapesById,
              [id]: { ...currentSheet.shapesById[id], x: newX, y: newY },
            },
          },
        },
      };
    });
  },

  recordShapeMoves: (oldPositions: { id: string; x: number; y: number }[], newPositions: { id: string; x: number; y: number }[]) => {
    const state = _get();
    const command = new MoveShapesCommand(
      wrappedSet,
      state.activeSheetId,
      oldPositions,
      newPositions
    );
    useHistoryStore.getState().executeCommand(command);
  },

  updateShapeDimensions: (id: string, newX: number, newY: number, newWidth: number, newHeight: number) =>
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shape = currentSheet.shapesById[id];
      if (!shape) return state;

      let updatedTextOffsetX = shape.textOffsetX;
      let updatedTextOffsetY = shape.textOffsetY;
      
      // Only adjust text offsets if textPosition is 'outside' and position hasn't been manually set
      if (shape.textPosition === 'outside' && !shape.isTextPositionManuallySet) {
        // Adjust vertical position to maintain distance from bottom
        const originalHeight = shape.height;
        const originalTextOffsetY = shape.textOffsetY;
        const distanceFromBottom = originalHeight - originalTextOffsetY;
        updatedTextOffsetY = newHeight - distanceFromBottom;
        
        // Adjust horizontal position based on alignment
        if (shape.horizontalAlign === 'center') {
          updatedTextOffsetX = (newWidth / 2) - (shape.textWidth / 2);
        } else if (shape.horizontalAlign === 'right') {
          updatedTextOffsetX = newWidth - shape.textWidth;
        } else {
          // left alignment
          updatedTextOffsetX = 0;
        }
      }

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: {
              ...currentSheet.shapesById,
              [id]: { ...shape, x: newX, y: newY, width: newWidth, height: newHeight, textOffsetX: updatedTextOffsetX, textOffsetY: updatedTextOffsetY },
            },
          },
        },
      };
    }),

  updateShapeHeight: (id: string, height: number) =>
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shape = currentSheet.shapesById[id];
      if (!shape) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: {
              ...currentSheet.shapesById,
              [id]: { ...shape, height },
            },
          },
        },
      };
    }),

  updateShapeDimensionsMultiple: (dimensions: { id: string; x: number; y: number; width: number; height: number }[]) =>
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      dimensions.forEach(({ id, x, y, width, height }) => {
        const shape = newShapesById[id];
        if (shape) {
          let updatedTextOffsetX = shape.textOffsetX;
          let updatedTextOffsetY = shape.textOffsetY;
          
          if (shape.textPosition === 'outside' && !shape.isTextPositionManuallySet) {
            // Adjust vertical position
            const originalHeight = shape.height;
            const originalTextOffsetY = shape.textOffsetY;
            const distanceFromBottom = originalHeight - originalTextOffsetY;
            updatedTextOffsetY = height - distanceFromBottom;
            
            // Adjust horizontal position based on alignment
            if (shape.horizontalAlign === 'center') {
              updatedTextOffsetX = (width / 2) - (shape.textWidth / 2);
            } else if (shape.horizontalAlign === 'right') {
              updatedTextOffsetX = width - shape.textWidth;
            } else {
              updatedTextOffsetX = 0;
            }
          }
          
          newShapesById[id] = { ...shape, x, y, width, height, textOffsetX: updatedTextOffsetX, textOffsetY: updatedTextOffsetY };
        }
      });
      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
          },
        },
      };
    }),

  recordShapeResize: (id: string, finalX: number, finalY: number, finalWidth: number, finalHeight: number) => {
    const state = _get();
    const command = new ResizeShapeCommand(
      wrappedSet,
      state.activeSheetId,
      id,
      finalX,
      finalY,
      finalWidth,
      finalHeight,
      () => _get().sheets[state.activeSheetId]?.shapesById[id]
    );
    useHistoryStore.getState().executeCommand(command);
  },

  recordShapeResizeMultiple: (dimensions: { id: string; x: number; y: number; width: number; height: number }[]) => {
    const state = _get();
    // Execute a command for each shape
    dimensions.forEach(({ id, x, y, width, height }) => {
      const command = new ResizeShapeCommand(
        wrappedSet,
        state.activeSheetId,
        id,
        x,
        y,
        width,
        height,
        () => _get().sheets[state.activeSheetId]?.shapesById[id]
      );
      useHistoryStore.getState().executeCommand(command);
    });
  },

  setSelectedShapeColor: (color: string) => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet) return;

    currentSheet.selectedShapeIds.forEach((id) => {
      const command = new UpdateShapePropertiesCommand(
        wrappedSet,
        state.activeSheetId,
        id,
        { color },
        () => _get().sheets[state.activeSheetId]?.shapesById[id]
      );
      useHistoryStore.getState().executeCommand(command);
    });

    // Update selected color in sheet
    wrappedSet((state: any) => ({
      ...state,
      sheets: {
        ...state.sheets,
        [state.activeSheetId]: {
          ...state.sheets[state.activeSheetId],
          selectedShapeColor: color,
        },
      },
    }));
  },

  updateShapeTextPosition: (id: string, textOffsetX: number, textOffsetY: number) => {
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shape = currentSheet.shapesById[id];
      if (!shape) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: {
              ...currentSheet.shapesById,
              [id]: { ...shape, textOffsetX, textOffsetY, isTextPositionManuallySet: true },
            },
          },
        },
      };
    });
  },

  updateShapeTextDimensions: (id: string, textWidth: number, textHeight: number) => {
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shape = currentSheet.shapesById[id];
      if (!shape) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: {
              ...currentSheet.shapesById,
              [id]: { ...shape, textWidth, textHeight },
            },
          },
        },
      };
    });
  },

  deselectAllTextBlocks: () => {
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id) => {
        const shape = newShapesById[id];
        if (shape) {
          newShapesById[id] = { ...shape, isTextSelected: false };
        }
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
          },
        },
      };
    });
  },

  updateShapeIsTextSelected: (id: string, isTextSelected: boolean) => {
    const state = _get();
    const command = new UpdateShapePropertiesCommand(
      wrappedSet,
      state.activeSheetId,
      id,
      { isTextSelected },
      () => _get().sheets[state.activeSheetId]?.shapesById[id]
    );
    useHistoryStore.getState().executeCommand(command);
  },

  setSelectedFont: (font: string) => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet) return;

    currentSheet.selectedShapeIds.forEach((id) => {
      const command = new UpdateShapePropertiesCommand(
        wrappedSet,
        state.activeSheetId,
        id,
        { fontFamily: font, isTextPositionManuallySet: false },
        () => _get().sheets[state.activeSheetId]?.shapesById[id]
      );
      useHistoryStore.getState().executeCommand(command);
    });

    // Update selected font in sheet
    wrappedSet((state: any) => ({
      ...state,
      sheets: {
        ...state.sheets,
        [state.activeSheetId]: {
          ...state.sheets[state.activeSheetId],
          selectedFont: font,
        },
      },
    }));
  },

  setSelectedFontSize: (size: number) => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet) return;

    currentSheet.selectedShapeIds.forEach((id) => {
      const command = new UpdateShapePropertiesCommand(
        wrappedSet,
        state.activeSheetId,
        id,
        { fontSize: size, isTextPositionManuallySet: false },
        () => _get().sheets[state.activeSheetId]?.shapesById[id]
      );
      useHistoryStore.getState().executeCommand(command);
    });

    // Update selected font size in sheet
    wrappedSet((state: any) => ({
      ...state,
      sheets: {
        ...state.sheets,
        [state.activeSheetId]: {
          ...state.sheets[state.activeSheetId],
          selectedFontSize: size,
        },
      },
    }));
  },

  toggleBold: () => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet) return;

    currentSheet.selectedShapeIds.forEach((id) => {
      const shape = currentSheet.shapesById[id];
      if (shape) {
        const command = new UpdateShapePropertiesCommand(
          wrappedSet,
          state.activeSheetId,
          id,
          { isBold: !shape.isBold },
          () => _get().sheets[state.activeSheetId]?.shapesById[id]
        );
        useHistoryStore.getState().executeCommand(command);
      }
    });
  },

  toggleItalic: () => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet) return;

    currentSheet.selectedShapeIds.forEach((id) => {
      const shape = currentSheet.shapesById[id];
      if (shape) {
        const command = new UpdateShapePropertiesCommand(
          wrappedSet,
          state.activeSheetId,
          id,
          { isItalic: !shape.isItalic },
          () => _get().sheets[state.activeSheetId]?.shapesById[id]
        );
        useHistoryStore.getState().executeCommand(command);
      }
    });
  },

  toggleUnderlined: () => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet) return;

    currentSheet.selectedShapeIds.forEach((id) => {
      const shape = currentSheet.shapesById[id];
      if (shape) {
        const command = new UpdateShapePropertiesCommand(
          wrappedSet,
          state.activeSheetId,
          id,
          { isUnderlined: !shape.isUnderlined },
          () => _get().sheets[state.activeSheetId]?.shapesById[id]
        );
        useHistoryStore.getState().executeCommand(command);
      }
    });
  },

  setVerticalAlign: (alignment: 'top' | 'middle' | 'bottom') => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet) return;

    currentSheet.selectedShapeIds.forEach((id) => {
      const command = new UpdateShapePropertiesCommand(
        wrappedSet,
        state.activeSheetId,
        id,
        { verticalAlign: alignment },
        () => _get().sheets[state.activeSheetId]?.shapesById[id]
      );
      useHistoryStore.getState().executeCommand(command);
    });
  },

  setHorizontalAlign: (alignment: 'left' | 'center' | 'right') => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet) return;

    currentSheet.selectedShapeIds.forEach((id) => {
      const command = new UpdateShapePropertiesCommand(
        wrappedSet,
        state.activeSheetId,
        id,
        { horizontalAlign: alignment, isTextPositionManuallySet: false },
        () => _get().sheets[state.activeSheetId]?.shapesById[id]
      );
      useHistoryStore.getState().executeCommand(command);
    });
  },

  setSelectedTextColor: (color: string) => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet) return;

    currentSheet.selectedShapeIds.forEach((id) => {
      const command = new UpdateShapePropertiesCommand(
        wrappedSet,
        state.activeSheetId,
        id,
        { textColor: color },
        () => _get().sheets[state.activeSheetId]?.shapesById[id]
      );
      useHistoryStore.getState().executeCommand(command);
    });

    // Update selected text color in sheet
    wrappedSet((state: any) => ({
      ...state,
      sheets: {
        ...state.sheets,
        [state.activeSheetId]: {
          ...state.sheets[state.activeSheetId],
          selectedTextColor: color,
        },
      },
    }));
  },

  bringForward: (id: string) => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet) return;

    const newShapeIds = [...currentSheet.shapeIds];
    const currentIdx = newShapeIds.indexOf(id);
    if (currentIdx < 0 || currentIdx === newShapeIds.length - 1) return;

    // Swap with the next element
    [newShapeIds[currentIdx], newShapeIds[currentIdx + 1]] = [newShapeIds[currentIdx + 1]!, newShapeIds[currentIdx]!];

    const command = new ReorderShapesCommand(
      wrappedSet,
      state.activeSheetId,
      newShapeIds,
      () => _get().sheets[state.activeSheetId]?.shapeIds || []
    );
    useHistoryStore.getState().executeCommand(command);
  },

  sendBackward: (id: string) => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet) return;

    const newShapeIds = [...currentSheet.shapeIds];
    const currentIdx = newShapeIds.indexOf(id);
    if (currentIdx <= 0) return;

    // Swap with the previous element
    [newShapeIds[currentIdx], newShapeIds[currentIdx - 1]] = [newShapeIds[currentIdx - 1]!, newShapeIds[currentIdx]!];

    const command = new ReorderShapesCommand(
      wrappedSet,
      state.activeSheetId,
      newShapeIds,
      () => _get().sheets[state.activeSheetId]?.shapeIds || []
    );
    useHistoryStore.getState().executeCommand(command);
  },

  bringToFront: (id: string) => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet) return;

    const currentIdx = currentSheet.shapeIds.indexOf(id);
    if (currentIdx === -1 || currentIdx === currentSheet.shapeIds.length - 1) return;

    const newShapeIds = currentSheet.shapeIds.filter((shapeId) => shapeId !== id);
    newShapeIds.push(id);

    const command = new ReorderShapesCommand(
      wrappedSet,
      state.activeSheetId,
      newShapeIds,
      () => _get().sheets[state.activeSheetId]?.shapeIds || []
    );
    useHistoryStore.getState().executeCommand(command);
  },

  sendToBack: (id: string) => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet) return;

    const currentIdx = currentSheet.shapeIds.indexOf(id);
    if (currentIdx === -1 || currentIdx === 0) return;

    const newShapeIds = currentSheet.shapeIds.filter((shapeId) => shapeId !== id);
    newShapeIds.unshift(id);

    const command = new ReorderShapesCommand(
      wrappedSet,
      state.activeSheetId,
      newShapeIds,
      () => _get().sheets[state.activeSheetId]?.shapeIds || []
    );
    useHistoryStore.getState().executeCommand(command);
  },

  groupShapes: (ids: string[]) => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet) return;

    const shapesToGroup = ids.map((id) => currentSheet.shapesById[id]).filter((shape): shape is Shape => !!shape);
    if (shapesToGroup.length < 2) return; // Need at least two shapes to group

    // Calculate bounding box of selected shapes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    shapesToGroup.forEach((shape) => {
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + shape.width);
      maxY = Math.max(maxY, shape.y + shape.height);
    });

    const groupWidth = maxX - minX;
    const groupHeight = maxY - minY;

    const groupId = uuidv4();
    const newGroupShape: Shape = {
      id: groupId,
      type: 'Group',
      x: minX,
      y: minY,
      width: groupWidth,
      height: groupHeight,
      text: '', // Groups don't have text
      color: 'transparent', // Groups are transparent
      layerId: currentSheet.activeLayerId,
      textOffsetX: 0,
      textOffsetY: 0,
      textWidth: 0,
      textHeight: 0,
      svgContent: undefined,
      minX: undefined,
      minY: undefined,
      fontFamily: undefined,
      fontSize: undefined,
      isTextSelected: undefined,
      isBold: undefined,
      isItalic: undefined,
      isUnderlined: undefined,
      verticalAlign: undefined,
      horizontalAlign: undefined,
      textPosition: undefined,
      textColor: undefined,
      parentId: undefined,
      autosize: undefined,
      isTextPositionManuallySet: undefined,
    };

    const command = new GroupShapesCommand(
      wrappedSet,
      state.activeSheetId,
      ids,
      newGroupShape,
      () => _get().sheets[state.activeSheetId]?.shapesById || {}
    );
    useHistoryStore.getState().executeCommand(command);
  },

  deleteSelected: () => {
    const state = _get();
    const currentSheet = state.sheets[state.activeSheetId];
    if (!currentSheet || currentSheet.selectedShapeIds.length === 0) return;

    const command = new DeleteShapesCommand(
      wrappedSet,
      state.activeSheetId,
      currentSheet.selectedShapeIds,
      () => _get().sheets[state.activeSheetId]?.shapesById || {},
      () => _get().sheets[state.activeSheetId]?.connectors || {}
    );
    useHistoryStore.getState().executeCommand(command);
  },

  updateShapeInteractionUrl: (shapeId: string, url: string) => {
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shape = currentSheet.shapesById[shapeId];
      if (!shape) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: {
              ...currentSheet.shapesById,
              [shapeId]: { ...shape, interactionUrl: url },
            },
          },
        },
      };
    });
  },
});