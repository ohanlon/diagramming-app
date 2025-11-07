import type { ExportContext, Exporter, RenderSheetToImage } from './Exporter';
import { PngExporter } from './PngExporter';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export class TiffExporter implements Exporter {
  constructor(private render: RenderSheetToImage) {}

  async export(ctx: ExportContext): Promise<void> {
    try {
      const res = await this.render(ctx.sheetId, ctx.widthPx, ctx.heightPx, 'image/png');
      if (!res.canvas) throw new Error('Failed to render sheet for TIFF export');
      const utifModule = await import('utif');
      const UTIF: any = utifModule && (utifModule.default || utifModule);
      const c = res.canvas as HTMLCanvasElement;
      const g = c.getContext('2d');
      if (!g) throw new Error('Canvas context unavailable');
      const imgData = g.getImageData(0, 0, ctx.widthPx, ctx.heightPx);
      let tiffBuffer: ArrayBuffer | null = null;
      if (UTIF && typeof UTIF.encodeImage === 'function') {
        tiffBuffer = UTIF.encodeImage(imgData.data, ctx.widthPx, ctx.heightPx);
      } else if (UTIF && typeof UTIF.encode === 'function') {
        try { tiffBuffer = UTIF.encode([{ data: imgData.data, width: ctx.widthPx, height: ctx.heightPx }]); } catch {}
      }
      if (!tiffBuffer) throw new Error('TIFF encoding API not found');
      const blob = new Blob([tiffBuffer], { type: 'image/tiff' });
      const name = `${ctx.diagramName || 'diagram'} - ${ctx.sheetName || 'sheet'}.tiff`;
      downloadBlob(blob, name);
    } catch (e) {
      try {
        const pngExporter = new PngExporter(this.render);
        await pngExporter.export(ctx);
        alert('TIFF export requires the utif package. PNG has been saved instead.');
      } catch (e2) {
        console.error('TIFF export failed and PNG fallback failed', e2);
        alert('TIFF export failed. See console for details.');
      }
    }
  }
}
