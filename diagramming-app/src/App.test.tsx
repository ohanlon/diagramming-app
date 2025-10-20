import { render, screen } from '@testing-library/react';
import App from './App';
import { customHistory } from './customHistory';

// Provide a minimal global.fetch implementation so background hooks don't
// throw in the test environment.
(global as any).fetch = (url: any, opts?: any) => Promise.resolve({ ok: true, json: async () => ({}) });

// Mock cookie utility so App's session hydration completes synchronously
jest.mock('./utils/userCookie', () => ({
  getCurrentUserFromCookie: () => ({ id: 'user-1', username: 'me@example.com' }),
}));

// Mock child components
jest.mock('./components/Toolbar/Toolbar', () => {
  return jest.fn(() => <div data-testid="mock-toolbar" />);
});
jest.mock('./components/ShapeStore/ShapeStore', () => {
  return jest.fn(() => <div data-testid="mock-shapestore" />);
});
jest.mock('./components/Canvas/Canvas', () => {
  return jest.fn(() => <div data-testid="mock-canvas" />);
});
jest.mock('./components/LayerPanel/LayerPanel', () => {
  return jest.fn(() => <div data-testid="mock-layerpanel" />);
});
jest.mock('./components/SheetTabs/SheetTabs', () => {
  return jest.fn(() => <div data-testid="mock-sheettabs" />);
});
jest.mock('./components/StatusBar/StatusBar', () => {
  return jest.fn(() => <div data-testid="mock-statusbar" />);
});

describe('App', () => {
  test('renders App component and its child components', () => {
    // Navigate to a diagram route so the MainAppLayout mounts and renders
    // the toolbar/canvas/layerpanel components we assert on.
    customHistory.push('/diagram/test-diagram-id');
    render(<App />);

    expect(screen.getByTestId('mock-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-shapestore')).toBeInTheDocument();
    expect(screen.getByTestId('mock-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('mock-layerpanel')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sheettabs')).toBeInTheDocument();
    expect(screen.getByTestId('mock-statusbar')).toBeInTheDocument();
  });
});
