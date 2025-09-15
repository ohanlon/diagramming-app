import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Sheet, DiagramState, HistoryState, LineStyle, Shape, Connector, Point, Layer } from '../types';
import { v4 as uuidv4 } from 'uuid';


interface DiagramStoreActions {
  setSelectedLineWidth: (width: number) => void;
  updateShapeSvgContent: (id: string, svgContent: string) => void;
  setSelectedShapeColor: (color: string) => void;
  addShape: (shape: Shape) => void;
  updateShapePosition: (id: string, newX: number, newY: number) => void;
  updateShapePositions: (positions: { id: string; x: number; y: number }[]) => void;
  recordShapeMove: (id: string, newX: number, newY: number) => void;
  recordShapeMoves: (positions: { id: string; x: number; y: number }[]) => void;
  updateShapeDimensions: (
    id: string,
    newX: number,
    newY: number,
    newWidth: number,
    newHeight: number
  ) => void;
  updateShapeHeight: (id: string, height: number) => void;
  updateShapeDimensionsMultiple: (dimensions: { id: string; x: number; y: number; width: number; height: number }[]) => void;
  recordShapeResize: (
    id: string,
    finalX: number,
    finalY: number,
    finalWidth: number,
    finalHeight: number
  ) => void;
  recordShapeResizeMultiple: (dimensions: { id: string; x: number; y: number; width: number; height: number }[]) => void;
  updateShapeText: (id: string, text: string) => void;
  addConnector: (connector: Connector) => void;
  setSelectedShapes: (ids: string[]) => void;
  toggleShapeSelection: (id: string) => void;
  setSelectedConnectors: (ids: string[]) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  undo: () => void;
  redo: () => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  toggleFullscreen: () => void;
  addLayer: () => void;
  removeLayer: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  toggleLayerVisibility: (id: string) => void;
  setActiveLayer: (id: string) => void;
  addSheet: () => void;
  removeSheet: (id: string) => void;
  setActiveSheet: (id: string) => void;
  renameSheet: (id: string, name: string) => void;
  cutShape: (ids: string[]) => void;
  copyShape: (ids: string[]) => void;
  pasteShape: () => void;
  setSelectedFont: (font: string) => void;
  setSelectedFontSize: (size: number) => void;
  updateShapeTextPosition: (id: string, textOffsetX: number, textOffsetY: number) => void;
  updateShapeTextDimensions: (id: string, textWidth: number, textHeight: number) => void;
  deselectAllTextBlocks: () => void;
  updateShapeIsTextSelected: (id: string, isTextSelected: boolean) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderlined: () => void;
  resetStore: () => void;
  setVerticalAlign: (alignment: 'top' | 'middle' | 'bottom') => void;
  setHorizontalAlign: (alignment: 'left' | 'center' | 'right') => void;
  setSelectedTextColor: (color: string) => void;
  setSelectedLineStyle: (style: LineStyle) => void;
  groupShapes: (ids: string[]) => void;
  deleteSelected: () => void;
  setConnectorDragTargetShapeId: (shapeId: string | null) => void;
}

const defaultLayerId = uuidv4();
const defaultSheetId = uuidv4();

const initialState: DiagramState = {
  sheets: {
    [defaultSheetId]: {
      id: defaultSheetId,
      name: 'Sheet 1',
      shapesById: {},
      shapeIds: [],
      connectors: {},
      selectedShapeIds: [],
      layers: {
        [defaultLayerId]: {
          id: defaultLayerId,
          name: 'Layer 1',
          isVisible: true,
          isLocked: false,
        },
      },
      layerIds: [defaultLayerId],
      activeLayerId: defaultLayerId,
      zoom: 1,
      pan: { x: 0, y: 0 },
      clipboard: null,
      selectedFont: 'Open Sans',
      selectedFontSize: 10, // Default font size
      selectedTextColor: '#000000',
      selectedShapeColor: '#000000',
      selectedLineStyle: 'continuous',
      selectedLineWidth: 1,
      selectedConnectorIds: [],
      connectorDragTargetShapeId: null,
    },
  },
  activeSheetId: defaultSheetId,
  history: {
    past: [],
    future: [],
  },
};

const addHistory = (set: (fn: (state: DiagramState & DiagramStoreActions) => DiagramState & DiagramStoreActions) => void) => {
  set((state: DiagramState) => {
    const { history, sheets, activeSheetId } = state;
    const newPast = [...history.past, { sheets, activeSheetId }];
    return {
      ...state,
      history: { past: newPast, future: [] },
    };
  });
};

