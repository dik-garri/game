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
// цепочка островов над лавой: острова шириной iw, разрывы gw, на высоте row.
// Возвращает центры островов (для монет/врагов).
function islands(s, c0, c1, iw, gw, row) {
  gap(s, c0, c1); // сперва вся зона — лава
  const centers = [];
  let c = c0;
  while (c <= c1) {
    const end = Math.min(c + iw - 1, c1);
    for (let x = c; x <= end; x++) s[x] = row;
    centers.push(Math.floor((c + end) / 2));
    c = end + 1 + gw;
  }
  return centers;
}

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

// ===================== M — средние (рельеф + лава + враги) =====================

// M1: холмы + 2 лавовых разрыва + враг на плато.
{
  const s = makeSurf();
  hill(s, 8, 18, 5);
  gap(s, 26, 28);
  flat(s, 34, 46, 5); stairs(s, 31, 7, 5); stairs(s, 47, 5, 7);
  gap(s, 56, 58);
  hill(s, 64, 72, 6);
  levels.M1 = build({ name: "Тропинка", surf: s, P: 2, F: 75,
    coins: [...coinArc(s, 35, 45, 2), { c: 27, r: 4 }, { c: 57, r: 4 }, ...coinArc(s, 10, 16, 3)],
    enemies: [{ x: 40, y: 4, patrol: [35, 45] }] });
}

// M2: череда плато-островов над лавой (прыжки), 1 враг.
{
  const s = makeSurf();
  const ctr = islands(s, 18, 60, 6, 3, 6);
  flat(s, 30, 34, 5);
  levels.M2 = build({ name: "Перепрыжки", surf: s, P: 2, F: 75,
    coins: ctr.map((c) => ({ c, r: 4 })),
    enemies: [{ x: ctr[0], y: 5, patrol: [ctr[0] - 2, ctr[0] + 2] }] });
}

// M3: широкий лавовый разрыв через движущуюся X-платформу + холмы, 1 враг.
{
  const s = makeSurf();
  hill(s, 8, 18, 6);
  gap(s, 34, 41);                 // широкая лава — только через платформу
  hill(s, 50, 64, 5);
  levels.M3 = build({ name: "Платформа", surf: s, P: 2, F: 75,
    coins: [{ c: 37, r: 3 }, { c: 38, r: 3 }, ...coinArc(s, 52, 62, 2), ...coinArc(s, 10, 16, 3)],
    enemies: [{ x: 56, y: 4, patrol: [52, 62] }],
    mp: [{ x: 37, y: 5, axis: "x", range: 4, speed: 80 }] });
}

// M4: холмы с шипами на вершинах + 2 разрыва + враг.
{
  const s = makeSurf();
  hill(s, 10, 20, 5); hill(s, 30, 40, 5); hill(s, 56, 68, 5);
  gap(s, 24, 26); gap(s, 46, 48);
  levels.M4 = build({ name: "Шипы и ямы", surf: s, P: 2, F: 75,
    spikes: [15, 35],
    coins: [{ c: 25, r: 4 }, { c: 47, r: 4 }, ...coinArc(s, 57, 67, 2)],
    enemies: [{ x: 62, y: 4, patrol: [57, 67] }] });
}

// M5: плато, впадина, пара столбов над лавой, 2 врага, движущаяся платформа.
{
  const s = makeSurf();
  flat(s, 10, 20, 5); stairs(s, 7, 7, 5); stairs(s, 21, 5, 7);
  gap(s, 30, 40); pillar(s, 33, 5); pillar(s, 37, 5); // два столба-острова
  hill(s, 48, 60, 5);
  gap(s, 66, 68);
  levels.M5 = build({ name: "Разогрев", surf: s, P: 2, F: 75,
    spikes: [54],
    coins: [...coinArc(s, 11, 19, 2), { c: 33, r: 3 }, { c: 37, r: 3 }, ...coinArc(s, 49, 59, 2), { c: 67, r: 4 }],
    enemies: [{ x: 15, y: 4, patrol: [11, 19] }, { x: 54, y: 4, patrol: [49, 59] }],
    mp: [{ x: 35, y: 5, axis: "y", range: 2, speed: 70 }] });
}

