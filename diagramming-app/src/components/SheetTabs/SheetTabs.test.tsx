import { render, screen, fireEvent } from '@testing-library/react';
import SheetTabs from './SheetTabs';
import { useDiagramStore } from '../../store/useDiagramStore';

// Mock the useDiagramStore hook
jest.mock('../../store/useDiagramStore', () => ({
  useDiagramStore: jest.fn(),
}));

describe('SheetTabs', () => {
  beforeEach(() => {
    // Reset the mock before each test
    (useDiagramStore as jest.Mock).mockReturnValue({
      sheets: {
        'sheet-1': { id: 'sheet-1', name: 'Sheet 1' },
        'sheet-2': { id: 'sheet-2', name: 'Sheet 2' },
      },
      activeSheetId: 'sheet-1',
      addSheet: jest.fn(),
      removeSheet: jest.fn(),
      setActiveSheet: jest.fn(),
      renameSheet: jest.fn(),
    });
  });

  test('renders SheetTabs and Add New Sheet button', () => {
    render(<SheetTabs />);
    expect(screen.getByText(/Sheet 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Sheet 2/i)).toBeInTheDocument();
  });

  test('calls addSheet when Add New Sheet button is clicked', () => {
    const { addSheet } = useDiagramStore();
    render(<SheetTabs />);
    fireEvent.click(screen.getByTestId('add-sheet-button'));
    expect(addSheet).toHaveBeenCalled();
  });

  test('calls setActiveSheet when a sheet tab is clicked', () => {
    const { setActiveSheet } = useDiagramStore();
    render(<SheetTabs />);
    fireEvent.click(screen.getByText(/Sheet 2/i));
    expect(setActiveSheet).toHaveBeenCalledWith('sheet-2');
  });

});
