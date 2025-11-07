import type { ExportContext, Exporter, RenderSheetToImage } from './Exporter';

export class PptExporter implements Exporter {
  constructor(private render: RenderSheetToImage, private getAllSheetIds: () => string[], private getSheetName: (id: string) => string | undefined, private exportWidthPx: number, private exportHeightPx: number, private setProgress?: (current: number, total: number) => void) {}

  async export(ctx: ExportContext): Promise<void> {
    const sheetIds = this.getAllSheetIds();
    const pptxMod: any = await import('pptxgenjs');
    const PPTXClass = (pptxMod && (pptxMod.default || pptxMod)) as any;
    const pptx = new PPTXClass();
    const total = sheetIds.length;
    const slideWidthInches = 10;
    const slideHeightInches = this.exportWidthPx && this.exportHeightPx ? slideWidthInches * (this.exportHeightPx / this.exportWidthPx) : (10 * (9 / 16));

    for (let i = 0; i < sheetIds.length; i++) {
      const id = sheetIds[i];
      if (!id) continue;
      if (this.setProgress) this.setProgress(i + 1, total);
      const result = await this.render(id, this.exportWidthPx, this.exportHeightPx, 'image/png');
      const png = result.dataUrl;
      const slide = pptx.addSlide();
      if (!png) {
        const name = this.getSheetName(id) || `Sheet ${i + 1}`;
        slide.addText(name, { x: 1, y: 1, fontSize: 24 });
        continue;
      }
      try {
        slide.addImage({ data: png, x: 0, y: 0, w: slideWidthInches, h: slideHeightInches });
      } catch (e) {
        try {
          slide.addImage({ data: png, x: '0%', y: '0%', w: '100%', h: '100%' });
        } catch (e2) {
          const name = this.getSheetName(id) || `Sheet ${i + 1}`;
          slide.addText(name, { x: 1, y: 1, fontSize: 24 });
        }
      }
    }

    const fileName = `${ctx.diagramName || 'diagram'}.pptx`;
    if (typeof pptx.writeFile === 'function') {
      await pptx.writeFile({ fileName });
    } else if (typeof pptx.save === 'function') {
      await pptx.save(fileName);
    } else {
      throw new Error('pptx export API not found');
    }
  }
}
