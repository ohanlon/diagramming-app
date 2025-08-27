import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Mock ReactDOM.createRoot
const mockRender = jest.fn();

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: mockRender,
  })),
}));

describe('main.tsx', () => {
  test('renders the App component into the root element', async () => {
    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);

    // ✅ Use import instead of require
    await import('./main.tsx');

    expect(ReactDOM.createRoot).toHaveBeenCalledWith(rootElement);
    expect(mockRender).toHaveBeenCalledWith(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });
});
