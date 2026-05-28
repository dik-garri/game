// Проверяет, что в каждом уровне физически возможно дойти от P до F.
// Не запускает Phaser — строит граф «стенд-поинтов» (клеток, где игрок может
// стоять) и BFS-ом проверяет связность с учётом дальности прыжка.
//
// Источники цифр прыжка (см. src/config.js):
//   jumpVelocity = -560, gravity = 1200, playerSpeed = 220, tileSize = 32.
// Максимальная высота прыжка: v²/(2g) = 130.67 px ≈ 4.08 тайла → 4 тайла вверх.
// Максимальная горизонталь зависит от разницы высот; ниже — таблица для dy
// в тайлах (положительное = прыжок ВВЕРХ). Спуск вниз ограничен мягче.
//
// Эти числа — теоретический максимум по формулам, округлённые ВНИЗ. Дают
// небольшой реалистичный запас неточности игрока (~0.4 тайла).
import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS } from "../src/levels.js";

// Теория (jumpVelocity=560, gravity=1200, playerSpeed=220, tileSize=32):
// dy=0: 6.4 тайла, dy=-1: 6.8, dy=-2: 7.1, dy=+1: 6.0, dy=+2: 5.5, dy=+3: 4.9, dy=+4: 3.7.
// Цифры ниже — теоретический предел минус 1 тайл "на неточность игрока".
// Тест ловит реально невозможные участки, не "сложно вытянуть идеальный прыжок".
const MAX_JUMP_UP_TILES = 4;
function maxJumpDx(dy) {
  if (dy > MAX_JUMP_UP_TILES) return -1;
  if (dy >= 0) return [5, 5, 4, 3, 2][dy]; // вверх (или горизонтально)
  if (dy === -1) return 6;
  if (dy === -2) return 6;
  return 7; // глубже dy=-3 — больше воздуха
}

function findChar(grid, ch) {
  for (let r = 0; r < grid.length; r++) {
    const c = grid[r].indexOf(ch);
    if (c >= 0) return [r, c];
  }
  return null;
}

// Строит множество «стенд-поинтов» — клеток (row, col), где игрок может стоять.
// Считаются: клетка над любым '=' тайлом + диапазоны движущихся платформ.
function buildStandPoints(level) {
  const grid = level.map;
  const W = grid[0].length;
  const stands = new Set();
  const key = (r, c) => `${r},${c}`;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === "=" && r > 0) stands.add(key(r - 1, c));
    }
  }
  for (const p of level.movingPlatforms ?? []) {
    if (p.axis === "x") {
      for (let c = p.x - p.range; c <= p.x + p.range; c++) {
        if (c >= 0 && c < W) stands.add(key(p.y - 1, c));
      }
    } else {
      // Y-axis: платформа на колонке p.x, по высотам [p.y - range, p.y + range]
      for (let yr = p.y - p.range; yr <= p.y + p.range; yr++) {
        if (yr > 0) stands.add(key(yr - 1, p.x));
      }
    }
  }
  return stands;
}

// Можно ли допрыгнуть с (r1,c1) на (r2,c2)?
function canJumpTo(r1, c1, r2, c2) {
  const dy = r1 - r2; // > 0 если прыжок ВВЕРХ
  const max = maxJumpDx(dy);
  if (max < 0) return false;
  return Math.abs(c2 - c1) <= max;
}

function isLevelReachable(level) {
  const stands = buildStandPoints(level);
  const grid = level.map;
  const pPos = findChar(grid, "P");
  const fPos = findChar(grid, "F");
  if (!pPos || !fPos) return { ok: false, reason: "missing P or F" };

  const key = (r, c) => `${r},${c}`;
  // P-стенд: клетка с P считается стартовой даже если массив stands её не содержит.
  stands.add(key(pPos[0], pPos[1]));

  // Победа: игрок коснулся флага → достаточно достичь любой клетки в 3×3 окрестности F
  // (флаг физически 32×32, body игрока ±14 px — соседние клетки точно дадут overlap).
  const isWinCell = (r, c) =>
    Math.abs(r - fPos[0]) <= 1 && Math.abs(c - fPos[1]) <= 1;

  const visited = new Set([key(pPos[0], pPos[1])]);
  const queue = [[pPos[0], pPos[1]]];
  const standsList = [...stands].map((s) => s.split(",").map(Number));

  while (queue.length) {
    const [r, c] = queue.shift();
    if (isWinCell(r, c)) return { ok: true, visited: visited.size };

    for (const [nr, nc] of standsList) {
      const k = key(nr, nc);
      if (visited.has(k)) continue;
      if (!canJumpTo(r, c, nr, nc)) continue;
      visited.add(k);
      queue.push([nr, nc]);
    }
  }

  return {
    ok: false,
    reason: `F at (${fPos[0]},${fPos[1]}) недостижим от P at (${pPos[0]},${pPos[1]})`,
    visited: visited.size,
    totalStands: stands.size,
  };
}

test("каждый уровень проходим: путь от P до F существует", () => {
  const failures = [];
  for (const level of LEVELS) {
    const r = isLevelReachable(level);
    if (!r.ok) failures.push(`"${level.name}": ${r.reason} (visited=${r.visited}/${r.totalStands})`);
  }
  assert.equal(failures.length, 0, "Непроходимые уровни:\n  " + failures.join("\n  "));
});

test("у каждого уровня есть ровно один P и ровно один F", () => {
  for (const level of LEVELS) {
    const all = level.map.join("");
    const pCount = (all.match(/P/g) ?? []).length;
    const fCount = (all.match(/F/g) ?? []).length;
    assert.equal(pCount, 1, `Уровень "${level.name}": P count = ${pCount}`);
    assert.equal(fCount, 1, `Уровень "${level.name}": F count = ${fCount}`);
  }
});

test("у каждого врага под траекторией патруля есть пол", () => {
  for (const level of LEVELS) {
    let pRow = -1;
    for (let r = 0; r < level.map.length; r++)
      if (level.map[r].includes("P")) pRow = r;
    const floorRow = level.map[pRow + 1];
    for (const en of level.enemies ?? []) {
      const [a, b] = en.patrol;
      const slice = floorRow.slice(a, b + 1);
      const allFloor = [...slice].every((c) => c === "=" || c === "^");
      assert.ok(
        allFloor,
        `Уровень "${level.name}": враг patrol [${a},${b}] стоит над "${slice}"`
      );
    }
  }
});
