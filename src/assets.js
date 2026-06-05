import { CONFIG } from "./config.js";

const T = CONFIG.tileSize;

// Реестр: ключ → размер текстуры в пикселях.
// Игрок выше тайла (42px): голова-круг крупная сверху, тело-коллизия 28×30 по
// центру (см. PLAYER_BODY и Player.js).
export const ASSET_KEYS = {
  player: { w: T - 4, h: 42 },
  enemy:  { w: T - 6, h: T - 6 },
  coin:   { w: T / 2, h: T / 2 },
  spike:  { w: T, h: T },
  tile:   { w: T, h: T },   // трава-сверху (верхний ряд земли)
  dirt:   { w: T, h: T },   // земля без травы (нижние ряды)
  lavaDeep: { w: T, h: T }, // глубокая лава (нижние ряды, статична)
  platform: { w: T * 2, h: T / 2 },
  flag:   { w: T, h: T },
};

// Кадры анимированной поверхности лавы (ключи lavaTop0..3).
export const LAVA_SURFACE_FRAMES = 4;

// Размер коллизионного тела игрока (центрируется в текстуре 28×42).
export const PLAYER_BODY = { w: T - 4, h: T - 2 }; // 28×30

// Вся графика рисуется кодом (никаких внешних ассетов). Единый «мультяшный»
// стиль: плоские заливки, мягкие тени, светлые блики, без жёстких рамок —
// чтобы тайлы стыковались бесшовно.
export function createPlaceholderTextures(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  drawDirt(g);
  drawGrass(g);
  drawLavaDeep(g);
  drawLavaSurface(g);
  drawSpike(g);
  drawCoin(g);
  drawPlatform(g);
  drawFlag(g);
  drawEnemy(g);
  drawDefaultPlayer(g);
  g.destroy();
}

// ----- палитра -----
const C = {
  dirt: 0xb06a3c, dirtDark: 0x8f5228, dirtLight: 0xc5895c,
  grass: 0x6abe30, grassDark: 0x4f9e24,
  steel: 0x9aa5b1, steelDark: 0x5b6470, steelTip: 0xe8edf2,
  lava: 0xff7b29, lavaDark: 0xd2491b, lavaTop: 0xffb43f, lavaBlob: 0xffd23f,
  gold: 0xffd24a, goldDark: 0xe0a81e, goldLight: 0xfff3b0,
  wood: 0x8a5a32, woodDark: 0x6d4526, woodLight: 0xb07a48,
  stone: 0x9aa0aa, stoneDark: 0x6c727c, stoneLight: 0xc3c8d0,
  flagRed: 0xe23b2e, flagWhite: 0xf5f5f5, pole: 0xcfd3da, poleDark: 0x9aa0aa,
  enemyBody: 0xc0392b, enemyBelly: 0xe8604f, enemyDark: 0x8e2920,
  skin: 0xf4c190, skinShade: 0xd99a63, hair: 0x6d4c2f,
  overalls: 0x2f6fc4, boot: 0xe23b2e, button: 0xffd54f, ink: 0x1a1014,
};

function tex(g, key, drawFn) {
  const { w, h } = ASSET_KEYS[key];
  g.clear();
  drawFn(w, h);
  g.generateTexture(key, w, h);
}

// ----- земля -----
function drawDirt(g) {
  tex(g, "dirt", (w, h) => {
    g.fillStyle(C.dirt, 1); g.fillRect(0, 0, w, h);
    g.fillStyle(C.dirtDark, 1);
    g.fillRect(6, 6, 3, 3); g.fillRect(22, 5, 3, 3); g.fillRect(13, 16, 3, 3);
    g.fillRect(24, 22, 3, 3); g.fillRect(5, 24, 3, 3);
    g.fillStyle(C.dirtLight, 1); g.fillRect(16, 11, 2, 2); g.fillRect(9, 20, 2, 2);
  });
}

function drawGrass(g) {
  tex(g, "tile", (w, h) => {
    g.fillStyle(C.dirt, 1); g.fillRect(0, 0, w, h);
    g.fillStyle(C.dirtDark, 1); g.fillRect(7, 16, 3, 3); g.fillRect(22, 22, 3, 3);
    g.fillStyle(C.grassDark, 1); g.fillRect(0, 0, w, 8);
    g.fillStyle(C.grass, 1); g.fillRect(0, 0, w, 5);
    g.fillStyle(C.grass, 1);
    g.fillRect(3, 8, 2, 2); g.fillRect(13, 8, 2, 2); g.fillRect(24, 8, 2, 2);
  });
}

