export async function generateThumbnailFromSvgElement(svgElement: SVGSVGElement, width = 128, height = 98): Promise<string> {
  if (!svgElement) return Promise.resolve('');

  try {
    const serializer = new XMLSerializer();
    const clone = svgElement.cloneNode(true) as SVGSVGElement;

    // Ensure width/height in clone so rasterization scales predictably
    const viewBoxAttr = clone.getAttribute('viewBox');
    let vbWidth = 0;
    let vbHeight = 0;
    if (viewBoxAttr) {
      const parts = viewBoxAttr.split(/\s+|,/).map(Number).filter(n => !Number.isNaN(n));
      if (parts.length === 4) {
        vbWidth = parts[2];
        vbHeight = parts[3];
      }
    }

    // Fallback to element bounding box / client sizes
    if (!vbWidth || !vbHeight) {
      // Use getBoundingClientRect if available
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
    // Avoid tainting the canvas when possible
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

    // Clear canvas with transparent background (or white if preferred)
    ctx.clearRect(0, 0, width, height);

    // Compute scale to fit svg into target while preserving aspect ratio
    const scale = Math.min(width / vbWidth, height / vbHeight);
    const destW = vbWidth * scale;
    const destH = vbHeight * scale;
    const destX = Math.max(0, Math.floor((width - destW) / 2));
    const destY = Math.max(0, Math.floor((height - destH) / 2));

    ctx.drawImage(img, 0, 0, vbWidth, vbHeight, destX, destY, destW, destH);

    // Convert to PNG data URL
    const dataUrl = canvas.toDataURL('image/png');
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
