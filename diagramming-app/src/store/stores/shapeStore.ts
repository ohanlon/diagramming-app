// Shape-related store actions and state
import { v4 as uuidv4 } from 'uuid';
import type { Shape, DiagramState } from '../../types';

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

// Helper function to add shape to state (extracted from main store)
const _addShapeToState = (state: DiagramState, shape: Shape): DiagramState => {
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
  tempDiv.style.fontSize = `${fontSize}px`;
  tempDiv.style.fontWeight = isBold ? 'bold' : 'normal';
  tempDiv.style.fontStyle = isItalic ? 'italic' : 'normal';
  tempDiv.style.whiteSpace = newShape.autosize ? 'normal' : 'nowrap';
  tempDiv.textContent = newShape.text || '';
  document.body.appendChild(tempDiv);

  const textWidth = Math.round(tempDiv.scrollWidth + PADDING_HORIZONTAL);
  const textHeight = Math.round(tempDiv.scrollHeight + PADDING_VERTICAL);
  document.body.removeChild(tempDiv);

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
            textOffsetX: 0,
            textOffsetY: newShape.textPosition === 'inside' ? 0 : newShape.height + 8,
            textWidth: newShape.autosize ? textWidth : newShape.width,
            textHeight: newShape.autosize ? textHeight : 20,
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
  get: () => DiagramState, 
  addHistory: () => void
): ShapeStoreActions => ({

  addShapeAndRecordHistory: (shape: Shape) => {
    set((state) => _addShapeToState(state, shape));
    addHistory();
  },

  updateShapeSvgContent: (id: string, svgContent: string) => {
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
              [id]: { ...shape, svgContent },
            },
          },
        },
      };
    });
  },

  updateShapeText: (id: string, text: string) => {
    addHistory();
    set((state) => {
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
              [id]: { ...currentSheet.shapesById[id], text, isTextPositionManuallySet: false },
            },
          },
        },
      };
    });
  },

  updateShapePosition: (id: string, newX: number, newY: number) => {
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
              [id]: { ...shape, x: newX, y: newY },
            },
          },
        },
      };
    });
  },

  updateShapePositions: (positions: { id: string; x: number; y: number }[]) =>
    set((state) => {
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
    addHistory();
    set((state) => {
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

  recordShapeMoves: (positions: { id: string; x: number; y: number }[]) => {
    addHistory();
    set((state) => {
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
    });
  },

  updateShapeDimensions: (id: string, newX: number, newY: number, newWidth: number, newHeight: number) =>
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shape = currentSheet.shapesById[id];
      if (!shape) return state;

      let updatedTextOffsetY = shape.textOffsetY;
      // Only adjust textOffsetY if textPosition is 'outside'
      if (shape.textPosition === 'outside') {
        const originalHeight = shape.height;
        const originalTextOffsetY = shape.textOffsetY;
        const distanceFromBottom = originalHeight - originalTextOffsetY;
        updatedTextOffsetY = newHeight - distanceFromBottom;
      }

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: {
              ...currentSheet.shapesById,
              [id]: { ...shape, x: newX, y: newY, width: newWidth, height: newHeight, textOffsetY: updatedTextOffsetY },
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
          let updatedTextOffsetY = shape.textOffsetY;
          if (shape.textPosition === 'outside') {
            const originalHeight = shape.height;
            const originalTextOffsetY = shape.textOffsetY;
            const distanceFromBottom = originalHeight - originalTextOffsetY;
            updatedTextOffsetY = height - distanceFromBottom;
          }
          newShapesById[id] = { ...shape, x, y, width, height, textOffsetY: updatedTextOffsetY };
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
    addHistory();
    set((state) => {
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
              [id]: {
                ...currentSheet.shapesById[id],
                x: finalX,
                y: finalY,
                width: finalWidth,
                height: finalHeight,
              },
            },
          },
        },
      };
    });
  },

  recordShapeResizeMultiple: (dimensions: { id: string; x: number; y: number; width: number; height: number }[]) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      dimensions.forEach(({ id, x, y }) => {
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
    });
  },

  setSelectedShapeColor: (color: string) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id) => {
        const shape = newShapesById[id];
        if (shape) {
          newShapesById[id] = { ...shape, color };
        }
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedShapeColor: color,
            shapesById: newShapesById,
          },
        },
      };
    });
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
    addHistory();
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
              [id]: { ...shape, isTextSelected },
            },
          },
        },
      };
    });
  },

  setSelectedFont: (font: string) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id) => {
        const shape = newShapesById[id];
        if (shape) {
          newShapesById[id] = { ...shape, fontFamily: font, isTextPositionManuallySet: false };
        }
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedFont: font,
            shapesById: newShapesById,
          },
        },
      };
    });
  },

  setSelectedFontSize: (size: number) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id) => {
        const shape = newShapesById[id];
        if (shape) {
          newShapesById[id] = { ...shape, fontSize: size, isTextPositionManuallySet: false };
        }
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedFontSize: size,
            shapesById: newShapesById,
          },
        },
      };
    });
  },

  toggleBold: () => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id) => {
        const shape = newShapesById[id];
        if (shape) {
          newShapesById[id] = { ...shape, isBold: !shape.isBold };
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

  toggleItalic: () => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id) => {
        const shape = newShapesById[id];
        if (shape) {
          newShapesById[id] = { ...shape, isItalic: !shape.isItalic };
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

  toggleUnderlined: () => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id) => {
        const shape = newShapesById[id];
        if (shape) {
          newShapesById[id] = { ...shape, isUnderlined: !shape.isUnderlined };
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

  setVerticalAlign: (alignment: 'top' | 'middle' | 'bottom') => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id) => {
        const shape = newShapesById[id];
        if (shape) {
          newShapesById[id] = { ...shape, verticalAlign: alignment };
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

  setHorizontalAlign: (alignment: 'left' | 'center' | 'right') => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id) => {
        const shape = newShapesById[id];
        if (shape) {
          newShapesById[id] = { ...shape, horizontalAlign: alignment, isTextPositionManuallySet: false };
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

  setSelectedTextColor: (color: string) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id) => {
        const shape = newShapesById[id];
        if (shape) {
          newShapesById[id] = { ...shape, textColor: color };
        }
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedTextColor: color,
            shapesById: newShapesById,
          },
        },
      };
    });
  },

  bringForward: (id: string) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapeIds = [...currentSheet.shapeIds];
      const currentIdx = newShapeIds.indexOf(id);
      if (currentIdx < 0 || currentIdx === newShapeIds.length - 1) return state;

      // Swap with the next element
      [newShapeIds[currentIdx], newShapeIds[currentIdx + 1]] = [newShapeIds[currentIdx + 1], newShapeIds[currentIdx]];

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapeIds: newShapeIds,
          },
        },
      };
    });
  },

  sendBackward: (id: string) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapeIds = [...currentSheet.shapeIds];
      const currentIdx = newShapeIds.indexOf(id);
      if (currentIdx <= 0) return state;

      // Swap with the previous element
      [newShapeIds[currentIdx], newShapeIds[currentIdx - 1]] = [newShapeIds[currentIdx - 1], newShapeIds[currentIdx]];

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapeIds: newShapeIds,
          },
        },
      };
    });
  },

  bringToFront: (id: string) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const currentIdx = currentSheet.shapeIds.indexOf(id);
      if (currentIdx === -1 || currentIdx === currentSheet.shapeIds.length - 1)
        return state;

      const newShapeIds = currentSheet.shapeIds.filter((shapeId) => shapeId !== id);
      newShapeIds.push(id);

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapeIds: newShapeIds,
          },
        },
      };
    });
  },

  sendToBack: (id: string) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const currentIdx = currentSheet.shapeIds.indexOf(id);
      if (currentIdx === -1 || currentIdx === 0) return state;

      const newShapeIds = currentSheet.shapeIds.filter((shapeId) => shapeId !== id);
      newShapeIds.unshift(id);

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapeIds: newShapeIds,
          },
        },
      };
    });
  },

  groupShapes: (ids: string[]) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shapesToGroup = ids.map((id) => currentSheet.shapesById[id]).filter(Boolean);
      if (shapesToGroup.length < 2) return state; // Need at least two shapes to group

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
        // Add all other properties from Shape, even if undefined
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

      const newShapesById = { ...currentSheet.shapesById, [groupId]: newGroupShape };
      const newShapeIds = [...currentSheet.shapeIds, groupId];
      const newSelectedShapeIds = [groupId];

      shapesToGroup.forEach((shape) => {
        newShapesById[shape.id] = {
          ...shape,
          parentId: groupId,
          x: shape.x - minX,
          y: shape.y - minY,
          // Reset width and height to avoid stretching the group
          width: 0,
          height: 0,
        };
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            shapeIds: newShapeIds,
            selectedShapeIds: newSelectedShapeIds,
          },
        },
      };
    });
  },

  deleteSelected: () => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      const newConnectors = { ...currentSheet.connectors };

      // Delete shapes
      currentSheet.selectedShapeIds.forEach((id) => {
        delete newShapesById[id];
      });

      // Delete connectors
      Object.entries(currentSheet.connectors).forEach(([id, connector]) => {
        if (currentSheet.selectedShapeIds.includes(connector.startNodeId) || currentSheet.selectedShapeIds.includes(connector.endNodeId)) {
          delete newConnectors[id];
        }
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            connectors: newConnectors,
            selectedShapeIds: [],
            selectedConnectorIds: [],
          },
        },
      };
    });
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