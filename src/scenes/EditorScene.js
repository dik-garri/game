// Конструктор уровней. Рисует сетку в Phaser, всю мета-информацию (имя, размеры,
// враги, платформы) редактирует через HTML-панель справа от холста (см. index.html).
//
// Связь HTML ↔ Phaser:
//   - EditorScene держит ОДНО состояние уровня (this.level).
//   - HTML-инпуты управляются через document API; обработчики ставим в create(),
//     снимаем в shutdown.
//   - Все изменения проходят через методы сцены (paintCell, addEnemy, …),
//     которые обновляют this.level и перерисовывают.

import { CONFIG } from "../config.js";

const LEGEND = {
  "=": "tile", "^": "spike", C: "coin", P: "player", F: "flag", ".": "empty",
};

function blankLevel(w = 78, h = 10, name = "Новый уровень") {
  return {
    name, tileSize: CONFIG.tileSize, legend: LEGEND,
    map: Array.from({ length: h }, () => ".".repeat(w)),
    enemies: [], movingPlatforms: [],
  };
}

// Нормализует загруженный уровень — заполняет недостающие поля и приводит к нужным размерам.
function normalizeLevel(raw) {
  const base = blankLevel();
  return {
    ...base,
    ...raw,
    legend: LEGEND,
    map: (raw.map ?? base.map).map((r) => String(r)),
    enemies: raw.enemies ?? [],
    movingPlatforms: raw.movingPlatforms ?? [],
  };
}

const STORAGE_KEY = "platformer-editor-level";

export class EditorScene extends Phaser.Scene {
  constructor() { super("Editor"); }

  init(data) {
    if (data?.level) this.level = normalizeLevel(data.level);
    else this.level = this.loadFromStorage() ?? blankLevel();
    this.currentTool = "=";
    this.handlers = []; // [{el, type, fn}] для снятия в shutdown
  }

  create() {
    const T = CONFIG.tileSize;
    this.cameras.main.setBackgroundColor(0x1e2a3a);
    this.updateWorldBounds();

    // Группы для перерисовки сетки/сущностей.
    this.gridGroup = this.add.group();
    this.entityGroup = this.add.group();
    this.renderAll();

    // Сетка-направляющая (тонкие линии) — visual grid.
    this.drawGridLines();

    // Курсор-обводка под мышью.
    this.cursor = this.add.rectangle(0, 0, T, T)
      .setStrokeStyle(2, 0xffd54f, 0.9)
      .setOrigin(0)
      .setDepth(1000);

    // Ввод: мышь над холстом.
    this.input.on("pointermove", (p) => this.updateCursor(p));
    this.input.on("pointerdown", (p) => this.handleClick(p));

    // Стрелки — панорамирование камеры (мир шире холста).
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D");

    // Цифры — выбор инструмента.
    this.input.keyboard.on("keydown", (e) => this.onKey(e));

    // Подсветка инструмента и подсказка поверх камеры.
    this.toolText = this.add.text(16, 12, "", { fontSize: "16px", color: "#ffd54f" })
      .setScrollFactor(0).setDepth(1000);
    this.add.text(16, 36, "1-5/0=инструмент  WASD/стрелки=панорама  click=поставить",
      { fontSize: "12px", color: "#b0bec5" })
      .setScrollFactor(0).setDepth(1000);

    this.setupHtmlPanel();
    this.syncPanelFromLevel();
    this.refreshToolLabel();
  }

  shutdown() {
    document.body.classList.remove("editor-mode");
    // Снять все HTML-обработчики.
    for (const { el, type, fn } of this.handlers) el.removeEventListener(type, fn);
    this.handlers = [];
  }

  // ---- камера/мир ----
  updateWorldBounds() {
    const T = CONFIG.tileSize;
    const W = this.level.map[0].length * T;
    const H = this.level.map.length * T;
    this.cameras.main.setBounds(0, 0, W, H);
    this.physics?.world?.setBounds?.(0, 0, W, H);
  }

