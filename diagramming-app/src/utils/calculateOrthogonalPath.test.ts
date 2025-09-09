import { calculateOrthogonalPath } from './calculateOrthogonalPath';
import type { Shape } from '../types';

describe('calculateOrthogonalPath', () => {
  // Define some mock shapes for testing
  const mockShape1: Shape = {
    id: 'shape1',
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    type: 'rectangle',
    text: 'Shape 1',
    color: 'red',
    layerId: 'layer1',
    svgContent: '',
    fontFamily: 'Arial',
  };

  const mockShape2: Shape = {
    id: 'shape2',
    x: 200,
    y: 100,
    width: 100,
    height: 50,
    type: 'rectangle',
    text: 'Shape 2',
    color: 'blue',
    layerId: 'layer1',
    svgContent: '',
    fontFamily: 'Arial',
  };

  test('should calculate a basic orthogonal path between two shapes', () => {
    const allShapes: Shape[] = [mockShape1, mockShape2];
    const result = calculateOrthogonalPath(mockShape1, mockShape2, allShapes);

    expect(result).toBeDefined();
    expect(result.path.length).toBeGreaterThan(0);
    // Add more specific assertions about the path if needed
  });

  // Performance test case (will be expanded)
  test('should calculate path efficiently with many obstacles', () => {
    const numObstacles = 20; // Number of obstacle shapes
    const obstacles: Shape[] = [];
    for (let i = 0; i < numObstacles; i++) {
      obstacles.push({
        id: `obstacle-${i}`,
        x: 50 + (i % 10) * 50,
        y: 50 + Math.floor(i / 10) * 50,
        width: 30,
        height: 30,
        type: 'rectangle',
        text: '',
        color: 'gray',
        layerId: 'layer1',
        svgContent: '',
        fontFamily: 'Arial',
      });
    }

    const sourceShape: Shape = {
      id: 'source',
      x: 0,
      y: 250,
      width: 50,
      height: 50,
      type: 'rectangle',
      text: 'Source',
      color: 'green',
      layerId: 'layer1',
      svgContent: '',
      fontFamily: 'Arial',
    };

    const targetShape: Shape = {
      id: 'target',
      x: 500,
      y: 250,
      width: 50,
      height: 50,
      type: 'rectangle',
      text: 'Target',
      color: 'purple',
      layerId: 'layer1',
      svgContent: '',
      fontFamily: 'Arial',
    };

    const allShapes = [sourceShape, targetShape, ...obstacles];

    const startTime = process.hrtime.bigint();
    const result = calculateOrthogonalPath(sourceShape, targetShape, allShapes);
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    console.log(`Path calculation with ${numObstacles} obstacles took ${durationMs.toFixed(2)} ms`);

    expect(result).toBeDefined();
    expect(result.path.length).toBeGreaterThan(0);
    expect(durationMs).toBeLessThan(500); // Expect it to complete within 500ms
  });
});
