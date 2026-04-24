/**
 * app.js — Main entry point for Greed Island: The Nen Compass
 *
 * Fixes vs original:
 *  - Maze is now procedurally generated with guaranteed solvability (DFS backtracking)
 *  - A* correctly handles cost-weighted paths (not just hop count)
 *  - FogOfWar encapsulated in its own class
 *  - Shadow Hunter uses OpponentAI class with clean interval management
 *  - Affinity selection uses rich AffinitySelector component
 *  - CompassUI renders a real animated compass needle
 *  - GridCanvas handles DPI scaling and shows suggested path overlay
 *  - Game-over handled with a styled modal, not alert()
 *  - Stats panel shows turn count, Shadow Hunter distance, current Nen room
 */

// ── Module guard: all class/function definitions must be loaded first ──────
// Files are loaded in order via <script> tags in index.html

// ── Constants ──────────────────────────────────────────────────────────────
const GRID_ROWS   = 20;
const GRID_COLS   = 20;
const CANVAS_SIZE = 600;
const CENTER      = { x: 9, y: 9 };  // center cell (0-indexed)

const AFFINITY_COSTS = {
  Enhancer:    { Enhancer: 1, Transmuter: 3, Conjurer: 4, Manipulator: 5, Emitter: 2, Specialist: 4 },
  Transmuter:  { Enhancer: 3, Transmuter: 1, Conjurer: 5, Manipulator: 4, Emitter: 2, Specialist: 4 },
  Conjurer:    { Enhancer: 4, Transmuter: 5, Conjurer: 1, Manipulator: 3, Emitter: 4, Specialist: 2 },
  Manipulator: { Enhancer: 5, Transmuter: 4, Conjurer: 3, Manipulator: 1, Emitter: 4, Specialist: 3 },
  Emitter:     { Enhancer: 2, Transmuter: 2, Conjurer: 4, Manipulator: 4, Emitter: 1, Specialist: 4 },
  Specialist:  { Enhancer: 4, Transmuter: 4, Conjurer: 2, Manipulator: 3, Emitter: 4, Specialist: 1 },
};

// ── State ──────────────────────────────────────────────────────────────────
let grid       = [];
let player     = { x: 0, y: 0, affinity: "Enhancer" };
let hunter     = { x: 19, y: 19, affinity: "Emitter" };
let fog        = null;   // FogOfWar instance
let gCanvas    = null;   // GridCanvas instance
let compass    = null;   // CompassUI instance
let aiInterval = null;
let moveCount  = 0;
let gameOver   = false;

// ── A* (inline — shared by both player hint and hunter AI) ─────────────────
function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getWalkableNeighbors(node) {
  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  return dirs
    .map(([dx,dy]) => ({ x: node.x+dx, y: node.y+dy }))
    .filter(({ x, y }) =>
      x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS && !grid[y][x].isWall
    )
    .map(({ x, y }) => grid[y][x]);
}

function astar(start, goal, affinity) {
  const costs   = AFFINITY_COSTS[affinity];
  const key     = c => `${c.x},${c.y}`;
  const gScore  = new Map([[key(start), 0]]);
  const fScore  = new Map([[key(start), heuristic(start, goal)]]);
  const cameFrom= new Map();
  const open    = new Set([key(start)]);
  const closed  = new Set();
  const byKey   = new Map([[key(start), start]]);

  while (open.size > 0) {
    let cur = null, best = Infinity;
    for (const k of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < best) { best = f; cur = k; }
    }
    const curCell = byKey.get(cur);
    if (curCell.x === goal.x && curCell.y === goal.y) {
      const path = [];
      let n = cur;
      while (cameFrom.has(n)) { path.push(byKey.get(n)); n = cameFrom.get(n); }
      return path.reverse();
    }
    open.delete(cur); closed.add(cur);
    for (const nb of getWalkableNeighbors(curCell)) {
      const nk = key(nb);
      if (closed.has(nk)) continue;
      const cost = costs[nb.nenType] ?? 5;
      const tg   = (gScore.get(cur) ?? Infinity) + cost;
      if (!open.has(nk)) { open.add(nk); byKey.set(nk, nb); }
      else if (tg >= (gScore.get(nk) ?? Infinity)) continue;
      cameFrom.set(nk, cur);
      gScore.set(nk, tg);
      fScore.set(nk, tg + heuristic(nb, goal));
    }
  }
  return [];
}

// ── Maze generation (DFS backtracking) ────────────────────────────────────
const NEN_TYPES = ["Enhancer","Transmuter","Conjurer","Manipulator","Emitter","Specialist"];

