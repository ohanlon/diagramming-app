export function stripSvgContentFromShapes(shapesById: Record<string, any>) {
  const result: Record<string, any> = {};
  for (const [id, shape] of Object.entries(shapesById || {})) {
    // If the shape references an external 'path' (catalog shape), we can safely strip
    // svgContent because the client can re-fetch and reapply the original SVG when rendering.
    // However, if the shape has no 'path' (custom/inline SVG), preserve its svgContent
    // so it can be displayed after loading from the server.
    if (shape && (shape as any).path) {
      const { svgContent, ...rest } = shape as any;
      result[id] = { ...rest };
    } else {
      // Preserve svgContent for inline/custom shapes
      result[id] = { ...(shape as any) };
    }
  }
  return result;
}
