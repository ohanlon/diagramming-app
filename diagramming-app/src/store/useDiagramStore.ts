
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DiagramState, Shape, Connector, Point } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Define a type for the history state
type HistoryState = Pick<
  DiagramState,
  | 'sheets'
  | 'activeSheetId'
>;

interface DiagramStoreActions {
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
  setSelectedFontSize: (size: number) => void; // New action
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
    },
  },
  activeSheetId: defaultSheetId,
  history: {
    past: [],
    future: [],
  },
};

// Function to add a new state to the history
const addHistory = (
  get: () => DiagramState & DiagramStoreActions,
  set: (state: Partial<DiagramState & DiagramStoreActions>) => void
) => {
  const { history, sheets, activeSheetId } = get();
  const newPast = [...history.past, { sheets, activeSheetId } as HistoryState];
  set({ history: { past: newPast, future: [] } });
};

export const useDiagramStore = create<DiagramState & DiagramStoreActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addShape: (shape) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: {
                  ...activeSheet.shapesById,
                  [shape.id]: { ...shape, layerId: activeSheet.activeLayerId, fontSize: activeSheet.selectedFontSize, textOffsetX: 0, textOffsetY: shape.height + 5, textWidth: shape.width, textHeight: 20 },
                },
                shapeIds: [...activeSheet.shapeIds, shape.id],
                selectedShapeIds: [shape.id],
              },
            },
          };
        });
      },

      updateShapePosition: (id, newX, newY) =>
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const shape = activeSheet.shapesById[id];
          if (!shape) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: {
                  ...activeSheet.shapesById,
                  [id]: { ...shape, x: newX, y: newY },
                },
              },
            },
          };
        }),

      recordShapeMove: (id, newX, newY) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: {
                  ...activeSheet.shapesById,
                  [id]: { ...activeSheet.shapesById[id], x: newX, y: newY },
                },
              },
            },
          };
        });
      },

      updateShapePositions: (positions) =>
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const newShapesById = { ...activeSheet.shapesById };
          positions.forEach(({ id, x, y }) => {
            const shape = newShapesById[id];
            if (shape) {
              newShapesById[id] = { ...shape, x, y };
            }
          });
          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: newShapesById,
              },
            },
          };
        }),

      recordShapeMoves: (positions) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const newShapesById = { ...activeSheet.shapesById };
          positions.forEach(({ id, x, y }) => {
            const shape = newShapesById[id];
            if (shape) {
              newShapesById[id] = { ...shape, x, y };
            }
          });
          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: newShapesById,
              },
            },
          };
        });
      },

      updateShapeDimensions: (id, newX, newY, newWidth, newHeight) =>
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const shape = activeSheet.shapesById[id];
          if (!shape) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: {
                  ...activeSheet.shapesById,
                  [id]: {
                    ...shape,
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight,
                  },
                },
              },
            },
          };
        }),

      recordShapeResize: (id, finalX, finalY, finalWidth, finalHeight) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: {
                  ...activeSheet.shapesById,
                  [id]: {
                    ...activeSheet.shapesById[id],
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

      updateShapeDimensionsMultiple: (dimensions) =>
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const newShapesById = { ...activeSheet.shapesById };
          dimensions.forEach(({ id, x, y, width, height }) => {
            const shape = newShapesById[id];
            if (shape) {
              newShapesById[id] = { ...shape, x, y, width, height };
            }
          });
          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: newShapesById,
              },
            },
          };
        }),

      recordShapeResizeMultiple: (dimensions) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const newShapesById = { ...activeSheet.shapesById };
          dimensions.forEach(({ id, x, y, width, height }) => {
            const shape = newShapesById[id];
            if (shape) {
              newShapesById[id] = { ...shape, x, y, width, height };
            }
          });
          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: newShapesById,
              },
            },
          };
        });
      },

      updateShapeText: (id, text) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: {
                  ...activeSheet.shapesById,
                  [id]: { ...activeSheet.shapesById[id], text },
                },
              },
            },
          };
        });
      },

      addConnector: (connector) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                connectors: { ...activeSheet.connectors, [connector.id]: connector },
              },
            },
          };
        });
      },

      setSelectedShapes: (ids) =>
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                selectedShapeIds: ids,
              },
            },
          };
        }),

      toggleShapeSelection: (id) =>
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const selectedShapeIds = activeSheet.selectedShapeIds.includes(id)
            ? activeSheet.selectedShapeIds.filter((shapeId) => shapeId !== id)
            : [...activeSheet.selectedShapeIds, id];

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                selectedShapeIds: selectedShapeIds,
              },
            },
          };
        }),

      setZoom: (zoom) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                zoom: zoom,
              },
            },
          };
        });
      },

      setPan: (pan) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                pan: pan,
              },
            },
          };
        });
      },

      undo: () =>
        set((state) => {
          const { past, future } = state.history;
          if (past.length === 0) return state;

          const previousState = past[past.length - 1];
          const newPast = past.slice(0, past.length - 1);

          const currentState: DiagramState = {
            sheets: state.sheets,
            activeSheetId: state.activeSheetId,
            history: { past: [], future: [] }, // History is not part of the snapshot
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
        set((state) => {
          const { past, future } = state.history;
          if (future.length === 0) return state;

          const nextState = future[0];
          const newFuture = future.slice(1);

          const currentState: DiagramState = {
            sheets: state.sheets,
            activeSheetId: state.activeSheetId,
            history: { past: [], future: [] }, // History is not part of the snapshot
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

      bringForward: (id) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const currentIdx = activeSheet.shapeIds.indexOf(id);
          if (currentIdx === -1 || currentIdx === activeSheet.shapeIds.length - 1)
            return state;

          const newShapeIds = [...activeSheet.shapeIds];
          const [shapeId] = newShapeIds.splice(currentIdx, 1);
          newShapeIds.splice(currentIdx + 1, 0, shapeId);

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapeIds: newShapeIds,
              },
            },
          };
        });
      },

      sendBackward: (id) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const currentIdx = activeSheet.shapeIds.indexOf(id);
          if (currentIdx === -1 || currentIdx === 0) return state;

          const newShapeIds = [...activeSheet.shapeIds];
          const [shapeId] = newShapeIds.splice(currentIdx, 1);
          newShapeIds.splice(currentIdx - 1, 0, shapeId);

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapeIds: newShapeIds,
              },
            },
          };
        });
      },

      bringToFront: (id) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const currentIdx = activeSheet.shapeIds.indexOf(id);
          if (currentIdx === -1 || currentIdx === activeSheet.shapeIds.length - 1)
            return state;

          const newShapeIds = activeSheet.shapeIds.filter((shapeId) => shapeId !== id);
          newShapeIds.push(id);

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapeIds: newShapeIds,
              },
            },
          };
        });
      },

      sendToBack: (id) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const currentIdx = activeSheet.shapeIds.indexOf(id);
          if (currentIdx === -1 || currentIdx === 0) return state;

          const newShapeIds = activeSheet.shapeIds.filter((shapeId) => shapeId !== id);
          newShapeIds.unshift(id);

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapeIds: newShapeIds,
              },
            },
          };
        });
      },

      toggleFullscreen: () =>
        set((state) => {
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
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const newLayerId = uuidv4();
          const newLayerName = `Layer ${activeSheet.layerIds.length + 1}`;
          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                layers: {
                  ...activeSheet.layers,
                  [newLayerId]: {
                    id: newLayerId,
                    name: newLayerName,
                    isVisible: true,
                    isLocked: false,
                  },
                },
                layerIds: [newLayerId, ...activeSheet.layerIds],
                activeLayerId: newLayerId,
              },
            },
          };
        });
      },

      removeLayer: (id) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          if (activeSheet.layerIds.length === 1) {
            console.warn('Cannot remove the last layer.');
            return state;
          }

          const newLayers = { ...activeSheet.layers };
          delete newLayers[id];

          const newLayerIds = activeSheet.layerIds.filter((layerId) => layerId !== id);

          const newActiveLayerId =
            activeSheet.activeLayerId === id
              ? newLayerIds[0]
              : activeSheet.activeLayerId;

          const newShapesById = Object.fromEntries(
            Object.entries(activeSheet.shapesById).filter(
              ([, shape]) => shape.layerId !== id
            )
          );
          const newShapeIds = activeSheet.shapeIds.filter(
            (shapeId) => newShapesById[shapeId]
          );
          const newConnectors = Object.fromEntries(
            Object.entries(activeSheet.connectors).filter(
              ([, conn]) =>
                newShapesById[conn.startNodeId] && newShapesById[conn.endNodeId]
            )
          );
          const newSelectedShapeIds = activeSheet.selectedShapeIds.filter(
            (shapeId) => newShapesById[shapeId]
          );

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
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

      renameLayer: (id, name) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const layer = activeSheet.layers[id];
          if (!layer) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                layers: { ...activeSheet.layers, [id]: { ...layer, name } },
              },
            },
          };
        });
      },

      toggleLayerVisibility: (id) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const layer = activeSheet.layers[id];
          if (!layer) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                layers: {
                  ...activeSheet.layers,
                  [id]: { ...layer, isVisible: !layer.isVisible },
                },
              },
            },
          };
        });
      },

      setActiveLayer: (id) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          if (!activeSheet.layers[id]) return state;
          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                activeLayerId: id,
              },
            },
          };
        });
      },

      cutShape: (ids) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const shapesToCut = ids.map(id => activeSheet.shapesById[id]).filter(Boolean);
          if (shapesToCut.length === 0) return state;

          const newShapesById = { ...activeSheet.shapesById };
          ids.forEach(id => delete newShapesById[id]);

          const newShapeIds = activeSheet.shapeIds.filter((id) => !ids.includes(id));

          const newConnectors = Object.fromEntries(
            Object.entries(activeSheet.connectors).filter(
              ([, conn]) => !ids.includes(conn.startNodeId) && !ids.includes(conn.endNodeId)
            )
          );

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
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

      copyShape: (ids) => {
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const shapesToCopy = ids.map(id => activeSheet.shapesById[id]).filter(Boolean);
          if (shapesToCopy.length === 0) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                clipboard: shapesToCopy,
              },
            },
          };
        });
      },

      pasteShape: () => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const { clipboard, selectedShapeIds, shapesById, shapeIds } = activeSheet;
          if (!clipboard || clipboard.length === 0) return state;

          let x = 0;
          let y = 0;

          if (selectedShapeIds.length > 0) {
            const selectedShape = shapesById[selectedShapeIds[0]];
            if (selectedShape) {
              x = selectedShape.x + 16;
              y = selectedShape.y + 16;
            }
          } else if (shapeIds.length > 0) {
            const lastShape = shapesById[shapeIds[shapeIds.length - 1]];
            if (lastShape) {
              x = lastShape.x + 16;
              y = lastShape.y + 16;
            }
          }

          const newShapes: Shape[] = [];
          const newShapeIds: string[] = [];
          const newShapesById = { ...shapesById };

          clipboard.forEach(shape => {
              const newShapeId = uuidv4();
              const newShape = {
                  ...shape,
                  id: newShapeId,
                  x: x + (shape.x - clipboard[0].x),
                  y: y + (shape.y - clipboard[0].y),
                  layerId: activeSheet.activeLayerId,
              };
              newShapes.push(newShape);
              newShapeIds.push(newShapeId);
              newShapesById[newShapeId] = newShape;
          });


          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: newShapesById,
                shapeIds: [...shapeIds, ...newShapeIds],
                selectedShapeIds: newShapeIds,
              },
            },
          };
        });
      },

      addSheet: () => {
        addHistory(get, set);
        set((state) => {
          const newSheetId = uuidv4();
          const newSheetName = `Sheet ${Object.keys(state.sheets).length + 1}`;
          const defaultLayerId = uuidv4();

          const newSheet = {
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
          };

          return {
            sheets: {
              ...state.sheets,
              [newSheetId]: newSheet,
            },
            activeSheetId: newSheetId,
          };
        });
      },

      removeSheet: (id) => {
        addHistory(get, set);
        set((state) => {
          const sheetIds = Object.keys(state.sheets);
          if (sheetIds.length === 1) {
            console.warn('Cannot remove the last sheet.');
            return state;
          }

          const newSheets = { ...state.sheets };
          delete newSheets[id];

          const newActiveSheetId = id === state.activeSheetId ? sheetIds.filter(sheetId => sheetId !== id)[0] : state.activeSheetId;

          return {
            sheets: newSheets,
            activeSheetId: newActiveSheetId,
          };
        });
      },

      setActiveSheet: (id) => {
        addHistory(get, set);
        set((state) => {
          if (!state.sheets[id]) return state;
          return { activeSheetId: id };
        });
      },

      renameSheet: (id, name) => {
        addHistory(get, set);
        set((state) => {
          const sheet = state.sheets[id];
          if (!sheet) return state;
          return {
            sheets: {
              ...state.sheets,
              [id]: { ...sheet, name },
            },
          };
        });
      },

      setSelectedFont: (font) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const newShapesById = { ...activeSheet.shapesById };
          activeSheet.selectedShapeIds.forEach((id) => {
            const shape = newShapesById[id];
            if (shape) {
              newShapesById[id] = { ...shape, fontFamily: font };
            }
          });

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                selectedFont: font,
                shapesById: newShapesById,
              },
            },
          };
        });
      },

      setSelectedFontSize: (size) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const newShapesById = { ...activeSheet.shapesById };
          activeSheet.selectedShapeIds.forEach((id) => {
            const shape = newShapesById[id];
            if (shape) {
              newShapesById[id] = { ...shape, fontSize: size };
            }
          });

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                selectedFontSize: size,
                shapesById: newShapesById,
              },
            },
          };
        });
      },

      updateShapeTextPosition: (id, textOffsetX, textOffsetY) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const shape = activeSheet.shapesById[id];
          if (!shape) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: {
                  ...activeSheet.shapesById,
                  [id]: { ...shape, textOffsetX, textOffsetY },
                },
              },
            },
          };
        });
      },

      updateShapeTextDimensions: (id, textWidth, textHeight) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const shape = activeSheet.shapesById[id];
          if (!shape) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: {
                  ...activeSheet.shapesById,
                  [id]: { ...shape, textWidth, textHeight },
                },
              },
            },
          };
        });
      },

      deselectAllTextBlocks: () => {
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const newShapesById = { ...activeSheet.shapesById };
          activeSheet.shapeIds.forEach((id) => {
            const shape = newShapesById[id];
            if (shape) {
              newShapesById[id] = { ...shape, isTextSelected: false };
            }
          });

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: newShapesById,
              },
            },
          };
        });
      },

      updateShapeIsTextSelected: (id, isTextSelected) => {
        addHistory(get, set);
        set((state) => {
          const activeSheet = state.sheets[state.activeSheetId];
          if (!activeSheet) return state;

          const shape = activeSheet.shapesById[id];
          if (!shape) return state;

          return {
            sheets: {
              ...state.sheets,
              [state.activeSheetId]: {
                ...activeSheet,
                shapesById: {
                  ...activeSheet.shapesById,
                  [id]: { ...shape, isTextSelected },
                },
              },
            },
          };
        });
      },
    }),
    {
      name: 'diagram-storage-v2', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
