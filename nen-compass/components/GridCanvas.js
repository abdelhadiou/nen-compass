/**
 * GridCanvas.js — Canvas rendering for the 20×20 Nen maze
 *
 * Responsibilities:
 *  - Draw fog-of-war grid with Nen-type colours
 *  - Draw player, Shadow Hunter (if visible), and center marker
 *  - Highlight the A* suggested path for the player
 *  - Handle click-to-move input and delegate to app logic
 */

// Note: CELL_SIZE, GRID_SIZE, and NEN_COLORS are defined in app.js (shared global scope).
// These component constants are kept as comments for documentation purposes only.
// CELL_SIZE = 30, GRID_SIZE = 20

class GridCanvas {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Function} onCellClick  — (x, y) => void
   */
  constructor(canvas, onCellClick) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onCellClick = onCellClick;

    this.canvas.addEventListener("click", (e) => this._handleClick(e));
  }

  // ── Private ──────────────────────────────────────────────────────────────

  _handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      this.onCellClick(x, y);
    }
  }

  _drawCell(cell, fog) {
    const { ctx } = this;
    const px = cell.x * CELL_SIZE;
    const py = cell.y * CELL_SIZE;

    if (fog === "hidden") {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
      return;
    }

    if (cell.isWall) {
      // Walls: dark texture
      const alpha = fog === "dim" ? 0.5 : 1.0;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
      ctx.fillStyle = "#222244";
      ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      ctx.globalAlpha = 1.0;
    } else {
      // Walkable path: subtle Nen colour tint
      const alpha = fog === "dim" ? 0.25 : 0.35;
      ctx.fillStyle = "#111118";
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = NEN_COLORS[cell.nenType] ?? "#555";
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
      ctx.globalAlpha = 1.0;
    }

    // Grid lines
    ctx.strokeStyle = "#1e1e2e";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Full redraw of the grid.
   *
   * @param {Object[][]} grid
   * @param {{x,y}} player
   * @param {{x,y}} hunter
   * @param {{x,y}} center
   * @param {FogOfWar} fog
   * @param {Object[]} suggestedPath   — cells from A* (may be empty)
   */
  draw(grid, player, hunter, center, fog, suggestedPath = []) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const pathSet = new Set(suggestedPath.map((c) => `${c.x},${c.y}`));

    // ── Draw cells ──────────────────────────────────────────────────────────
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = grid[y][x];
        const visible = fog.isVisible(x, y, player.x, player.y);
        const revealed = fog.revealed.has(`${x},${y}`);

        let fogState;
        if (visible) fogState = "clear";
        else if (revealed) fogState = "dim";
        else fogState = "hidden";

        this._drawCell(cell, fogState);

        // Suggested path highlight (only on visible, non-wall cells)
        if (visible && !cell.isWall && pathSet.has(`${x},${y}`)) {
          ctx.globalAlpha = 0.25;
          ctx.fillStyle = "#00ffff";
          ctx.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
          ctx.globalAlpha = 1.0;
        }
      }
    }

    // ── Center marker ────────────────────────────────────────────────────────
    if (fog.isVisible(center.x, center.y, player.x, player.y) ||
        fog.revealed.has(`${center.x},${center.y}`)) {
      ctx.font = "bold 16px Courier New";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#d2a849";
      ctx.shadowColor = "#d2a849";
      ctx.shadowBlur = 10;
      ctx.fillText("★", center.x * CELL_SIZE + CELL_SIZE / 2, center.y * CELL_SIZE + CELL_SIZE / 2);
      ctx.shadowBlur = 0;
    }

    // ── Shadow Hunter ────────────────────────────────────────────────────────
    if (fog.isVisible(hunter.x, hunter.y, player.x, player.y)) {
      this._drawEntity(hunter.x, hunter.y, "#ff3333", "#ff0000", "👤");
    }

    // ── Player ───────────────────────────────────────────────────────────────
    this._drawEntity(player.x, player.y, "#00ffff", "#00cccc", "◉");
  }

  _drawEntity(x, y, fillColor, glowColor, symbol) {
    const { ctx } = this;
    const cx = x * CELL_SIZE + CELL_SIZE / 2;
    const cy = y * CELL_SIZE + CELL_SIZE / 2;
    const r = CELL_SIZE / 2 - 4;

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = `${CELL_SIZE * 0.55}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
    ctx.fillText(symbol, cx, cy);
  }
}
