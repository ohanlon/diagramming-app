import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShapeStore from './ShapeStore';

// Mock catalog.json data
const mockCatalogData = [
  { name: 'AWS', path: '/shapes/aws/index.json' },
  { name: 'Flowchart', path: '/shapes/flowchart/index.json' },
];

// Mock index.json for AWS
const mockAwsIndexData = [
  { id: 'aws-database', name: 'Database', path: '/shapes/aws/database/shapes.json' },
];

// Mock shapes.json for AWS Database
const mockAwsDatabaseShapesData = [
  { id: 'aurora-shape', title: 'Aurora', path: '/public/shapes/aws/database/Aurora.svg', textPosition: 'inside' },
  { id: 'dynamodb-shape', title: 'DynamoDB', path: '/public/shapes/aws/database/DynamoDB.svg', textPosition: 'inside' },
];

// Mock index.json for Flowchart
const mockFlowchartIndexData = [
    { id: 'flowchart-main', name: 'Flowchart', path: '/shapes/flowchart/shapes.json' },
];

// Mock shapes.json data for Flowchart
const mockFlowchartShapesData = [
  { id: 'flowchart-process-shape', title: 'Flowchart Process', path: '/public/shapes/flowchart/process.svg', textPosition: 'inside' },
  { id: 'flowchart-decision-shape', title: 'Flowchart Decision', path: '/public/shapes/flowchart/decision.svg', textPosition: 'inside' },
];

const mockSvgContent = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>';

global.fetch = jest.fn((url) => {
  if (url.toString().endsWith('catalog.json')) {
    return Promise.resolve({
      json: () => Promise.resolve(mockCatalogData),
    });
  } else if (url.toString().endsWith('aws/index.json')) {
    return Promise.resolve({
      json: () => Promise.resolve(mockAwsIndexData),
    });
  } else if (url.toString().endsWith('aws/database/shapes.json')) {
    return Promise.resolve({
      json: () => Promise.resolve(mockAwsDatabaseShapesData),
    });
  } else if (url.toString().endsWith('flowchart/index.json')) {
    return Promise.resolve({
        json: () => Promise.resolve(mockFlowchartIndexData),
    });
  } else if (url.toString().endsWith('flowchart/shapes.json')) {
    return Promise.resolve({
      json: () => Promise.resolve(mockFlowchartShapesData),
    });
  } else if (url.toString().endsWith('.svg')) {
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

  test('renders the search input', async () => {
    render(<ShapeStore />);
    expect(screen.getByLabelText('Search Categories')).toBeInTheDocument();
  });

  test('selects a sub-category and displays its shapes', async () => {
    render(<ShapeStore />);

    const searchInput = screen.getByLabelText('Search Categories');
    fireEvent.click(searchInput);
    fireEvent.change(searchInput, { target: { value: 'data' } });

    const databaseOption = await screen.findByRole('option', { name: 'Database' });
    fireEvent.click(databaseOption);

    expect(await screen.findByText('Database')).toBeInTheDocument();
    // Check for the Aurora shape by its test id
    expect(await screen.findByTestId('aurora-shape')).toBeInTheDocument();

    // Verify that shapes from other categories are not displayed
    expect(screen.queryByTestId('flowchart-process-shape')).not.toBeInTheDocument();
  });

  test('selects another sub-category and displays its shapes', async () => {
    render(<ShapeStore />);

    const searchInput = screen.getByLabelText('Search Categories');
    fireEvent.change(searchInput, { target: { value: 'flow' } });

    const flowchartOption = await screen.findByRole('option', { name: 'Flowchart' });
    fireEvent.click(flowchartOption);

    expect(await screen.findByText('Flowchart')).toBeInTheDocument();
    expect(await screen.findByTestId('flowchart-decision-shape')).toBeInTheDocument();

    // Verify that shapes from other categories are not displayed
    expect(screen.queryByTestId('aurora-shape')).not.toBeInTheDocument();
  });
});


