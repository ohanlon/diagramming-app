import { render, screen } from '@testing-library/react';
import App from './App';

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
    render(<App />);

    expect(screen.getByTestId('mock-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-shapestore')).toBeInTheDocument();
    expect(screen.getByTestId('mock-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('mock-layerpanel')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sheettabs')).toBeInTheDocument();
    expect(screen.getByTestId('mock-statusbar')).toBeInTheDocument();
  });
});
