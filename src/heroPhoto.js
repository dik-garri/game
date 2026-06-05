// Кастомизация героя — chibi Mario-style спрайт с фото лица.
//
// Пропорции «большая голова»: голова/лицо занимают верхние ~60% спрайта,
// маленькое тело-комбинезон снизу. Так фото читается крупно и узнаваемо,
// а персонаж выглядит как милый платформер-герой, а не «летающее лицо».
//
// Готовый спрайт сохраняется в localStorage как PNG dataURL.

const KEY = "platformer-hero-photo";

// Размер текстуры игрока — должен совпадать с ASSET_KEYS.player в assets.js.
const W = 28;
const H = 42;

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
// Координатная карта (28×42):
//   y 0..28  — голова-круг (контур + кожа + круглое фото-лицо, диаметр ~26)
//   y 27..42 — две ноги в ботинках
function composePlayerSprite(photoImg) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;     // гладкий портрет, не пиксельная каша
  ctx.imageSmoothingQuality = "high";
  const F = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const disc = (color, cx, cy, r) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  };

  const HEAD = { cx: 14, cy: 14, r: 14 }; // круг почти во всю ширину

  // --- Ноги (рисуем ПЕРВЫМИ, голова перекроет их верх) ---
  // Низ ног на y36 = низ коллизии (28×30 центрирована, тело y6..36), чтобы
  // ботинки стояли на земле, а не уходили в тайл.
  F(COLORS.outline, 7, 27, 14, 9);     // тёмный контур ног
  F(COLORS.overalls, 8, 28, 5, 5);     // левая штанина
  F(COLORS.overalls, 15, 28, 5, 5);    // правая штанина
  F(COLORS.boot, 8, 33, 5, 3);         // левый ботинок
  F(COLORS.boot, 15, 33, 5, 3);        // правый ботинок

  // --- Ручки по бокам (под головой, у плеч) ---
  F(COLORS.outline, 3, 25, 4, 7);      // контур левой руки
  F(COLORS.skin, 4, 26, 2, 5);         // левая рука (кожа)
  F(COLORS.outline, 21, 25, 4, 7);     // контур правой руки
  F(COLORS.skin, 22, 26, 2, 5);        // правая рука (кожа)

  // --- Голова: контур-круг → кожа-круг → круглое фото-лицо ---
  disc(COLORS.outline, HEAD.cx, HEAD.cy, HEAD.r);       // тёмный ободок
  disc(COLORS.skin, HEAD.cx, HEAD.cy, HEAD.r - 1);      // кожа (тонкий ободок)

  // Лицо: клип по кругу (r-2 ≈ 12 → диаметр 24), фото в bounding box.
  const fr = HEAD.r - 2;
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
