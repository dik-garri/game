import { CONFIG, COLORS } from "./config.js";

const T = CONFIG.tileSize;

// Реестр: ключ → размеры. Используется и при генерации, и как контракт
// для будущих спрайтов (см. ASSETS.md).
export const ASSET_KEYS = {
  player: { w: T - 4, h: T - 2 },
  enemy:  { w: T - 6, h: T - 6 },
  coin:   { w: T / 2, h: T / 2 },
  spike:  { w: T, h: T },
  tile:   { w: T, h: T },
  platform: { w: T * 2, h: T / 2 },
  flag:   { w: T, h: T },
};

// Генерирует placeholder-текстуры. Вызывается из BootScene.
// ЗАМЕНА НА СПРАЙТЫ: заменить тело этой функции на scene.load.image/spritesheet
// (см. ASSETS.md). Остальной код ссылается на текстуры по ключам и не меняется.
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

  // шип — треугольник
  {
    const { w, h } = ASSET_KEYS.spike;
    g.clear(); g.fillStyle(COLORS.spike, 1);
    g.beginPath(); g.moveTo(0, h); g.lineTo(w / 2, 0); g.lineTo(w, h);
    g.closePath(); g.fillPath();
    g.generateTexture("spike", w, h);
  }

  g.destroy();
}
