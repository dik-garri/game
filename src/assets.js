import { CONFIG, COLORS } from "./config.js";

const T = CONFIG.tileSize;

// Реестр: ключ → размеры. Используется и при генерации placeholder, и при
// апскейле загруженных спрайтов.
export const ASSET_KEYS = {
  player: { w: T - 4, h: T - 2 },
  enemy:  { w: T - 6, h: T - 6 },
  coin:   { w: T / 2, h: T / 2 },
  spike:  { w: T, h: T },
  tile:   { w: T, h: T },
  platform: { w: T * 2, h: T / 2 },
  flag:   { w: T, h: T },
};

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

  // шип — треугольник (постоянный placeholder, спрайта в паке Kenney нет)
  {
    const { w, h } = ASSET_KEYS.spike;
    g.clear(); g.fillStyle(COLORS.spike, 1);
    g.beginPath(); g.moveTo(0, h); g.lineTo(w / 2, 0); g.lineTo(w, h);
    g.closePath(); g.fillPath();
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
    const rawKey = `${key}_raw`;
    if (!scene.textures.exists(rawKey)) continue;
    const { w, h } = ASSET_KEYS[key];
    const rt = scene.add.renderTexture(0, 0, w, h).setVisible(false);
    const img = scene.add.image(0, 0, rawKey).setOrigin(0).setVisible(false);
    img.setDisplaySize(w, h);
    rt.draw(img, 0, 0);
    // Заменяем placeholder в кэше текстур: удаляем старый, сохраняем новый.
    if (scene.textures.exists(key)) scene.textures.remove(key);
    rt.saveTexture(key);
    img.destroy();
    rt.destroy();
  }
}
