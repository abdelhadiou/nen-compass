/**
 * CompassUI.js — Nen Compass UI widget
 *
 * Shows:
 *  - Cardinal / intercardinal direction arrow pointing toward the center
 *  - Manhattan distance to center
 *  - A visual glowing compass needle rendered on a small <canvas>
 */

class CompassUI {
  /**
   * @param {HTMLElement} container   — Parent element for the compass widget
   */
  constructor(container) {
    this.container = container;
    this._build();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  _build() {
    this.container.innerHTML = `
      <h3 style="margin:0 0 8px;color:var(--gold);border-bottom:1px dashed var(--gold);padding-bottom:5px;">
        Nen Compass
      </h3>
      <canvas id="compass-canvas" width="100" height="100"
        style="display:block;margin:0 auto 8px;"></canvas>
      <div id="compass-direction"
        style="font-size:1.6rem;text-align:center;color:var(--gi-green-glow);
               font-weight:bold;text-shadow:0 0 10px var(--gi-green);letter-spacing:2px;">
        --
      </div>
      <div id="compass-distance"
        style="text-align:center;color:var(--text-light);font-size:0.85rem;margin-top:4px;">
        Distance: --
      </div>
    `;

    this._canvas = document.getElementById("compass-canvas");
    this._ctx = this._canvas.getContext("2d");
    this._dirEl = document.getElementById("compass-direction");
    this._distEl = document.getElementById("compass-distance");
  }

  _drawNeedle(angleDeg) {
    const ctx = this._ctx;
    const W = this._canvas.width;
    const H = this._canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const r = cx - 10;

    ctx.clearRect(0, 0, W, H);

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#2ea043";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#3fb950";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Cardinal labels
    ctx.font = "bold 10px Courier New";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labels = [["N", 0], ["E", 90], ["S", 180], ["W", 270]];
    for (const [label, deg] of labels) {
      const rad = (deg - 90) * (Math.PI / 180);
      ctx.fillStyle = "#3fb950";
      ctx.fillText(label, cx + (r - 12) * Math.cos(rad), cy + (r - 12) * Math.sin(rad));
    }

    // Needle
    const needleRad = (angleDeg - 90) * (Math.PI / 180);
    const tipX = cx + (r - 18) * Math.cos(needleRad);
    const tipY = cy + (r - 18) * Math.sin(needleRad);
    const tailX = cx - 10 * Math.cos(needleRad);
    const tailY = cy - 10 * Math.sin(needleRad);

    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(tipX, tipY);
    ctx.strokeStyle = "#d2a849";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#d2a849";
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#d2a849";
    ctx.fill();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Update the compass display.
   *
   * @param {{x:number,y:number}} player
   * @param {{x:number,y:number}} center
   */
  update(player, center) {
    const dx = center.x - player.x;
    const dy = center.y - player.y;
    const dist = Math.abs(dx) + Math.abs(dy);

    if (dist === 0) {
      this._dirEl.textContent = "★";
      this._distEl.textContent = "YOU ARE HERE";
      this._drawNeedle(0);
      return;
    }

    // Build direction label
    let dir = "";
    if (dy < 0) dir += "N";
    if (dy > 0) dir += "S";
    if (dx > 0) dir += "E";
    if (dx < 0) dir += "W";

    // Angle for needle: atan2 in screen coords (y increases downward)
    const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

    this._dirEl.textContent = dir;
    this._distEl.textContent = `Distance: ${dist}`;
    this._drawNeedle(angleDeg);
  }

  /**
   * Show the glow animation when within 3 cells of center (compass "glows").
   * @param {boolean} glowing
   */
  setGlow(glowing) {
    this._canvas.style.filter = glowing
      ? "drop-shadow(0 0 10px #d2a849)"
      : "none";
  }
}
