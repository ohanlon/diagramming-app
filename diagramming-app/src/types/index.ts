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

export type Interaction = {
  type: 'embed';
  url: string;
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
  path?: string;
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
  textPosition?: 'inside' | 'outside' | 'None';
  textColor?: string;
  parentId?: string; // New: ID of the parent group shape
  autosize?: boolean;
  isTextPositionManuallySet?: boolean;
  interaction?: Interaction;
};

export type ShapeType = 'Group' | string;

export type AnchorType = 'top' | 'right' | 'bottom' | 'left';

export type LineStyle = 'continuous' | 'dashed' | 'long-dash' | 'dot-dash' | 'custom-1' | 'custom-2' | 'long-dash-space' | 'long-space-short-dot';

export type ArrowStyle = 'none' | 'standard_arrow' | 'polygon_arrow' | 'circle';

export type ConnectionType = 'direct' | 'orthogonal' | 'bezier';

export type Connector = {
  id: string;
  startNodeId: string;
  endNodeId: string;
  startAnchorType: AnchorType;
  endAnchorType: AnchorType;
  lineStyle?: LineStyle;
  lineWidth?: number;
  startArrow?: ArrowStyle;
  endArrow?: ArrowStyle;
  connectionType?: ConnectionType;
  cornerRadius?: number; // Radius for rounded corners on orthogonal connections (default: 0)
  text?: string;
  textPosition?: number; // 0-1 value representing position along the path (0.5 = center)
  textOffset?: { x: number; y: number }; // Offset from the calculated position on path
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  isTextSelected?: boolean;
};

export type Sheet = {
  id: string;
  name: string;
  index: number; // Order of the sheet in the tab list
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
  selectedLineWidth: number;
  selectedConnectionType: ConnectionType;
  connectorDragTargetShapeId: string | null;
};

export type DiagramState = {
  sheets: Record<string, Sheet>;
  activeSheetId: string;
  isSnapToGridEnabled: boolean; // Add snapping state
  isDirty?: boolean; // Whether the store has unsaved changes
  // Server integration
  remoteDiagramId?: string | null; // Persisted diagram id on backend
  serverVersion?: number | null; // Server-side integer version for optimistic concurrency
  // Conflict handling fields when a save fails due to concurrent updates
  conflictServerState?: any | null;
  conflictServerVersion?: number | null;
  conflictUpdatedBy?: { id?: string; username?: string } | null;
  conflictOpen?: boolean;
  conflictLocalState?: any | null;
  serverUrl?: string; // Base URL of diagram server
  serverAuthUser?: string | null; // Optional basic auth user
  serverAuthPass?: string | null; // Optional basic auth password
  lastSaveError?: string | null; // Last error message from save attempts
  currentUser?: { id: string; username: string; avatarUrl?: string; roles?: string[] } | null; // Authenticated user's info with optional roles
  isEditable?: boolean; // Whether the currently opened diagram is editable by the current user
  diagramName?: string; // Human-friendly diagram name (required for save)
  // UI theme mode for the application ('light' or 'dark')
  themeMode?: 'light' | 'dark';
  thumbnailDataUrl?: string | null; // Base64-encoded PNG data URL for a small thumbnail preview
  showAuthDialog?: boolean; // Legacy flag controlling auth modal visibility (kept for compatibility)
  // Cache-related state for handling offline edits and 401 responses
  cachedDiagramData?: any | null; // Cached diagram data when user loses connection
  showCacheDialog?: boolean; // Whether to show the cache restore dialog
  cacheWarningMessage?: string | null; // Warning message about version conflicts
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