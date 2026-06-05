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

  const poses = [
    { armL: "out", armR: "out", legL: "plant", legR: "plant" }, // idle
    { armL: "up",  armR: "out", legL: "lift",  legR: "plant" }, // шаг A
    { armL: "out", armR: "up",  legL: "plant", legR: "lift"  }, // шаг B
  ];
  poses.forEach((pose, i) => drawHeroFrame(ctx, i * W, photoImg, pose));

  return canvas.toDataURL("image/png");
}

// Рисует один кадр героя со сдвигом ox по X.
function drawHeroFrame(ctx, ox, photoImg, pose) {
  const F = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(ox + x, y, w, h); };
  const disc = (color, cx, cy, r) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(ox + cx, cy, r, 0, Math.PI * 2); ctx.fill();
  };

  const HEAD = { cx: 14, cy: 14, r: 14 };

  // --- Ноги (рисуем первыми; lift = нога приподнята на 2px) ---
  drawLeg(F, 8, pose.legL === "lift");
  drawLeg(F, 15, pose.legR === "lift");

  // --- Ручки (out = в сторону и чуть вверх; up = поднята) ---
  drawArm(F, "L", pose.armL);
  drawArm(F, "R", pose.armR);

  // --- Голова: контур → кожа → круглое фото-лицо ---
  disc(COLORS.outline, HEAD.cx, HEAD.cy, HEAD.r);
  disc(COLORS.skin, HEAD.cx, HEAD.cy, HEAD.r - 1);

  const fr = HEAD.r - 2;
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

// Нога: x — левый край штанины (ширина 5). lift поднимает ступню на 2px.
function drawLeg(F, x, lift) {
  const top = 28;
  const bootH = 3;
  const legBottom = lift ? 34 : 36;       // приподнятая нога короче
  const pantsH = legBottom - bootH - top; // высота штанины
  F(COLORS.outline, x - 1, top - 1, 7, legBottom - top + 1);
  F(COLORS.overalls, x, top, 5, pantsH);
  F(COLORS.boot, x, legBottom - bootH, 5, bootH);
}

// Рука: side 'L'/'R'. pose 'out' — в сторону и чуть вверх; 'up' — поднята.
// Рисуем диагональную «лесенку» из 2 блоков, чтобы рука смотрела наружу-вверх.
function drawArm(F, side, pose) {
  const up = pose === "up";
  // Базовые координаты для левой руки; правую отзеркалим.
  // seg1 — у плеча, seg2 — кисть (выше и дальше наружу).
  const shoulderY = 25;
  const handY = up ? shoulderY - 6 : shoulderY - 3; // 'up' выше
  if (side === "L") {
    F(COLORS.outline, 3, shoulderY - 1, 4, 5);   // плечо-сегмент
    F(COLORS.skin, 4, shoulderY, 2, 3);
    F(COLORS.outline, 0, handY - 1, 4, 4);        // кисть наружу-вверх
    F(COLORS.skin, 1, handY, 2, 2);
  } else {
    F(COLORS.outline, 21, shoulderY - 1, 4, 5);
    F(COLORS.skin, 22, shoulderY, 2, 3);
    F(COLORS.outline, 24, handY - 1, 4, 4);
    F(COLORS.skin, 25, handY, 2, 2);
  }
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