// ===================== H — продвинутые =====================

// H1: тройка островов-столбов над лавой + 2 врага + шипы + X-платформа.
{
  const s = makeSurf();
  hill(s, 6, 14, 6);
  const ctr = islands(s, 22, 50, 4, 3, 5);
  hill(s, 58, 70, 5);
  levels.H1 = build({ name: "Связка", surf: s, P: 2, F: 75,
    spikes: [10],
    coins: [...ctr.map((c) => ({ c, r: 3 })), ...coinArc(s, 60, 68, 2)],
    enemies: [{ x: ctr[0], y: 4, patrol: [ctr[0] - 1, ctr[0] + 1] }, { x: 64, y: 4, patrol: [60, 68] }],
    mp: [{ x: 54, y: 5, axis: "x", range: 3, speed: 85 }] });
}

// H2: два широких разрыва, каждый через Y-платформу + плато + враг + шипы.
{
  const s = makeSurf();
  flat(s, 8, 16, 5);
  gap(s, 22, 29);
  flat(s, 34, 46, 5);
  gap(s, 52, 59);
  hill(s, 64, 72, 6);
  levels.H2 = build({ name: "Качели", surf: s, P: 2, F: 75,
    spikes: [40],
    coins: [{ c: 25, r: 3 }, { c: 55, r: 3 }, ...coinArc(s, 35, 45, 3)],
    enemies: [{ x: 12, y: 4, patrol: [9, 15] }],
    mp: [{ x: 25, y: 5, axis: "y", range: 2, speed: 70 }, { x: 55, y: 5, axis: "y", range: 2, speed: 70 }] });
}

// H3: «гребёнка» — чередование высоких и низких площадок с шипами + 2 врага + разрывы.
{
  const s = makeSurf();
  flat(s, 10, 14, 5); flat(s, 20, 24, 5); flat(s, 44, 48, 5); flat(s, 54, 58, 5);
  gap(s, 32, 34); gap(s, 64, 66);
  levels.H3 = build({ name: "Гребёнка", surf: s, P: 2, F: 75,
    spikes: [12, 22, 46, 56],
    coins: [{ c: 33, r: 4 }, { c: 65, r: 4 }, ...coinArc(s, 36, 42, 3)],
    enemies: [{ x: 28, y: 6, patrol: [27, 30] }, { x: 70, y: 6, patrol: [68, 73] }] });
}

// H4: два разрыва подряд с островком между + шипы + 2 врага + X-платформа.
{
  const s = makeSurf();
  hill(s, 6, 14, 6);
  gap(s, 20, 23); pillar(s, 26, 5); gap(s, 28, 31);
  flat(s, 38, 50, 5);
  gap(s, 58, 64);
  levels.H4 = build({ name: "Двойной прыжок", surf: s, P: 2, F: 75,
    spikes: [43],
    coins: [{ c: 26, r: 3 }, ...coinArc(s, 39, 49, 2), { c: 61, r: 3 }],
    enemies: [{ x: 44, y: 4, patrol: [39, 49] }, { x: 70, y: 6, patrol: [68, 73] }],
    mp: [{ x: 61, y: 5, axis: "x", range: 3, speed: 90 }] });
}

// H5: длинный маршрут — лестница на высокое плато, спуск по столбам, разрывы, 2 врага, 2 платформы.
{
  const s = makeSurf();
  stairs(s, 8, 7, 4); flat(s, 12, 22, 4); stairs(s, 23, 4, 7);
  const ctr = islands(s, 30, 46, 3, 3, 5);
  gap(s, 54, 60);
  hill(s, 64, 72, 5);
  levels.H5 = build({ name: "Перед бурей", surf: s, P: 2, F: 75,
    spikes: [16],
    coins: [...coinArc(s, 13, 21, 2), ...ctr.map((c) => ({ c, r: 3 })), ...coinArc(s, 65, 71, 2)],
    enemies: [{ x: 17, y: 3, patrol: [13, 21] }, { x: 68, y: 4, patrol: [65, 71] }],
    mp: [{ x: 57, y: 5, axis: "x", range: 3, speed: 90 }, { x: ctr[1], y: 4, axis: "y", range: 2, speed: 70 }] });
}

