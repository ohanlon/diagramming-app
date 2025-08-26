import { render, screen, fireEvent } from '@testing-library/react';
import LayerPanel from './LayerPanel';
import { useDiagramStore } from '../../store/useDiagramStore';

// Mock the useDiagramStore hook
jest.mock('../../store/useDiagramStore', () => ({
  useDiagramStore: jest.fn(),
}));

// Mock useCallback since it's used in LayerPanel.tsx
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useCallback: jest.fn((fn) => fn),
}));

describe('LayerPanel', () => {
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
          layers: {
            'layer-1': { id: 'layer-1', name: 'Layer 1', isVisible: true },
          },
          layerIds: ['layer-1'],
          activeLayerId: 'layer-1',
        },
      },
      activeSheetId: 'sheet-1',
      setActiveLayer: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      renameLayer: jest.fn(),
      toggleLayerVisibility: jest.fn(),
    });
  });

  test('renders LayerPanel and Add Layer button', () => {
    render(<LayerPanel showLayerPanel={true} setShowLayerPanel={jest.fn()} />);
    expect(screen.getByTestId('close-layer-panel-button')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Layer/i })).toBeInTheDocument();
  });

  test('calls setShowLayerPanel when close button is clicked', () => {
    const mockSetShowLayerPanel = jest.fn();
    render(<LayerPanel showLayerPanel={true} setShowLayerPanel={mockSetShowLayerPanel} />);
    fireEvent.click(screen.getByTestId('close-layer-panel-button'));
    expect(mockSetShowLayerPanel).toHaveBeenCalledWith(false);
  });

  test('renders existing layers', () => {
    render(<LayerPanel showLayerPanel={true} setShowLayerPanel={jest.fn()} />);
    expect(screen.getByText('Layer 1')).toBeInTheDocument();
  });

  test('calls addLayer when Add Layer button is clicked', () => {
    const { addLayer } = useDiagramStore();
    render(<LayerPanel showLayerPanel={true} setShowLayerPanel={jest.fn()} />);
    fireEvent.click(screen.getByTestId('add-layer-button'));
    expect(addLayer).toHaveBeenCalled();
  });
});
