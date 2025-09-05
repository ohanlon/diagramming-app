import convert from 'color-convert';

export const hexToRgb = (hex: string): [number, number, number] => {
  return convert.hex.rgb(hex);
};

export const findClosestColor = (targetColor: string, colorPalette: string[]): string => {
  const targetRgb = hexToRgb(targetColor);

  let closestColor = colorPalette[0];
  let minDistance = Infinity;

  for (const color of colorPalette) {
    const rgb = hexToRgb(color);
    const distance = Math.sqrt(
      Math.pow(targetRgb[0] - rgb[0], 2) +
      Math.pow(targetRgb[1] - rgb[1], 2) +
      Math.pow(targetRgb[2] - rgb[2], 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }

  return closestColor;
};