  // ---- отрисовка ----
  drawGridLines() {
    if (this.gridLines) this.gridLines.destroy();
    const T = CONFIG.tileSize;
    const W = this.level.map[0].length * T;
    const H = this.level.map.length * T;
    const g = this.add.graphics().lineStyle(1, 0x2c3e50, 0.5);
    for (let x = 0; x <= W; x += T) { g.lineBetween(x, 0, x, H); }
    for (let y = 0; y <= H; y += T) { g.lineBetween(0, y, W, y); }
    g.setDepth(-1);
    this.gridLines = g;
  }

  renderAll() {
    this.renderGrid();
    this.renderEntities();
  }

  renderGrid() {
    this.gridGroup.clear(true, true);
    const T = CONFIG.tileSize;
    const TEX_BY_CHAR = { "=": "tile", "^": "spike", C: "coin", P: "player", F: "flag" };
    for (let r = 0; r < this.level.map.length; r++) {
      const row = this.level.map[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        const tex = TEX_BY_CHAR[ch];
        if (!tex) continue;
        const img = this.add.image(c * T + T / 2, r * T + T / 2, tex);
        this.gridGroup.add(img);
      }
    }
  }

  renderEntities() {
    this.entityGroup.clear(true, true);
    const T = CONFIG.tileSize;
    for (const en of this.level.enemies) {
      const x = en.x * T + T / 2, y = en.y * T + T / 2;
      const img = this.add.image(x, y, "enemy").setAlpha(0.85);
      // линия патруля
      const y2 = y + 4;
      const l = this.add.line(0, 0,
        en.patrol[0] * T + T / 2, y2,
        en.patrol[1] * T + T / 2, y2,
        0xe53935, 0.6
      ).setOrigin(0, 0).setDepth(0);
      this.entityGroup.add(img); this.entityGroup.add(l);
    }
    for (const p of this.level.movingPlatforms) {
      const x = p.x * T + T / 2, y = p.y * T + T / 2;
      const img = this.add.image(x, y, "platform").setAlpha(0.85);
      // линия диапазона
      let line;
      const range = p.range * T;
      if (p.axis === "x") {
        line = this.add.line(0, 0, x - range, y, x + range, y, 0x42a5f5, 0.6).setOrigin(0);
      } else {
        line = this.add.line(0, 0, x, y - range, x, y + range, 0x42a5f5, 0.6).setOrigin(0);
      }
      this.entityGroup.add(img); this.entityGroup.add(line);
    }
  }

  // ---- ввод ----
  updateCursor(p) {
    const T = CONFIG.tileSize;
    const wx = this.cameras.main.scrollX + p.x;
    const wy = this.cameras.main.scrollY + p.y;
    const c = Math.floor(wx / T);
    const r = Math.floor(wy / T);
    this.cursor.x = c * T;
    this.cursor.y = r * T;
  }

  handleClick(p) {
    const T = CONFIG.tileSize;
    const wx = this.cameras.main.scrollX + p.x;
    const wy = this.cameras.main.scrollY + p.y;
    const c = Math.floor(wx / T);
    const r = Math.floor(wy / T);
    this.paintCell(r, c, this.currentTool);
  }

  paintCell(r, c, ch) {
    if (r < 0 || r >= this.level.map.length) return;
    if (c < 0 || c >= this.level.map[0].length) return;
    // У P и F не должно быть дубликатов — стираем предыдущие.
    if (ch === "P" || ch === "F") {
      for (let rr = 0; rr < this.level.map.length; rr++) {
        this.level.map[rr] = this.level.map[rr].replaceAll(ch, ".");
      }
    }
    const arr = this.level.map[r].split("");
    arr[c] = ch;
    this.level.map[r] = arr.join("");
    this.renderGrid();
  }

