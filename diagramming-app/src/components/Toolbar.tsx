import React from 'react';
import { useDiagramStore } from '../store/useDiagramStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateLeft, faArrowRotateRight } from '@fortawesome/free-solid-svg-icons';
import './Toolbar.less';
import { Tooltip } from 'react-tooltip';

const Toolbar: React.FC = () => {
  const { undo, redo, history } = useDiagramStore();

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
      <Tooltip id="diagram-toolbar-tooltip" />
    </div>
  );
};

export default Toolbar;