import React from 'react';
import { useDiagramStore } from '../store/useDiagramStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateLeft, faArrowRotateRight } from '@fortawesome/free-solid-svg-icons';
import './Toolbar.less';

const Toolbar: React.FC = () => {
  const { setZoom, undo, redo, history } = useDiagramStore();


  const handleResetZoom = () => {
    setZoom(1);
  };

  return (
    <div className="toolbar">
      <button onClick={undo} disabled={history.past.length === 0}>
        <FontAwesomeIcon icon={faArrowRotateLeft} />
      </button>
      <button onClick={redo} disabled={history.future.length === 0}>
        <FontAwesomeIcon icon={faArrowRotateRight} />
      </button>
      <button onClick={handleResetZoom}>Reset</button>
    </div>
  );
};

export default Toolbar;