// ===================== X — сложные (< L) =====================

// X1: много островов над лавой + 3 врага + шипы + X-платформа.
{
  const s = makeSurf();
  hill(s, 4, 12, 6);
  const ctr = islands(s, 18, 58, 4, 3, 5);
  hill(s, 64, 72, 5);
  levels.X1 = build({ name: "Шторм", surf: s, P: 2, F: 75,
    spikes: [8, ctr[1], ctr[3]],
    coins: ctr.map((c) => ({ c, r: 3 })),
    enemies: [{ x: ctr[0], y: 4, patrol: [ctr[0] - 1, ctr[0] + 1] }, { x: ctr[2], y: 4, patrol: [ctr[2] - 1, ctr[2] + 1] }, { x: 68, y: 4, patrol: [65, 71] }],
    mp: [{ x: 60, y: 5, axis: "x", range: 2, speed: 95 }] });
}

// X2: длинное лавовое озеро через цепь столбов + Y-платформы, 3 врага.
{
  const s = makeSurf();
  flat(s, 4, 12, 5);
  const ctr = islands(s, 16, 64, 2, 3, 5);
  flat(s, 68, 74, 6);
  levels.X2 = build({ name: "Лавовые мосты", surf: s, P: 2, F: 75,
    coins: ctr.map((c) => ({ c, r: 3 })),
    enemies: [{ x: 8, y: 4, patrol: [5, 11] }, { x: 71, y: 5, patrol: [69, 73] }, { x: ctr[2], y: 4, patrol: [ctr[2], ctr[2]] }],
    mp: [{ x: ctr[3], y: 4, axis: "y", range: 2, speed: 85 }, { x: ctr[6] ?? ctr[5], y: 4, axis: "y", range: 2, speed: 85 }] });
}

// X3: длинный спайк-гаунтлет на плато + разрывы + 2 врага + платформа.
{
  const s = makeSurf();
  flat(s, 8, 60, 5); stairs(s, 5, 7, 5); stairs(s, 61, 5, 7);
  gap(s, 30, 32); gap(s, 48, 50);
  levels.X3 = build({ name: "Гаунтлет", surf: s, P: 2, F: 75,
    spikes: [14, 20, 26, 38, 44, 56],
    coins: [{ c: 31, r: 3 }, { c: 49, r: 3 }, ...coinArc(s, 64, 72, 3)],
    enemies: [{ x: 35, y: 4, patrol: [34, 37] }, { x: 70, y: 6, patrol: [68, 73] }],
    mp: [{ x: 31, y: 4, axis: "x", range: 2, speed: 95 }] });
}

// X4: вертикальные башни (высокие столбы), подъём через Y-платформы над лавой, 3 врага.
{
  const s = makeSurf();
  flat(s, 4, 10, 6);
  gap(s, 14, 70);
  pillar(s, 18, 6); pillar(s, 19, 6);
  pillar(s, 30, 5); pillar(s, 31, 5);
  pillar(s, 44, 4); pillar(s, 45, 4);
  pillar(s, 58, 5); pillar(s, 59, 5);
  flat(s, 72, 75, 6);
  levels.X4 = build({ name: "Башни", surf: s, P: 2, F: 74,
    coins: [{ c: 18, r: 4 }, { c: 30, r: 3 }, { c: 44, r: 2 }, { c: 58, r: 3 }],
    enemies: [{ x: 7, y: 5, patrol: [5, 9] }, { x: 73, y: 5, patrol: [72, 74] }, { x: 18, y: 5, patrol: [18, 19] }],
    mp: [{ x: 24, y: 5, axis: "x", range: 3, speed: 95 }, { x: 38, y: 4, axis: "x", range: 3, speed: 95 }, { x: 52, y: 4, axis: "x", range: 3, speed: 95 }, { x: 65, y: 5, axis: "x", range: 3, speed: 95 }] });
}

