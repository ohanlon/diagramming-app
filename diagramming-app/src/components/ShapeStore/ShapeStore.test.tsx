import { render, screen, waitFor } from '@testing-library/react';
import ShapeStore from './ShapeStore';

// Mock fetch API
const mockShapesData = [
  { title: 'Aurora', path: '/shapes/aws/database/aurora.svg' },
  { title: 'DynamoDB', path: '/shapes/aws/database/dynamodb.svg' },
];

const mockSvgContent = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>';

global.fetch = jest.fn((url) => {
  if (url.endsWith('shapes.json')) {
    return Promise.resolve({
      json: () => Promise.resolve(mockShapesData),
    });
  } else if (url.endsWith('.svg')) {
    return Promise.resolve({
      text: () => Promise.resolve(mockSvgContent),
    });
  }
  return Promise.reject(new Error('unknown url'));
});

describe('ShapeStore', () => {
  test('renders category title and shapes', async () => {
    render(<ShapeStore />);

    await waitFor(() => {
      expect(screen.getByText('AWS Database')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('DynamoDB')).toBeInTheDocument();
    });

  });
});
