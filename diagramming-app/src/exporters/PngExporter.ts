import type { ExportContext, Exporter, RenderSheetToImage } from './Exporter';
import { downloadDataUrl } from '../utils/downloadUtils';

export class PngExporter implements Exporter {
  constructor(private render: RenderSheetToImage) {}

  async export(ctx: ExportContext): Promise<void> {
    const res = await this.render(ctx.sheetId, ctx.widthPx, ctx.heightPx, 'image/png');
    if (!res.dataUrl) throw new Error('Failed to render sheet for PNG export');
    const name = `${ctx.diagramName || 'diagram'} - ${ctx.sheetName || 'sheet'}.png`;
    downloadDataUrl(res.dataUrl, name);
  }
}
