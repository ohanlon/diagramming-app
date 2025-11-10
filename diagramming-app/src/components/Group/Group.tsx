import React from 'react';
import type { Shape, Point, AnchorType } from '../../types';
import Node from '../Node/Node';

interface GroupProps {
  groupShape: Shape;
  children: Shape[];
  zoom: number;
  isInteractive: boolean;
  isSelected: boolean;
  isConnectorDragTarget: boolean;
  onConnectorStart: (nodeId: string, point: Point, anchorType: AnchorType) => void;
  onContextMenu: (e: React.MouseEvent, shapeId: string) => void;
  onNodeMouseDown: (e: React.MouseEvent, shapeId: string) => void;
  activeLayerId: string;
  layers: Record<string, any>;
  isEditingText?: boolean;
  onTextEditComplete?: () => void;
}

/**
 * Group component renders a group of shapes as a single selectable unit
 * Children are rendered with relative positioning inside the group
 */
const Group: React.FC<GroupProps> = ({
  groupShape,
  children,
  zoom,
  isSelected,
  isConnectorDragTarget,
  onConnectorStart,
  onContextMenu,
  onNodeMouseDown,
  activeLayerId,
  layers,
}) => {
  // Handler for group-level mouse down
  const handleGroupMouseDown = (e: React.MouseEvent) => {
    // Prevent interaction with individual children
    e.stopPropagation();
    onNodeMouseDown(e, groupShape.id);
  };

  const handleGroupContextMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContextMenu(e, groupShape.id);
  };

  return (
    <g
      data-group-id={groupShape.id}
      onMouseDown={handleGroupMouseDown}
      onContextMenu={handleGroupContextMenu}
    >
      {/* Visual indicator for the group bounds when selected */}
      {isSelected && (
        <rect
          x={groupShape.x}
          y={groupShape.y}
          width={groupShape.width}
          height={groupShape.height}
          fill="none"
          stroke="#1976d2"
          strokeWidth={2 / zoom}
          strokeDasharray={`${8 / zoom} ${4 / zoom}`}
          pointerEvents="none"
          rx={4 / zoom}
        />
      )}

      {/* Render all child shapes at their relative positions */}
      {children.map((child) => (
        <Node
          key={child.id}
          shape={child}
          zoom={zoom}
          isInteractive={false} // Children in a group are not individually interactive
          isSelected={false} // Individual children don't show selection
          isConnectorDragTarget={false}
          onConnectorStart={onConnectorStart}
          onContextMenu={() => {}} // Context menu on group, not children
          onNodeMouseDown={() => {}} // Mouse down handled by group
          activeLayerId={activeLayerId}
          layers={layers}
          isEditingText={false} // Cannot edit text in grouped shapes
          onTextEditComplete={() => {}}
        />
      ))}

      {/* Connector anchor points for the group */}
      {isSelected && (
        <>
          {/* Top anchor */}
          <circle
            cx={groupShape.x + groupShape.width / 2}
            cy={groupShape.y}
            r={6 / zoom}
            fill="#1976d2"
            stroke="white"
            strokeWidth={2 / zoom}
            style={{ cursor: 'crosshair' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              const point = { x: groupShape.x + groupShape.width / 2, y: groupShape.y };
              onConnectorStart(groupShape.id, point, 'top');
            }}
          />
          {/* Right anchor */}
          <circle
            cx={groupShape.x + groupShape.width}
            cy={groupShape.y + groupShape.height / 2}
            r={6 / zoom}
            fill="#1976d2"
            stroke="white"
            strokeWidth={2 / zoom}
            style={{ cursor: 'crosshair' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              const point = { x: groupShape.x + groupShape.width, y: groupShape.y + groupShape.height / 2 };
              onConnectorStart(groupShape.id, point, 'right');
            }}
          />
          {/* Bottom anchor */}
          <circle
            cx={groupShape.x + groupShape.width / 2}
            cy={groupShape.y + groupShape.height}
            r={6 / zoom}
            fill="#1976d2"
            stroke="white"
            strokeWidth={2 / zoom}
            style={{ cursor: 'crosshair' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              const point = { x: groupShape.x + groupShape.width / 2, y: groupShape.y + groupShape.height };
              onConnectorStart(groupShape.id, point, 'bottom');
            }}
          />
          {/* Left anchor */}
          <circle
            cx={groupShape.x}
            cy={groupShape.y + groupShape.height / 2}
            r={6 / zoom}
            fill="#1976d2"
            stroke="white"
            strokeWidth={2 / zoom}
            style={{ cursor: 'crosshair' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              const point = { x: groupShape.x, y: groupShape.y + groupShape.height / 2 };
              onConnectorStart(groupShape.id, point, 'left');
            }}
          />
        </>
      )}

      {/* Drag target highlight */}
      {isConnectorDragTarget && (
        <rect
          x={groupShape.x - 4 / zoom}
          y={groupShape.y - 4 / zoom}
          width={groupShape.width + 8 / zoom}
          height={groupShape.height + 8 / zoom}
          fill="none"
          stroke="#4caf50"
          strokeWidth={3 / zoom}
          pointerEvents="none"
          rx={6 / zoom}
        />
      )}
    </g>
  );
};

export default Group;
