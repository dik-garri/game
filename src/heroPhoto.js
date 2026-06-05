// Кастомизация героя — chibi Mario-style спрайт с фото лица.
//
// Пропорции «большая голова»: голова/лицо занимают верхние ~60% спрайта,
// маленькое тело-комбинезон снизу. Так фото читается крупно и узнаваемо,
// а персонаж выглядит как милый платформер-герой, а не «летающее лицо».
//
// Готовый спрайт сохраняется в localStorage как PNG dataURL.

const KEY = "platformer-hero-photo";

// Размер ОДНОГО кадра — должен совпадать с ASSET_KEYS.player в assets.js.
const W = 28;
const H = 42;

// Спрайт-лист: кадр 0 = idle, кадры 1–2 = шаги ходьбы. Экспортируется,
// чтобы BootScene загрузил dataURL как spritesheet с этими размерами.
export const PLAYER_FRAMES = { frameWidth: W, frameHeight: H, count: 3 };

// Палитра — классические Mario-цвета + контур.
const COLORS = {
  outline: "#1a1014",   // тёмный контур силуэта
  cap: "#e23b2e",       // красная шапка
  capShade: "#a82018",  // тень шапки/козырёк
  skin: "#f4c190",      // кожа (рамка лица, руки)
  overalls: "#2f6fc4",  // синий комбинезон
  overallsShade: "#214f8e",
  button: "#ffd54f",    // жёлтые пуговицы
  boot: "#5d3a1a",      // коричневые ботинки
};

export function loadPhoto() {
  if (typeof localStorage === "undefined") return null;
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function clearPhoto() {
  if (typeof localStorage === "undefined") return;
  try { localStorage.removeItem(KEY); } catch {}
}
export function hasPhoto() { return !!loadPhoto(); }

// Читает File от <input type="file"> и возвращает dataURL (для передачи в
// crop-оверлей). Бросает, если файл не картинка.
export async function fileToImageDataUrl(file) {
  if (!file || !file.type?.startsWith("image/")) throw new Error("Это не картинка");
  return fileToDataUrl(file);
}

// Принимает уже обрезанное (квадратное) изображение, собирает Mario-style
// спрайт с лицом из него и сохраняет композит в localStorage.
export function composeAndSave(croppedImg) {
  const composite = composePlayerSprite(croppedImg);
  try {
    localStorage.setItem(KEY, composite);
  } catch (e) {
    throw new Error("Не удалось сохранить: " + e.message);
  }
  return composite;
}

// ----- сборка спрайт-листа (3 кадра по 28×42) -----
// Кадр 0 — idle (руки разведены и приподняты, ноги ровно).
// Кадр 1 — шаг A (левая рука выше, левая нога поднята).
// Кадр 2 — шаг B (правая рука выше, правая нога поднята).
function composePlayerSprite(photoImg) {
  const canvas = document.createElement("canvas");
  canvas.width = W * PLAYER_FRAMES.count;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // hi/lo — высота руки, up/down — поднята ли ступня.
  const poses = [
    { armL: "hi", armR: "hi", bootL: "down", bootR: "down" }, // idle: обе руки вверх
    { armL: "hi", armR: "lo", bootL: "up",   bootR: "down" }, // шаг A
    { armL: "lo", armR: "hi", bootL: "down", bootR: "up"   }, // шаг B
  ];
  poses.forEach((pose, i) => drawHeroFrame(ctx, i * W, photoImg, pose));

  return canvas.toDataURL("image/png");
}

// Рисует один кадр героя со сдвигом ox по X.
// Слои снизу вверх: руки → торс-комбинезон → ботинки → голова с лицом.
function drawHeroFrame(ctx, ox, photoImg, pose) {
  const F = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(ox + x, y, w, h); };
  const disc = (color, cx, cy, r) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(ox + cx, cy, r, 0, Math.PI * 2); ctx.fill();
  };

  const HEAD = { cx: 14, cy: 13, r: 13 };

  // --- Руки (вверх-в стороны от торса; рисуем первыми) ---
  drawArm(F, "L", pose.armL);
  drawArm(F, "R", pose.armR);

  // --- Торс-комбинезон (даёт рукам опору, соединяет голову и ноги) ---
  F(COLORS.outline, 7, 24, 14, 10);     // контур торса (y24..34)
  F(COLORS.overalls, 8, 25, 12, 8);     // комбинезон (y25..33)
  F(COLORS.button, 11, 28, 2, 2);       // пуговицы
  F(COLORS.button, 15, 28, 2, 2);

  // --- Ботинки (две ноги; up = ступня приподнята на 2px) ---
  drawBoot(F, 8, pose.bootL === "up");
  drawBoot(F, 15, pose.bootR === "up");

  // --- Голова: контур → кожа → круглое фото-лицо ---
  disc(COLORS.outline, HEAD.cx, HEAD.cy, HEAD.r);
  disc(COLORS.skin, HEAD.cx, HEAD.cy, HEAD.r - 1);

  const fr = HEAD.r - 2; // радиус лица ≈ 11 → диаметр 22
  ctx.save();
  ctx.beginPath();
  ctx.arc(ox + HEAD.cx, HEAD.cy, fr, 0, Math.PI * 2);
  ctx.clip();
  const min = Math.min(photoImg.width, photoImg.height);
  const sx = (photoImg.width - min) / 2;
  const sy = (photoImg.height - min) / 2;
  ctx.drawImage(photoImg, sx, sy, min, min,
    ox + HEAD.cx - fr, HEAD.cy - fr, fr * 2, fr * 2);
  ctx.restore();
}

// Рука: вертикальная конечность сбоку от торса, вверх. hi — поднята выше, lo — ниже.
// Левая у x4..8, правая у x20..24 — наружу от торса (x8..20).
function drawArm(F, side, height) {
  const handTop = height === "hi" ? 16 : 22;
  const bottom = 28; // у торса
  const len = bottom - handTop;
  if (side === "L") {
    F(COLORS.outline, 4, handTop - 1, 4, len + 2);
    F(COLORS.skin, 5, handTop, 2, len);
  } else {
    F(COLORS.outline, 20, handTop - 1, 4, len + 2);
    F(COLORS.skin, 21, handTop, 2, len);
  }
}

// Ботинок: x — левый край (ширина 5). up поднимает ступню на 2px.
// Низ опущенной ступни на y36 = низ коллизии (тело 28×30 центрировано: y6..36).
function drawBoot(F, x, up) {
  const bottom = up ? 34 : 36;
  F(COLORS.outline, x - 1, bottom - 4, 7, 5);
  F(COLORS.boot, x, bottom - 3, 5, 3);
}

// ----- утилиты -----
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error ?? new Error("FileReader error"));
    r.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Не удалось распарсить картинку"));
    img.src = src;
  });
}
