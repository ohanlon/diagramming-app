import React from 'react';
import { useDiagramStore } from '../store/useDiagramStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateLeft, faArrowRotateRight, faCopy, faPaste, faScissors } from '@fortawesome/free-solid-svg-icons';
import './Toolbar.less';
import { Tooltip } from 'react-tooltip';

const Toolbar: React.FC = () => {
  const { undo, redo, history, cutShape, copyShape, pasteShape, activeSheetId, sheets } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];
  const { selectedShapeIds, clipboard } = activeSheet;

  return (
    <div className="toolbar">
      <div className="bordered-button">
        <button onClick={undo} data-tooltip-id="diagram-toolbar-tooltip" data-tooltip-content="Undo" disabled={history.past.length === 0}>
          <FontAwesomeIcon icon={faArrowRotateLeft} />
        </button>
        <button onClick={redo} data-tooltip-id="diagram-toolbar-tooltip" data-tooltip-content="Redo" disabled={history.future.length === 0}>
          <FontAwesomeIcon icon={faArrowRotateRight} />
        </button>
      </div>
      <div className="bordered-button">
        <button onClick={() => cutShape(selectedShapeIds)} data-tooltip-id="diagram-toolbar-tooltip" data-tooltip-content="Cut" disabled={selectedShapeIds.length === 0}>
          <FontAwesomeIcon icon={faScissors} />
        </button>
        <button onClick={() => copyShape(selectedShapeIds)} data-tooltip-id="diagram-toolbar-tooltip" data-tooltip-content="Copy" disabled={selectedShapeIds.length === 0}>
          <FontAwesomeIcon icon={faCopy} />
        </button>
        <button onClick={() => pasteShape()} data-tooltip-id="diagram-toolbar-tooltip" data-tooltip-content="Paste" disabled={!clipboard}>
          <FontAwesomeIcon icon={faPaste} />
        </button>
      </div>
      <Tooltip id="diagram-toolbar-tooltip" />
    </div>
  );
};

export default Toolbar;