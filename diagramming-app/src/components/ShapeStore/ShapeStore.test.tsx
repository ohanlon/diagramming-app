import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ShapeStore from './ShapeStore';

// Mock catalog.json data
const mockCatalogData = [
  { name: 'AWS', path: 'aws/shapes.json' },
  { name: 'Flowchart', path: 'flowchart/shapes.json' },
];

// Mock shapes.json data for AWS (public/shapes/aws/shapes.json)
const mockAwsShapesData = [
  { title: 'Aurora', path: '/public/shapes/aws/database/Aurora.svg', textPosition: 'inside' },
  { title: 'DynamoDB', path: '/public/shapes/aws/database/DynamoDB.svg', textPosition: 'inside' },
];

// Mock shapes.json data for Flowchart (public/shapes/flowchart/shapes.json)
const mockFlowchartShapesData = [
  { title: 'Flowchart Process', path: '/public/shapes/flowchart/process.svg', textPosition: 'inside' },
  { title: 'Flowchart Decision', path: '/public/shapes/flowchart/decision.svg', textPosition: 'inside' },
];

const mockSvgContent = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>';

global.fetch = jest.fn((url) => {
  if (url.endsWith('catalog.json')) {
    return Promise.resolve({
      json: () => Promise.resolve(mockCatalogData),
    });
  } else if (url.endsWith('aws/shapes.json')) {
    return Promise.resolve({
      json: () => Promise.resolve(mockAwsShapesData),
    });
  } else if (url.endsWith('flowchart/shapes.json')) {
    return Promise.resolve({
      json: () => Promise.resolve(mockFlowchartShapesData),
    });
  } else if (url.endsWith('.svg')) {
    return Promise.resolve({
      text: () => Promise.resolve(mockSvgContent),
    });
  }
  return Promise.reject(new Error(`unknown url: ${url}`));
});

describe('ShapeStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search input and filters categories', async () => {
    render(<ShapeStore />);

    // Wait for catalog and top-level shapes to load
    await waitFor(() => {
      expect(screen.getByLabelText('Search Shapes')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search Shapes');
    fireEvent.change(searchInput, { target: { value: 'aurora' } });

    await waitFor(() => {
      const options = screen.queryAllByRole('option');
      const visibleOptions = options.filter(option => option.textContent && option.textContent.toLowerCase().includes('aurora'));
      expect(visibleOptions.length).toBe(1);
      expect(visibleOptions.some(option => option.textContent === 'Aurora')).toBe(true);
      expect(visibleOptions.some(option => option.textContent === 'Flowchart Process')).toBe(false);
    });

    fireEvent.change(searchInput, { target: { value: 'flowchart' } });

    await waitFor(() => {
      const options = screen.queryAllByRole('option');
      const visibleOptions = options.filter(option => option.textContent && option.textContent.toLowerCase().includes('flowchart'));
      expect(visibleOptions.length).toBe(2);
      expect(visibleOptions.some(option => option.textContent === 'Flowchart Process')).toBe(true);
      expect(visibleOptions.some(option => option.textContent === 'Flowchart Decision')).toBe(true);
      expect(visibleOptions.some(option => option.textContent === 'Aurora')).toBe(false);
    });
  });

  test('selects a sub-category and displays its shapes', async () => {
    render(<ShapeStore />);

    const searchInput = screen.getByLabelText('Search Shapes');
    fireEvent.click(searchInput); // Click to open dropdown
    fireEvent.change(searchInput, { target: { value: 'aurora' } });

    const auroraOption = await screen.findByRole('option', { name: 'Aurora' });
    fireEvent.click(auroraOption);

    await waitFor(() => {
      expect(screen.getByText('Aurora')).toBeInTheDocument();
      expect(screen.getByTestId('6dd2a02e-95f1-4867-90f3-cdb197e33979')).toBeInTheDocument();
    });

    // Verify that shapes from other categories are not displayed
    expect(screen.queryByTestId('5add9643-63b1-4d80-a880-96ff7545c63c')).not.toBeInTheDocument();
  });

  test('selects another sub-category and displays its shapes', async () => {
    render(<ShapeStore />);

    const searchInput = screen.getByLabelText('Search Shapes');
    fireEvent.change(searchInput, { target: { value: 'decision' } });

    await waitFor(() => {
      fireEvent.click(screen.getByRole('option', { name: 'Flowchart Decision' }));
    });

    await waitFor(() => {
      expect(screen.getByText('Flowchart Decision')).toBeInTheDocument();
      expect(screen.getByTestId('1d458151-0088-4667-bc0d-eb2f42fcd453')).toBeInTheDocument();
    });

    // Verify that shapes from other categories are not displayed
    expect(screen.queryByTestId('Aurora')).not.toBeInTheDocument();
  });
});
