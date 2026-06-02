// Сохранение прогресса в localStorage.
// Структура: { [levelName]: { completed: boolean, bestScore: number } }
//
// Ключ — name уровня (а не индекс), потому что индекс может сдвинуться при
// добавлении/удалении уровней, а имя стабильно.

const KEY = "platformer-progress";

function readAll() {
  if (typeof localStorage === "undefined") return {};
  try {
    const s = localStorage.getItem(KEY);
    const obj = s ? JSON.parse(s) : {};
    return (obj && typeof obj === "object") ? obj : {};
  } catch { return {}; }
}

function writeAll(obj) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(obj)); }
  catch (e) { console.warn("progress: не удалось сохранить:", e.message); }
}

// Возвращает { completed, bestScore } или null если уровень ни разу не запускался.
export function getProgress(levelName) {
  const all = readAll();
  return all[levelName] ?? null;
}

// Отмечает уровень пройденным; обновляет bestScore, если новый счёт выше.
export function markCompleted(levelName, score) {
  const all = readAll();
  const prev = all[levelName] ?? { completed: false, bestScore: 0 };
  all[levelName] = {
    completed: true,
    bestScore: Math.max(prev.bestScore ?? 0, score ?? 0),
  };
  writeAll(all);
}

// Полная очистка прогресса (для меню «начать заново»).
export function resetProgress() {
  writeAll({});
}
