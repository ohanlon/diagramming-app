import type { Point, Shape, AnchorType } from '../types';

interface OrthogonalPathResult {
  path: Point[];
  sourceConnectionPoint: Point;
  targetConnectionPoint: Point;
  arrowDirection: AnchorType;
}

// --- Grid and A* Pathfinding Constants and Helpers ---
const GRID_SIZE = 20; // Each grid cell is 20x20 pixels
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

// --- Min-Priority Queue for A* ---
class MinPriorityQueue<T> {
  private heap: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare;
  }

  push(item: T): void {
    this.heap.push(item);
    this.bubbleUp();
  }

  pop(): T | undefined {
    if (this.isEmpty()) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last !== undefined) {
      this.heap[0] = last;
      this.sinkDown();
    }
    return min;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(): void {
    let index = this.heap.length - 1;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parentIndex]) < 0) {
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private sinkDown(): void {
    let index = 0;
    const length = this.heap.length;
    const element = this.heap[0];

    while (true) {
      let leftChildIndex = 2 * index + 1;
      let rightChildIndex = 2 * index + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIndex < length) {
        leftChild = this.heap[leftChildIndex];
        if (this.compare(leftChild, element) < 0) {
          swap = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        rightChild = this.heap[rightChildIndex];
        if (
          (swap === null && this.compare(rightChild, element) < 0) ||
          (swap !== null && this.compare(rightChild, leftChild!) < 0)
        ) {
          swap = rightChildIndex;
        }
      }

      if (swap === null) break;
      [this.heap[index], this.heap[swap]] = [this.heap[swap], this.heap[index]];
      index = swap;
    }
  }
}

// --- A* Pathfinding Algorithm ---
const findPathAStar = (
  startGrid: Point,
  endGrid: Point,
  gridObstacles: Set<string>
): Point[] => {
  const openList = new MinPriorityQueue<GridNode>((a, b) => a.f - b.f);
  const openListMap = new Map<string, GridNode>(); // For O(1) lookups
  const closedList = new Map<string, GridNode>(); // For O(1) lookups

  const startNode: GridNode = {
    x: startGrid.x,
    y: startGrid.y,
    g: 0,
    h: heuristic(startGrid, endGrid),
    f: heuristic(startGrid, endGrid),
    parent: null,
  };
  openList.push(startNode);
  openListMap.set(`${startNode.x},${startNode.y}`, startNode);

  while (!openList.isEmpty()) {
    const currentNode = openList.pop()!;
    const currentKey = `${currentNode.x},${currentNode.y}`;

    // If we've already processed this node with a better path, skip
    if (closedList.has(currentKey) && closedList.get(currentKey)!.f <= currentNode.f) {
      continue;
    }

    // Remove from openListMap and add to closedList
    openListMap.delete(currentKey);
    closedList.set(currentKey, currentNode);

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

      // Skip if obstacle or already processed with a better path
      if (gridObstacles.has(neighborKey) || closedList.has(neighborKey)) {
        continue;
      }

      const newG = currentNode.g + 1;
      const existingNeighbor = openListMap.get(neighborKey);

      if (!existingNeighbor || newG < existingNeighbor.g) {
        const neighborNode: GridNode = existingNeighbor || {
          x: neighborGrid.x,
          y: neighborGrid.y,
          h: heuristic(neighborGrid, endGrid),
          parent: null, // Will be set below
          g: 0, // Will be set below
          f: 0, // Will be set below
        };

        neighborNode.g = newG;
        neighborNode.f = newG + neighborNode.h;
        neighborNode.parent = currentNode;

        if (!existingNeighbor) {
          openList.push(neighborNode);
          openListMap.set(neighborKey, neighborNode);
        } else {
          // If already in openList, update its priority (re-add to maintain heap property)
          // A simple re-push is fine for this basic PQ, but a more robust PQ would have a decrease-key operation.
          // For now, we rely on the closedList check to ignore outdated entries.
          openList.push(neighborNode);
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

  const EPSILON = 0.001; // Tolerance for floating point comparisons

  for (let i = 2; i < path.length; i++) {
    const nextPoint = path[i];

    // Check if the three points are collinear (horizontal or vertical) within a small tolerance
    if (
      (Math.abs(prevPoint.x - currentPoint.x) < EPSILON && Math.abs(currentPoint.x - nextPoint.x) < EPSILON) || // Vertical
      (Math.abs(prevPoint.y - currentPoint.y) < EPSILON && Math.abs(currentPoint.y - nextPoint.y) < EPSILON)    // Horizontal
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
  allShapes: Shape[],
  startAnchorType: AnchorType,
  endAnchorType: AnchorType
): OrthogonalPathResult => {
  const sourceConnectionPoints = getConnectionPoints(sourceShape);
  const targetConnectionPoints = getConnectionPoints(targetShape);

  const startPoint = sourceConnectionPoints[startAnchorType];
  const endPoint = targetConnectionPoints[endAnchorType];

  // Collect all obstacle grid cells
  const gridObstacles: Set<string> = new Set();
  allShapes.forEach(shape => {
    // Exclude source and target shapes from being obstacles for the current path
    if (shape.id !== sourceShape.id && shape.id !== targetShape.id) {
      getObstacleGridCells(shape).forEach(cell => gridObstacles.add(cell));
    }
  });

  const startGrid = toGridCoords(startPoint);
  const endGrid = toGridCoords(endPoint);

  const path = findPathAStar(startGrid, endGrid, gridObstacles);

  let bestPath: Point[] = [];
  let bestSourceAnchor: AnchorType = startAnchorType;
  let bestTargetAnchor: AnchorType = endAnchorType;

  if (path.length > 0) {
    bestPath = simplifyPath(path);
  } else {
    // Fallback to a direct line if A* fails
    bestPath = [startPoint, endPoint];
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
    sourceConnectionPoint: startPoint,
    targetConnectionPoint: endPoint,
    arrowDirection,
  };
};