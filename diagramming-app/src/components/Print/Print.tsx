
import React from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import Node from '../Node/Node';
import Connector from '../Connector/Connector';
import type { Shape } from '../../types';
import './Print.less';

interface PrintProps {
  /** If provided, Print will render this specific sheet instead of the store active sheet */
  sheetId?: string;
}

const Print: React.FC<PrintProps> = ({ sheetId }) => {
  const { sheets, activeSheetId } = useDiagramStore();
  const activeSheet = sheetId ? sheets?.[sheetId] : sheets?.[activeSheetId];

  if (!activeSheet) {
    return null;
  }

  const { shapesById, shapeIds, connectors, layers } = activeSheet;

  // Get all shapes and connectors from visible layers
  const visibleShapes = shapeIds
    .map(id => shapesById[id])
    .filter((shape): shape is Shape => {
      if (!shape) {
        return false;
      }

      const layer = layers[shape.layerId];
      return Boolean(layer?.isVisible);
    });

  const visibleConnectors = Object.values(connectors)
    .filter(connector => {
      const startShape = shapesById[connector.startNodeId];
      const endShape = shapesById[connector.endNodeId];

      if (!startShape || !endShape) {
        return false;
      }

      const startLayer = layers[startShape.layerId];
      const endLayer = layers[endShape.layerId];

      return Boolean(startLayer?.isVisible && endLayer?.isVisible);
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
  const hasVisibleShapes = visibleShapes.length > 0;
  const viewBox = hasVisibleShapes
    ? `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`
    : `${-padding} ${-padding} ${padding * 2} ${padding * 2}`;

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
