export interface ExportContext {
  diagramName: string;
  sheetId: string;
  sheetName: string;
  widthPx: number;
  heightPx: number;
}

export interface RenderResult {
  dataUrl: string | null;
  canvas?: HTMLCanvasElement | null;
}

export interface Exporter {
  export(ctx: ExportContext): Promise<void>;
}

export type RenderSheetToImage = (
  sheetId: string,
  widthPx: number,
  heightPx: number,
  mimeType: string,
  quality?: number
) => Promise<RenderResult>;
