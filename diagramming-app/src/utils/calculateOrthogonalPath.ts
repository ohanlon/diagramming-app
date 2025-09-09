import type { Point, Shape, AnchorType } from '../types';

interface OrthogonalPathResult {
  path: Point[];
  sourceConnectionPoint: Point;
  targetConnectionPoint: Point;
  arrowDirection: AnchorType;
}

// --- Grid and A* Pathfinding Constants and Helpers ---
const GRID_SIZE = 10; // Each grid cell is 10x10 pixels
const OBSTACLE_PADDING = 5; // Padding around shapes to consider as obstacles

// Converts canvas coordinates to grid coordinates
const toGridCoords = (point: Point): Point => ({
  x: Math.floor(point.x / GRID_SIZE),
  y: Math.floor(point.y / GRID_SIZE),
});

// Converts grid coordinates back to canvas coordinates (center of the grid cell)
const toCanvasCoords = (gridPoint: Point): Point => ({
  x: gridPoint.x * GRID_SIZE + GRID_SIZE / 2,
  y: gridPoint.y * GRID_SIZE + GRID_SIZE / 2,
});

// Represents a node in the A* grid
interface GridNode {
  x: number;
  y: number;
  g: number; // Cost from start to this node
  h: number; // Heuristic cost from this node to end
  f: number; // g + h
  parent: GridNode | null;
}

// Heuristic function (Manhattan distance for orthogonal paths)
const heuristic = (a: Point, b: Point): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

const getConnectionPoints = (shape: Shape): { [key in AnchorType]: Point } => {
  const { x, y, width, height } = shape;
  return {
    top: { x: x + width / 2, y: y },
    right: { x: x + width, y: y + height / 2 },
    bottom: { x: x + width / 2, y: y + height },
    left: { x: x, y: y + height / 2 },
  };
};

// Function to get all grid cells occupied by a shape, including padding
const getObstacleGridCells = (shape: Shape): Set<string> => {
  const cells = new Set<string>();
  const paddedMinX = shape.x - OBSTACLE_PADDING;
  const paddedMinY = shape.y - OBSTACLE_PADDING;
  const paddedMaxX = shape.x + shape.width + OBSTACLE_PADDING;
  const paddedMaxY = shape.y + shape.height + OBSTACLE_PADDING;

  const startGridX = Math.floor(paddedMinX / GRID_SIZE);
  const startGridY = Math.floor(paddedMinY / GRID_SIZE);
  const endGridX = Math.ceil(paddedMaxX / GRID_SIZE);
  const endGridY = Math.ceil(paddedMaxY / GRID_SIZE);

  for (let x = startGridX; x < endGridX; x++) {
    for (let y = startGridY; y < endGridY; y++) {
      cells.add(`${x},${y}`);
    }
  }
  return cells;
};

// --- A* Pathfinding Algorithm ---
const findPathAStar = (
  startGrid: Point,
  endGrid: Point,
  gridObstacles: Set<string>
): Point[] => {
  const openList: GridNode[] = [];
  const closedList: Set<string> = new Set();

  const startNode: GridNode = {
    x: startGrid.x,
    y: startGrid.y,
    g: 0,
    h: heuristic(startGrid, endGrid),
    f: heuristic(startGrid, endGrid),
    parent: null,
  };
  openList.push(startNode);

  while (openList.length > 0) {
    openList.sort((a, b) => a.f - b.f);
    const currentNode = openList.shift()!;

    const currentKey = `${currentNode.x},${currentNode.y}`;
    if (closedList.has(currentKey)) {
      continue;
    }
    closedList.add(currentKey);

    if (currentNode.x === endGrid.x && currentNode.y === endGrid.y) {
      const path: Point[] = [];
      let temp: GridNode | null = currentNode;
      while (temp) {
        path.push(toCanvasCoords({ x: temp.x, y: temp.y }));
        temp = temp.parent;
      }
      return path.reverse();
    }

    const neighbors = [
      { x: currentNode.x, y: currentNode.y - 1 }, // Up
      { x: currentNode.x, y: currentNode.y + 1 }, // Down
      { x: currentNode.x - 1, y: currentNode.y }, // Left
      { x: currentNode.x + 1, y: currentNode.y }, // Right
    ];

    for (const neighborGrid of neighbors) {
      const neighborKey = `${neighborGrid.x},${neighborGrid.y}`;

      if (gridObstacles.has(neighborKey) || closedList.has(neighborKey)) {
        continue;
      }

      const newG = currentNode.g + 1;
      let neighborNode = openList.find(node => node.x === neighborGrid.x && node.y === neighborGrid.y);

      if (!neighborNode || newG < neighborNode.g) {
        if (!neighborNode) {
          neighborNode = {
            x: neighborGrid.x,
            y: neighborGrid.y,
            g: newG,
            h: heuristic(neighborGrid, endGrid),
            f: newG + heuristic(neighborGrid, endGrid),
            parent: currentNode,
          };
          openList.push(neighborNode);
        } else {
          neighborNode.g = newG;
          neighborNode.f = newG + neighborNode.h;
          neighborNode.parent = currentNode;
        }
      }
    }
  }

  return []; // No path found
};

