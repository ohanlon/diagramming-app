import type { ExportContext, Exporter, RenderSheetToImage } from './Exporter';

type PdfPageSize = 'image' | 'a4_portrait' | 'a4_landscape' | 'letter_portrait' | 'letter_landscape' | 'custom';

export class PdfExporter implements Exporter {
  constructor(
    private render: RenderSheetToImage,
    private options: { pageSize: PdfPageSize; customWidthIn?: number; customHeightIn?: number }
  ) {}

  async export(ctx: ExportContext): Promise<void> {
    const res = await this.render(ctx.sheetId, ctx.widthPx, ctx.heightPx, 'image/png');
    if (!res.dataUrl) throw new Error('Failed to render sheet for PDF export');
    const jspdfModule: any = await import('jspdf');
    const jsPDFClass: any = jspdfModule && (jspdfModule.jsPDF || jspdfModule.default || jspdfModule);
    const fileName = `${ctx.diagramName || 'diagram'} - ${ctx.sheetName || 'sheet'}.pdf`;
    const { pageSize, customWidthIn, customHeightIn } = this.options;

    if (pageSize === 'image') {
      const doc = new jsPDFClass({ orientation: ctx.widthPx > ctx.heightPx ? 'landscape' : 'portrait', unit: 'px', format: [ctx.widthPx, ctx.heightPx] });
      doc.addImage(res.dataUrl, 'PNG', 0, 0, ctx.widthPx, ctx.heightPx);
      doc.save(fileName);
      return;
    }

    if (pageSize === 'a4_portrait' || pageSize === 'a4_landscape' || pageSize === 'letter_portrait' || pageSize === 'letter_landscape') {
      const format = pageSize.startsWith('a4') ? 'a4' : 'letter';
      const orientation = pageSize.endsWith('landscape') ? 'landscape' : 'portrait';
      const doc = new jsPDFClass({ orientation, unit: 'in', format });
      const imgInW = ctx.widthPx / 96;
      const imgInH = ctx.heightPx / 96;
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const scale = Math.min(pageW / imgInW, pageH / imgInH);
      const w = imgInW * scale;
      const h = imgInH * scale;
      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;
      doc.addImage(res.dataUrl, 'PNG', x, y, w, h);
      doc.save(fileName);
      return;
    }

    if (pageSize === 'custom') {
      const widthIn = customWidthIn || ctx.widthPx / 96;
      const heightIn = customHeightIn || ctx.heightPx / 96;
      const doc = new jsPDFClass({ orientation: widthIn > heightIn ? 'landscape' : 'portrait', unit: 'in', format: [widthIn, heightIn] });
      const imgInW = ctx.widthPx / 96;
      const imgInH = ctx.heightPx / 96;
      const scale = Math.min(widthIn / imgInW, heightIn / imgInH);
      const w = imgInW * scale;
      const h = imgInH * scale;
      const x = (widthIn - w) / 2;
      const y = (heightIn - h) / 2;
      doc.addImage(res.dataUrl, 'PNG', x, y, w, h);
      doc.save(fileName);
      return;
    }
  }
}
