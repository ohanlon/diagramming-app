import React from 'react';
import { useDiagramStore } from '../store/useDiagramStore';
import './Toolbar.less';

const Toolbar: React.FC = () => {
  const { setZoom } = useDiagramStore();


  const handleResetZoom = () => {
    setZoom(1);
  };

  return (
    <div className="toolbar">
      <button onClick={handleResetZoom}>Reset</button>
    </div>
  );
};

export default Toolbar;