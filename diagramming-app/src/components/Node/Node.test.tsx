import { render, screen } from '@testing-library/react';
import Node from './Node';
import { useDiagramStore } from '../../store/useDiagramStore';

// Mock the useDiagramStore hook
jest.mock('../../store/useDiagramStore', () => ({
  useDiagramStore: jest.fn(),
}));

// Mock useCallback since it's used in Node.tsx
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useCallback: jest.fn((fn) => fn),
}));

describe('Node', () => {
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
          offset: { x: 0, y: 0 },
          selectedShapeIds: [],
          shapesById: {},
        },
      },
      activeSheetId: 'sheet-1',
      updateShapeDimensions: jest.fn(),
      updateShapeDimensionsMultiple: jest.fn(),
      recordShapeResize: jest.fn(),
      recordShapeResizeMultiple: jest.fn(),
      updateShapeText: jest.fn(),
      toggleShapeSelection: jest.fn(),
      setSelectedShapes: jest.fn(),
    });
  });

  const defaultShape = {
    id: 'node-1',
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    text: 'Test Node',
    color: 'red',
    svgContent: '',
    fontFamily: 'Arial',
  };

  

  test('renders node without text if not provided', () => {
    const shapeWithoutText = { ...defaultShape, text: '' };
    render(
      <svg>
        <Node
          shape={shapeWithoutText}
          zoom={1}
          isInteractive={true}
          isSelected={false}
          onConnectorStart={jest.fn()}
          onContextMenu={jest.fn()}
        />
      </svg>
    );
    expect(screen.queryByText(/Test Node/i)).not.toBeInTheDocument();
  });
});
