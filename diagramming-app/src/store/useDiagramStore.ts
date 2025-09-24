import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Sheet, DiagramState, LineStyle, Shape, Connector, Point, ArrowStyle } from '../types';
import { useHistoryStore } from './useHistoryStore';

interface DiagramStoreActions {
  setSelectedStartArrow: (arrowStyle: ArrowStyle) => void;
  setSelectedEndArrow: (arrowStyle: ArrowStyle) => void;
  setSelectedLineWidth: (width: number) => void;
  updateShapeSvgContent: (id: string, svgContent: string) => void;
  setSelectedShapeColor: (color: string) => void;
  addShapeAndRecordHistory: (shape: Shape) => void;
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
  reorderLayer: (fromIndex: number, toIndex: number) => void;
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
  selectAll: () => void;
  selectShapes: () => void;
  selectConnectors: () => void;
  updateShapeInteractionUrl: (shapeId: string, url: string) => void;
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
};

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

const addHistory = (
  set: (fn: (state: DiagramState & DiagramStoreActions) => void) => void,
  get: () => DiagramState & DiagramStoreActions
): void => {
  const { sheets, activeSheetId } = get();
  useHistoryStore.getState().recordHistory(sheets, activeSheetId);
};

export const useDiagramStore = create<DiagramState & DiagramStoreActions>()(
  persist<DiagramState & DiagramStoreActions>(
    (set: (fn: (state: DiagramState & DiagramStoreActions) => void) => void, get: () => DiagramState & DiagramStoreActions) => ({
      ...initialState,
      setConnectorDragTargetShapeId: (shapeId: string | null) => {
        set((state) => {
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

      setSelectedShapeColor: (color: string) => {
        addHistory(set, get);
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



      addShapeAndRecordHistory: (shape: Shape) => {
        set((state) => _addShapeToState(state, shape));
        addHistory(set, get);
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

      recordShapeMove: (id: string, newX: number, newY: number) => {
        addHistory(set, get);
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

      recordShapeMoves: (positions: { id: string; x: number; y: number }[]) => {
        addHistory(set, get);
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
      recordShapeResize: (id: string, finalX: number, finalY: number, finalWidth: number, finalHeight: number) => {
        addHistory(set, get);
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

      recordShapeResizeMultiple: (dimensions: { id: string; x: number; y: number; width: number; height: number }[]) => {
        addHistory(set, get);
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

      updateShapeText: (id: string, text: string) => {
        addHistory(set, get);
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

      addConnector: (connector: Connector) => {
        addHistory(set, get);
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          const newConnector = {
            ...connector,
            startArrow: 'none' as ArrowStyle,
            endArrow: 'polygon_arrow' as ArrowStyle,
          };

          return {
            ...state,
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...currentSheet,
                connectors: { ...currentSheet.connectors, [connector.id]: newConnector },
                selectedConnectorIds: [], // Deselect all connectors when a new one is added
              },
            },
          };
        });
      },

      setSelectedShapes: (ids: string[]) =>
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          return {
            ...state,
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...currentSheet,
                selectedShapeIds: ids,
                selectedConnectorIds: [],
              },
            },
          };
        }),

      toggleShapeSelection: (id: string) => {
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          const selectedShapeIds = currentSheet.selectedShapeIds.includes(id)
            ? currentSheet.selectedShapeIds.filter((shapeId) => shapeId !== id)
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
        set((state) => {
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
        set((state) => {
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
        set((state) => {
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

      undo: () => {
        set((state) => {
          const historyState = useHistoryStore.getState().undo(state.sheets, state.activeSheetId);
          if (!historyState) return state;
          return {
            ...state,
            sheets: historyState.sheets,
            activeSheetId: historyState.activeSheetId,
          };
        });
      },

      redo: () => {
        set((state) => {
          const historyState = useHistoryStore.getState().redo(state.sheets, state.activeSheetId);
          if (!historyState) return state;
          return {
            ...state,
            sheets: historyState.sheets,
            activeSheetId: historyState.activeSheetId,
          };
        });
      },

      bringForward: (id: string) => {
        addHistory(set, get);
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
        addHistory(set, get);
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
        addHistory(set, get);
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
        addHistory(set, get);
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

      toggleFullscreen: () =>
        set((state) => { // Changed to return empty object
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
        addHistory(set, get);
        set((state) => {
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
        addHistory(set, get);
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          if (currentSheet.layerIds.length === 1) {
            console.warn('Cannot remove the last layer.');
            return state;
          }

          const newLayers = Object.fromEntries(
            Object.entries(currentSheet.layers).filter(([layerId]) => layerId !== id)
          );

          const newLayerIds = currentSheet.layerIds.filter((layerId) => layerId !== id);

          const newActiveLayerId =
            currentSheet.activeLayerId === id
              ? newLayerIds[0]
              : currentSheet.activeLayerId;

          const newShapesById = Object.fromEntries(
            Object.entries(currentSheet.shapesById).filter(
              ([, shape]) => shape.layerId !== id
            )
          );
          const newShapeIds = currentSheet.shapeIds.filter(
            (shapeId) => newShapesById[shapeId]
          );
          const newConnectors = Object.fromEntries(
            Object.entries(currentSheet.connectors).filter(
              ([, conn]) =>
                newShapesById[conn.startNodeId] && newShapesById[conn.endNodeId]
            )
          );
          const newSelectedShapeIds = currentSheet.selectedShapeIds.filter(
            (shapeId) => newShapesById[shapeId]
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
        addHistory(set, get);
        set((state) => {
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
        addHistory(set, get);
        set((state) => {
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
        addHistory(set, get);
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet || !currentSheet.layers[id]) return state;
          return { ...state, activeSheetId: id };
        });
      },

      reorderLayer: (fromIndex: number, toIndex: number) => {
        addHistory(set, get);
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          const newLayerIds = [...currentSheet.layerIds];
          const [movedLayerId] = newLayerIds.splice(fromIndex, 1);
          newLayerIds.splice(toIndex, 0, movedLayerId);

          return {
            ...state,
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...currentSheet,
                layerIds: newLayerIds,
              },
            },
          };
        });
      },

      cutShape: (ids: string[]) => {
        addHistory(set, get);
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          const shapesToCut = ids.map((id) => currentSheet.shapesById[id]).filter(Boolean);
          if (shapesToCut.length === 0) return state;

          const newShapesById = { ...currentSheet.shapesById };
          ids.forEach((id) => delete newShapesById[id]);

          const newShapeIds = currentSheet.shapeIds.filter((id) => !ids.includes(id));

          const newConnectors = Object.fromEntries(
            Object.entries(currentSheet.connectors).filter(
              ([, conn]) => !ids.includes(conn.startNodeId) && !ids.includes(conn.endNodeId)
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
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          const shapesToCopy = ids.map((id) => currentSheet.shapesById[id]).filter(Boolean);
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
        addHistory(set, get);
        set((state) => {
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

          clipboard.forEach((shape) => {
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
        addHistory(set, get);
        set((state) => {
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
        addHistory(set, get);
        set((state) => {
          const sheetIds = Object.keys(state.sheets);
          if (sheetIds.length === 1) {
            console.warn('Cannot remove the last sheet.');
            return state;
          }

          const newSheets = Object.fromEntries(
            Object.entries(state.sheets).filter(([sheetId]) => sheetId !== id)
          );

          const newActiveSheetId = id === state.activeSheetId ? sheetIds.filter((sheetId) => sheetId !== id)[0] : state.activeSheetId;

          return {
            ...state,
            sheets: newSheets,
            activeSheetId: newActiveSheetId,
          };
        });
      },

      setActiveSheet: (id: string) => {
        addHistory(set, get);
        set((state) => {
          if (!state.sheets[id]) return state;
          return { ...state, activeSheetId: id };
        });
      },

      renameSheet: (id: string, name: string) => {
        addHistory(set, get);
        set((state) => {
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
        addHistory(set, get);
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
        addHistory(set, get);
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
        addHistory(set, get);
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

      toggleBold: () => {
        addHistory(set, get);
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
        addHistory(set, get);
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
        addHistory(set, get);
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

      resetStore: () => {
        set(() => ({
          ...initialState,
        }));
      },

      setVerticalAlign: (alignment: 'top' | 'middle' | 'bottom') => {
        addHistory(set, get);
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
        addHistory(set, get);
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
        addHistory(set, get);
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

      setSelectedLineStyle: (style: LineStyle) => {
        addHistory(set, get);
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          const newConnectors = { ...currentSheet.connectors };
          const targetConnectorIds = currentSheet.selectedConnectorIds.length > 0
            ? currentSheet.selectedConnectorIds
            : Object.keys(newConnectors);

          targetConnectorIds.forEach((connectorId) => {
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
        addHistory(set, get);
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          const newConnectors = { ...currentSheet.connectors };
          const targetConnectorIds = currentSheet.selectedConnectorIds.length > 0
            ? currentSheet.selectedConnectorIds
            : Object.keys(newConnectors);

          targetConnectorIds.forEach((connectorId) => {
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

      setSelectedStartArrow: (arrowStyle: ArrowStyle) => {
        addHistory(set, get);
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          const newConnectors = { ...currentSheet.connectors };
          currentSheet.selectedConnectorIds.forEach((connectorId) => {
            const connector = newConnectors[connectorId];
            if (connector) {
              newConnectors[connectorId] = { ...connector, startArrow: arrowStyle };
            }
          });

          return {
            ...state,
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...currentSheet,
                connectors: newConnectors,
              },
            },
          };
        });
      },

      setSelectedEndArrow: (arrowStyle: ArrowStyle) => {
        addHistory(set, get);
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          const newConnectors = { ...currentSheet.connectors };
          currentSheet.selectedConnectorIds.forEach((connectorId) => {
            const connector = newConnectors[connectorId];
            if (connector) {
              newConnectors[connectorId] = { ...connector, endArrow: arrowStyle };
            }
          });

          return {
            ...state,
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...currentSheet,
                connectors: newConnectors,
              },
            },
          };
        });
      },

      groupShapes: (ids: string[]) => {
        addHistory(set, get);
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
        addHistory(set, get);
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

      selectAll: () => {
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          return {
            ...state,
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...currentSheet,
                selectedShapeIds: currentSheet.shapeIds,
                selectedConnectorIds: Object.keys(currentSheet.connectors),
              },
            },
          };
        });
      },

      selectShapes: () => {
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          return {
            ...state,
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...currentSheet,
                selectedShapeIds: currentSheet.shapeIds,
                selectedConnectorIds: [],
              },
            },
          };
        });
      },

      selectConnectors: () => {
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          return {
            ...state,
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...currentSheet,
                selectedConnectorIds: Object.keys(currentSheet.connectors),
                selectedShapeIds: [],
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

      // New action to set multiple properties at once
      setMultipleProperties: (ids: string[], properties: Partial<Shape>) => {
        addHistory(set, get);
        set((state) => {
          const currentSheet = state.sheets[state.activeSheetId];
          if (!currentSheet) return state;

          const newShapesById = { ...currentSheet.shapesById };
          ids.forEach((id) => {
            const shape = newShapesById[id];
            if (shape) {
              newShapesById[id] = { ...shape, ...properties };
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
    }),
    {
      name: 'diagram-storage',
    }
  )
);
