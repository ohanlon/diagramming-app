import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const mockRender = jest.fn();

// Mock ReactDOM
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: mockRender,
  })),
}));

describe('main.tsx', () => {
  test('renders the App component into the root element', () => {
    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);

    // Import main.tsx to trigger its execution
    require('./main.tsx');

    expect(ReactDOM.createRoot).toHaveBeenCalledWith(rootElement);
    expect(mockRender).toHaveBeenCalledWith(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });
});
