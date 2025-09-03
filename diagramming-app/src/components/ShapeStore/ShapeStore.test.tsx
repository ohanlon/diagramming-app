import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ShapeStore from './ShapeStore';

// Mock data
const mockCatalogData = [
  { id: 'aws', name: 'AWS', path: '/shapes/aws/index.json' },
  { id: 'flowchart', name: 'Flowchart', path: '/shapes/flowchart/index.json' },
];

const mockAwsIndexData = [
  { id: 'aws-db', name: 'AWS Database', path: '/shapes/aws/database/shapes.json', shapes: [] },
];

const mockAwsDbShapesData = [
  { id: 'd9e5373f-8f8f-4c6d-8b8b-3b3b3b3b3b3b', title: 'Aurora', path: '/shapes/aws/database/Aurora.svg', textPosition: 'inside' },
];

const mockFlowchartIndexData = [
    { id: 'flowchart-main', name: 'Flowchart', path: '/shapes/flowchart/shapes.json', shapes: [] },
];

const mockFlowchartShapesData = [
  { id: 'a4b2a2b2-4a2b-4b2b-8b2b-2b2b2b2b2b2b', title: 'Decision', path: '/shapes/flowchart/decision.svg', textPosition: 'inside' },
];

const mockSvgContent = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>';

global.fetch = jest.fn((url) => {
    if (typeof url !== 'string') {
        return Promise.reject(new Error('url must be a string'));
    }
    if (url.endsWith('/shapes/catalog.json')) {
        return Promise.resolve({ json: () => Promise.resolve(mockCatalogData) });
    }
    if (url.endsWith('/shapes/aws/index.json')) {
        return Promise.resolve({ json: () => Promise.resolve(mockAwsIndexData) });
    }
    if (url.endsWith('/shapes/aws/database/shapes.json')) {
        return Promise.resolve({ json: () => Promise.resolve(mockAwsDbShapesData) });
    }
    if (url.endsWith('/shapes/flowchart/index.json')) {
        return Promise.resolve({ json: () => Promise.resolve(mockFlowchartIndexData) });
    }
    if (url.endsWith('/shapes/flowchart/shapes.json')) {
        return Promise.resolve({ json: () => Promise.resolve(mockFlowchartShapesData) });
    }
    if (url.endsWith('.svg')) {
        return Promise.resolve({ text: () => Promise.resolve(mockSvgContent) });
    }
    return Promise.reject(new Error(`unknown url: ${url}`));
});


describe('ShapeStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search input and filters categories', async () => {
    render(<ShapeStore />);

    await waitFor(() => {
      expect(screen.getByLabelText('Search Categories')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search Categories');
    fireEvent.change(searchInput, { target: { value: 'data' } });

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(1);
      expect(options[0].textContent).toBe('AWS Database');
    });
  });

  test('selects a category and displays its shapes', async () => {
    render(<ShapeStore />);

    await waitFor(() => {
        expect(screen.getByLabelText('Search Categories')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search Categories');
    fireEvent.change(searchInput, { target: { value: 'data' } });

    const option = await screen.findByRole('option', { name: 'AWS Database' });
    fireEvent.click(option);

    await waitFor(() => {
      expect(screen.getByText('AWS Database')).toBeInTheDocument();
      expect(screen.getByTestId('d9e5373f-8f8f-4c6d-8b8b-3b3b3b3b3b3b')).toBeInTheDocument();
    });
  });
});