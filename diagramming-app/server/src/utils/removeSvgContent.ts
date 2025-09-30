export function stripSvgContentFromShapes(shapesById: Record<string, any>) {
  const result: Record<string, any> = {};
  for (const [id, shape] of Object.entries(shapesById || {})) {
    const { svgContent, ...rest } = shape as any;
    result[id] = { ...rest };
  }
  return result;
}
