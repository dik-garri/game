import { CONFIG, COLORS } from "./config.js";

const T = CONFIG.tileSize;

// Реестр: ключ → размер текстуры в пикселях.
// Игрок выше тайла (42px): голова-круг крупная сверху, тело-коллизия 28×30 по
// центру (см. PLAYER_BODY и Player.js). Так лицо занимает больше ЛОГИЧЕСКИХ
// пикселей на экране — а это потолок детализации при image-rendering: pixelated.
export const ASSET_KEYS = {
  player: { w: T - 4, h: 42 },
  enemy:  { w: T - 6, h: T - 6 },
  coin:   { w: T / 2, h: T / 2 },
  spike:  { w: T, h: T },
  tile:   { w: T, h: T },
  platform: { w: T * 2, h: T / 2 },
  flag:   { w: T, h: T },
};

// Размер коллизионного тела игрока (центрируется в текстуре 28×42).
export const PLAYER_BODY = { w: T - 4, h: T - 2 }; // 28×30 — как было

// Спрайты Kenney (18×18, CC0). Имена ключей соответствуют ASSET_KEYS.
// «spike» в паке нет — генерируется placeholder-треугольником.
export const SPRITE_FILES = {
  player:   "assets/sprites/player.png",
  enemy:    "assets/sprites/enemy.png",
  coin:     "assets/sprites/coin.png",
  tile:     "assets/sprites/tile.png",
  platform: "assets/sprites/platform.png",
  flag:     "assets/sprites/flag.png",
};

// Регистрирует все placeholder-текстуры (используются как фолбэк, если
// картинка не загрузилась, и для спайка, которого в паке нет).
export function createPlaceholderTextures(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  const rect = (key, color) => {
    const { w, h } = ASSET_KEYS[key];
    g.clear(); g.fillStyle(color, 1); g.fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
  };

  rect("player", COLORS.player);
  rect("enemy", COLORS.enemy);
  rect("tile", COLORS.tile);
  rect("platform", COLORS.platform);
  rect("flag", COLORS.flag);

  // монета — круг
  {
    const { w } = ASSET_KEYS.coin;
    g.clear(); g.fillStyle(COLORS.coin, 1); g.fillCircle(w / 2, w / 2, w / 2);
    g.generateTexture("coin", w, w);
  }

  // шип — три металлических зубца на основании (спрайта в паке Kenney нет)
  {
    const { w, h } = ASSET_KEYS.spike;
    const STEEL = 0x9aa5b1, STEEL_DARK = 0x5b6470, TIP = 0xe8edf2;
    g.clear();
    // основание
    g.fillStyle(STEEL_DARK, 1);
    g.fillRect(0, h - 5, w, 5);
    // 3 зубца
    const n = 3, sw = w / n;
    for (let i = 0; i < n; i++) {
      const left = i * sw, cx = left + sw / 2, baseY = h - 3;
      g.fillStyle(STEEL, 1);
      g.fillTriangle(left + 1, baseY, cx, 2, left + sw - 1, baseY);
      // тёмная правая грань — объём
      g.fillStyle(STEEL_DARK, 1);
      g.fillTriangle(cx, 2, left + sw - 1, baseY, cx, baseY);
      // светлый кончик
      g.fillStyle(TIP, 1);
      g.fillTriangle(cx - 1, 5, cx, 2, cx + 1, 5);
    }
    g.generateTexture("spike", w, h);
  }

  g.destroy();
}

// Берёт загруженный спрайт по ключу `${key}_raw` (см. preload в BootScene)
// и сохраняет его под `key`, отмасштабировав до целевых размеров ASSET_KEYS.
// pixelArt: true в конфиге обеспечивает nearest-neighbor — масштабирование
// остаётся резким, без размытия.
//
// Если raw-текстуры нет (файл не загрузился) — оставляем placeholder, который
// уже зарегистрирован под этим же ключом.
export function applyLoadedSprites(scene) {
  for (const key of Object.keys(SPRITE_FILES)) {
    // player: сохраняем пропорции (contain), чтобы квадратный Kenney-спрайт не
    // растягивался в высокий 28×42. Остальным — растяжение (нужно платформе 64×16).
    upscaleRawIntoKey(scene, `${key}_raw`, key, { contain: key === "player" });
  }
}

// Утилита: rawKey → upscale до размера ASSET_KEYS[targetKey] → сохраняем
// под targetKey, заменив старую текстуру (если была).
// opts.contain — вписать с сохранением пропорций (по центру), иначе растянуть.
export function upscaleRawIntoKey(scene, rawKey, targetKey, opts = {}) {
  if (!scene.textures.exists(rawKey)) return false;
  const { w, h } = ASSET_KEYS[targetKey];
  const rt = scene.add.renderTexture(0, 0, w, h).setVisible(false);
  const img = scene.add.image(0, 0, rawKey).setOrigin(0.5).setVisible(false);

  if (opts.contain) {
    const src = scene.textures.get(rawKey).getSourceImage();
    const scale = Math.min(w / src.width, h / src.height);
    img.setDisplaySize(src.width * scale, src.height * scale);
    rt.draw(img, w / 2, h / 2); // центрируем
  } else {
    img.setDisplaySize(w, h);
    rt.draw(img, w / 2, h / 2);
  }

  if (scene.textures.exists(targetKey)) scene.textures.remove(targetKey);
  rt.saveTexture(targetKey);
  img.destroy();
  rt.destroy();
  return true;
}
