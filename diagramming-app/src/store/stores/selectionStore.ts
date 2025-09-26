// Selection-related store actions and state

export interface SelectionStoreActions {
  // Shape selection
  setSelectedShapes: (ids: string[]) => void;
  toggleShapeSelection: (id: string) => void;
  
  // Connector selection  
  setSelectedConnectors: (ids: string[]) => void;
  
  // Multi-select operations
  selectAll: () => void;
  selectShapes: () => void;
  selectConnectors: () => void;
}

// This will be imported and used in the main store
export const createSelectionActions = (set: any, get: any): SelectionStoreActions => ({
  setSelectedShapes: () => {
    // Implementation to be moved from main store
  },
  
  toggleShapeSelection: () => {
    // Implementation to be moved from main store
  },
  
  setSelectedConnectors: () => {
    // Implementation to be moved from main store
  },
  
  selectAll: () => {
    // Implementation to be moved from main store
  },
  
  selectShapes: () => {
    // Implementation to be moved from main store
  },
  
  selectConnectors: () => {
    // Implementation to be moved from main store
  },
});