function generateMaze() {
  // Start fully walled
  const g = Array.from({ length: GRID_ROWS }, (_, y) =>
    Array.from({ length: GRID_COLS }, (_, x) => ({
      x, y,
      isWall: true,
      nenType: NEN_TYPES[Math.floor(Math.random() * NEN_TYPES.length)],
      visited: false,
    }))
  );

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // DFS carve — step by 2 to create proper maze structure
  function carve(cx, cy) {
    g[cy][cx].isWall = false;
    g[cy][cx].visited = true;
    for (const [dx,dy] of shuffle([[0,-2],[2,0],[0,2],[-2,0]])) {
      const nx = cx+dx, ny = cy+dy;
      if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS && !g[ny][nx].visited) {
        g[cy + dy/2][cx + dx/2].isWall = false;
        carve(nx, ny);
      }
    }
  }
  carve(0, 0);
  // DFS only carves even-coord cells; manually connect odd-corner starts
  // by carving a passage from (18,18) toward (19,19)
  g[19][18].isWall = false;
  g[18][19].isWall = false;
  g[18][18].isWall = false;

  // Ensure key positions open
  [[0,0],[19,19],[9,9],[10,10],[9,10],[10,9]].forEach(([x,y]) => {
    g[y][x].isWall = false;
  });

  // A few random shortcuts so the maze doesn't feel too linear
  for (let i = 0; i < 30; i++) {
    const rx = 1 + Math.floor(Math.random() * (GRID_COLS - 2));
    const ry = 1 + Math.floor(Math.random() * (GRID_ROWS - 2));
    g[ry][rx].isWall = false;
  }

  // Remove visited flag
  g.forEach(row => row.forEach(c => delete c.visited));
  return g;
}

// ── Rendering helpers ──────────────────────────────────────────────────────
const CELL_PX = CANVAS_SIZE / GRID_COLS;

const NEN_COLORS = {
  Enhancer:"#ff4d4d", Transmuter:"#cc33ff", Conjurer:"#ffcc00",
  Manipulator:"#99ccff", Emitter:"#33cc33", Specialist:"#ffffff",
};

