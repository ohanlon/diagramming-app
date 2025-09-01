import { render, screen, fireEvent, act } from '@testing-library/react';
import Toolbar from './Toolbar';
import { useDiagramStore } from '../../store/useDiagramStore';

// Mock the useDiagramStore hook
jest.mock('../../store/useDiagramStore', () => ({
  useDiagramStore: jest.fn(),
}));

interface MockResizeObserverInstance {
  observe: jest.Mock;
  unobserve: jest.Mock;
  disconnect: jest.Mock;
  _callback: (entries: { contentRect: { width: number }; target: Element }[]) => void;
}

describe('Toolbar', () => {
  let mockResizeObserverInstance: MockResizeObserverInstance;
  let mockToolbarElement: HTMLDivElement; // To hold the mocked toolbar element

  beforeEach(() => {
    // Mock clientWidth and getBoundingClientRect for the toolbar element
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 1000, // Set a default width for the toolbar
    });
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        width: 1000,
        height: 50,
        x: 0,
        y: 0,
        top: 0,
        right: 1000,
        bottom: 50,
        left: 0,
        toJSON: () => {},
      }),
    });

    (useDiagramStore as jest.Mock).mockReturnValue({
      undo: jest.fn(),
      redo: jest.fn(),
      setSelectedFont: jest.fn(),
      setSelectedFontSize: jest.fn(),
      cutShape: jest.fn(),
      copyShape: jest.fn(),
      pasteShape: jest.fn(),
      toggleBold: jest.fn(),
      toggleItalic: jest.fn(),
      toggleUnderlined: jest.fn(),
      resetStore: jest.fn(),
      setVerticalAlign: jest.fn(),
      setHorizontalAlign: jest.fn(),
      setSelectedTextColor: jest.fn(),
      history: { past: [], future: [] },
      sheets: {
        'sheet-1': {
          id: 'sheet-1',
          name: 'Sheet 1',
          shapesById: {},
          shapeIds: [],
          connectors: {},
          selectedShapeIds: [],
          layers: {},
          layerIds: [],
          activeLayerId: 'layer-1',
          zoom: 1,
          pan: { x: 0, y: 0 },
          clipboard: null,
          selectedFont: 'Open Sans',
          selectedFontSize: 10,
          selectedTextColor: '#000000',
        },
      },
      activeSheetId: 'sheet-1',
    });

    // Mock ResizeObserver to capture the instance and trigger callback
    global.ResizeObserver = jest.fn().mockImplementation((callback) => {
      mockResizeObserverInstance = {
        observe: jest.fn((element) => {
          mockToolbarElement = element; // Capture the element being observed
        }),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
        _callback: callback,
      };
      return mockResizeObserverInstance;
    });
  });

  // Helper to trigger resize
  const triggerResize = (width: number) => {
    if (mockResizeObserverInstance && mockResizeObserverInstance._callback && mockToolbarElement) {
      act(() => {
        // Manually set the width of the mocked element
        Object.defineProperty(mockToolbarElement, 'clientWidth', { value: width });
        Object.defineProperty(mockToolbarElement, 'getBoundingClientRect', {
          value: () => ({
            width: width,
            height: 50, // Assuming a fixed height
            x: 0, y: 0, top: 0, right: width, bottom: 50, left: 0,
            toJSON: () => {},
          }),
        });

        mockResizeObserverInstance._callback([{
          contentRect: { width },
          target: mockToolbarElement,
        }]);
      });
    }
  };

  test('renders Toolbar with undo, redo, font and font size selector', () => {
    render(<Toolbar />);
    triggerResize(1000); // Simulate a wide enough toolbar

    expect(screen.getByTestId('undo-button')).toBeInTheDocument();
    expect(screen.getByTestId('redo-button')).toBeInTheDocument();
    expect(screen.getByTestId('selectFont')).toBeInTheDocument();
    expect(screen.getByTestId('selectFontSize')).toBeInTheDocument();
  });

  test('undo button is disabled when no past history', () => {
    render(<Toolbar />);
    triggerResize(1000);
    expect(screen.getByTestId('undo-button')).toBeDisabled();
  });

  test('redo button is disabled when no future history', () => {
    render(<Toolbar />);
    triggerResize(1000);
    expect(screen.getByTestId('redo-button')).toBeDisabled();
  });

  test('calls undo when undo button is clicked', () => {
    const { undo } = useDiagramStore();
    (useDiagramStore as jest.Mock).mockReturnValueOnce({
      ...useDiagramStore(),
      history: { past: [{}], future: [] },
    });
    render(<Toolbar />);
    triggerResize(1000);
    fireEvent.click(screen.getByTestId('undo-button'));
    expect(undo).toHaveBeenCalled();
  });

  test('calls redo when redo button is clicked', () => {
    const { redo } = useDiagramStore();
    (useDiagramStore as jest.Mock).mockReturnValueOnce({
      ...useDiagramStore(),
      history: { past: [], future: [{}] },
    });
    render(<Toolbar />);
    triggerResize(1000);
    fireEvent.click(screen.getByTestId('redo-button'));
    expect(redo).toHaveBeenCalled();
  });

  test('calls setSelectedFont when font is changed', () => {
    const { setSelectedFont } = useDiagramStore();
    render(<Toolbar />);
    triggerResize(1000);
    fireEvent.change(screen.getByTestId('selectFont'), {
      target: { value: 'Roboto' },
    });
    expect(setSelectedFont).toHaveBeenCalledWith('Roboto');
  });
});