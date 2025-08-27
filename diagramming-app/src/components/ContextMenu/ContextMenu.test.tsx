import { render, screen, fireEvent } from '@testing-library/react';
import ContextMenu from './ContextMenu';

describe('ContextMenu', () => {
  const defaultProps = {
    x: 0,
    y: 0,
    onClose: jest.fn(),
    onBringForward: jest.fn(),
    onSendBackward: jest.fn(),
    onBringToFront: jest.fn(),
    onSendToBack: jest.fn(),
  };

  

  test('calls onBringForward and onClose when "Bring Forward" is clicked', () => {
    render(<ContextMenu {...defaultProps} />);
    fireEvent.click(screen.getByText(/Bring Forward/i));
    expect(defaultProps.onBringForward).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test('calls onSendBackward and onClose when "Send Backward" is clicked', () => {
    render(<ContextMenu {...defaultProps} />);
    fireEvent.click(screen.getByText(/Send Backward/i));
    expect(defaultProps.onSendBackward).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test('calls onBringToFront and onClose when "Bring to Front" is clicked', () => {
    render(<ContextMenu {...defaultProps} />);
    fireEvent.click(screen.getByText(/Bring to Front/i));
    expect(defaultProps.onBringToFront).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test('calls onSendToBack and onClose when "Send to Back" is clicked', () => {
    render(<ContextMenu {...defaultProps} />);
    fireEvent.click(screen.getByText(/Send to Back/i));
    expect(defaultProps.onSendToBack).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