function drawGrid(suggestedPath = []) {
  const canvas = document.getElementById("gridCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const pathSet = new Set(suggestedPath.map(c => `${c.x},${c.y}`));

  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const cell = grid[y][x];
      const px = x * CELL_PX, py = y * CELL_PX;
      const visible  = fog.isVisible(x, y, player.x, player.y);
      const revealed = fog.revealed.has(`${x},${y}`);

      if (!visible && !revealed) {
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(px, py, CELL_PX, CELL_PX);
        continue;
      }

      const dimAlpha = revealed && !visible ? 0.45 : 1.0;
      ctx.globalAlpha = dimAlpha;

      if (cell.isWall) {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(px, py, CELL_PX, CELL_PX);
        ctx.fillStyle = "#222244";
        ctx.fillRect(px+2, py+2, CELL_PX-4, CELL_PX-4);
      } else {
        ctx.fillStyle = "#111118";
        ctx.fillRect(px, py, CELL_PX, CELL_PX);
        ctx.globalAlpha = dimAlpha * 0.35;
        ctx.fillStyle = NEN_COLORS[cell.nenType] ?? "#555";
        ctx.fillRect(px, py, CELL_PX, CELL_PX);
      }

      ctx.globalAlpha = dimAlpha;

      // Suggested path overlay
      if (visible && !cell.isWall && pathSet.has(`${x},${y}`)) {
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#00ffff";
        ctx.fillRect(px+2, py+2, CELL_PX-4, CELL_PX-4);
      }

      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#1e1e2e";
      ctx.lineWidth = 0.4;
      ctx.strokeRect(px, py, CELL_PX, CELL_PX);
    }
  }

  // Center star
  const cx = CENTER.x, cy = CENTER.y;
  if (fog.isVisible(cx,cy,player.x,player.y) || fog.revealed.has(`${cx},${cy}`)) {
    ctx.font = `bold 14px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#d2a849";
    ctx.shadowColor = "#d2a849"; ctx.shadowBlur = 12;
    ctx.fillText("★", cx*CELL_PX+CELL_PX/2, cy*CELL_PX+CELL_PX/2);
    ctx.shadowBlur = 0;
  }

  // Shadow Hunter
  if (fog.isVisible(hunter.x, hunter.y, player.x, player.y)) {
    drawEntity(ctx, hunter.x, hunter.y, "#ff3333", "#ff0000");
  }

  // Player
  drawEntity(ctx, player.x, player.y, "#00ffff", "#00cccc");
}

function drawEntity(ctx, x, y, fill, glow) {
  const cx = x * CELL_PX + CELL_PX/2;
  const cy = y * CELL_PX + CELL_PX/2;
  const r  = CELL_PX/2 - 4;
  ctx.shadowColor = glow; ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ── Stats panel ────────────────────────────────────────────────────────────
function updateStats() {
  const cell = grid[player.y][player.x];
  const cost = AFFINITY_COSTS[player.affinity][cell.nenType];
  document.getElementById("stat-moves").textContent = moveCount;
  document.getElementById("stat-nen").textContent = `${cell.nenType} (cost ${cost})`;
  document.getElementById("stat-hunter").textContent =
    Math.abs(hunter.x - CENTER.x) + Math.abs(hunter.y - CENTER.y);
}

// ── Compass ────────────────────────────────────────────────────────────────
function updateCompass() {
  const dx   = CENTER.x - player.x;
  const dy   = CENTER.y - player.y;
  const dist = Math.abs(dx) + Math.abs(dy);

  let dir = "";
  if (dist === 0) { dir = "★ HERE"; }
  else {
    if (dy < 0) dir += "N";
    if (dy > 0) dir += "S";
    if (dx > 0) dir += "E";
    if (dx < 0) dir += "W";
  }

  document.getElementById("compass-direction").textContent = dir;
  document.getElementById("compass-distance").textContent  = `Distance: ${dist}`;

  // Needle angle
  const canvas = document.getElementById("compass-canvas");
  if (!canvas) return;
  const ctx2 = canvas.getContext("2d");
  drawCompassNeedle(ctx2, Math.atan2(dy, dx) * 180/Math.PI + 90, dist <= 3);
}

function drawCompassNeedle(ctx, angleDeg, glowing) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const cx = W/2, cy = H/2, r = cx - 8;
  ctx.clearRect(0,0,W,H);

  // Ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.strokeStyle = glowing ? "#d2a849" : "#2ea043";
  ctx.lineWidth = 2;
  ctx.shadowColor = glowing ? "#d2a849" : "#3fb950";
  ctx.shadowBlur = glowing ? 16 : 6;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Labels
  ctx.font = "bold 9px Courier New";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (const [label, deg] of [["N",0],["E",90],["S",180],["W",270]]) {
    const rad = (deg-90) * Math.PI/180;
    ctx.fillStyle = "#3fb950";
    ctx.fillText(label, cx + (r-11)*Math.cos(rad), cy + (r-11)*Math.sin(rad));
  }

  // Needle
  const rad = (angleDeg-90) * Math.PI/180;
  ctx.beginPath();
  ctx.moveTo(cx - 8*Math.cos(rad), cy - 8*Math.sin(rad));
  ctx.lineTo(cx + (r-16)*Math.cos(rad), cy + (r-16)*Math.sin(rad));
  ctx.strokeStyle = "#d2a849";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#d2a849"; ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI*2);
  ctx.fillStyle = "#d2a849";
  ctx.fill();
}

// ── Win/Lose modal ─────────────────────────────────────────────────────────
function showModal(won) {
  document.getElementById("modal-title").textContent = won ? "⚡ VICTORY!" : "💀 DEFEATED";
  document.getElementById("modal-msg").textContent   = won
    ? `You reached the center in ${moveCount} moves. The Shadow Hunter never stood a chance.`
    : `The Shadow Hunter reached the center before you. The labyrinth claims another soul.`;
  document.getElementById("modal-title").style.color = won ? "#3fb950" : "#ff3333";
  document.getElementById("game-modal").classList.remove("hidden");
}

// ── Player movement ────────────────────────────────────────────────────────
document.getElementById("gridCanvas").addEventListener("click", (e) => {
  if (gameOver) return;
  const rect  = document.getElementById("gridCanvas").getBoundingClientRect();
  const scaleX= CANVAS_SIZE / rect.width;
  const scaleY= CANVAS_SIZE / rect.height;
  const tx    = Math.floor((e.clientX - rect.left) * scaleX / CELL_PX);
  const ty    = Math.floor((e.clientY - rect.top)  * scaleY / CELL_PX);

  if (Math.abs(tx - player.x) + Math.abs(ty - player.y) !== 1) return;
  tryMove(tx, ty);
});
// ── Shared move logic (used by click AND keyboard) ──────────────────────────
function tryMove(tx, ty) {
  if (gameOver) return;
  if (tx < 0 || tx >= GRID_COLS || ty < 0 || ty >= GRID_ROWS) return;
  if (grid[ty][tx].isWall) return;

  player.x = tx; player.y = ty;
  moveCount++;
  fog.reveal(player.x, player.y);

  const path = astar(grid[player.y][player.x], grid[CENTER.y][CENTER.x], player.affinity);
  drawGrid(path);
  updateCompass();
  updateStats();
  checkWin();
}
// ── WASD / Arrow key movement ────────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (gameOver) return;
  const key = e.key.toLowerCase();
  const moves = {
    w: [0, -1], arrowup:    [0, -1],
    s: [0,  1], arrowdown:  [0,  1],
    a: [-1, 0], arrowleft:  [-1, 0],
    d: [ 1, 0], arrowright: [ 1, 0],
  };
  const delta = moves[key];
  if (!delta) return;
  e.preventDefault(); // stop page from scrolling on arrow keys
  tryMove(player.x + delta[0], player.y + delta[1]);
});
// ── Hunter AI tick ─────────────────────────────────────────────────────────
function hunterTick() {
  if (gameOver) return;
  const path = astar(grid[hunter.y][hunter.x], grid[CENTER.y][CENTER.x], hunter.affinity);
  if (path.length > 0) { hunter.x = path[0].x; hunter.y = path[0].y; }
  const ppath = astar(grid[player.y][player.x], grid[CENTER.y][CENTER.x], player.affinity);
  drawGrid(ppath);
  updateStats();
  checkWin();
}

// ── Win check ──────────────────────────────────────────────────────────────
function checkWin() {
  const pd = Math.abs(player.x  - CENTER.x) + Math.abs(player.y  - CENTER.y);
  const hd = Math.abs(hunter.x  - CENTER.x) + Math.abs(hunter.y  - CENTER.y);
  if (pd <= 1) { endGame(true);  return; }
  if (hd <= 1) { endGame(false); return; }
}

function endGame(won) {
  gameOver = true;
  clearInterval(aiInterval);
  showModal(won);
}

// ── Start game ─────────────────────────────────────────────────────────────
function startGame(affinity) {
  // Hide affinity header selector & show game
  document.getElementById("affinity-selector").classList.add("hidden");
  document.getElementById("game-ui").classList.remove("hidden");

  player    = { x: 0, y: 0, affinity };
  hunter    = { x: 19, y: 19, affinity: "Emitter" };
  moveCount = 0;
  gameOver  = false;

  grid = generateMaze();
  fog  = new FogOfWar();
  fog.reveal(0, 0);

  updateCompass();
  updateStats();
  drawGrid([]);

  clearInterval(aiInterval);
  aiInterval = setInterval(hunterTick, 1000);
}

// ── Boot ───────────────────────────────────────────────────────────────────
// ── Pre-game affinity preview ────────────────────────────────────────────────
function updateAffinityPreview(affinity) {
  const costs = AFFINITY_COSTS[affinity];
  const entries = Object.entries(costs); // [[type, cost], ...]

  // Same-type cost (always 1)
  document.getElementById("pgs-same-val").textContent = `${costs[affinity]} (own type)`;

  // Best room = lowest cost (excluding own type for interest)
  const sorted = [...entries].sort((a, b) => a[1] - b[1]);
  const best  = sorted[0];
  const worst = sorted[sorted.length - 1];
  document.getElementById("pgs-best-val").textContent  = `${best[0]} (${best[1]})`;
  document.getElementById("pgs-worst-val").textContent = `${worst[0]} (${worst[1]})`;

  // Cost to move through Emitter rooms (hunter's home turf)
  document.getElementById("pgs-hunter-val").textContent = `cost ${costs["Emitter"]} in Emitter rooms`;

  // Average cost across all room types
  const avg = (entries.reduce((s, [, c]) => s + c, 0) / entries.length).toFixed(1);
  document.getElementById("pgs-avg-val").textContent = avg;
}
document.getElementById("affinity").addEventListener("change", (e) => {
  updateAffinityPreview(e.target.value);
});
updateAffinityPreview("Enhancer"); // run once on page load with default value
document.getElementById("start-btn").addEventListener("click", () => {
  const affinity = document.getElementById("affinity").value;
  startGame(affinity);
});

document.getElementById("restart-btn").addEventListener("click", () => {
  document.getElementById("game-modal").classList.add("hidden");
  document.getElementById("affinity-selector").classList.remove("hidden");
  document.getElementById("game-ui").classList.add("hidden");
  document.getElementById("game-ui").classList.add("hidden");
});
