
import React from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import Node from '../Node/Node';
import Connector from '../Connector/Connector';
import './Print.less';

const Print: React.FC = () => {
  const { sheets, activeSheetId } = useDiagramStore();
  const activeSheet = sheets[activeSheetId];

  if (!activeSheet) {
    return null;
  }

  const { shapesById, shapeIds, connectors, layers } = activeSheet;

  // Get all shapes and connectors from visible layers
  const visibleShapes = shapeIds
    .map(id => shapesById[id])
    .filter(shape => shape && layers[shape.layerId]?.isVisible);

  const visibleConnectors = Object.values(connectors)
    .filter(connector => {
      const startShape = shapesById[connector.startNodeId];
      const endShape = shapesById[connector.endNodeId];
      return startShape && endShape && layers[startShape.layerId]?.isVisible && layers[endShape.layerId]?.isVisible;
    });

  // Calculate the bounding box of all visible elements
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  visibleShapes.forEach(shape => {
    minX = Math.min(minX, shape.x);
    minY = Math.min(minY, shape.y);
    maxX = Math.max(maxX, shape.x + shape.width);
    maxY = Math.max(maxY, shape.y + shape.height);
  });

  const padding = 50;
  const viewBox = `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;

  return (
    <div className="print-container">
      <svg className="print-svg" viewBox={viewBox}>
        {visibleShapes.map(shape => (
          <Node key={shape.id} shape={shape} zoom={1} isInteractive={false} isSelected={false} isConnectorDragTarget={false} onConnectorStart={() => {}} onContextMenu={() => {}} onNodeMouseDown={() => {}} activeLayerId={activeSheet.activeLayerId} layers={activeSheet.layers} />
        ))}
        {visibleConnectors.map(connector => (
          <Connector key={connector.id} connector={connector} isSelected={false} activeLayerId={activeSheet.activeLayerId} layers={activeSheet.layers} />
        ))}
      </svg>
    </div>
  );
};

export default Print;
