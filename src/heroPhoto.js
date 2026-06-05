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

// ----- сборка спрайта (chibi: большая голова сверху, тело снизу) -----
// Координатная карта (28×30):
//   y 0..3   — шапка
//   y 3..21  — голова (рамка-кожа + фото-лицо внутри)
//   y 21..30 — тело: плечи/руки, комбинезон, ботинки
function composePlayerSprite(photoImg) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const F = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };

  // --- Голова: тёмный контур + кожа-рамка ---
  // Контур головы (на 1px шире кожи со всех сторон).
  F(COLORS.outline, 3, 2, 22, 20);
  // Кожа-основа головы.
  F(COLORS.skin, 4, 3, 20, 18);

  // --- Шапка поверх верха головы ---
  F(COLORS.cap, 4, 3, 20, 4);      // основная красная полоса
  F(COLORS.cap, 6, 1, 16, 2);      // макушка чуть выше
  F(COLORS.capShade, 4, 7, 20, 1); // тень под кромкой шапки (козырёк)

  // --- Лицо из фото: квадратный crop в окно головы ---
  const FACE = { x: 6, y: 8, w: 16, h: 12 };
  const min = Math.min(photoImg.width, photoImg.height);
  const sx = (photoImg.width - min) / 2;
  const sy = (photoImg.height - min) / 2;
  ctx.drawImage(photoImg, sx, sy, min, min, FACE.x, FACE.y, FACE.w, FACE.h);

  // --- Тело снизу (y 21..30) ---
  // Контур тела.
  F(COLORS.outline, 6, 21, 16, 9);
  // Плечи/руки (кожа) по бокам.
  F(COLORS.skin, 7, 22, 3, 5);
  F(COLORS.skin, 18, 22, 3, 5);
  // Комбинезон (синий) в центре.
  F(COLORS.overalls, 10, 22, 8, 8);
  F(COLORS.overallsShade, 10, 27, 8, 1); // тень внизу комбинезона
  // Лямки к плечам.
  F(COLORS.overalls, 10, 21, 2, 2);
  F(COLORS.overalls, 16, 21, 2, 2);
  // Пуговицы.
  F(COLORS.button, 11, 24, 2, 2);
  F(COLORS.button, 15, 24, 2, 2);
  // Ботинки (коричневые, две ноги, нижний ряд).
  F(COLORS.boot, 8, 28, 5, 2);
  F(COLORS.boot, 15, 28, 5, 2);

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
