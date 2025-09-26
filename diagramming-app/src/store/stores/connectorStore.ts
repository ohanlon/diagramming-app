// Connector-related store actions and state
import type { Connector, LineStyle, ArrowStyle, ConnectionType } from '../../types';

export interface ConnectorStoreActions {
  // Connector CRUD operations
  addConnector: (connector: Connector) => void;
  
  // Connector styling
  setSelectedLineStyle: (style: LineStyle) => void;
  setSelectedLineWidth: (width: number) => void;
  setSelectedStartArrow: (arrowStyle: ArrowStyle) => void;
  setSelectedEndArrow: (arrowStyle: ArrowStyle) => void;
  setSelectedConnectionType: (connectionType: ConnectionType) => void;
  
  // Connector interaction
  setConnectorDragTargetShapeId: (shapeId: string | null) => void;
}

// This will be imported and used in the main store
export const createConnectorActions = (set: any, get: any, addHistory: any): ConnectorStoreActions => ({
  addConnector: () => {
    // Implementation to be moved from main store
  },
  
  setSelectedLineStyle: () => {
    // Implementation to be moved from main store
  },
  
  setSelectedLineWidth: () => {
    // Implementation to be moved from main store
  },
  
  setSelectedStartArrow: () => {
    // Implementation to be moved from main store
  },
  
  setSelectedEndArrow: () => {
    // Implementation to be moved from main store
  },
  
  setSelectedConnectionType: () => {
    // Implementation to be moved from main store
  },
  
  setConnectorDragTargetShapeId: () => {
    // Implementation to be moved from main store
  },
});