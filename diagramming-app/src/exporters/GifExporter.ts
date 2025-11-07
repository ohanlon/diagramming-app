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

export class GifExporter implements Exporter {
  constructor(private render: RenderSheetToImage) {}

  async export(ctx: ExportContext): Promise<void> {
    try {
      const res = await this.render(ctx.sheetId, ctx.widthPx, ctx.heightPx, 'image/png');
      if (!res.canvas) throw new Error('Failed to render sheet for GIF export');
      // dynamic import gif.js (optimized) fallback
      let gifModule: any = null;
      try { gifModule = await import('gif.js.optimized'); } catch { gifModule = await import('gif.js'); }
      const GIFClass: any = gifModule && (gifModule.default || gifModule.GIF || gifModule);

      // Resolve worker script URL
      let workerUrl: string | null = null;
      let createdBlobUrl: string | null = null;
      try {
        const modUrl: any = await import('gif.js.optimized/dist/gif.worker.js?url');
        workerUrl = modUrl && (modUrl.default || modUrl);
      } catch {
        try {
          const modUrl: any = await import('gif.js/dist/gif.worker.js?url');
          workerUrl = modUrl && (modUrl.default || modUrl);
        } catch {
          try {
            const raw: any = await import('gif.js.optimized/dist/gif.worker.js?raw');
            const txt = raw && (raw.default || raw);
            createdBlobUrl = URL.createObjectURL(new Blob([txt], { type: 'application/javascript' }));
            workerUrl = createdBlobUrl;
          } catch {
            try {
              const raw2: any = await import('gif.js/dist/gif.worker.js?raw');
              const txt2 = raw2 && (raw2.default || raw2);
              createdBlobUrl = URL.createObjectURL(new Blob([txt2], { type: 'application/javascript' }));
              workerUrl = createdBlobUrl;
            } catch {
              // last fallback - rely on library default
            }
          }
        }
      }

      const gifOptions: any = { workers: 2, quality: 10, width: ctx.widthPx, height: ctx.heightPx };
      if (workerUrl) gifOptions.workerScript = workerUrl;
      const gif = new GIFClass(gifOptions);

      // Composite onto white background to avoid transparent -> black
      const whiteCanvas = document.createElement('canvas');
      whiteCanvas.width = (res.canvas as HTMLCanvasElement).width;
      whiteCanvas.height = (res.canvas as HTMLCanvasElement).height;
      const wctx = whiteCanvas.getContext('2d');
      if (wctx) {
        wctx.fillStyle = '#ffffff';
        wctx.fillRect(0, 0, whiteCanvas.width, whiteCanvas.height);
        wctx.drawImage(res.canvas as HTMLCanvasElement, 0, 0);
      }
      gif.addFrame(whiteCanvas, { copy: true, delay: 0 });
      await new Promise<void>((resolve, reject) => {
        gif.on('finished', (blob: Blob) => {
          try {
            const name = `${ctx.diagramName || 'diagram'} - ${ctx.sheetName || 'sheet'}.gif`;
            downloadBlob(blob, name);
          } finally {
            if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
            resolve();
          }
        });
        gif.on('abort', () => reject(new Error('GIF export aborted')));
        try { gif.render(); } catch (e) { reject(e); }
      });
    } catch (e) {
      try {
        const pngExporter = new PngExporter(this.render);
        await pngExporter.export(ctx);
        alert('GIF export requires gif.js. PNG has been saved instead.');
      } catch (e2) {
        console.error('GIF export failed and PNG fallback failed', e2);
        alert('GIF export failed. See console for details.');
      }
    }
  }
}
