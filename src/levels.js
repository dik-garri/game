// Загружает встроенные уровни из levels/*.json и опубликованные пользовательские
// из localStorage. Работает в обеих средах: браузер (fetch) и Node (fs) для тестов.
//
// Структура каталога:
//   levels/index.json — ["L1", "L2", ...]  (порядок появления в меню)
//   levels/L1.json    — { name, tileSize, legend, map, enemies, movingPlatforms }
//   localStorage["platformer-published-levels"] — массив таких же объектов
//
// Куда добавить новый уровень в код:
//   1) Положить levels/L6.json
//   2) Дописать "L6" в levels/index.json
// Уровни из конструктора публикуются в localStorage кнопкой «💾 Сохранить» —
// в src не пишутся, чтобы не требовать бэкенда.

const PUBLISHED_KEY = "platformer-published-levels";

async function loadJson(relPath) {
  // URL относительно этого модуля — работает и в браузере (fetch), и в Node (fs).
  // Так путь не зависит от того, под каким префиксом игра обслуживается.
  const url = new URL(relPath, import.meta.url);
  if (typeof window !== "undefined") {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Не удалось загрузить ${url}: ${r.status}`);
    return r.json();
  }
  const { readFile } = await import("node:fs/promises");
  return JSON.parse(await readFile(url, "utf8"));
}

async function loadBuiltIn() {
  const names = await loadJson("../levels/index.json");
  return Promise.all(names.map((n) => loadJson(`../levels/${n}.json`)));
}

function loadPublished() {
  if (typeof localStorage === "undefined") return [];
  try {
    const s = localStorage.getItem(PUBLISHED_KEY);
    const arr = s ? JSON.parse(s) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

const builtIn = await loadBuiltIn();
const published = loadPublished();

export const LEVELS = [...builtIn, ...published];
export const BUILTIN_COUNT = builtIn.length;
export const PUBLISHED_LEVELS_KEY = PUBLISHED_KEY;

// Помощник для EditorScene/MenuScene: сохранить или обновить уровень в опубликованных
// (поиск по name; если найден — заменяет, иначе добавляет).
export function publishLevel(level) {
  const arr = loadPublished();
  const i = arr.findIndex((l) => l.name === level.name);
  // Глубокая копия, чтобы дальнейшие правки в редакторе не задели хранилище.
  const clone = JSON.parse(JSON.stringify(level));
  if (i >= 0) arr[i] = clone; else arr.push(clone);
  localStorage.setItem(PUBLISHED_KEY, JSON.stringify(arr));
  return arr;
}

export function unpublishLevel(name) {
  const arr = loadPublished().filter((l) => l.name !== name);
  localStorage.setItem(PUBLISHED_KEY, JSON.stringify(arr));
  return arr;
}

// Возвращает свежий список опубликованных (не из кэша LEVELS, а из localStorage).
export function getPublishedLevels() {
  return loadPublished();
}
