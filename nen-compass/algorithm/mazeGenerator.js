/**
 * mazeGenerator.js — Procedural maze generation
 * Uses Recursive Backtracking (DFS) to guarantee every cell is reachable.
 * Then overlays random Nen types on walkable cells.
 */

// Note: NEN_TYPES and GRID_SIZE are defined in app.js (shared global scope).

/**
 * Shuffle an array in place (Fisher-Yates).
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates a 20×20 maze grid using recursive backtracking.
 * The algorithm carves passages on a grid where every other cell is a "room"
 * and the cells between rooms start as walls that can be knocked down.
 *
 * @returns {Object[][]}  2D array of cell objects:
 *   { x, y, isWall, nenType }
 */
// Standalone reference implementation — app.js uses its own inlined version.
function generateMaze_standalone() {
  // Start fully walled
  const grid = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[y][x] = {
        x,
        y,
        isWall: true,
        nenType: NEN_TYPES[Math.floor(Math.random() * NEN_TYPES.length)],
        visited: false,
      };
    }
  }

  // Carve passages using DFS from (0,0)
  // We treat even-coordinate cells as "rooms" and move in steps of 2
  function carve(cx, cy) {
    grid[cy][cx].isWall = false;
    grid[cy][cx].visited = true;

    const directions = shuffle([[0, -2], [2, 0], [0, 2], [-2, 0]]);
    for (const [dx, dy] of directions) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && !grid[ny][nx].visited) {
        // Remove the wall between current and next
        grid[cy + dy / 2][cx + dx / 2].isWall = false;
        carve(nx, ny);
      }
    }
  }

  carve(0, 0);

  // Guarantee key positions are open
  const keyPositions = [
    { x: 0, y: 0 },           // Player start
    { x: 19, y: 19 },         // Shadow Hunter start
    { x: 9, y: 9 },           // Center (slightly off from exact geometric center)
    { x: 10, y: 10 },         // Also open the 10,10 area
    { x: 9, y: 10 },
    { x: 10, y: 9 },
  ];
  for (const pos of keyPositions) {
    grid[pos.y][pos.x].isWall = false;
  }

  // Add a few random extra passages for variety (avoids too linear mazes)
  const extraHoles = Math.floor(GRID_SIZE * 2);
  for (let i = 0; i < extraHoles; i++) {
    const rx = 1 + Math.floor(Math.random() * (GRID_SIZE - 2));
    const ry = 1 + Math.floor(Math.random() * (GRID_SIZE - 2));
    grid[ry][rx].isWall = false;
  }

  // Clean up temporary visited flag
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      delete grid[y][x].visited;
    }
  }

  return grid;
}