// --- Path Simplification ---
const simplifyPath = (path: Point[]): Point[] => {
  if (path.length < 3) return path;

  const simplified: Point[] = [path[0]];
  let prevPoint = path[0];
  let currentPoint = path[1];

  for (let i = 2; i < path.length; i++) {
    const nextPoint = path[i];

    // Check if the three points are collinear (horizontal or vertical)
    if (
      (prevPoint.x === currentPoint.x && currentPoint.x === nextPoint.x) || // Vertical
      (prevPoint.y === currentPoint.y && currentPoint.y === nextPoint.y)    // Horizontal
    ) {
      // If collinear, skip the currentPoint (it's redundant)
      currentPoint = nextPoint;
    } else {
      // If not collinear, add the currentPoint to the simplified path
      simplified.push(currentPoint);
      prevPoint = currentPoint;
      currentPoint = nextPoint;
    }
  }
  simplified.push(currentPoint); // Add the last point
  return simplified;
};

// --- Main Orthogonal Path Calculation Function ---
export const calculateOrthogonalPath = (
  sourceShape: Shape,
  targetShape: Shape,
  allShapes: Shape[]
): OrthogonalPathResult => {
  const sourceConnectionPoints = getConnectionPoints(sourceShape);
  const targetConnectionPoints = getConnectionPoints(targetShape);

  const possibleAnchorTypes: AnchorType[] = ['top', 'right', 'bottom', 'left'];

  let bestPath: Point[] = [];
  let bestCost = Infinity;
  let bestSourceAnchor: AnchorType = 'right';
  let bestTargetAnchor: AnchorType = 'left';

  // Collect all obstacle grid cells
  const gridObstacles: Set<string> = new Set();
  allShapes.forEach(shape => {
    // Exclude source and target shapes from being obstacles for the current path
    if (shape.id !== sourceShape.id && shape.id !== targetShape.id) {
      getObstacleGridCells(shape).forEach(cell => gridObstacles.add(cell));
    }
  });

  for (const startAnchor of possibleAnchorTypes) {
    for (const endAnchor of possibleAnchorTypes) {
      const startPoint = sourceConnectionPoints[startAnchor];
      const endPoint = targetConnectionPoints[endAnchor];

      const startGrid = toGridCoords(startPoint);
      const endGrid = toGridCoords(endPoint);

      const path = findPathAStar(startGrid, endGrid, gridObstacles);

      if (path.length > 0) {
        const simplifiedPath = simplifyPath(path);

        // Calculate cost: path length + (number of bends * bend_penalty)
        let bends = 0;
        for (let i = 1; i < simplifiedPath.length - 1; i++) {
          const p1 = simplifiedPath[i - 1];
          const p2 = simplifiedPath[i];
          const p3 = simplifiedPath[i + 1];

          // Check for a bend (change in direction)
          if (!((p1.x === p2.x && p2.x === p3.x) || (p1.y === p2.y && p2.y === p3.y))) {
            bends++;
          }
        }

        const pathLength = simplifiedPath.reduce((acc, p, i, arr) => {
          if (i === 0) return acc;
          const prev = arr[i - 1];
          return acc + Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
        }, 0);

        const currentCost = pathLength + (bends * GRID_SIZE * 2); // Penalize bends

        if (currentCost < bestCost) {
          bestCost = currentCost;
          bestPath = simplifiedPath;
          bestSourceAnchor = startAnchor;
          bestTargetAnchor = endAnchor;
        }
      }
    }
  }

  // If no path found, return an empty path or a direct line as fallback
  if (bestPath.length === 0) {
    // Fallback to a direct line if A* fails for all combinations
    bestPath = [sourceConnectionPoints.right, targetConnectionPoints.left];
    bestSourceAnchor = 'right';
    bestTargetAnchor = 'left';
  }

  // Determine arrow direction based on the last segment of the best path
  let arrowDirection: AnchorType = 'right'; // Default
  if (bestPath.length >= 2) {
    const lastPoint = bestPath[bestPath.length - 1];
    const secondLastPoint = bestPath[bestPath.length - 2];

    if (lastPoint.x === secondLastPoint.x) { // Vertical movement
      if (lastPoint.y > secondLastPoint.y) {
        arrowDirection = 'bottom';
      } else {
        arrowDirection = 'top';
      }
    } else if (lastPoint.y === secondLastPoint.y) { // Horizontal movement
      if (lastPoint.x > secondLastPoint.x) {
        arrowDirection = 'right';
      } else {
        arrowDirection = 'left';
      }
    }
  }

  return {
    path: bestPath,
    sourceConnectionPoint: sourceConnectionPoints[bestSourceAnchor],
    targetConnectionPoint: targetConnectionPoints[bestTargetAnchor],
    arrowDirection,
  };
};