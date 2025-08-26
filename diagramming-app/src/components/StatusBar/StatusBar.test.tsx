import { render, screen, fireEvent } from '@testing-library/react';
import StatusBar from './StatusBar';
import { useDiagramStore } from '../../store/useDiagramStore';

// Mock the useDiagramStore hook
jest.mock('../../store/useDiagramStore', () => ({
  useDiagramStore: jest.fn(),
}));

describe('StatusBar', () => {
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
        },
      },
      activeSheetId: 'sheet-1',
      setZoom: jest.fn(),
      toggleFullscreen: jest.fn(),
    });
  });

  test('renders zoom percentage correctly', () => {
    render(<StatusBar showLayerPanel={false} setShowLayerPanel={jest.fn()} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  test('calls setShowLayerPanel when layer group button is clicked', () => {
    const mockSetShowLayerPanel = jest.fn();
    render(<StatusBar showLayerPanel={false} setShowLayerPanel={mockSetShowLayerPanel} />);
    const layerGroupButton = screen.getByTestId('toggle-layer-panel-button');
    fireEvent.click(layerGroupButton);
    expect(mockSetShowLayerPanel).toHaveBeenCalledWith(true);
  });
});
