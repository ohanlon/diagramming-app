import { forwardRef } from 'react';
import './ContextMenu.less';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  canCut: boolean;
  canCopy: boolean;
  canPaste: boolean;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>((
  { x, y, onClose, onUndo, onRedo, canUndo, canRedo, onCut, onCopy, onPaste, canCut, canCopy, canPaste, onBringForward, onSendBackward, onBringToFront, onSendToBack },
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
        <li className={!canUndo ? 'disabled' : ''} onClick={canUndo ? () => handleItemClick(onUndo) : undefined}>Undo</li>
        <li className={!canRedo ? 'disabled' : ''} onClick={canRedo ? () => handleItemClick(onRedo) : undefined}>Redo</li>
        <hr />
        <li className={!canCut ? 'disabled' : ''} onClick={canCut ? () => handleItemClick(onCut) : undefined}>Cut</li>
        <li className={!canCopy ? 'disabled' : ''} onClick={canCopy ? () => handleItemClick(onCopy) : undefined}>Copy</li>
        <li className={!canPaste ? 'disabled' : ''} onClick={canPaste ? () => handleItemClick(onPaste) : undefined}>Paste</li>
        <hr />
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