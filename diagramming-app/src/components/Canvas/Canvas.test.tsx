import { create } from 'zustand';
import { act, render } from '@testing-library/react';
import Canvas from './Canvas';
import { useDiagramStore } from '../../store/useDiagramStore';

// Mock Zustand store
jest.mock('../../store/useDiagramStore', () => {
  const actual = jest.requireActual('../../store/useDiagramStore');
  return {
    ...actual,
    useDiagramStore: jest.fn(),
  };
});

const mockUseDiagramStore = useDiagramStore as jest.MockedFunction<typeof useDiagramStore>;

// Mock useCallback and useEffect since they are heavily used in Canvas.tsx
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useCallback: jest.fn((fn) => fn),
  useEffect: jest.fn((fn) => fn()), // Immediately call useEffect for basic rendering
}));

describe('Canvas', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockUseDiagramStore.mockReturnValue({
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

describe('Canvas - Snapping Feature', () => {
  beforeEach(() => {
    mockUseDiagramStore.mockImplementation(
      create(() => ({
        sheets: {
          'sheet-1': {
            id: 'sheet-1',
            name: 'Sheet 1',
            nodes: {},
            connectors: {},
            zoom: 1,
            pan: { x: 0, y: 0 },
            offset: { x: 0, y: 0 },
            selectedShapeIds: ['shape-1'],
            shapesById: {
              'shape-1': { id: 'shape-1', x: 45, y: 45, width: 10, height: 10 },
            },
            shapeIds: ['shape-1'],
            layers: {
              'layer-1': { id: 'layer-1', name: 'Layer 1', isVisible: true },
            },
            activeLayerId: 'layer-1',
          },
        },
        activeSheetId: 'sheet-1',
        isSnapToGridEnabled: true,
        updateShapePosition: jest.fn(),
        updateShapePositions: jest.fn(),
      }))
    );
  });

  test('snaps shape to grid when snapping is enabled', () => {
    const { getByTestId } = render(<Canvas />);

    // Simulate dragging a shape
    const shape = getByTestId('mock-node');
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 53,
      clientY: 53,
    });
    act(() => {
      document.dispatchEvent(mouseMoveEvent);
    });

    // Verify that the shape position is snapped to the grid
    expect(mockUseDiagramStore().updateShapePosition).toHaveBeenCalledWith('shape-1', 60, 60);
  });

  test('does not snap shape to grid when snapping is disabled', () => {
    mockUseDiagramStore.mockImplementationOnce(
      create(() => ({
        sheets: {
          'sheet-1': {
            id: 'sheet-1',
            name: 'Sheet 1',
            nodes: {},
            connectors: {},
            zoom: 1,
            pan: { x: 0, y: 0 },
            offset: { x: 0, y: 0 },
            selectedShapeIds: ['shape-1'],
            shapesById: {
              'shape-1': { id: 'shape-1', x: 45, y: 45, width: 10, height: 10 },
            },
            shapeIds: ['shape-1'],
            layers: {
              'layer-1': { id: 'layer-1', name: 'Layer 1', isVisible: true },
            },
            activeLayerId: 'layer-1',
          },
        },
        activeSheetId: 'sheet-1',
        isSnapToGridEnabled: false,
        updateShapePosition: jest.fn(),
        updateShapePositions: jest.fn(),
      }))
    );

    const { getByTestId } = render(<Canvas />);

    // Simulate dragging a shape
    const shape = getByTestId('mock-node');
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 53,
      clientY: 53,
    });
    act(() => {
      document.dispatchEvent(mouseMoveEvent);
    });

    // Verify that the shape position is not snapped to the grid
    expect(mockUseDiagramStore().updateShapePosition).toHaveBeenCalledWith('shape-1', 53, 53);
  });
});
