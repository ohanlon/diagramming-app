import type { ExportContext, Exporter, RenderSheetToImage } from './Exporter';
import { downloadDataUrl } from '../utils/downloadUtils';

export class JpgExporter implements Exporter {
  constructor(private render: RenderSheetToImage, private quality = 0.92) {}

  async export(ctx: ExportContext): Promise<void> {
    const res = await this.render(ctx.sheetId, ctx.widthPx, ctx.heightPx, 'image/jpeg', this.quality);
    if (!res.dataUrl) throw new Error('Failed to render sheet for JPG export');
    const name = `${ctx.diagramName || 'diagram'} - ${ctx.sheetName || 'sheet'}.jpg`;
    downloadDataUrl(res.dataUrl, name);
  }
}
