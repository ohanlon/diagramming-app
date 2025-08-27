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
      setZoom: jest.fn(),
      activeSheet: { zoom: 1 },
      selectedFont: 'Open Sans',
      setSelectedFont: jest.fn(),
      history: { past: [], future: [] },
    });
  });

  test('renders Toolbar with undo, redo, zoom, and font selector', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('undo-button')).toBeInTheDocument();
    expect(screen.getByTestId('redo-button')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-in-button')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-out-button')).toBeInTheDocument();
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

  test('calls setZoom when zoom in button is clicked', () => {
    const { setZoom } = useDiagramStore();
    render(<Toolbar />);
    fireEvent.click(screen.getByTestId('zoom-in-button'));
    expect(setZoom).toHaveBeenCalledWith(1.1);
  });

  test('calls setZoom when zoom out button is clicked', () => {
    const { setZoom } = useDiagramStore();
    render(<Toolbar />);
    fireEvent.click(screen.getByTestId('zoom-out-button'));
    expect(setZoom).toHaveBeenCalledWith(1 / 1.1);
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