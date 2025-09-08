import { render, screen, fireEvent, act } from '@testing-library/react';
import ShapeStore from './ShapeStore';

// Mock catalog.json data
const mockCatalogData = [
  { id: '4c6dfc72-644f-4e1d-8dda-cfb3cfc59560', name: 'AWS', path: '/shapes/aws/index.json' },
  { id: '1a529804-75b0-4f7b-99dd-2dcf95eb6695', name: 'Flowchart', path: '/shapes/architecture/index.json' },
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
  } else if (url.toString().endsWith('architecture/index.json')) { // Updated path for flowchart
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
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock = {};
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => localStorageMock[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        clear: jest.fn(() => {
          localStorageMock = {};
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up the mock after each test
    Object.defineProperty(global, 'localStorage', {
      value: undefined,
      writable: true,
    });
  });

  test('renders the search input and initially no categories are visible', async () => {
    await act(async () => {
      render(<ShapeStore />);
      await Promise.resolve(); // Flushes microtasks
      await Promise.resolve(); // Flushes microtasks again, just in case
    });
    expect(screen.getByLabelText('Search Categories')).toBeInTheDocument();
    // Initially, no categories should be visible unless pre-pinned in localStorage
    expect(screen.queryByText('Database')).not.toBeInTheDocument();
    expect(screen.queryByText('Flowchart')).not.toBeInTheDocument();
  });

  test('selects a category from search, pins it, and displays its shapes in an accordion', async () => {
    await act(async () => {
      render(<ShapeStore />);
      await Promise.resolve(); // Flushes microtasks
      await Promise.resolve(); // Flushes microtasks again, just in case
    });

    const searchInput = screen.getByLabelText('Search Categories');
    fireEvent.click(searchInput);
    fireEvent.change(searchInput, { target: { value: 'data' } });

    const databaseOption = await screen.findByRole('option', { name: 'Database' });
    await act(async () => {
      fireEvent.click(databaseOption);
    });
    await act(async () => {}); // Flush any pending effects

    // Verify category is now visible as an accordion
    const databaseAccordionSummary = await screen.findByText('Database');
    expect(databaseAccordionSummary).toBeInTheDocument();

    // Verify it's initially pinned (as it was added via search)
    const pinIcon = databaseAccordionSummary.closest('.MuiAccordionSummary-root')?.querySelector('[data-testid="PushPinIcon"]');
    expect(pinIcon).toBeInTheDocument();

    // Expand the accordion to see shapes
    await act(async () => {
      fireEvent.click(databaseAccordionSummary);
    });

    // Check for the Aurora shape by its test id
    expect(await screen.findByTestId('aurora-shape')).toBeInTheDocument();

    // Verify that shapes from other categories are not displayed
    expect(screen.queryByTestId('flowchart-process-shape')).not.toBeInTheDocument();

    // Verify localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('pinnedShapeCategoryIds', JSON.stringify(['aws-database']));
  });

  test('unpinning a category changes its icon but keeps it visible', async () => {
    localStorage.getItem = jest.fn((key: string) => {
      if (key === 'pinnedShapeCategoryIds') return JSON.stringify(['aws-database']);
      return null;
    });

    await act(async () => {
      render(<ShapeStore />);
      await Promise.resolve(); // Flushes microtasks
      await Promise.resolve(); // Flushes microtasks again, just in case
    });

    const databaseAccordionSummary = await screen.findByText('Database');
    expect(databaseAccordionSummary).toBeInTheDocument();

    // Clear setItem calls after initial render to only track subsequent calls
    (localStorage.setItem as jest.Mock).mockClear();

    // Verify it's initially pinned
    const pinIcon = databaseAccordionSummary.closest('.MuiAccordionSummary-root')?.querySelector('[data-testid="PushPinIcon"]');
    expect(pinIcon).toBeInTheDocument();

    // Click the pin icon to unpin
    const pinIconButton = pinIcon?.closest('button');
    expect(pinIconButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(pinIconButton!);
    });
    await act(async () => {}); // Flush any pending effects

    // Verify it's now unpinned (icon changed)
    const unpinIcon = databaseAccordionSummary.closest('.MuiAccordionSummary-root')?.querySelector('[data-testid="PushPinOutlinedIcon"]');
    expect(unpinIcon).toBeInTheDocument();
    expect(pinIcon).not.toBeInTheDocument(); // Old pin icon should be gone

    // Verify category is still visible
    expect(databaseAccordionSummary).toBeInTheDocument();

    // Verify localStorage was updated to remove the pinned ID
    expect(localStorage.setItem).toHaveBeenCalledWith('pinnedShapeCategoryIds', JSON.stringify([]));
  });

  test('removing a category hides it from view but does not unpin it', async () => {
    localStorage.getItem = jest.fn((key: string) => {
      if (key === 'pinnedShapeCategoryIds') return JSON.stringify(['aws-database']);
      return null;
    });

    await act(async () => {
      render(<ShapeStore />);
      await Promise.resolve(); // Flushes microtasks
      await Promise.resolve(); // Flushes microtasks again, just in case
    });

    // Clear setItem calls after initial render to only track subsequent calls
    (localStorage.setItem as jest.Mock).mockClear();

    const databaseAccordionSummary = await screen.findByText('Database');
    expect(databaseAccordionSummary).toBeInTheDocument();

    // Click the close icon to remove
    const closeIcon = databaseAccordionSummary.closest('.MuiAccordionSummary-root')?.querySelector('[data-testid="CloseIcon"]');
    expect(closeIcon).toBeInTheDocument();

    const closeIconButton = closeIcon?.closest('button');
    expect(closeIconButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(closeIconButton!);
    });

    // Verify category is no longer visible
    expect(screen.queryByText('Database')).not.toBeInTheDocument();

    // Verify localStorage.setItem was NOT called at all after the remove operation
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  test('categories pinned in localStorage are visible on initial render', async () => {
    localStorage.getItem = jest.fn((key: string) => {
      if (key === 'pinnedShapeCategoryIds') return JSON.stringify(['aws-database', 'flowchart-main']);
      return null;
    });

    await act(async () => {
      render(<ShapeStore />);
      await Promise.resolve(); // Flushes microtasks
      await Promise.resolve(); // Flushes microtasks again, just in case
    });

    // Verify both categories are visible and pinned
    const databaseAccordionSummary = await screen.findByText('Database');
    expect(databaseAccordionSummary).toBeInTheDocument();
    expect(databaseAccordionSummary.closest('.MuiAccordionSummary-root')?.querySelector('[data-testid="PushPinIcon"]')).toBeInTheDocument();

    const flowchartAccordionSummary = await screen.findByText('Flowchart');
    expect(flowchartAccordionSummary).toBeInTheDocument();
    expect(flowchartAccordionSummary.closest('.MuiAccordionSummary-root')?.querySelector('[data-testid="PushPinIcon"]')).toBeInTheDocument();

    // Expand one and check shapes
    await act(async () => {
      fireEvent.click(databaseAccordionSummary);
    });
    expect(await screen.findByTestId('aurora-shape')).toBeInTheDocument();
  });
});
