/**
 * aStar.js — A* pathfinding algorithm
 * Returns the shortest-cost path from start cell to goal cell
 * considering Nen affinity movement costs.
 */

// Note: AFFINITY_COSTS is defined in app.js (shared global scope).

/**
 * Heuristic: weighted Manhattan distance
 * We use min possible cost (1) * Manhattan distance as admissible heuristic
 */
function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Returns the 4-directional walkable neighbours of a cell within the grid.
 * @param {Object[][]} grid
 * @param {Object} node  — {x, y}
 */
function getNeighbors(grid, node) {
  const GRID_SIZE = grid.length;
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const result = [];
  for (const [dx, dy] of dirs) {
    const nx = node.x + dx;
    const ny = node.y + dy;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && !grid[ny][nx].isWall) {
      result.push(grid[ny][nx]);
    }
  }
  return result;
}

/**
 * A* search.
 * @param {Object[][]} grid       — 2D array of cell objects
 * @param {{x,y}} start
 * @param {{x,y}} goal
 * @param {string} affinity       — Nen affinity of the mover
 * @returns {Object[]}            — array of cells from start (exclusive) to goal (inclusive), or []
 */
// Standalone reference implementation — app.js uses its own inlined astar() function.
function aStar_standalone(grid, start, goal, affinity) {
  const costs = AFFINITY_COSTS[affinity];
  if (!costs) return [];

  const key = (c) => `${c.x},${c.y}`;

  const gScore = new Map();
  const fScore = new Map();
  const cameFrom = new Map();
  const openSet = new Set();
  const closedSet = new Set();

  const startKey = key(start);
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(start, goal));
  openSet.add(startKey);

  // Store cell references by key for quick lookup
  const cellByKey = new Map();
  cellByKey.set(startKey, start);

  while (openSet.size > 0) {
    // Get node with lowest fScore
    let current = null;
    let lowestF = Infinity;
    for (const k of openSet) {
      const f = fScore.get(k) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        current = k;
      }
    }

    const currentCell = cellByKey.get(current);

    if (currentCell.x === goal.x && currentCell.y === goal.y) {
      // Reconstruct path
      const path = [];
      let node = current;
      while (cameFrom.has(node)) {
        path.push(cellByKey.get(node));
        node = cameFrom.get(node);
      }
      return path.reverse();
    }

    openSet.delete(current);
    closedSet.add(current);

    for (const neighbor of getNeighbors(grid, currentCell)) {
      const nk = key(neighbor);
      if (closedSet.has(nk)) continue;

      const moveCost = costs[neighbor.nenType] ?? 5;
      const tentativeG = (gScore.get(current) ?? Infinity) + moveCost;

      if (!openSet.has(nk)) {
        openSet.add(nk);
        cellByKey.set(nk, neighbor);
      } else if (tentativeG >= (gScore.get(nk) ?? Infinity)) {
        continue;
      }

      cameFrom.set(nk, current);
      gScore.set(nk, tentativeG);
      fScore.set(nk, tentativeG + heuristic(neighbor, goal));
    }
  }

  return []; // No path found
}
