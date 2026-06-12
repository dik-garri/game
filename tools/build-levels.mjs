// Авторский генератор «интересных» уровней (E/M/H/X/Z) с многоуровневым
// рельефом. Каждый уровень спроектирован вручную через хелперы рельефа.
// Старые рисованные L-уровни (Разминка..Финал) НЕ трогаем — они эталон.
//
// Запуск:  node tools/build-levels.mjs
// JSON-файлы в levels/ — источник правды для игры; этот скрипт лишь авторская
// тулза для безошибочной генерации (ширина/проходимость проверяются тестом).
import { writeFile } from "node:fs/promises";

const W = 78, ROWS = 9, GROUND = 7; // базовая высота поверхности (ряд верха)
const LEGEND = { "=": "tile", "^": "spike", C: "coin", P: "player", F: "flag", ".": "empty" };

// surf[c] = ряд верхнего твёрдого тайла (4..8), или null = пропасть (лава).
function makeSurf() { return Array(W).fill(GROUND); }
const flat = (s, c0, c1, row) => { for (let c = c0; c <= c1; c++) s[c] = row; };
const gap  = (s, c0, c1)      => { for (let c = c0; c <= c1; c++) s[c] = null; };
// ступенчатый холм: пирамида с вершиной peak в центре c0..c1 (шаг 1/тайл).
function hill(s, c0, c1, peak) {
  const mid = (c0 + c1) / 2;
  for (let c = c0; c <= c1; c++) {
    const d = Math.round(Math.abs(c - mid));
    const row = Math.min(GROUND, peak + d);
    if (s[c] != null) s[c] = Math.min(s[c], row);
  }
}
// лестница: от row0 в c0 до row1 в c1, по 1 тайлу на ступень.
function stairs(s, c0, row0, row1) {
  const dir = row1 >= row0 ? 1 : -1, n = Math.abs(row1 - row0);
  for (let i = 0; i <= n; i++) { const c = c0 + i; if (c < W) s[c] = row0 + dir * i; }
}
// узкий столб-остров высотой row на колонке c (вокруг — пропасть).
const pillar = (s, c, row) => { s[c] = row; };

// Собирает уровень из surf + фич. spikes/coins — массивы колонок/{c,r}.
function build({ name, surf, spikes = [], coins = [], P, F, enemies = [], mp = [] }) {
  const g = Array.from({ length: ROWS }, () => Array(W).fill("."));
  for (let c = 0; c < W; c++) {
    if (surf[c] == null) continue;
    for (let r = surf[c]; r < ROWS; r++) g[r][c] = "=";
  }
  for (const c of spikes) { if (surf[c] == null) throw new Error(`${name}: шип над ямой col ${c}`); g[surf[c]][c] = "^"; }
  for (const { c, r } of coins) g[r][c] = "C";
  const place = (col, ch) => {
    if (surf[col] == null) throw new Error(`${name}: ${ch} над ямой col ${col}`);
    g[surf[col] - 1][col] = ch;
  };
  place(P, "P"); place(F, "F");
  const map = g.map((row) => row.join(""));
  for (const row of map) if (row.length !== W) throw new Error(`${name}: width ${row.length}`);
  return { name, tileSize: 32, legend: LEGEND, map, enemies, movingPlatforms: mp };
}

// coin-дорожка над поверхностью (ряд surf-2) на отрезке колонок с шагом step.
function coinArc(surf, c0, c1, step = 3, lift = 2) {
  const out = [];
  for (let c = c0; c <= c1; c += step) if (surf[c] != null) out.push({ c, r: Math.max(1, surf[c] - lift) });
  return out;
}

const levels = {};

// ===================== E — лёгкие, но с рельефом =====================

// E1: пологие холмы, без ям/врагов/шипов. Учит ходьбе и мелким подъёмам.
{
  const s = makeSurf();
  hill(s, 10, 22, 5);
  hill(s, 30, 44, 4);
  hill(s, 52, 66, 5);
  levels.E1 = build({ name: "Первые шаги", surf: s, P: 2, F: 75,
    coins: [...coinArc(s, 12, 20, 2), ...coinArc(s, 32, 42, 2), ...coinArc(s, 54, 64, 2)] });
}

// E2: один пологий лавовый разрыв (2) + остров-холм. Первый осознанный прыжок.
{
  const s = makeSurf();
  hill(s, 8, 18, 6);
  gap(s, 34, 35);
  hill(s, 40, 52, 5);
  gap(s, 60, 61);
  levels.E2 = build({ name: "Первый прыжок", surf: s, P: 2, F: 75,
    coins: [...coinArc(s, 10, 16, 2), { c: 34, r: 4 }, { c: 35, r: 4 }, ...coinArc(s, 42, 50, 2), { c: 70, r: 5 }] });
}

// E3: настоящая лестница вверх → плато с монетами → спуск. Без ям. Учит лазать.
{
  const s = makeSurf();
  stairs(s, 24, 7, 4); // подъём 7→4 на cols 24..27
  flat(s, 28, 40, 4);  // плато
  stairs(s, 41, 4, 7); // спуск 4→7
  levels.E3 = build({ name: "Ступеньки", surf: s, P: 2, F: 75,
    coins: [...coinArc(s, 28, 40, 2, 2), { c: 12, r: 5 }, { c: 60, r: 5 }, { c: 68, r: 5 }] });
}

// E4: холмы + один шип на вершине + один узкий разрыв. Аккуратность.
{
  const s = makeSurf();
  hill(s, 10, 20, 5);
  hill(s, 44, 56, 5);
  gap(s, 32, 34);
  levels.E4 = build({ name: "Холмы и шип", surf: s, P: 2, F: 75,
    spikes: [15, 50],
    coins: [{ c: 33, r: 4 }, ...coinArc(s, 11, 19, 2), ...coinArc(s, 45, 55, 2), { c: 68, r: 5 }] });
}

// E5: разнообразный рельеф (плато + впадина) + 1 враг на ровном участке + разрыв.
{
  const s = makeSurf();
  flat(s, 14, 24, 5);   // приподнятая площадка
  stairs(s, 11, 7, 5); stairs(s, 25, 5, 7);
  gap(s, 40, 42);
  hill(s, 50, 64, 5);
  levels.E5 = build({ name: "Первый враг", surf: s, P: 2, F: 75,
    coins: [...coinArc(s, 15, 23, 2), { c: 41, r: 4 }, ...coinArc(s, 52, 62, 2), { c: 70, r: 5 }],
    enemies: [{ x: 18, y: 4, patrol: [15, 23] }] });
}

// ===================== запись =====================
const names = Object.keys(levels);
for (const n of names) {
  await writeFile(`levels/${n}.json`, JSON.stringify(levels[n], null, 2));
  console.log("wrote", n, "—", levels[n].name);
}