// X5: комбо всех мотивов — острова, шипы, разрывы, 3 врага, платформы.
{
  const s = makeSurf();
  hill(s, 4, 12, 6);
  const a = islands(s, 18, 34, 3, 3, 5);
  flat(s, 40, 50, 4); stairs(s, 37, 7, 4); stairs(s, 51, 4, 7);
  const b = islands(s, 56, 70, 3, 3, 5);
  levels.X5 = build({ name: "Финал++", surf: s, P: 2, F: 75,
    spikes: [8, 45],
    coins: [...a.map((c) => ({ c, r: 3 })), ...coinArc(s, 41, 49, 2), ...b.map((c) => ({ c, r: 3 }))],
    enemies: [{ x: a[0], y: 4, patrol: [a[0] - 1, a[0] + 1] }, { x: 45, y: 3, patrol: [41, 49] }, { x: b[1], y: 4, patrol: [b[1] - 1, b[1] + 1] }],
    mp: [{ x: 53, y: 4, axis: "x", range: 2, speed: 100 }] });
}

// ===================== Z — хардкор (> L) =====================

// Z1: плотный гаунтлет столбов над большим озером + 4 врага + шипы + платформы.
{
  const s = makeSurf();
  flat(s, 2, 8, 6);
  const ctr = islands(s, 12, 66, 3, 3, 5);
  flat(s, 70, 75, 6);
  levels.Z1 = build({ name: "Преисподняя", surf: s, P: 3, F: 74,
    spikes: [5, ctr[1], ctr[3], ctr[5], 72],
    coins: ctr.map((c) => ({ c, r: 3 })),
    enemies: [{ x: 4, y: 5, patrol: [3, 6] }, { x: ctr[0], y: 4, patrol: [ctr[0], ctr[0]] }, { x: ctr[2], y: 4, patrol: [ctr[2], ctr[2]] }, { x: ctr[4], y: 4, patrol: [ctr[4], ctr[4]] }, { x: 73, y: 5, patrol: [71, 74] }],
    mp: [{ x: 30, y: 4, axis: "y", range: 2, speed: 90 }, { x: 50, y: 4, axis: "y", range: 2, speed: 90 }] });
}

// Z2: почти сплошная лава, переход по узким островам + Y-платформы, 4 врага.
{
  const s = makeSurf();
  flat(s, 2, 8, 5);
  const ctr = islands(s, 12, 60, 2, 3, 5);
  flat(s, 66, 75, 6);
  levels.Z2 = build({ name: "Море лавы", surf: s, P: 3, F: 74,
    spikes: [5, 7, 68, 72],
    coins: ctr.map((c) => ({ c, r: 3 })),
    enemies: [{ x: 4, y: 4, patrol: [3, 6] }, { x: 70, y: 5, patrol: [67, 73] }, { x: ctr[1], y: 4, patrol: [ctr[1], ctr[1]] }, { x: ctr[3], y: 4, patrol: [ctr[3], ctr[3]] }, { x: ctr[5], y: 4, patrol: [ctr[5], ctr[5]] }],
    mp: [{ x: ctr[2], y: 4, axis: "y", range: 2, speed: 95 }, { x: ctr[4], y: 4, axis: "y", range: 2, speed: 95 }, { x: ctr[6], y: 4, axis: "y", range: 2, speed: 95 }] });
}

