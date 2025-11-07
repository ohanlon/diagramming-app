/**
 * Rasterize an SVG element into a canvas and return both the canvas and a data URL.
 * This helper keeps the SVG-to-canvas logic in one place so callers can reuse
 * the canvas for further conversions (e.g., GIF/TIFF encoding) when needed.
 */
export async function rasterizeSvgElement(svgElement: SVGSVGElement, width = 128, height = 98, mimeType = 'image/png', quality?: number): Promise<{ canvas: HTMLCanvasElement; dataUrl: string }> {
  if (!svgElement) return { canvas: document.createElement('canvas'), dataUrl: '' };

  const serializer = new XMLSerializer();
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Ensure width/height in clone so rasterization scales predictably
  const viewBoxAttr = clone.getAttribute('viewBox');
  let vbWidth = 0;
  let vbHeight = 0;
  if (viewBoxAttr) {
    const parts = viewBoxAttr
      .split(/\s+|,/)
      .map(token => Number(token))
      .filter((n): n is number => !Number.isNaN(n));

    if (parts.length === 4) {
      const [, , parsedWidth, parsedHeight] = parts;
      vbWidth = typeof parsedWidth === 'number' ? parsedWidth : vbWidth;
      vbHeight = typeof parsedHeight === 'number' ? parsedHeight : vbHeight;
    }
  }

  // Fallback to element bounding box / client sizes
  if (!vbWidth || !vbHeight) {
    try {
      const rect = svgElement.getBoundingClientRect();
      vbWidth = rect.width || (svgElement.clientWidth || 800);
      vbHeight = rect.height || (svgElement.clientHeight || 600);
    } catch (e) {
      vbWidth = svgElement.clientWidth || 800;
      vbHeight = svgElement.clientHeight || 600;
    }
  }

  // Explicitly set width/height attributes on clone so image loads with correct size
  clone.setAttribute('width', String(vbWidth));
  clone.setAttribute('height', String(vbHeight));

  const svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(clone);
  const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

  const img = new Image();
  img.crossOrigin = 'anonymous';

  const loaded: Promise<void> = new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (err) => reject(err);
  });

  img.src = svgDataUrl;
  await loaded;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.clearRect(0, 0, width, height);

  // Compute scale to fit svg into target while preserving aspect ratio
  const scale = Math.min(width / vbWidth, height / vbHeight);
  const destW = vbWidth * scale;
  const destH = vbHeight * scale;
  const destX = Math.max(0, Math.floor((width - destW) / 2));
  const destY = Math.max(0, Math.floor((height - destH) / 2));

  ctx.drawImage(img, 0, 0, vbWidth, vbHeight, destX, destY, destW, destH);

  let dataUrl: string;
  try {
    if (quality !== undefined) {
      dataUrl = canvas.toDataURL(mimeType, quality);
    } else {
      dataUrl = canvas.toDataURL(mimeType);
    }
  } catch (err) {
    // Some mime types may not be supported by canvas; fall back to PNG
    dataUrl = canvas.toDataURL('image/png');
  }

  return { canvas, dataUrl };
}

/**
 * Backwards-compatible helper that returns a PNG data URL. Prefer using
 * rasterizeSvgElement when you need access to the canvas itself.
 */
export async function generateThumbnailFromSvgElement(svgElement: SVGSVGElement, width = 128, height = 98): Promise<string> {
  try {
    const { dataUrl } = await rasterizeSvgElement(svgElement, width, height, 'image/png');
    return dataUrl;
  } catch (err) {
    console.warn('Thumbnail generation failed', err);
    return '';
  }
}

export async function generateThumbnailFromSvgSelector(selector = 'svg.canvas-svg', width = 128, height = 98): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const svg = document.querySelector(selector) as SVGSVGElement | null;
  if (!svg) return null;
  try {
    const dataUrl = await generateThumbnailFromSvgElement(svg, width, height);
    return dataUrl || null;
  } catch (e) {
    console.warn('Failed to generate thumbnail from selector', e);
    return null;
  }
}
