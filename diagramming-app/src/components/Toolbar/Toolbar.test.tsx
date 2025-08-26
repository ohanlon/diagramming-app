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
      history: { past: [], future: [] },
      cutShape: jest.fn(),
      copyShape: jest.fn(),
      pasteShape: jest.fn(),
      activeSheetId: 'sheet-1',
      sheets: {
        'sheet-1': {
          id: 'sheet-1',
          name: 'Sheet 1',
          selectedShapeIds: [],
          clipboard: null,
        },
      },
      selectedFont: 'Open Sans',
      setSelectedFont: jest.fn(),
    });
  });

  test('renders Toolbar with undo, redo, cut, copy, paste buttons and font selector', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('undo-button')).toBeInTheDocument();
    expect(screen.getByTestId('redo-button')).toBeInTheDocument();
    expect(screen.getByTestId('cut-button')).toBeInTheDocument();
    expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    expect(screen.getByTestId('paste-button')).toBeInTheDocument();
    expect(screen.getByTestId('selectFont')).toBeInTheDocument();
  });

  test('undo button is disabled when no past history', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('undo-button')).toBeDisabled();
  });

  test('redo button is disabled when no future history', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('redo-button')).toBeDisabled();
  });

  test('cut and copy buttons are disabled when no shape is selected', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('cut-button')).toBeDisabled();
    expect(screen.getByTestId('copy-button')).toBeDisabled();
  });

  test('paste button is disabled when clipboard is empty', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('paste-button')).toBeDisabled();
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

  test('calls setSelectedFont when font is changed', () => {
    const { setSelectedFont } = useDiagramStore();
    render(<Toolbar />);
    fireEvent.change(screen.getByTestId('selectFont'), {
      target: { value: 'Roboto' },
    });
    expect(setSelectedFont).toHaveBeenCalledWith('Roboto');
  });
});
