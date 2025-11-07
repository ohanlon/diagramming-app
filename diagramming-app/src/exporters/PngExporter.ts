import type { ExportContext, Exporter, RenderSheetToImage } from './Exporter';

function downloadDataUrl(dataUrl: string, filename: string) {
  const parts = dataUrl.split(',');
  if (parts.length < 2 || !parts[0] || !parts[1]) return;
  const m = parts[0].match(/:(.*?);/);
  const mime = m && m[1] ? m[1] : 'image/png';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  const blob = new Blob([u8arr], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export class PngExporter implements Exporter {
  constructor(private render: RenderSheetToImage) {}

  async export(ctx: ExportContext): Promise<void> {
    const res = await this.render(ctx.sheetId, ctx.widthPx, ctx.heightPx, 'image/png');
    if (!res.dataUrl) throw new Error('Failed to render sheet for PNG export');
    const name = `${ctx.diagramName || 'diagram'} - ${ctx.sheetName || 'sheet'}.png`;
    downloadDataUrl(res.dataUrl, name);
  }
}
