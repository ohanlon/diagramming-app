
export type Point = {
  x: number;
  y: number;
};

export type Layer = {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked: boolean; // Optional: for preventing interaction
};

export type ShapeType = 'rectangle' | 'circle' | 'diamond' | 'text';

export type Shape = {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string; // For example, to distinguish shapes
  layerId: string; // New: ID of the layer this shape belongs to
};

export type AnchorType = 'top' | 'right' | 'bottom' | 'left';

export type Connector = {
  id: string;
  startNodeId: string;
  endNodeId: string;
  startAnchorType: AnchorType;
  endAnchorType: AnchorType;
};

export type Sheet = {
  id: string;
  name: string;
  shapesById: Record<string, Shape>;
  shapeIds: string[];
  connectors: Record<string, Connector>;
  selectedShapeIds: string[];
  layers: Record<string, Layer>;
  layerIds: string[];
  activeLayerId: string;
  zoom: number;
  pan: Point;
  clipboard: Shape[] | null;
};

export type DiagramState = {
  sheets: Record<string, Sheet>;
  activeSheetId: string;
  history: {
    past: HistoryState[];
    future: HistoryState[];
  };
};
