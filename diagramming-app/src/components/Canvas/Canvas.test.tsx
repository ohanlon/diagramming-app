import { render, screen } from '@testing-library/react';
import Canvas from './Canvas';
import { useDiagramStore } from '../../store/useDiagramStore';

// Mock the useDiagramStore hook
jest.mock('../../store/useDiagramStore', () => ({
  useDiagramStore: jest.fn(),
}));

// Mock useCallback and useEffect since they are heavily used in Canvas.tsx
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useCallback: jest.fn((fn) => fn),
  useEffect: jest.fn((fn) => fn()), // Immediately call useEffect for basic rendering
}));

// Mock Node and ConnectorComponent to simplify testing Canvas
// jest.mock('./Node', () => {
//   return jest.fn(() => <g data-testid="mock-node" />);
// });
// jest.mock('./Connector', () => {
//   return jest.fn(() => <g data-testid="mock-connector" />);
// });
// jest.mock('./ContextMenu', () => {
//   return jest.fn(() => <div data-testid="mock-context-menu" />);
// });

describe('Canvas', () => {
  beforeEach(() => {
    // Reset the mock before each test
    (useDiagramStore as jest.Mock).mockReturnValue({
      sheets: {
        'sheet-1': {
          id: 'sheet-1',
          name: 'Sheet 1',
          nodes: {},
          connectors: {},
          zoom: 1,
          pan: { x: 0, y: 0 },
          offset: { x: 0, y: 0 },
          selectedShapeIds: [],
          shapesById: {},
          shapeIds: [],
          layers: {
            'layer-1': { id: 'layer-1', name: 'Layer 1', isVisible: true },
          },
          activeLayerId: 'layer-1',
        },
      },
      activeSheetId: 'sheet-1',
      addShape: jest.fn(),
      addConnector: jest.fn(),
      setPan: jest.fn(),
      setZoom: jest.fn(),
      setSelectedShapes: jest.fn(),
      toggleShapeSelection: jest.fn(),
      bringForward: jest.fn(),
      sendBackward: jest.fn(),
      bringToFront: jest.fn(),
      sendToBack: jest.fn(),
      updateShapePosition: jest.fn(),
      updateShapePositions: jest.fn(),
      recordShapeMoves: jest.fn(),
    });
  });

  test('renders Canvas component', () => {
    render(<Canvas />);
  });

});
