# Greed Island: The Nen Compass
**Challenge 02 — Real-Time Pathfinding Maze Game**

> *"The compass points to the center, but not the shortest path. Trust it for direction, not for steps."* — Kurapika

---

## How to Play

1. Unzip the project folder.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge).
3. Select your **Nen Affinity** — this determines your movement cost in each room.
4. Click **Enter Labyrinth**.
5. Click adjacent (non-diagonal) cells to move your character (cyan circle).
6. Reach the **★ center cell** (or within 1 cell of it) before the **Shadow Hunter** (red circle) does.

---

## Game Mechanics

| Feature | Description |
|---|---|
| **20 × 20 Maze** | Procedurally generated via DFS backtracking — always solvable |
| **Nen Affinities** | 6 types; your affinity vs. room type determines movement cost (1–5) |
| **Fog of War** | Only 2-cell radius visible; previously visited cells stay revealed |
| **Nen Compass** | Animated needle + direction label points toward center |
| **Suggested Path** | Cyan overlay shows your A\* best path after each move |
| **Shadow Hunter** | Emitter AI moves 1 step/sec using perfect A\* toward center |
| **Win Condition** | Reach center (or ≤ 1 Manhattan distance) before the Hunter |

---

## Affinity Cost Table

| Your \ Room | Enhancer | Transmuter | Conjurer | Manipulator | Emitter | Specialist |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Enhancer**    | 1 | 3 | 4 | 5 | 2 | 4 |
| **Transmuter**  | 3 | 1 | 5 | 4 | 2 | 4 |
| **Conjurer**    | 4 | 5 | 1 | 3 | 4 | 2 |
| **Manipulator** | 5 | 4 | 3 | 1 | 4 | 3 |
| **Emitter**     | 2 | 2 | 4 | 4 | 1 | 4 |
| **Specialist**  | 4 | 4 | 2 | 3 | 4 | 1 |

> Lower cost = faster movement. Walls are impassable.

---

## Project Structure

```
nen-compass/
├── index.html                 Main HTML shell + script loading order
├── style.css                  Dark HxH-themed UI styles
├── app.js                     Game loop, state, input, win detection
├── algorithm/
│   ├── aStar.js               Standalone A* implementation (exported for reuse)
│   ├── mazeGenerator.js       DFS backtracking maze generator
│   ├── fogOfWar.js            FogOfWar class — visibility & memory map
│   └── opponentAI.js          OpponentAI class — Shadow Hunter behaviour
└── components/
    ├── GridCanvas.js           Canvas renderer (cells, entities, path overlay)
    ├── CompassUI.js            Animated compass needle widget
    └── AffinitySelector.js     Pre-game affinity picker with cards
```

> **Note:** `app.js` contains its own inlined A\* and maze generator so the game runs from a single origin without a module bundler. The `algorithm/` files are standalone reference implementations that document the logic independently.

---

## Strategy Tips

- **Enhancer** is great for open maps — cost 1 in Enhancer rooms, 2 in Emitter.
- **Emitter** is the safest all-rounder (never costs more than 4).
- The **Shadow Hunter is Emitter** — it's fast in open corridors. Use narrow walls to force it around longer routes.
- The cyan **path overlay** recalculates after every move — follow it for the optimal route given your affinity.
- The compass **glows gold** when you're within 3 cells of the center.

---

*Built for the ELEC Greed Island Hackathon — Challenge 02.*