  onKey(e) {
    const TOOL_KEYS = { "1": "=", "2": "^", "3": "C", "4": "P", "5": "F", "0": "." };
    if (TOOL_KEYS[e.key]) {
      this.currentTool = TOOL_KEYS[e.key];
      this.refreshToolLabel();
      this.highlightToolButton();
    }
    if (e.key === "Escape") this.scene.start("Menu");
  }

  update() {
    const speed = 12;
    const c = this.cameras.main;
    if (this.cursors.left.isDown || this.wasd.A.isDown) c.scrollX -= speed;
    if (this.cursors.right.isDown || this.wasd.D.isDown) c.scrollX += speed;
    if (this.cursors.up.isDown || this.wasd.W.isDown) c.scrollY -= speed;
    if (this.cursors.down.isDown || this.wasd.S.isDown) c.scrollY += speed;
  }

  refreshToolLabel() {
    const LABEL = { "=": "Тайл", "^": "Шип", C: "Монета", P: "Старт", F: "Финиш", ".": "Стереть" };
    this.toolText.setText(`Инструмент: ${LABEL[this.currentTool]} (${this.currentTool})`);
  }

  // ---- интеграция с HTML-панелью ----
  setupHtmlPanel() {
    document.body.classList.add("editor-mode");

    const $ = (id) => document.getElementById(id);
    const on = (el, type, fn) => { el.addEventListener(type, fn); this.handlers.push({ el, type, fn }); };

    // Кнопки-инструменты.
    document.querySelectorAll("#editor-panel [data-tool]").forEach((btn) => {
      on(btn, "click", () => {
        this.currentTool = btn.dataset.tool;
        this.refreshToolLabel();
        this.highlightToolButton();
      });
    });

    // Размеры/имя.
    on($("ed-resize"), "click", () => {
      const w = Math.max(20, Math.min(300, parseInt($("ed-width").value, 10) || 78));
      const h = Math.max(5, Math.min(40, parseInt($("ed-height").value, 10) || 10));
      this.resizeMap(w, h);
    });
    on($("ed-name"), "input", () => { this.level.name = $("ed-name").value; });

    // Враги.
    on($("en-add"), "click", () => {
      const x = parseInt($("en-x").value, 10);
      const a = parseInt($("en-pmin").value, 10);
      const b = parseInt($("en-pmax").value, 10);
      if (!Number.isFinite(x) || !Number.isFinite(a) || !Number.isFinite(b) || a > b) {
        alert("Проверь числа: x в тайлах, patrol min ≤ max"); return;
      }
      this.level.enemies.push({ x, y: 6, patrol: [a, b] });
      this.renderEntities(); this.refreshLists();
    });

    // Платформы.
    on($("pl-add"), "click", () => {
      const x = parseInt($("pl-x").value, 10);
      const y = parseInt($("pl-y").value, 10);
      const axis = $("pl-axis").value;
      const range = parseInt($("pl-range").value, 10);
      const speed = parseInt($("pl-speed").value, 10);
      if (![x, y, range, speed].every(Number.isFinite) || range < 1 || speed < 1) {
        alert("Проверь числа платформы"); return;
      }
      this.level.movingPlatforms.push({ x, y, axis, range, speed });
      this.renderEntities(); this.refreshLists();
    });

    // Action buttons.
    on($("ed-save"), "click", () => this.saveToStorage());
    on($("ed-load"), "click", () => this.loadAndApply());
    on($("ed-test"), "click", () => this.testLevel());
    on($("ed-export"), "click", () => this.exportToClipboard());
    on($("ed-import"), "click", () => this.importFromPrompt());
    on($("ed-clear"), "click", () => {
      if (!confirm("Очистить уровень?")) return;
      this.level = blankLevel(this.level.map[0].length, this.level.map.length, this.level.name);
      this.syncPanelFromLevel(); this.updateWorldBounds(); this.drawGridLines(); this.renderAll();
    });
    on($("ed-menu"), "click", () => this.scene.start("Menu"));
  }

