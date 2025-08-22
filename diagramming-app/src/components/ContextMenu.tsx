import { forwardRef } from 'react';
import './ContextMenu.less';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>((
  { x, y, onClose, onBringForward, onSendBackward, onBringToFront, onSendToBack },
  ref
) => {
  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{ top: y, left: x }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ul>
        <li className="submenu-container">
          Arrange
          <ul className="submenu">
            <li onClick={() => handleItemClick(onBringForward)}>Bring Forward</li>
            <li onClick={() => handleItemClick(onSendBackward)}>Send Backward</li>
            <li onClick={() => handleItemClick(onBringToFront)}>Bring to Front</li>
            <li onClick={() => handleItemClick(onSendToBack)}>Send to Back</li>
          </ul>
        </li>
      </ul>
    </div>
  );
});

export default ContextMenu;