// Кастомизация героя — Mario-style спрайт с фото лица.
//
// Когда юзер загружает фото, мы НЕ кладём его «как есть» в текстуру игрока,
// а собираем композит 28×30: шапка → лицо (=фото) → тельце-комбинезон →
// ручки → ножки-ботинки. Получается узнаваемый персонаж-платформер с лицом
// игрока, а не «летающий аватар».
//
// Готовый спрайт сохраняется в localStorage как PNG dataURL.

const KEY = "platformer-hero-photo";

// Размеры финального спрайта — должны совпадать с ASSET_KEYS.player в assets.js.
const W = 28;
const H = 30;

// Прямоугольник «лица» внутри спрайта (куда вписывается фото).
const FACE = { x: 8, y: 4, w: 12, h: 10 };

// Палитра тела — классические Mario-цвета.
const COLORS = {
  cap: "#d62828",       // красная шапка
  capDark: "#9d2222",   // тень козырька
  shirt: "#d62828",     // красная рубашка
  overalls: "#2a5d9e",  // синий комбинезон
  button: "#ffd54f",    // жёлтые пуговицы
  skin: "#f4c190",      // подложка под лицо (если фото с прозрачностью)
  arm: "#f4c190",       // кожа рук
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

// ----- сборка спрайта -----
function composePlayerSprite(photoImg) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 1. Шапка (рядом 0-2 и козырёк-полоска шире на ряду 3).
  ctx.fillStyle = COLORS.cap;
  ctx.fillRect(8, 0, 12, 3);
  ctx.fillStyle = COLORS.capDark;
  ctx.fillRect(6, 3, 16, 1);

  // 2. Подложка под лицо (на случай прозрачного фото).
  ctx.fillStyle = COLORS.skin;
  ctx.fillRect(FACE.x, FACE.y, FACE.w, FACE.h);

  // 3. Лицо из фото — вписываем квадратный crop в FACE-прямоугольник.
  // Pixel-art consistency: nearest-neighbor для всех ресайзов.
  ctx.imageSmoothingEnabled = false;
  const min = Math.min(photoImg.width, photoImg.height);
  const sx = (photoImg.width - min) / 2;
  const sy = (photoImg.height - min) / 2;
  ctx.drawImage(photoImg, sx, sy, min, min, FACE.x, FACE.y, FACE.w, FACE.h);

  // 4. Рубашка (красная, ряды 14-17).
  ctx.fillStyle = COLORS.shirt;
  ctx.fillRect(6, 14, 16, 4);

  // 5. Руки (кожа, по бокам рубашки).
  ctx.fillStyle = COLORS.arm;
  ctx.fillRect(4, 15, 2, 5);
  ctx.fillRect(22, 15, 2, 5);

  // 6. Комбинезон (синий, ряды 18-25). Накрывает низ рубашки.
  ctx.fillStyle = COLORS.overalls;
  ctx.fillRect(8, 17, 12, 9);

  // 7. Пуговицы комбинезона.
  ctx.fillStyle = COLORS.button;
  ctx.fillRect(10, 19, 2, 2);
  ctx.fillRect(16, 19, 2, 2);

  // 8. Лямки комбинезона (от верха комбинезона до плеч).
  ctx.fillStyle = COLORS.overalls;
  ctx.fillRect(9, 14, 2, 4);
  ctx.fillRect(17, 14, 2, 4);

  // 9. Ботинки (коричневые, 2 ноги, ряды 26-29).
  ctx.fillStyle = COLORS.boot;
  ctx.fillRect(7, 26, 6, 4);
  ctx.fillRect(15, 26, 6, 4);

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
