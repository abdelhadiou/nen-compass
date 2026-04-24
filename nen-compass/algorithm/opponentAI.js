/**
 * opponentAI.js — Shadow Hunter AI
 *
 * The Shadow Hunter has Emitter affinity and uses perfect A* pathfinding
 * toward the center of the maze. It moves one step every second.
 */

class OpponentAI {
  /**
   * @param {number} startX
   * @param {number} startY
   */
  constructor(startX = 19, startY = 19) {
    this.x = startX;
    this.y = startY;
    this.affinity = "Emitter"; // Shadow Hunter's fixed Nen type (per lore hint)
    this._intervalId = null;
    this._path = [];
  }

  /**
   * Recalculates A* path from current position to goal and takes one step.
   * Call this once per second.
   *
   * @param {Object[][]} grid
   * @param {{x:number,y:number}} goal   — Center cell
   * @param {Function} onMove            — Callback after each step
   */
  step(grid, goal, onMove) {
    // Recalculate path every move for "perfect" pathfinding
    const path = aStar(grid, grid[this.y][this.x], goal, this.affinity);
    if (path.length > 0) {
      this.x = path[0].x;
      this.y = path[0].y;
    }
    if (typeof onMove === "function") onMove();
  }

  /**
   * Start autonomous movement on a 1-second interval.
   *
   * @param {Function} getGrid   — Returns current grid (in case it changes)
   * @param {{x:number,y:number}} goal
   * @param {Function} onMove    — Called after each step
   */
  start(getGrid, goal, onMove) {
    this.stop();
    this._intervalId = setInterval(() => {
      this.step(getGrid(), goal, onMove);
    }, 1000);
  }

  /**
   * Stop autonomous movement (e.g., on game over).
   */
  stop() {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  /**
   * Reset to starting position.
   */
  reset(startX = 19, startY = 19) {
    this.stop();
    this.x = startX;
    this.y = startY;
    this._path = [];
  }

  /**
   * Chebyshev distance from the hunter to the goal.
   */
  distanceTo(goal) {
    return Math.abs(this.x - goal.x) + Math.abs(this.y - goal.y);
  }
}
