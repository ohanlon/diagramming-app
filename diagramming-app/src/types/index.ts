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

export type Shape = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string; // For example, to distinguish shapes
  layerId: string; // New: ID of the layer this shape belongs to
  svgContent?: string;
  minX?: number;
  minY?: number;
  fontFamily?: string; // New: Optional font family for the shape's text
  fontSize?: number;
  textOffsetX: number;
  textOffsetY: number;
  textWidth: number;
  textHeight: number;
  isTextSelected?: boolean;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderlined?: boolean;
  verticalAlign?: 'top' | 'middle' | 'bottom';
  horizontalAlign?: 'left' | 'center' | 'right';
  textPosition?: 'inside' | 'outside';
  textColor?: string;
  parentId?: string; // New: ID of the parent group shape
  autosize?: boolean;
  isTextPositionManuallySet?: boolean;
};

export type ShapeType = 'Group' | string;

export type AnchorType = 'top' | 'right' | 'bottom' | 'left';

export type LineStyle = 'continuous' | 'dashed';

export type Connector = {
  id: string;
  startNodeId: string;
  endNodeId: string;
  startAnchorType: AnchorType;
  endAnchorType: AnchorType;
  lineStyle?: LineStyle;
};

export type Sheet = {
  id: string;
  name: string;
  shapesById: Record<string, Shape>;
  shapeIds: string[];
  connectors: Record<string, Connector>;
  selectedShapeIds: string[];
  selectedConnectorIds: string[];
  layers: Record<string, Layer>;
  layerIds: string[];
  activeLayerId: string;
  zoom: number;
  pan: Point;
  clipboard: Shape[] | null;
  selectedFont: string; // New: The currently selected font for this sheet
  selectedFontSize: number; // New: The currently selected font size for this sheet
  selectedTextColor: string;
  selectedShapeColor: string;
  selectedLineStyle: LineStyle;
};

export type DiagramState = {
  sheets: Record<string, Sheet>;
  activeSheetId: string;
  history: {
    past: HistoryState[];
    future: HistoryState[];
  };
};

export type HistoryState = {
  sheets: Record<string, Sheet>;
  activeSheetId: string;
};

export type ShapeStoreShape = {
  title: string;
  shape: string;
};

export type ShapeStoreCategory = {
  name: string;
  shapes: ShapeStoreShape[];
};

export type ShapeStore = {
  categories: ShapeStoreCategory[];
};