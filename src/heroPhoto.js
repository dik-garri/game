// Кастомизация героя — chibi Mario-style спрайт с фото лица.
//
// Пропорции «большая голова»: голова/лицо занимают верхние ~60% спрайта,
// маленькое тело-комбинезон снизу. Так фото читается крупно и узнаваемо,
// а персонаж выглядит как милый платформер-герой, а не «летающее лицо».
//
// Готовый спрайт сохраняется в localStorage как PNG dataURL.

const KEY = "platformer-hero-photo";

// Размеры финального спрайта — должны совпадать с ASSET_KEYS.player в assets.js.
const W = 28;
const H = 30;

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

// ----- сборка спрайта: большое круглое лицо + ноги -----
// Координатная карта (28×30):
//   y 1..23  — голова-круг (контур + кожа + круглое фото-лицо)
//   y 23..30 — две ноги в ботинках
function composePlayerSprite(photoImg) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const F = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const disc = (color, cx, cy, r) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  };

  const HEAD = { cx: 14, cy: 12, r: 12 };

  // --- Ноги (рисуем ПЕРВЫМИ, чтобы голова перекрыла их верх) ---
  F(COLORS.outline, 8, 22, 13, 8);     // тёмный контур тела-ног
  F(COLORS.overalls, 9, 23, 4, 4);     // левая штанина
  F(COLORS.overalls, 15, 23, 4, 4);    // правая штанина
  F(COLORS.boot, 9, 27, 4, 3);         // левый ботинок
  F(COLORS.boot, 15, 27, 4, 3);        // правый ботинок

  // --- Голова: контур-круг → кожа-круг → круглое фото-лицо ---
  disc(COLORS.outline, HEAD.cx, HEAD.cy, HEAD.r);       // тёмный ободок
  disc(COLORS.skin, HEAD.cx, HEAD.cy, HEAD.r - 1);      // кожа (виден тонкий ободок)

  // Лицо: клип по кругу (r-2), фото вписывается в bounding box.
  const fr = HEAD.r - 2; // радиус лица
  ctx.save();
  ctx.beginPath();
  ctx.arc(HEAD.cx, HEAD.cy, fr, 0, Math.PI * 2);
  ctx.clip();
  const min = Math.min(photoImg.width, photoImg.height);
  const sx = (photoImg.width - min) / 2;
  const sy = (photoImg.height - min) / 2;
  ctx.drawImage(photoImg, sx, sy, min, min,
    HEAD.cx - fr, HEAD.cy - fr, fr * 2, fr * 2);
  ctx.restore();

  return canvas.toDataURL("image/png");
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