// ----- лава: глубокий слой (статичный, тёмно-оранжевый, без яркой кромки) -----
function drawLavaDeep(g) {
  tex(g, "lavaDeep", (w, h) => {
    g.fillStyle(0xe65a1f, 1); g.fillRect(0, 0, w, h);
    g.fillStyle(C.lavaDark, 1);
    g.fillRect(5, 8, 3, 3); g.fillRect(20, 18, 3, 3); g.fillRect(12, 24, 2, 2);
    g.fillStyle(0xff8a3d, 1); g.fillRect(16, 6, 2, 2); g.fillRect(8, 20, 2, 2);
  });
}

// ----- лава: поверхность (4 кадра анимации, ключи lavaTop0..3) -----
// Яркая светящаяся кромка + пузыри, которые «бурлят» (двигаются по кадрам).
function drawLavaSurface(g) {
  const { w, h } = ASSET_KEYS.lavaDeep;
  for (let f = 0; f < LAVA_SURFACE_FRAMES; f++) {
    g.clear();
    // тело
    g.fillStyle(0xe65a1f, 1); g.fillRect(0, 0, w, h);
    g.fillStyle(C.lava, 1); g.fillRect(0, 0, w, 8);
    // светящаяся кромка с лёгкой «волной» по кадрам
    g.fillStyle(C.lavaTop, 1);
    g.fillRect(0, 0, w, 3);
    g.fillStyle(C.lavaBlob, 1);
    g.fillRect((f * 8) % w, 1, 5, 1);            // блик бежит по поверхности
    // пузыри, поднимающиеся/смещающиеся по кадрам
    const phase = f / LAVA_SURFACE_FRAMES;
    g.fillStyle(C.lavaBlob, 1);
    g.fillCircle(7 + f, 12 - f, 2);
    g.fillCircle(20 - f, 16 + (f % 2) * 2, 2);
    g.fillCircle(26, 10 + Math.round(phase * 4), 1.5);
    g.generateTexture(`lavaTop${f}`, w, h);
  }
}

// ----- шипы -----
function drawSpike(g) {
  tex(g, "spike", (w, h) => {
    g.fillStyle(C.steelDark, 1); g.fillRect(0, h - 5, w, 5);
    const n = 3, sw = w / n;
    for (let i = 0; i < n; i++) {
      const left = i * sw, cx = left + sw / 2, baseY = h - 3;
      g.fillStyle(C.steel, 1);
      g.fillTriangle(left + 1, baseY, cx, 2, left + sw - 1, baseY);
      g.fillStyle(C.steelDark, 1);
      g.fillTriangle(cx, 2, left + sw - 1, baseY, cx, baseY);
      g.fillStyle(C.steelTip, 1);
      g.fillTriangle(cx - 1, 5, cx, 2, cx + 1, 5);
    }
  });
}

// ----- монета -----
function drawCoin(g) {
  tex(g, "coin", (w, h) => {
    const r = w / 2;
    g.fillStyle(C.goldDark, 1); g.fillCircle(r, r, r);
    g.fillStyle(C.gold, 1); g.fillCircle(r, r, r - 1.5);
    g.fillStyle(C.goldDark, 1); g.fillRect(r - 1, 3, 2, w - 6); // прорезь-«номинал»
    g.fillStyle(C.goldLight, 1); g.fillCircle(r - 2, r - 2, 1.6); // блик
  });
}

// ----- движущаяся платформа (каменная плита) -----
function drawPlatform(g) {
  tex(g, "platform", (w, h) => {
    g.fillStyle(C.stone, 1); g.fillRoundedRect(0, 1, w, h - 1, 3);
    g.fillStyle(C.stoneLight, 1); g.fillRoundedRect(0, 1, w, 4, 3); // верхний блик
    g.fillStyle(C.stoneDark, 1); g.fillRect(0, h - 3, w, 3);         // нижняя тень
    g.fillStyle(C.stoneDark, 1);                                     // «болты»
    g.fillCircle(6, h / 2 + 1, 1.5); g.fillCircle(w - 6, h / 2 + 1, 1.5);
  });
}

