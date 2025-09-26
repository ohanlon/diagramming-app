// Connector-related store actions and state
import type { Connector, LineStyle, ArrowStyle, ConnectionType, DiagramState } from '../../types';

export interface ConnectorStoreActions {
  // Connector CRUD operations
  addConnector: (connector: Connector) => void;
  
  // Connector styling
  setSelectedLineStyle: (style: LineStyle) => void;
  setSelectedLineWidth: (width: number) => void;
  setSelectedStartArrow: (arrowStyle: ArrowStyle) => void;
  setSelectedEndArrow: (arrowStyle: ArrowStyle) => void;
  setSelectedConnectionType: (connectionType: ConnectionType) => void;
  
  // Connector text
  updateConnectorText: (connectorId: string, text: string) => void;
  updateConnectorTextPosition: (connectorId: string, position: number, offset?: { x: number; y: number }) => void;
  setConnectorTextSelected: (connectorId: string, isSelected: boolean) => void;
  
  // Connector interaction
  setConnectorDragTargetShapeId: (shapeId: string | null) => void;
}

// This will be imported and used in the main store
export const createConnectorActions = (
  set: (fn: (state: DiagramState) => DiagramState) => void,
  _get: () => DiagramState,
  addHistory: () => void
): ConnectorStoreActions => ({

  addConnector: (connector: Connector) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const newConnector = {
        ...connector,
        startArrow: 'none' as ArrowStyle,
        endArrow: 'polygon_arrow' as ArrowStyle,
        connectionType: currentSheet.selectedConnectionType,
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

  setSelectedLineStyle: (style: LineStyle) => {
    addHistory();
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
    addHistory();
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

  setSelectedConnectionType: (connectionType: ConnectionType) => {
    addHistory();
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
          newConnectors[connectorId] = { ...connector, connectionType: connectionType };
        }
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            selectedConnectionType: connectionType,
            connectors: newConnectors,
          },
        },
      };
    });
  },

  setSelectedStartArrow: (arrowStyle: ArrowStyle) => {
    addHistory();
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
    addHistory();
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

  updateConnectorText: (connectorId: string, text: string) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const connector = currentSheet.connectors[connectorId];
      if (!connector) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            connectors: {
              ...currentSheet.connectors,
              [connectorId]: {
                ...connector,
                text,
              },
            },
          },
        },
      };
    });
  },

  updateConnectorTextPosition: (connectorId: string, position: number, offset?: { x: number; y: number }) => {
    addHistory();
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const connector = currentSheet.connectors[connectorId];
      if (!connector) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            connectors: {
              ...currentSheet.connectors,
              [connectorId]: {
                ...connector,
                textPosition: Math.max(0, Math.min(1, position)), // Clamp between 0 and 1
                textOffset: offset || connector.textOffset || { x: 0, y: 0 },
              },
            },
          },
        },
      };
    });
  },

  setConnectorTextSelected: (connectorId: string, isSelected: boolean) => {
    set((state) => {
      const currentSheet = state.sheets[state.activeSheetId];
      if (!currentSheet) return state;

      const connector = currentSheet.connectors[connectorId];
      if (!connector) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: {
            ...currentSheet,
            connectors: {
              ...currentSheet.connectors,
              [connectorId]: {
                ...connector,
                isTextSelected: isSelected,
              },
            },
          },
        },
      };
    });
  },

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
});