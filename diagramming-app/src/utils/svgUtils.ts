// Utility to make SVG IDs unique to prevent conflicts in the DOM
export const makeImageSVGUnique = (svgContent: string, uniqueSuffix: string): string => {
  if (!svgContent || typeof svgContent !== 'string') {
    return svgContent;
  }

  let processedSvg = svgContent;

  // Find all id attributes and make them unique
  processedSvg = processedSvg.replace(/id="([^"]+)"/g, (_, id) => `id="${id}_${uniqueSuffix}"`);

  // Find all references to those IDs and update them
  processedSvg = processedSvg.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${id}_${uniqueSuffix})`);
  processedSvg = processedSvg.replace(/href="#([^"]+)"/g, (_, id) => `href="#${id}_${uniqueSuffix}"`);
  processedSvg = processedSvg.replace(/xlink:href="#([^"]+)"/g, (_, id) => `xlink:href="#${id}_${uniqueSuffix}"`);

  // Handle clip-path references
  processedSvg = processedSvg.replace(/clip-path="url\(#([^)]+)\)"/g, (_, id) => `clip-path="url(#${id}_${uniqueSuffix})"`);

  // Handle mask references
  processedSvg = processedSvg.replace(/mask="url\(#([^)]+)\)"/g, (_, id) => `mask="url(#${id}_${uniqueSuffix})"`);

  // Handle filter references
  processedSvg = processedSvg.replace(/filter="url\(#([^)]+)\)"/g, (_, id) => `filter="url(#${id}_${uniqueSuffix})"`);

  return processedSvg;
};

// Generate a short unique identifier for shapes
export const generateShapeUniqueId = (shapeId: string, index?: number): string => {
  // Use a combination of shape ID and index/timestamp to ensure uniqueness
  const suffix = index !== undefined ? `${index}` : `${Date.now()}`;
  return `${shapeId}_${suffix}`.replace(/[^a-zA-Z0-9_-]/g, '_');
};