// ----- финишный флаг (клетчатый на шесте) -----
function drawFlag(g) {
  tex(g, "flag", (w, h) => {
    // холмик-основание
    g.fillStyle(C.grassDark, 1); g.fillRoundedRect(2, h - 5, 18, 5, 2);
    g.fillStyle(C.grass, 1); g.fillRoundedRect(2, h - 6, 18, 3, 2);
    // шест
    g.fillStyle(C.poleDark, 1); g.fillRect(6, 3, 3, h - 8);
    g.fillStyle(C.pole, 1); g.fillRect(6, 3, 1, h - 8);
    // клетчатое полотно (3×3 клетки по 5px) справа от шеста
    const fx = 9, fy = 4, cs = 5, cols = 3, rows = 3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dark = (r + c) % 2 === 0;
        g.fillStyle(dark ? C.flagRed : C.flagWhite, 1);
        g.fillRect(fx + c * cs, fy + r * cs, cs, cs);
      }
    }
  });
}

// ----- враг (сердитый слизень) -----
function drawEnemy(g) {
  tex(g, "enemy", (w, h) => {
    g.fillStyle(C.enemyDark, 1); g.fillRoundedRect(2, 5, w - 4, h - 6, 8); // контур-тень
    g.fillStyle(C.enemyBody, 1); g.fillRoundedRect(2, 4, w - 4, h - 7, 8); // тело
    g.fillStyle(C.enemyBelly, 1); g.fillRoundedRect(5, 8, w - 10, 6, 4);   // светлое брюшко
    // глаза
    g.fillStyle(0xffffff, 1); g.fillCircle(9, 12, 3); g.fillCircle(w - 9, 12, 3);
    g.fillStyle(C.ink, 1); g.fillCircle(10, 13, 1.5); g.fillCircle(w - 8, 13, 1.5);
    // сердитые брови
    g.fillStyle(C.ink, 1);
    g.fillTriangle(5, 7, 12, 10, 5, 10);
    g.fillTriangle(w - 5, 7, w - 12, 10, w - 5, 10);
    // рот
    g.fillStyle(C.ink, 1); g.fillRect(9, 17, w - 18, 2);
    // ножки
    g.fillStyle(C.enemyDark, 1);
    g.fillRoundedRect(3, h - 4, 7, 4, 2); g.fillRoundedRect(w - 10, h - 4, 7, 4, 2);
  });
}

// ----- игрок по умолчанию (без фото) — милый персонаж -----
function drawDefaultPlayer(g) {
  tex(g, "player", (w, h) => {
    // торс-комбинезон
    g.fillStyle(C.ink, 1); g.fillRect(7, 24, 14, 10);
    g.fillStyle(C.overalls, 1); g.fillRect(8, 25, 12, 8);
    g.fillStyle(C.button, 1); g.fillRect(11, 28, 2, 2); g.fillRect(15, 28, 2, 2);
    // ботинки (красные)
    g.fillStyle(C.ink, 1); g.fillRect(7, 32, 6, 5); g.fillRect(15, 32, 6, 5);
    g.fillStyle(C.boot, 1); g.fillRect(8, 33, 5, 3); g.fillRect(15, 33, 5, 3);
    // голова
    g.fillStyle(C.ink, 1); g.fillCircle(14, 13, 13);
    g.fillStyle(C.skin, 1); g.fillCircle(14, 13, 12);
    // волосы-чёлка
    g.fillStyle(C.hair, 1); g.fillRoundedRect(5, 2, 18, 6, 3);
    // глаза
    g.fillStyle(C.ink, 1); g.fillCircle(10, 13, 1.7); g.fillCircle(18, 13, 1.7);
    // щёчки
    g.fillStyle(0xef9aa0, 1); g.fillCircle(8, 16, 1.6); g.fillCircle(20, 16, 1.6);
    // улыбка
    g.fillStyle(C.ink, 1);
    g.fillRect(11, 18, 6, 1); g.fillRect(10, 17, 1, 1); g.fillRect(17, 17, 1, 1);
  });
}