  resizeMap(w, h) {
    const oldMap = this.level.map;
    const newMap = Array.from({ length: h }, (_, r) => {
      const oldRow = oldMap[r] ?? "";
      return (oldRow + ".".repeat(w)).slice(0, w);
    });
    this.level.map = newMap;
    this.updateWorldBounds(); this.drawGridLines(); this.renderAll();
  }

  highlightToolButton() {
    document.querySelectorAll("#editor-panel [data-tool]").forEach((b) => {
      b.classList.toggle("active", b.dataset.tool === this.currentTool);
    });
  }

  syncPanelFromLevel() {
    document.getElementById("ed-name").value = this.level.name;
    document.getElementById("ed-width").value = this.level.map[0].length;
    document.getElementById("ed-height").value = this.level.map.length;
    this.refreshLists();
    this.highlightToolButton();
  }

  refreshLists() {
    const enUl = document.getElementById("enemies-list");
    enUl.innerHTML = "";
    this.level.enemies.forEach((en, i) => {
      const li = document.createElement("li");
      li.textContent = `#${i + 1} x=${en.x} patrol=[${en.patrol[0]},${en.patrol[1]}]`;
      const rm = document.createElement("button");
      rm.textContent = "×"; rm.title = "Удалить";
      rm.addEventListener("click", () => {
        this.level.enemies.splice(i, 1); this.renderEntities(); this.refreshLists();
      });
      li.appendChild(rm); enUl.appendChild(li);
    });
    const plUl = document.getElementById("platforms-list");
    plUl.innerHTML = "";
    this.level.movingPlatforms.forEach((p, i) => {
      const li = document.createElement("li");
      li.textContent = `#${i + 1} ${p.axis} x=${p.x} y=${p.y} r=${p.range} v=${p.speed}`;
      const rm = document.createElement("button");
      rm.textContent = "×"; rm.title = "Удалить";
      rm.addEventListener("click", () => {
        this.level.movingPlatforms.splice(i, 1); this.renderEntities(); this.refreshLists();
      });
      li.appendChild(rm); plUl.appendChild(li);
    });
  }

  // ---- сохранение / тест / экспорт ----
  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.level));
      this.toast("Сохранено в localStorage");
    } catch (e) { alert("Не удалось сохранить: " + e.message); }
  }

  loadFromStorage() {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? normalizeLevel(JSON.parse(s)) : null;
    } catch { return null; }
  }

  loadAndApply() {
    const l = this.loadFromStorage();
    if (!l) { alert("В localStorage ничего не сохранено"); return; }
    this.level = l;
    this.syncPanelFromLevel(); this.updateWorldBounds(); this.drawGridLines(); this.renderAll();
    this.toast("Загружено");
  }

  testLevel() {
    // Базовая валидация: нужен P и F.
    const all = this.level.map.join("");
    if (!all.includes("P")) { alert("Нет точки старта P"); return; }
    if (!all.includes("F")) { alert("Нет финиша F"); return; }
    // Запускаем GameScene с пометкой fromEditor.
    this.scene.stop("UI");
    this.scene.start("Game", { customLevel: this.level, fromEditor: true });
    this.scene.launch("UI", { lives: 3, score: 0, level: "тест" });
  }

  exportToClipboard() {
    const json = JSON.stringify(this.level, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(
        () => this.toast("JSON скопирован в буфер"),
        () => prompt("Скопируйте вручную:", json)
      );
    } else {
      prompt("Скопируйте вручную:", json);
    }
  }

  importFromPrompt() {
    const s = prompt("Вставьте JSON уровня:");
    if (!s) return;
    try {
      this.level = normalizeLevel(JSON.parse(s));
      this.syncPanelFromLevel(); this.updateWorldBounds(); this.drawGridLines(); this.renderAll();
      this.toast("Импортировано");
    } catch (e) { alert("Не JSON: " + e.message); }
  }

  toast(msg) {
    const el = document.getElementById("ed-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1500);
  }
}