// Z3: длинный спайк-гаунтлет + разрывы + башни, 4 врага, платформы.
{
  const s = makeSurf();
  flat(s, 6, 64, 5); stairs(s, 3, 7, 5); stairs(s, 65, 5, 7);
  gap(s, 22, 24); gap(s, 38, 40); gap(s, 54, 56);
  levels.Z3 = build({ name: "Игольное ушко", surf: s, P: 2, F: 75,
    spikes: [10, 12, 16, 18, 28, 30, 34, 44, 46, 50, 60, 62],
    coins: [{ c: 23, r: 3 }, { c: 39, r: 3 }, { c: 55, r: 3 }, ...coinArc(s, 68, 73, 3)],
    enemies: [{ x: 8, y: 4, patrol: [7, 9] }, { x: 27, y: 4, patrol: [26, 27] }, { x: 43, y: 4, patrol: [42, 43] }, { x: 59, y: 4, patrol: [58, 59] }, { x: 71, y: 6, patrol: [69, 73] }],
    mp: [{ x: 23, y: 4, axis: "x", range: 2, speed: 100 }, { x: 39, y: 4, axis: "x", range: 2, speed: 100 }, { x: 55, y: 4, axis: "x", range: 2, speed: 100 }] });
}

// Z4: высокие многоуровневые башни + подъёмы по Y-платформам над лавой, 4 врага, шипы.
{
  const s = makeSurf();
  flat(s, 2, 8, 6);
  gap(s, 12, 72);
  pillar(s, 16, 6); pillar(s, 17, 6);
  pillar(s, 26, 5); pillar(s, 27, 5);
  pillar(s, 38, 4); pillar(s, 39, 4);
  pillar(s, 50, 3); pillar(s, 51, 3);
  pillar(s, 62, 4); pillar(s, 63, 4);
  flat(s, 73, 75, 6);
  levels.Z4 = build({ name: "Вертикаль", surf: s, P: 3, F: 74,
    spikes: [4, 6],
    coins: [{ c: 16, r: 4 }, { c: 26, r: 3 }, { c: 38, r: 2 }, { c: 50, r: 1 }, { c: 62, r: 2 }],
    enemies: [{ x: 5, y: 5, patrol: [3, 7] }, { x: 16, y: 5, patrol: [16, 17] }, { x: 26, y: 4, patrol: [26, 27] }, { x: 38, y: 3, patrol: [38, 39] }, { x: 74, y: 5, patrol: [73, 74] }],
    mp: [{ x: 21, y: 5, axis: "x", range: 3, speed: 100 }, { x: 32, y: 4, axis: "x", range: 3, speed: 100 }, { x: 44, y: 3, axis: "x", range: 3, speed: 100 }, { x: 56, y: 3, axis: "x", range: 3, speed: 100 }, { x: 67, y: 4, axis: "x", range: 3, speed: 100 }] });
}

// Z5: АД — всё сразу: озёра-острова, спайки, башни, 5 врагов, 5 платформ.
{
  const s = makeSurf();
  flat(s, 2, 7, 6);
  const a = islands(s, 11, 27, 2, 3, 5);
  flat(s, 32, 36, 4); stairs(s, 29, 7, 4); stairs(s, 37, 4, 7);
  const b = islands(s, 42, 58, 2, 3, 5);
  hill(s, 64, 72, 5);
  levels.Z5 = build({ name: "АД", surf: s, P: 3, F: 75,
    spikes: [5, 34, 68],
    coins: [...a.map((c) => ({ c, r: 3 })), ...coinArc(s, 33, 35, 1, 3), ...b.map((c) => ({ c, r: 3 }))],
    enemies: [{ x: 5, y: 5, patrol: [3, 7] }, { x: a[1], y: 4, patrol: [a[1], a[1]] }, { x: 34, y: 3, patrol: [32, 36] }, { x: b[1], y: 4, patrol: [b[1], b[1]] }, { x: 68, y: 4, patrol: [65, 71] }],
    mp: [{ x: a[2] ?? a[1], y: 4, axis: "y", range: 2, speed: 100 }, { x: 40, y: 4, axis: "x", range: 2, speed: 105 }, { x: b[0], y: 4, axis: "y", range: 2, speed: 100 }, { x: b[2] ?? b[1], y: 4, axis: "y", range: 2, speed: 100 }, { x: 60, y: 4, axis: "x", range: 2, speed: 105 }] });
}

// ===================== запись =====================
const names = Object.keys(levels);
for (const n of names) {
  await writeFile(`levels/${n}.json`, JSON.stringify(levels[n], null, 2));
  console.log("wrote", n, "—", levels[n].name);
}
