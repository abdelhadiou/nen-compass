/**
 * AffinitySelector.js — Pre-game affinity selection screen
 *
 * Renders a styled card for each of the 6 Nen types,
 * showing the cost table row for that affinity.
 * Emits a "affinitySelected" custom event on the document when the player confirms.
 */

const AFFINITY_META = {
  Enhancer:    { emoji: "💪", desc: "Cheap in Enhancer & Emitter rooms. Struggles vs Manipulator.", color: "#ff4d4d" },
  Transmuter:  { emoji: "⚡", desc: "Best in Transmuter & Emitter rooms. Costly in Conjurer zones.", color: "#cc33ff" },
  Conjurer:    { emoji: "🔮", desc: "Excels in Conjurer & Specialist rooms. Sluggish in Transmuter.", color: "#ffcc00" },
  Manipulator: { emoji: "🎭", desc: "Fast in Manipulator rooms. Very slow in Enhancer zones.", color: "#99ccff" },
  Emitter:     { emoji: "🌊", desc: "Balanced everywhere (cost 1–4). Reliable across all Nen rooms.", color: "#33cc33" },
  Specialist:  { emoji: "✨", desc: "Excellent in Specialist & Conjurer rooms. Unpredictable otherwise.", color: "#ffffff" },
};

class AffinitySelector {
  /**
   * @param {HTMLElement} container   — Element to render into
   * @param {Function}    onSelect    — (affinity: string) => void
   */
  constructor(container, onSelect) {
    this.container = container;
    this.onSelect = onSelect;
    this._selected = "Enhancer";
    this._render();
  }

  _render() {
    this.container.innerHTML = `
      <div class="affinity-overlay">
        <div class="affinity-box">
          <h2 class="affinity-title">⚔ Choose Your Nen Affinity</h2>
          <p class="affinity-subtitle">Your aura type determines movement cost in each room.</p>
          <div class="affinity-cards" id="affinity-cards"></div>
          <button id="affinity-confirm" class="confirm-btn">Enter the Labyrinth</button>
        </div>
      </div>
    `;

    this._injectStyles();

    const cardsEl = document.getElementById("affinity-cards");
    for (const [name, meta] of Object.entries(AFFINITY_META)) {
      const card = document.createElement("div");
      card.className = "affinity-card" + (name === this._selected ? " selected" : "");
      card.dataset.affinity = name;
      card.style.setProperty("--nen-color", meta.color);
      card.innerHTML = `
        <div class="card-emoji">${meta.emoji}</div>
        <div class="card-name">${name}</div>
        <div class="card-desc">${meta.desc}</div>
      `;
      card.addEventListener("click", () => this._select(name));
      cardsEl.appendChild(card);
    }

    document.getElementById("affinity-confirm").addEventListener("click", () => {
      this.container.innerHTML = "";
      this.onSelect(this._selected);
    });
  }

  _select(name) {
    this._selected = name;
    document.querySelectorAll(".affinity-card").forEach((c) => {
      c.classList.toggle("selected", c.dataset.affinity === name);
    });
  }

  _injectStyles() {
    if (document.getElementById("affinity-styles")) return;
    const style = document.createElement("style");
    style.id = "affinity-styles";
    style.textContent = `
      .affinity-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.85);
        display: flex; align-items: center; justify-content: center;
        z-index: 1000;
      }
      .affinity-box {
        background: #161b22;
        border: 2px solid #2ea043;
        border-radius: 12px;
        padding: 32px;
        max-width: 700px; width: 90%;
        box-shadow: 0 0 40px rgba(46,160,67,0.4);
      }
      .affinity-title {
        color: #d2a849; margin: 0 0 6px;
        text-align: center; letter-spacing: 2px;
        text-shadow: 0 0 10px #d2a849;
      }
      .affinity-subtitle {
        color: #888; text-align: center; margin: 0 0 20px; font-size: 0.9rem;
      }
      .affinity-cards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 24px;
      }
      .affinity-card {
        background: #0d1117;
        border: 2px solid #333;
        border-radius: 8px;
        padding: 14px 10px;
        cursor: pointer;
        text-align: center;
        transition: all 0.2s;
      }
      .affinity-card:hover {
        border-color: var(--nen-color);
        box-shadow: 0 0 12px var(--nen-color);
      }
      .affinity-card.selected {
        border-color: var(--nen-color);
        background: rgba(255,255,255,0.05);
        box-shadow: 0 0 20px var(--nen-color);
      }
      .card-emoji { font-size: 1.8rem; margin-bottom: 4px; }
      .card-name  { font-weight: bold; color: var(--nen-color); margin-bottom: 4px; }
      .card-desc  { font-size: 0.72rem; color: #aaa; line-height: 1.3; }
      .confirm-btn {
        display: block; width: 100%;
        background: transparent; color: #d2a849;
        border: 2px solid #d2a849;
        padding: 12px; font-size: 1rem;
        font-family: 'Courier New', monospace;
        cursor: pointer; letter-spacing: 2px;
        border-radius: 6px;
        transition: all 0.3s;
      }
      .confirm-btn:hover {
        background: #d2a849; color: #0d1117;
        box-shadow: 0 0 20px #d2a849;
      }
    `;
    document.head.appendChild(style);
  }
}
