import { render, screen, fireEvent } from '@testing-library/react';
import Toolbar from './Toolbar';
import { useDiagramStore } from '../../store/useDiagramStore';

// Mock the useDiagramStore hook
jest.mock('../../store/useDiagramStore', () => ({
  useDiagramStore: jest.fn(),
}));

describe('Toolbar', () => {
  beforeEach(() => {
    // Reset the mock before each test
    (useDiagramStore as jest.Mock).mockReturnValue({
      undo: jest.fn(),
      redo: jest.fn(),
      setSelectedFont: jest.fn(),
      setSelectedFontSize: jest.fn(),
      cutShape: jest.fn(),
      copyShape: jest.fn(),
      pasteShape: jest.fn(),
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
        },
      },
      activeSheetId: 'sheet-1',
    });
  });

  test('renders Toolbar with undo, redo, font and font size selector', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('undo-button')).toBeInTheDocument();
    expect(screen.getByTestId('redo-button')).toBeInTheDocument();
    expect(screen.getByTestId('selectFont')).toBeInTheDocument();
    expect(screen.getByTestId('selectFontSize')).toBeInTheDocument();
  });

  test('undo button is disabled when no past history', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('undo-button')).toBeDisabled();
  });

  test('redo button is disabled when no future history', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('redo-button')).toBeDisabled();
  });

  test('calls undo when undo button is clicked', () => {
    const { undo } = useDiagramStore();
    (useDiagramStore as jest.Mock).mockReturnValueOnce({
      ...useDiagramStore(),
      history: { past: [{}], future: [] },
    });
    render(<Toolbar />);
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
    fireEvent.click(screen.getByTestId('redo-button'));
    expect(redo).toHaveBeenCalled();
  });

  

  test('calls setSelectedFont when font is changed', () => {
    const { setSelectedFont } = useDiagramStore();
    render(<Toolbar />);
    fireEvent.change(screen.getByTestId('selectFont'), {
      target: { value: 'Roboto' },
    });
    expect(setSelectedFont).toHaveBeenCalledWith('Roboto');
  });
});