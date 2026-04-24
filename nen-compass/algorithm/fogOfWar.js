/**
 * fogOfWar.js — Fog of War visibility system
 *
 * Rules:
 *  - Cells within a 2-cell Chebyshev radius of the player are always visible.
 *  - Cells the player has previously visited remain visible (memory map).
 *  - Everything else is hidden (dark fog).
 */

/**
 * FogOfWar manages the set of revealed cells and exposes a fast visibility check.
 */
class FogOfWar {
  constructor() {
    /** @type {Set<string>}  "x,y" keys of every cell ever seen */
    this.revealed = new Set();
  }

  /**
   * Call this every time the player moves to a new position.
   * Marks all cells within radius 2 as revealed.
   *
   * @param {number} px   Player column
   * @param {number} py   Player row
   * @param {number} gridSize
   */
  reveal(px, py, gridSize = 20) {
    const RADIUS = 2;
    for (let dy = -RADIUS; dy <= RADIUS; dy++) {
      for (let dx = -RADIUS; dx <= RADIUS; dx++) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
          this.revealed.add(`${nx},${ny}`);
        }
      }
    }
  }

  /**
   * Is the cell at (x, y) currently visible to the player?
   *
   * @param {number} x
   * @param {number} y
   * @param {number} px   Player column
   * @param {number} py   Player row
   * @returns {boolean}
   */
  isVisible(x, y, px, py) {
    const RADIUS = 2;
    if (Math.abs(x - px) <= RADIUS && Math.abs(y - py) <= RADIUS) return true;
    return this.revealed.has(`${x},${y}`);
  }

  /**
   * Reset the fog (new game).
   */
  reset() {
    this.revealed.clear();
  }
}
