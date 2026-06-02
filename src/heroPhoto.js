// Кастомизация героя — фото игрока вместо стандартного спрайта.
// Хранится в localStorage как PNG dataURL заранее уменьшенный до размера
// игрока (по умолчанию 32×32 px), чтобы:
//   1. localStorage не распух (несколько КБ вместо мегабайтов).
//   2. Не пришлось пересчитывать ресайз каждый раз при загрузке.

const KEY = "platformer-hero-photo";

export function loadPhoto() {
  if (typeof localStorage === "undefined") return null;
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function clearPhoto() {
  if (typeof localStorage === "undefined") return;
  try { localStorage.removeItem(KEY); } catch {}
}

export function hasPhoto() {
  return !!loadPhoto();
}

// Принимает File (из <input type="file">) — обрезает по центру в квадрат,
// ресайзит до targetSize, сохраняет в localStorage как PNG dataURL.
// Возвращает сам dataURL.
export async function savePhoto(file, targetSize = 32) {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("Это не картинка");
  }
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  const min = Math.min(img.width, img.height);
  const sx = (img.width - min) / 2;
  const sy = (img.height - min) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, min, min, 0, 0, targetSize, targetSize);

  const out = canvas.toDataURL("image/png");
  try {
    localStorage.setItem(KEY, out);
  } catch (e) {
    throw new Error("Не удалось сохранить (квота localStorage?): " + e.message);
  }
  return out;
}

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