export const useDiagramStore = create<DiagramState & DiagramStoreActions>()(
  persist(
    (set) => ({
      ...initialState,
      setConnectorDragTargetShapeId: (shapeId: string | null) => {
        set((state: DiagramState) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          return {
            ...state,
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...currentSheet,
                connectorDragTargetShapeId: shapeId,
              },
            },
          };
        });
      },
        updateShapeSvgContent: (id: string, svgContent: string) => {
    set((state: DiagramState) => {
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

  setSelectedShapeColor: (color: string) => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id: string) => {
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

  addShape: (shape: Shape) => {
    addHistory(set);
    set((state: DiagramState) => {
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

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: {
              ...currentSheet.shapesById,
              [newShape.id]: { ...newShape, layerId: currentSheet.activeLayerId, fontSize: currentSheet.selectedFontSize, textOffsetX: 0, textOffsetY: newShape.textPosition === 'inside' ? 0 : newShape.height + 8, textWidth: newShape.width, textHeight: 20, isBold: false, isItalic: false, isUnderlined: false, verticalAlign: 'middle', horizontalAlign: 'center', textColor: currentSheet.selectedTextColor, autosize: true, isTextPositionManuallySet: false },
            },
            shapeIds: [...(currentSheet.shapeIds || []), newShape.id],
            selectedShapeIds: [newShape.id],
          },
        },
      };
    });
  },

  updateShapePosition: (id: string, newX: number, newY: number) => {
    set((state: DiagramState) => {
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

  recordShapeMove: (id: string, newX: number, newY: number) => {
    addHistory(set);
    set((state: DiagramState) => {
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

  updateShapePositions: (positions: { id: string; x: number; y: number }[]) =>
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      positions.forEach(({ id, x, y }: { id: string; x: number; y: number }) => {
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

  recordShapeMoves: (positions: { id: string; x: number; y: number }[]) => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      positions.forEach(({ id, x, y }: { id: string; x: number; y: number }) => {
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

  updateShapeHeight: (id: string, height: number) =>
    set((state: DiagramState) => {
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

  updateShapeDimensions: (id: string, newX: number, newY: number, newWidth: number, newHeight: number) =>
    set((state: DiagramState) => {
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
              [id]: { ...shape, x: newX, y: newY, width: newWidth, height: newHeight },
            },
          },
        },
      };
    }),
  recordShapeResize: (id: string, finalX: number, finalY: number, finalWidth: number, finalHeight: number) => {
    addHistory(set);
    set((state: DiagramState) => {
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

  updateShapeDimensionsMultiple: (dimensions: { id: string; x: number; y: number; width: number; height: number }[]) =>
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      dimensions.forEach(({ id, x, y, width, height }: { id: string; x: number; y: number; width: number; height: number }) => {
        const shape = newShapesById[id];
        if (shape) {
          newShapesById[id] = { ...shape, x, y, width, height };
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

  recordShapeResizeMultiple: (dimensions: { id: string; x: number; y: number; width: number; height: number }[]) => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      dimensions.forEach(({ id, x, y }: { id: string; x: number; y: number; width: number; height: number }) => {
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

  updateShapeText: (id: string, text: string) => {
    addHistory(set);
    set((state: DiagramState) => {
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

  addConnector: (connector: Connector) => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            connectors: { ...currentSheet.connectors, [connector.id]: connector },
            selectedConnectorIds: [], // Deselect all connectors when a new one is added
          },
        },
      };
    });
  },

  setSelectedShapes: (ids: string[]) =>
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedShapeIds: ids,
          },
        },
      };
    }),

  toggleShapeSelection: (id: string) => {
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const selectedShapeIds = currentSheet.selectedShapeIds.includes(id)
        ? currentSheet.selectedShapeIds.filter((shapeId: string) => shapeId !== id)
        : [...currentSheet.selectedShapeIds, id];

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedShapeIds: selectedShapeIds,
          },
        },
      };
    });
  },

  setSelectedConnectors: (ids: string[]) => {
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedConnectorIds: ids,
          },
        },
      };
    });
  },

  setZoom: (zoom: number) => {
    set((state: DiagramState) => {
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
    set((state: DiagramState) => {
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

  undo: () =>
    set((state: DiagramState) => {
      const { past, future } = state.history;
      if (past.length === 0) return state;

      const previousState = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);

      const currentState: HistoryState = { // Changed to HistoryState
        sheets: state.sheets,
        activeSheetId: state.activeSheetId,
      };

      return {
        ...state,
        sheets: previousState.sheets,
        activeSheetId: previousState.activeSheetId,
        history: {
          past: newPast,
          future: [currentState, ...future],
        },
      };
    }),

  redo: () =>
    set((state: DiagramState) => {
      const { past, future } = state.history;
      if (future.length === 0) return state;

      const nextState = future[0];
      const newFuture = future.slice(1);

      const currentState: HistoryState = { // Changed to HistoryState
        sheets: state.sheets,
        activeSheetId: state.activeSheetId,
      };

      return {
        ...state,
        sheets: nextState.sheets,
        activeSheetId: nextState.activeSheetId,
        history: {
          past: [...past, currentState],
          future: newFuture,
        },
      };
    }),

  bringForward: (id: string) => {
    addHistory(set);
    set((state: DiagramState) => {
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
    addHistory(set);
    set((state: DiagramState) => {
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
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const currentIdx = currentSheet.shapeIds.indexOf(id);
      if (currentIdx === -1 || currentIdx === currentSheet.shapeIds.length - 1)
        return state;

      const newShapeIds = currentSheet.shapeIds.filter((shapeId: string) => shapeId !== id);
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
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const currentIdx = currentSheet.shapeIds.indexOf(id);
      if (currentIdx === -1 || currentIdx === 0) return state;

      const newShapeIds = currentSheet.shapeIds.filter((shapeId: string) => shapeId !== id);
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

  toggleFullscreen: () =>
    set((state: DiagramState) => { // Changed to return empty object
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      return state;
    }),

  addLayer: () => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newLayerId = uuidv4();
      const newLayerName = `Layer ${currentSheet.layerIds.length + 1}`;
      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            layers: {
              ...currentSheet.layers,
              [newLayerId]: {
                id: newLayerId,
                name: newLayerName,
                isVisible: true,
                isLocked: false,
              },
            },
            layerIds: [newLayerId, ...currentSheet.layerIds],
            activeLayerId: newLayerId,
          },
        },
      };
    });
  },

  removeLayer: (id: string) => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      if (currentSheet.layerIds.length === 1) {
        console.warn('Cannot remove the last layer.');
        return state;
      }

      const newLayers = Object.fromEntries(
        Object.entries(currentSheet.layers).filter(([layerId]: [string, Layer]) => layerId !== id)
      );

      const newLayerIds = currentSheet.layerIds.filter((layerId: string) => layerId !== id);

      const newActiveLayerId =
        currentSheet.activeLayerId === id
          ? newLayerIds[0]
          : currentSheet.activeLayerId;

      const newShapesById = Object.fromEntries(
        Object.entries(currentSheet.shapesById).filter(
          ([, shape]: [string, Shape]) => shape.layerId !== id
        )
      );
      const newShapeIds = currentSheet.shapeIds.filter(
        (shapeId: string) => newShapesById[shapeId]
      );
      const newConnectors = Object.fromEntries(
        Object.entries(currentSheet.connectors).filter(
          ([, conn]: [string, Connector]) =>
            newShapesById[conn.startNodeId] && newShapesById[conn.endNodeId]
        )
      );
      const newSelectedShapeIds = currentSheet.selectedShapeIds.filter(
        (shapeId: string) => newShapesById[shapeId]
      );

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            layers: newLayers,
            layerIds: newLayerIds,
            activeLayerId: newActiveLayerId,
            shapesById: newShapesById,
            shapeIds: newShapeIds,
            connectors: newConnectors,
            selectedShapeIds: newSelectedShapeIds,
          },
        },
      };
    });
  },

  renameLayer: (id: string, name: string) => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const layer = currentSheet.layers[id];
      if (!layer) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            layers: { ...currentSheet.layers, [id]: { ...layer, name } },
          },
        },
      };
    });
  },

  toggleLayerVisibility: (id: string) => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const layer = currentSheet.layers[id];
      if (!layer) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            layers: {
              ...currentSheet.layers,
              [id]: { ...layer, isVisible: !layer.isVisible },
            },
          },
        },
      };
    });
  },

  setActiveLayer: (id: string) => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      if (!currentSheet.layers[id]) return state;
      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            activeLayerId: id,
          },
        },
      };
    });
  },

  cutShape: (ids: string[]) => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shapesToCut = ids.map((id: string) => currentSheet.shapesById[id]).filter(Boolean);
      if (shapesToCut.length === 0) return state;

      const newShapesById = { ...currentSheet.shapesById };
      ids.forEach((id: string) => delete newShapesById[id]);

      const newShapeIds = currentSheet.shapeIds.filter((id: string) => !ids.includes(id));

      const newConnectors = Object.fromEntries(
        Object.entries(currentSheet.connectors).filter(
          ([, conn]: [string, Connector]) => !ids.includes(conn.startNodeId) && !ids.includes(conn.endNodeId)
        )
      );

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            shapeIds: newShapeIds,
            connectors: newConnectors,
            selectedShapeIds: [],
            clipboard: shapesToCut,
          },
        },
      };

    });
  },

  copyShape: (ids: string[]) => {
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shapesToCopy = ids.map((id: string) => currentSheet.shapesById[id]).filter(Boolean);
      if (shapesToCopy.length === 0) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            clipboard: shapesToCopy,
          },
        },
      };
    });
  },

  pasteShape: () => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const { clipboard, selectedShapeIds, shapesById, pan, zoom } = currentSheet;
      if (!clipboard || clipboard.length === 0) return state;

      let pasteX = 0;
      let pasteY = 0;

      if (selectedShapeIds.length > 0) {
        const selectedShape = shapesById[selectedShapeIds[0]];
        if (selectedShape) {
          pasteX = selectedShape.x + 10;
          pasteY = selectedShape.y + 10;
        }
      } else {
        // Calculate center of the visible canvas area
        const canvasWidth = window.innerWidth; // Assuming canvas takes full window width
        const canvasHeight = window.innerHeight; // Assuming canvas takes full window height

        // Adjust for current pan and zoom to get the center in diagram coordinates
        pasteX = (canvasWidth / 2 - pan.x) / zoom;
        pasteY = (canvasHeight / 2 - pan.y) / zoom;

        // Adjust for the first shape's own offset from its group's top-left
        // This assumes clipboard[0] is the reference point for the group
        pasteX -= clipboard[0].x;
        pasteY -= clipboard[0].y;
      }

      const newShapes: Shape[] = [];
      const newShapeIds: string[] = [];
      const newShapesById = { ...shapesById };

      clipboard.forEach((shape: Shape) => {
          const newShapeId = uuidv4();
          const newShape = {
              ...shape,
              id: newShapeId,
              x: pasteX + (shape.x - clipboard[0].x),
              y: pasteY + (shape.y - clipboard[0].y),
              layerId: currentSheet.activeLayerId,
          };
          newShapes.push(newShape);
          newShapeIds.push(newShapeId);
          newShapesById[newShapeId] = newShape;
      });


      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            shapeIds: [...currentSheet.shapeIds, ...newShapeIds],
            selectedShapeIds: newShapeIds,
          },
        },
      };
    });
  },

  addSheet: () => {
    addHistory(set);
    set((state: DiagramState) => {
      const newSheetId = uuidv4();
      const newSheetName = `Sheet ${Object.keys(state.sheets).length + 1}`;
      const defaultLayerId = uuidv4(); // This is fine here, as it's a local variable for newSheet

      const newSheet: Sheet = { // Explicitly type newSheet as Sheet
        id: newSheetId,
        name: newSheetName,
        shapesById: {},
        shapeIds: [],
        connectors: {},
        selectedShapeIds: [],
        layers: {
          [defaultLayerId]: {
            id: defaultLayerId,
            name: 'Layer 1',
            isVisible: true,
            isLocked: false,
          },
        },
        layerIds: [defaultLayerId],
        activeLayerId: defaultLayerId,
        zoom: 1,
        pan: { x: 0, y: 0 },
        clipboard: null,
        selectedFont: initialState.sheets[defaultSheetId].selectedFont,
        selectedFontSize: initialState.sheets[defaultSheetId].selectedFontSize,
        selectedTextColor: initialState.sheets[defaultSheetId].selectedTextColor,
        selectedShapeColor: initialState.sheets[defaultSheetId].selectedShapeColor,
        selectedLineStyle: initialState.sheets[defaultSheetId].selectedLineStyle,
        selectedLineWidth: initialState.sheets[defaultSheetId].selectedLineWidth,
        selectedConnectorIds: initialState.sheets[defaultSheetId].selectedConnectorIds,
        connectorDragTargetShapeId: null,
      };

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [newSheetId]: newSheet,
        },
        activeSheetId: newSheetId,
      };
    });
  },

  removeSheet: (id: string) => {
    addHistory(set);
    set((state: DiagramState) => {
      const sheetIds = Object.keys(state.sheets);
      if (sheetIds.length === 1) {
        console.warn('Cannot remove the last sheet.');
        return state;
      }

      const newSheets = Object.fromEntries(
        Object.entries(state.sheets).filter(([sheetId]: [string, Sheet]) => sheetId !== id)
      );

      const newActiveSheetId = id === state.activeSheetId ? sheetIds.filter((sheetId: string) => sheetId !== id)[0] : state.activeSheetId;

      return {
        ...state,
        sheets: newSheets,
        activeSheetId: newActiveSheetId,
      };
    });
  },

  setActiveSheet: (id: string) => {
    addHistory(set);
    set((state: DiagramState) => {
      if (!state.sheets[id]) return state;
      return { ...state, activeSheetId: id };
    });
  },

  renameSheet: (id: string, name: string) => {
    addHistory(set);
    set((state: DiagramState) => {
      const sheet = state.sheets[id];
      if (!sheet) return state;
      return {
        ...state,
        sheets: {
          ...state.sheets,
          [id]: { ...sheet, name },
        },
      };
    });
  },

  setSelectedFont: (font: string) => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id: string) => {
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
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id: string) => {
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

  updateShapeTextPosition: (id: string, textOffsetX: number, textOffsetY: number) => {
    addHistory(set);
    set((state: DiagramState) => {
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
    addHistory(set);
    set((state: DiagramState) => {
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
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id: string) => {
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
    addHistory(set);
    set((state: DiagramState) => {
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

  toggleBold: () => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id: string) => {
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
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id: string) => {
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
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id: string) => {
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

  resetStore: () => {
    set(initialState);
  },

  setVerticalAlign: (alignment: 'top' | 'middle' | 'bottom') => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id: string) => {
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
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id: string) => {
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
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newShapesById = { ...currentSheet.shapesById };
      currentSheet.selectedShapeIds.forEach((id: string) => {
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

  setSelectedLineStyle: (style: LineStyle) => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newConnectors = { ...currentSheet.connectors };
      const targetConnectorIds = currentSheet.selectedConnectorIds.length > 0
        ? currentSheet.selectedConnectorIds
        : Object.keys(newConnectors);

      targetConnectorIds.forEach((connectorId: string) => {
        const connector = newConnectors[connectorId];
        if (connector) {
          newConnectors[connectorId] = { ...connector, lineStyle: style };
        }
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedLineStyle: style,
            connectors: newConnectors,
          },
        },
      };
    });
  },

  setSelectedLineWidth: (width: number) => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newConnectors = { ...currentSheet.connectors };
      const targetConnectorIds = currentSheet.selectedConnectorIds.length > 0
        ? currentSheet.selectedConnectorIds
        : Object.keys(newConnectors);

      targetConnectorIds.forEach((connectorId: string) => {
        const connector = newConnectors[connectorId];
        if (connector) {
          newConnectors[connectorId] = { ...connector, lineWidth: width };
        }
        });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedLineWidth: width,
            connectors: newConnectors,
          },
        },
      };
    });
  },

  groupShapes: (ids: string[]) => {
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const shapesToGroup = ids.map((id: string) => currentSheet.shapesById[id]).filter(Boolean);
      if (shapesToGroup.length < 2) return state; // Need at least two shapes to group

      // Calculate bounding box of selected shapes
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      shapesToGroup.forEach((shape: Shape) => {
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

      shapesToGroup.forEach((shape: Shape) => {
        newShapesById[shape.id] = {
          ...shape,
          parentId: groupId,
          x: shape.x - minX, // Make coordinates relative to group
          y: shape.y - minY, // Make coordinates relative to group
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
    addHistory(set);
    set((state: DiagramState) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const { selectedShapeIds, selectedConnectorIds, shapesById, shapeIds, connectors } = currentSheet;

      if (selectedShapeIds.length === 0 && (!selectedConnectorIds || selectedConnectorIds.length === 0)) {
        return state;
      }

      const newShapesById = { ...shapesById };
      selectedShapeIds.forEach((id: string) => delete newShapesById[id]);

      const newShapeIds = shapeIds.filter((id: string) => !selectedShapeIds.includes(id));

      const newConnectors = { ...connectors };
      if (selectedConnectorIds) {
        selectedConnectorIds.forEach((id: string) => delete newConnectors[id]);
      }


      // Also remove connectors attached to deleted shapes
      Object.values(newConnectors).forEach((conn: Connector) => {
        if (selectedShapeIds.includes(conn.startNodeId) || selectedShapeIds.includes(conn.endNodeId)) {
          delete newConnectors[conn.id];
        }
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            shapesById: newShapesById,
            shapeIds: newShapeIds,
            connectors: newConnectors,
            selectedShapeIds: [],
            selectedConnectorIds: [],
          },
        },
      };
    });
  },
    }),
    {
      name: 'diagram-storage-v2',
      storage: createJSONStorage(() => localStorage),
      
    }
  )
);