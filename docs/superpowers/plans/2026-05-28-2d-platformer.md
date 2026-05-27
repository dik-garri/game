# 2D Платформер — План реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Веб-игра 2D-платформер на Phaser 3 (без сборки): 3 ручных уровня, прыжки, шипы/ямы, движущиеся платформы, враги, монеты, флаг-финиш, 3 жизни на уровень.

**Architecture:** Статичный `index.html` подключает Phaser 3 с CDN и игровой код как ES-модули. Игра разбита на сцены Phaser (Boot/Menu/Game/UI/LevelComplete/GameOver). Вся графика — placeholder-текстуры, генерируемые кодом через единый реестр ассетов (`assets.js`), что позволяет позже заменить их на спрайты без правки логики. Уровни описаны ASCII-картами в `levels.js`. Чистая логика (парсер карты, расчёт жизней) вынесена в модули без зависимости от Phaser и покрыта unit-тестами на Node.

**Tech Stack:** Phaser 3 (CDN), ES-модули, Arcade Physics. Тесты — Node встроенный `node:test` + `node:assert` (без зависимостей).

---

## Структура файлов

```
index.html                  # подключает Phaser CDN + src/main.js
package.json                 # только для запуска тестов (npm test), без зависимостей
src/
  config.js                  # игровые константы (гравитация, скорость, прыжок, жизни)
  main.js                    # Phaser.Game config, регистрация сцен
  assets.js                  # реестр ассетов + createPlaceholderTextures()
  levels.js                  # массив из 3 уровней (ASCII-карты + враги/платформы)
  logic/
    parseLevel.js            # ЧИСТАЯ логика: ASCII-карта → список объектов (без Phaser)
  scenes/
    BootScene.js
    MenuScene.js
    GameScene.js
    UIScene.js
    LevelCompleteScene.js
    GameOverScene.js
  entities/
    Player.js
    Enemy.js
    MovingPlatform.js
test/
  parseLevel.test.js         # unit-тесты парсера
ASSETS.md                    # контракт ассетов для замены на спрайты
README.md                    # запуск, управление, формат уровней, чеклист тестов
```

**Принцип:** вся проверяемая без браузера логика живёт в `src/logic/` и тестируется. Phaser-код (сцены, сущности) проверяется вручную по чеклисту README.

---

### Task 1: Каркас проекта и пустой холст Phaser

**Files:**
- Create: `index.html`
- Create: `package.json`
- Create: `src/config.js`
- Create: `src/main.js`
- Create: `.gitignore` (уже есть — проверить)

- [ ] **Step 1: Создать `package.json`** (нужен только для `npm test`, зависимостей нет)

```json
{
  "name": "platformer",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Создать `src/config.js`** — единое место для констант

```js
export const CONFIG = {
  width: 832,            // 26 тайлов * 32
  height: 512,           // 16 тайлов * 32
  tileSize: 32,
  gravity: 1200,
  playerSpeed: 220,
  jumpVelocity: -560,
  enemySpeed: 60,
  livesPerLevel: 3,
  coinScore: 10,
  enemyBounce: -300,     // отскок после прыжка на врага
};

// Цвета placeholder-графики (заменяются при переходе на спрайты)
export const COLORS = {
  bg: 0x1e2a3a,
  player: 0x4caf50,
  enemy: 0xe53935,
  coin: 0xffd54f,
  spike: 0xb0bec5,
  tile: 0x6d4c41,
  platform: 0x8d6e63,
  flag: 0x42a5f5,
};
```

- [ ] **Step 3: Создать `src/main.js`** — конфиг игры (сцены добавим по мере создания; пока пусто/Boot)

```js
import { CONFIG, COLORS } from "./config.js";

// Сцены импортируются и добавляются в массив scene по мере реализации задач.
const gameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.width,
  height: CONFIG.height,
  backgroundColor: COLORS.bg,
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: { gravity: { y: CONFIG.gravity }, debug: false },
  },
  scene: [], // заполняется в последующих задачах
};

// eslint-disable-next-line no-new
new Phaser.Game(gameConfig);
```

- [ ] **Step 4: Создать `index.html`**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Платформер</title>
  <style>
    html, body { margin: 0; height: 100%; background: #0f1620; }
    body { display: flex; align-items: center; justify-content: center; }
    canvas { image-rendering: pixelated; }
  </style>
</head>
<body>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
  <script type="module" src="./src/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Проверить вручную**

Запуск: `python3 -m http.server 8000` в корне проекта, открыть `http://localhost:8000`.
Ожидается: пустое тёмно-синее окно 832×512 без ошибок в консоли. (Сцен пока нет — чёрный/синий холст это нормально.)

- [ ] **Step 6: Commit**

```bash
git add index.html package.json src/config.js src/main.js .gitignore
git commit -m "feat: каркас проекта Phaser и игровой холст"
```

---

### Task 2: Парсер уровней (чистая логика + TDD)

**Files:**
- Create: `src/logic/parseLevel.js`
- Test: `test/parseLevel.test.js`

Парсер не зависит от Phaser: принимает объект уровня, возвращает плоский список объектов с пиксельными координатами. Это единственный модуль с автотестами.

- [ ] **Step 1: Написать падающий тест** `test/parseLevel.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLevel } from "../src/logic/parseLevel.js";

const sample = {
  name: "T",
  tileSize: 32,
  map: [
    "....",
    "C...",
    "P..F",
    "^===",
  ],
  legend: {
    "=": "tile", "^": "spike", C: "coin", P: "player", F: "flag", ".": "empty",
  },
};

test("конвертирует символы карты в объекты с пиксельными координатами", () => {
  const r = parseLevel(sample);
  // player в строке 2, столбце 0 → x=0*32+16, y=2*32+16 (центр тайла)
  assert.deepEqual(r.player, { x: 16, y: 80 });
  assert.deepEqual(r.flag, { x: 3 * 32 + 16, y: 2 * 32 + 16 });
});

test("собирает монеты, шипы и тайлы списками", () => {
  const r = parseLevel(sample);
  assert.equal(r.coins.length, 1);
  assert.deepEqual(r.coins[0], { x: 16, y: 48 });
  assert.equal(r.spikes.length, 1);
  assert.equal(r.tiles.length, 3);
});

test("'empty' и неизвестные символы не создают объектов", () => {
  const r = parseLevel({
    ...sample,
    map: ["?.", ".."],
    legend: { ".": "empty" },
  });
  assert.equal(r.tiles.length, 0);
  assert.equal(r.coins.length, 0);
});

test("при отсутствии player возвращает дефолтную позицию и флаг hadStart=false", () => {
  const r = parseLevel({ ...sample, map: ["..", "=="], });
  assert.equal(r.hadStart, false);
  assert.ok(r.player); // дефолт, не null
});

test("вычисляет worldHeight по числу строк для определения падения в яму", () => {
  const r = parseLevel(sample);
  assert.equal(r.worldHeight, 4 * 32);
  assert.equal(r.worldWidth, 4 * 32);
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/logic/parseLevel.js'`.

- [ ] **Step 3: Реализовать `src/logic/parseLevel.js`**

```js
// Чистая функция: объект уровня → списки игровых объектов в пикселях.
// Координаты объектов — центр соответствующего тайла.
export function parseLevel(level) {
  const ts = level.tileSize;
  const legend = level.legend ?? {};
  const result = {
    tiles: [], spikes: [], coins: [],
    player: { x: ts / 2, y: ts / 2 },
    flag: null,
    hadStart: false,
    worldWidth: 0,
    worldHeight: level.map.length * ts,
  };

  level.map.forEach((row, r) => {
    result.worldWidth = Math.max(result.worldWidth, row.length * ts);
    for (let c = 0; c < row.length; c++) {
      const kind = legend[row[c]];
      if (!kind || kind === "empty") continue;
      const pos = { x: c * ts + ts / 2, y: r * ts + ts / 2 };
      switch (kind) {
        case "tile": result.tiles.push(pos); break;
        case "spike": result.spikes.push(pos); break;
        case "coin": result.coins.push(pos); break;
        case "flag": result.flag = pos; break;
        case "player": result.player = pos; result.hadStart = true; break;
        default: console.warn(`parseLevel: неизвестный тип "${kind}"`);
      }
    }
  });

  return result;
}
```

- [ ] **Step 4: Запустить тесты — убедиться, что проходят**

Run: `npm test`
Expected: PASS — все 5 тестов зелёные.

- [ ] **Step 5: Commit**

```bash
git add src/logic/parseLevel.js test/parseLevel.test.js
git commit -m "feat: парсер ASCII-уровней с тестами"
```

---

### Task 3: Расчёт жизней/прогресса (чистая логика + TDD)

**Files:**
- Create: `src/logic/progress.js`
- Test: `test/progress.test.js`

Маленький модуль чистых функций для решений «жизни кончились?», «есть следующий уровень?». Держит сцены тонкими.

- [ ] **Step 1: Написать падающий тест** `test/progress.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { loseLife, isGameOver, nextLevelIndex, isLastLevel } from "../src/logic/progress.js";

test("loseLife уменьшает жизни, не уходя ниже 0", () => {
  assert.equal(loseLife(3), 2);
  assert.equal(loseLife(0), 0);
});

test("isGameOver истинно при 0 жизней", () => {
  assert.equal(isGameOver(0), true);
  assert.equal(isGameOver(1), false);
});

test("nextLevelIndex и isLastLevel учитывают общее число уровней", () => {
  assert.equal(nextLevelIndex(0), 1);
  assert.equal(isLastLevel(2, 3), true);
  assert.equal(isLastLevel(1, 3), false);
});
```

- [ ] **Step 2: Запустить — убедиться, что падает**

Run: `npm test`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Реализовать `src/logic/progress.js`**

```js
export const loseLife = (lives) => Math.max(0, lives - 1);
export const isGameOver = (lives) => lives <= 0;
export const nextLevelIndex = (i) => i + 1;
export const isLastLevel = (i, total) => i >= total - 1;
```

- [ ] **Step 4: Запустить — убедиться, что проходят**

Run: `npm test`
Expected: PASS — все тесты зелёные (включая Task 2).

- [ ] **Step 5: Commit**

```bash
git add src/logic/progress.js test/progress.test.js
git commit -m "feat: логика жизней и прогресса уровней с тестами"
```

---

### Task 4: Реестр ассетов и placeholder-текстуры

**Files:**
- Create: `src/assets.js`

Единая точка генерации графики. Каждый ключ описан размером и формой. Замена на спрайты затрагивает только этот файл.

- [ ] **Step 1: Реализовать `src/assets.js`**

```js
import { CONFIG, COLORS } from "./config.js";

const T = CONFIG.tileSize;

// Реестр: ключ → размеры. Используется и при генерации, и как контракт
// для будущих спрайтов (см. ASSETS.md).
export const ASSET_KEYS = {
  player: { w: T - 4, h: T - 2 },
  enemy:  { w: T - 6, h: T - 6 },
  coin:   { w: T / 2, h: T / 2 },
  spike:  { w: T, h: T },
  tile:   { w: T, h: T },
  platform: { w: T * 2, h: T / 2 },
  flag:   { w: T, h: T },
};

// Генерирует placeholder-текстуры. Вызывается из BootScene.
// ЗАМЕНА НА СПРАЙТЫ: заменить тело этой функции на scene.load.image/spritesheet
// (см. ASSETS.md). Остальной код ссылается на текстуры по ключам и не меняется.
export function createPlaceholderTextures(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  const rect = (key, color) => {
    const { w, h } = ASSET_KEYS[key];
    g.clear(); g.fillStyle(color, 1); g.fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
  };

  rect("player", COLORS.player);
  rect("enemy", COLORS.enemy);
  rect("tile", COLORS.tile);
  rect("platform", COLORS.platform);
  rect("flag", COLORS.flag);

  // монета — круг
  {
    const { w } = ASSET_KEYS.coin;
    g.clear(); g.fillStyle(COLORS.coin, 1); g.fillCircle(w / 2, w / 2, w / 2);
    g.generateTexture("coin", w, w);
  }

  // шип — треугольник
  {
    const { w, h } = ASSET_KEYS.spike;
    g.clear(); g.fillStyle(COLORS.spike, 1);
    g.beginPath(); g.moveTo(0, h); g.lineTo(w / 2, 0); g.lineTo(w, h);
    g.closePath(); g.fillPath();
    g.generateTexture("spike", w, h);
  }

  g.destroy();
}
```

- [ ] **Step 2: Проверка** — отдельного теста нет (зависит от Phaser graphics); проверяется визуально в Task 6.

- [ ] **Step 3: Commit**

```bash
git add src/assets.js
git commit -m "feat: реестр ассетов и генерация placeholder-текстур"
```

---

### Task 5: Данные уровней

**Files:**
- Create: `src/levels.js`

3 уровня нарастающей сложности. Карта — массив строк; ширина строки ≤ 26 символов (можно меньше — мир дополнится bounds). Используются те же символы legend, что понимает parseLevel.

- [ ] **Step 1: Реализовать `src/levels.js`**

```js
// Символы карты: '=' тайл, '^' шип, 'C' монета, 'P' старт, 'F' флаг, '.' пусто.
// enemies: { x, y } в ТАЙЛАХ; patrol [minTile, maxTile] в тайлах.
// movingPlatforms: { x, y } в тайлах; axis 'x'|'y'; range в тайлах; speed px/с.
const LEGEND = {
  "=": "tile", "^": "spike", C: "coin", P: "player", F: "flag", ".": "empty",
};

export const LEVELS = [
  {
    name: "Разминка",
    tileSize: 32,
    legend: LEGEND,
    map: [
      "..........................",
      "..........................",
      "..............C...........",
      "..........C...............",
      ".......======.............",
      "..C.......................",
      "P.........................",
      "====......^^^.........F...",
      "====......===.........=...",
      "====......===.........=...",
    ],
    enemies: [{ x: 16, y: 6, patrol: [14, 20] }],
    movingPlatforms: [],
  },
  {
    name: "Перепрыгни",
    tileSize: 32,
    legend: LEGEND,
    map: [
      "..........................",
      "...............C..........",
      "..........................",
      ".....C..........C.........",
      "....===.........===.......",
      "..........................",
      "P.....C..............C..F.",
      "===.......^^^^.......=====",
      "===.......====.......=====",
    ],
    enemies: [{ x: 5, y: 5, patrol: [4, 7] }],
    movingPlatforms: [{ x: 11, y: 5, axis: "x", range: 4, speed: 80 }],
  },
  {
    name: "Финальный рывок",
    tileSize: 32,
    legend: LEGEND,
    map: [
      "..........................",
      "............C.............",
      "........C.................",
      "....C.....................",
      "...===....................",
      "..............C....C......",
      "P....^^....................",
      "===.====.........^^^.....F",
      "===.====.........===.....=",
    ],
    enemies: [
      { x: 9, y: 6, patrol: [8, 12] },
      { x: 18, y: 6, patrol: [17, 22] },
    ],
    movingPlatforms: [{ x: 13, y: 4, axis: "y", range: 2, speed: 60 }],
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/levels.js
git commit -m "feat: 3 уровня (ASCII-карты, враги, платформы)"
```

---

### Task 6: BootScene + MenuScene (первый видимый экран)

**Files:**
- Create: `src/scenes/BootScene.js`
- Create: `src/scenes/MenuScene.js`
- Modify: `src/main.js` (добавить сцены в массив scene)

- [ ] **Step 1: Реализовать `src/scenes/BootScene.js`**

```js
import { createPlaceholderTextures } from "../assets.js";

export class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }
  create() {
    createPlaceholderTextures(this);
    this.scene.start("Menu");
  }
}
```

- [ ] **Step 2: Реализовать `src/scenes/MenuScene.js`**

```js
import { COLORS } from "../config.js";
import { LEVELS } from "../levels.js";

export class MenuScene extends Phaser.Scene {
  constructor() { super("Menu"); }
  create() {
    const cx = this.scale.width / 2;
    this.add.text(cx, 120, "ПЛАТФОРМЕР", { fontSize: "48px", color: "#fff" })
      .setOrigin(0.5);
    this.add.text(cx, 200, "← → или A/D — движение,  ↑/W/Пробел — прыжок",
      { fontSize: "18px", color: "#b0bec5" }).setOrigin(0.5);

    LEVELS.forEach((lvl, i) => {
      const t = this.add.text(cx, 280 + i * 50, `▶ ${i + 1}. ${lvl.name}`,
        { fontSize: "26px", color: "#4caf50" }).setOrigin(0.5).setInteractive();
      t.on("pointerover", () => t.setColor("#a5d6a7"));
      t.on("pointerout", () => t.setColor("#4caf50"));
      t.on("pointerdown", () => this.startLevel(i));
    });

    // Enter — начать с первого уровня
    this.input.keyboard.once("keydown-ENTER", () => this.startLevel(0));
  }

  startLevel(index) {
    this.scene.start("Game", { levelIndex: index });
    this.scene.launch("UI");
  }
}
```

- [ ] **Step 3: Подключить сцены в `src/main.js`**

Заменить импорты и массив `scene`:

```js
import { CONFIG, COLORS } from "./config.js";
import { BootScene } from "./scenes/BootScene.js";
import { MenuScene } from "./scenes/MenuScene.js";
// GameScene/UIScene/LevelCompleteScene/GameOverScene добавляются в Task 7–10.

const gameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.width,
  height: CONFIG.height,
  backgroundColor: COLORS.bg,
  pixelArt: true,
  physics: { default: "arcade", arcade: { gravity: { y: CONFIG.gravity }, debug: false } },
  scene: [BootScene, MenuScene],
};

new Phaser.Game(gameConfig);
```

- [ ] **Step 4: Проверить вручную**

Запуск: `python3 -m http.server 8000`, открыть `http://localhost:8000`.
Ожидается: меню с заголовком, подсказкой управления и тремя кликабельными уровнями. Консоль без ошибок. (Клик пока приведёт к ошибке — сцены Game/UI ещё нет; это нормально до Task 7.)

- [ ] **Step 5: Commit**

```bash
git add src/scenes/BootScene.js src/scenes/MenuScene.js src/main.js
git commit -m "feat: BootScene с генерацией текстур и стартовое меню"
```

---

### Task 7: GameScene — статичный мир и управляемый игрок

**Files:**
- Create: `src/entities/Player.js`
- Create: `src/scenes/GameScene.js`
- Modify: `src/main.js` (добавить GameScene)

Цель задачи: уровень строится из тайлов/шипов/монет/флага, игрок ходит и прыгает, стоит на платформах. Враги и движущиеся платформы — в следующих задачах.

- [ ] **Step 1: Реализовать `src/entities/Player.js`**

```js
import { CONFIG } from "../config.js";

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "player");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(false); // падение в яму = смерть (Task 9)
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({ a: "A", d: "D", w: "W", space: "SPACE" });
  }

  update() {
    const left = this.cursors.left.isDown || this.keys.a.isDown;
    const right = this.cursors.right.isDown || this.keys.d.isDown;
    const jump = this.cursors.up.isDown || this.keys.w.isDown || this.keys.space.isDown;

    if (left) this.setVelocityX(-CONFIG.playerSpeed);
    else if (right) this.setVelocityX(CONFIG.playerSpeed);
    else this.setVelocityX(0);

    if (jump && this.body.blocked.down) this.setVelocityY(CONFIG.jumpVelocity);
  }
}
```

- [ ] **Step 2: Реализовать `src/scenes/GameScene.js`** (без врагов/платформ пока)

```js
import { CONFIG } from "../config.js";
import { LEVELS } from "../levels.js";
import { parseLevel } from "../logic/parseLevel.js";
import { Player } from "../entities/Player.js";

export class GameScene extends Phaser.Scene {
  constructor() { super("Game"); }

  init(data) {
    this.levelIndex = data.levelIndex ?? 0;
    this.lives = CONFIG.livesPerLevel;
    this.score = 0;
  }

  create() {
    const level = LEVELS[this.levelIndex];
    const parsed = parseLevel(level);
    if (!parsed.hadStart) console.error("Уровень без точки старта P");

    this.physics.world.setBounds(0, 0, parsed.worldWidth, parsed.worldHeight);

    // статичные тайлы
    this.solids = this.physics.add.staticGroup();
    parsed.tiles.forEach((t) => this.solids.create(t.x, t.y, "tile"));

    // шипы (урон, не препятствие). Тело уменьшаем к основанию треугольника,
    // чтобы не убивало на пустых верхних углах тайла — иначе ощущается нечестно.
    this.spikes = this.physics.add.staticGroup();
    parsed.spikes.forEach((s) => {
      const spike = this.spikes.create(s.x, s.y, "spike");
      spike.body.setSize(CONFIG.tileSize - 6, CONFIG.tileSize / 2);
      spike.body.setOffset(3, CONFIG.tileSize / 2);
    });

    // монеты
    this.coins = this.physics.add.staticGroup();
    parsed.coins.forEach((c) => this.coins.create(c.x, c.y, "coin"));

    // флаг
    if (parsed.flag) this.flag = this.physics.add.staticImage(parsed.flag.x, parsed.flag.y, "flag");

    // игрок
    this.player = new Player(this, parsed.player.x, parsed.player.y);
    this.physics.add.collider(this.player, this.solids);

    // камера следует за игроком
    this.cameras.main.setBounds(0, 0, parsed.worldWidth, parsed.worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // сбор монет
    this.physics.add.overlap(this.player, this.coins, (_p, coin) => {
      coin.destroy();
      this.score += CONFIG.coinScore;
      this.events.emit("score-changed", this.score);
    });

    // сообщить UI стартовые значения
    this.events.emit("hud-init", { lives: this.lives, score: this.score, level: this.levelIndex + 1 });
  }

  update() {
    this.player.update();
  }
}
```

- [ ] **Step 3: Добавить GameScene в `src/main.js`**

Импортировать `GameScene` и добавить в массив `scene` после `MenuScene`.

- [ ] **Step 4: Проверить вручную**

Запуск сервера, в меню выбрать «1. Разминка».
Ожидается: игрок (зелёный) стоит на земле, ходит ←/→, прыгает ↑/Пробел, не проваливается сквозь тайлы, монеты исчезают при касании, камера следует. (UI/смерть/враги ещё не работают — ошибки про сцену UI допустимы; если мешают, временно убрать `this.scene.launch("UI")` в MenuScene до Task 8.)

- [ ] **Step 5: Commit**

```bash
git add src/entities/Player.js src/scenes/GameScene.js src/main.js
git commit -m "feat: GameScene со статичным миром, игроком и сбором монет"
```

---

### Task 8: UIScene (HUD) + события

**Files:**
- Create: `src/scenes/UIScene.js`
- Modify: `src/main.js`
- Modify: `src/scenes/GameScene.js` (события уже эмитятся; убедиться в hud-init/score-changed/life-changed)

- [ ] **Step 1: Реализовать `src/scenes/UIScene.js`**

```js
export class UIScene extends Phaser.Scene {
  constructor() { super("UI"); }

  create() {
    const style = { fontSize: "20px", color: "#ffffff" };
    this.livesText = this.add.text(16, 12, "", style);
    this.scoreText = this.add.text(16, 38, "", style);
    this.levelText = this.add.text(this.scale.width - 16, 12, "", style).setOrigin(1, 0);

    const game = this.scene.get("Game");
    game.events.on("hud-init", (d) => {
      this.render(d.lives, d.score, d.level);
      this.cur = d;
    });
    game.events.on("score-changed", (score) => {
      this.cur.score = score; this.render(this.cur.lives, score, this.cur.level);
    });
    game.events.on("life-changed", (lives) => {
      this.cur.lives = lives; this.render(lives, this.cur.score, this.cur.level);
    });

    // снять слушатели при остановке Game
    this.events.on("shutdown", () => {
      game.events.off("hud-init"); game.events.off("score-changed"); game.events.off("life-changed");
    });
  }

  render(lives, score, level) {
    this.livesText.setText(`❤ ${lives}`);
    this.scoreText.setText(`★ ${score}`);
    this.levelText.setText(`Уровень ${level}`);
  }
}
```

- [ ] **Step 2: Добавить UIScene в `src/main.js`** (в массив scene).

- [ ] **Step 3: Проверить вручную**

Выбрать уровень. Ожидается: слева вверху «❤ 3» и «★ 0», справа «Уровень 1». При сборе монеты счёт растёт.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/UIScene.js src/main.js
git commit -m "feat: HUD-сцена с жизнями, очками и номером уровня"
```

---

### Task 9: Смерть — шипы, ямы, потеря жизни, рестарт/Game Over

**Files:**
- Create: `src/scenes/GameOverScene.js`
- Modify: `src/scenes/GameScene.js`
- Modify: `src/main.js`

- [ ] **Step 1: Добавить логику смерти в `src/scenes/GameScene.js`**

В конце `create()` добавить столкновение с шипами и хранение флага «умер»:

```js
this.isDead = false;
this.physics.add.overlap(this.player, this.spikes, () => this.die(), null, this);
```

Добавить методы в класс:

```js
die() {
  if (this.isDead) return;
  this.isDead = true;
  this.lives = loseLife(this.lives);            // импорт из logic/progress.js
  this.events.emit("life-changed", this.lives);
  this.cameras.main.flash(150, 255, 0, 0);
  this.time.delayedCall(400, () => {
    if (isGameOver(this.lives)) {
      this.scene.stop("UI");
      this.scene.start("GameOver", { levelIndex: this.levelIndex, score: this.score });
    } else {
      this.scene.restart({ levelIndex: this.levelIndex, lives: this.lives, score: this.score });
    }
  });
}
```

Обновить `init` чтобы переносить жизни/очки при рестарте:

```js
init(data) {
  this.levelIndex = data.levelIndex ?? 0;
  this.lives = data.lives ?? CONFIG.livesPerLevel;
  this.score = data.score ?? 0;
}
```

Добавить проверку падения в яму в `update()`:

```js
update() {
  if (this.isDead) return;
  this.player.update();
  if (this.player.y > this.physics.world.bounds.height + 64) this.die();
}
```

Добавить импорт вверху файла:

```js
import { loseLife, isGameOver } from "../logic/progress.js";
```

- [ ] **Step 2: Реализовать `src/scenes/GameOverScene.js`**

```js
export class GameOverScene extends Phaser.Scene {
  constructor() { super("GameOver"); }
  init(data) { this.levelIndex = data.levelIndex; this.score = data.score; }
  create() {
    const cx = this.scale.width / 2, cy = this.scale.height / 2;
    this.add.text(cx, cy - 60, "ИГРА ОКОНЧЕНА", { fontSize: "44px", color: "#e53935" }).setOrigin(0.5);
    this.add.text(cx, cy, `Очки: ${this.score}`, { fontSize: "24px", color: "#fff" }).setOrigin(0.5);
    this.add.text(cx, cy + 50, "[R] заново   [M] меню", { fontSize: "20px", color: "#b0bec5" }).setOrigin(0.5);
    this.input.keyboard.once("keydown-R", () => {
      this.scene.start("Game", { levelIndex: this.levelIndex });
      this.scene.launch("UI");
    });
    this.input.keyboard.once("keydown-M", () => this.scene.start("Menu"));
  }
}
```

- [ ] **Step 3: Добавить GameOverScene в `src/main.js`.**

- [ ] **Step 4: Проверить вручную**

- Прыгнуть на шипы → вспышка, «❤» уменьшается, уровень перезапускается, очки/жизни сохраняются.
- Спрыгнуть в яму (за нижний край) → то же.
- **Проверить HUD после рестарта:** после смерти от шипа уровень перезапускается, а «❤»/«★» в HUD показывают актуальные значения (не «зависают» на старых). Если HUD устарел — UIScene держит листенеры на пересозданном эмиттере GameScene; в этом случае в `GameScene.die()` перед `this.scene.restart(...)` добавить `this.scene.stop("UI"); this.scene.launch("UI");`, либо переэмитить `hud-init` в начале `create()` (он уже эмитится в конце create — убедиться, что UIScene его ловит).
- Потерять все 3 жизни → экран «Игра окончена», [R] перезапускает уровень с 3 жизнями, [M] возвращает в меню.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.js src/scenes/GameOverScene.js src/main.js
git commit -m "feat: смерть от шипов/ям, потеря жизни, рестарт и Game Over"
```

---

### Task 10: Враги (патруль, смерть от прыжка сверху)

**Files:**
- Create: `src/entities/Enemy.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Реализовать `src/entities/Enemy.js`**

```js
import { CONFIG } from "../config.js";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  // minX/maxX — границы патруля в пикселях
  constructor(scene, x, y, minX, maxX) {
    super(scene, x, y, "enemy");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.minX = minX; this.maxX = maxX;
    this.setVelocityX(CONFIG.enemySpeed);
    this.setCollideWorldBounds(false);
  }

  update() {
    if (this.x <= this.minX && this.body.velocity.x < 0) this.setVelocityX(CONFIG.enemySpeed);
    else if (this.x >= this.maxX && this.body.velocity.x > 0) this.setVelocityX(-CONFIG.enemySpeed);
  }
}
```

- [ ] **Step 2: Спавн и столкновения врагов в `GameScene.create()`**

```js
import { Enemy } from "../entities/Enemy.js";
// ...
const T = CONFIG.tileSize;
this.enemies = this.physics.add.group();
(level.enemies ?? []).forEach((e) => {
  const enemy = new Enemy(
    this, e.x * T + T / 2, e.y * T + T / 2,
    e.patrol[0] * T + T / 2, e.patrol[1] * T + T / 2
  );
  this.enemies.add(enemy);
});
this.physics.add.collider(this.enemies, this.solids);

// игрок vs враг: прыжок сверху убивает, иначе урон.
// Допуск — половина высоты врага, чтобы быстрый прыжок не считался ударом сбоку.
this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
  const tol = enemy.body.height * 0.5;
  const fromAbove = player.body.velocity.y > 0 && (player.body.bottom <= enemy.body.top + tol);
  if (fromAbove) {
    enemy.destroy();
    player.setVelocityY(CONFIG.enemyBounce);
  } else {
    this.die();
  }
}, null, this);
```

- [ ] **Step 3: Обновлять врагов в `GameScene.update()`** (после `this.player.update()`):

```js
this.enemies.getChildren().forEach((e) => e.update());
```

- [ ] **Step 4: Проверить вручную**

- Враг (красный) ходит туда-сюда в своём диапазоне, не падает с края платформы (если патруль задан корректно).
- Прыжок сверху → враг исчезает, игрок отскакивает.
- Касание сбоку → потеря жизни (как шип).

- [ ] **Step 5: Commit**

```bash
git add src/entities/Enemy.js src/scenes/GameScene.js
git commit -m "feat: враги с патрулём и смертью от прыжка сверху"
```

---

### Task 11: Движущиеся платформы (с провозом игрока)

**Files:**
- Create: `src/entities/MovingPlatform.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Реализовать `src/entities/MovingPlatform.js`**

```js
// Кинематическая платформа: двигается между start и start±range по оси.
// ВАЖНО: Arcade Physics НЕ переносит автоматически тело, стоящее на immovable-
// платформе. Поэтому платформа сама считает свой сдвиг за кадр (deltaX/deltaY),
// а GameScene вручную прибавляет его игроку, когда тот стоит сверху.
export class MovingPlatform extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, axis, rangePx, speed) {
    super(scene, x, y, "platform");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.axis = axis;
    this.minV = axis === "x" ? x - rangePx : y - rangePx;
    this.maxV = axis === "x" ? x + rangePx : y + rangePx;
    this.speed = speed;
    this.deltaX = 0; this.deltaY = 0;
    this.prevX = x; this.prevY = y;
    if (axis === "x") this.setVelocityX(speed); else this.setVelocityY(speed);
  }

  // Вызывается в preUpdate автоматически Phaser? Нет — вызываем вручную из сцены
  // ДО того, как применим дельту к игроку.
  update() {
    // развернуть на границе и зафиксировать позицию, чтобы не накапливался дрейф
    if (this.axis === "x") {
      if (this.x <= this.minV && this.body.velocity.x < 0) { this.x = this.minV; this.setVelocityX(this.speed); }
      else if (this.x >= this.maxV && this.body.velocity.x > 0) { this.x = this.maxV; this.setVelocityX(-this.speed); }
    } else {
      if (this.y <= this.minV && this.body.velocity.y < 0) { this.y = this.minV; this.setVelocityY(this.speed); }
      else if (this.y >= this.maxV && this.body.velocity.y > 0) { this.y = this.maxV; this.setVelocityY(-this.speed); }
    }
    // сдвиг за прошедший кадр (позиция уже обновлена физикой к этому моменту)
    this.deltaX = this.x - this.prevX;
    this.deltaY = this.y - this.prevY;
    this.prevX = this.x;
    this.prevY = this.y;
  }

  // игрок стоит на платформе?
  isRiding(player) {
    return this.body.touching.up && player.body.touching.down
      || (player.body.bottom <= this.body.top + 4
          && player.body.right > this.body.left
          && player.body.left < this.body.right
          && player.body.blocked.down);
  }
}
```

- [ ] **Step 2: Спавн и коллайдер в `GameScene.create()`**

```js
import { MovingPlatform } from "../entities/MovingPlatform.js";
// ...
this.platforms = this.add.group();
(level.movingPlatforms ?? []).forEach((p) => {
  const mp = new MovingPlatform(
    this, p.x * T + T / 2, p.y * T + T / 2, p.axis, p.range * T, p.speed
  );
  this.platforms.add(mp);
  this.physics.add.collider(this.player, mp);
  this.physics.add.collider(this.enemies, mp);
});
```

- [ ] **Step 3: Обновлять платформы в `update()` и провозить игрока**

Порядок важен: сначала обновляем платформы (считаем дельту), затем переносим игрока, если он на платформе:

```js
this.platforms.getChildren().forEach((p) => {
  p.update();
  if (p.isRiding(this.player)) {
    this.player.x += p.deltaX;
    this.player.y += p.deltaY;
  }
});
```

- [ ] **Step 4: Проверить вручную**

На уровнях 2 и 3: платформа ездит по своей оси; игрок, стоя на ней, перемещается вместе с ней (по X и по Y) и может с неё спрыгнуть/запрыгнуть. Игрок не «соскальзывает» с движущейся платформы.

- [ ] **Step 5: Commit**

```bash
git add src/entities/MovingPlatform.js src/scenes/GameScene.js
git commit -m "feat: движущиеся платформы с провозом игрока"
```

---

### Task 12: Флаг-финиш и LevelCompleteScene

**Files:**
- Create: `src/scenes/LevelCompleteScene.js`
- Modify: `src/scenes/GameScene.js`
- Modify: `src/main.js`

- [ ] **Step 1: Обработка касания флага в `GameScene.create()`**

GameScene уже импортирует `LEVELS`; новых импортов сюда добавлять НЕ нужно — выбор следующего уровня делает LevelCompleteScene.

```js
// в create(), рядом с this.isDead = false;  →  this.won = false;
if (this.flag) {
  this.physics.add.overlap(this.player, this.flag, () => {
    if (this.isDead || this.won) return;
    this.won = true;
    this.scene.stop("UI");
    this.scene.start("LevelComplete", {
      levelIndex: this.levelIndex, score: this.score,
    });
  }, null, this);
}
```

(Инициализировать `this.won = false;` рядом с `this.isDead = false;`.)

- [ ] **Step 2: Реализовать `src/scenes/LevelCompleteScene.js`**

```js
import { LEVELS } from "../levels.js";
import { nextLevelIndex, isLastLevel } from "../logic/progress.js";

export class LevelCompleteScene extends Phaser.Scene {
  constructor() { super("LevelComplete"); }
  init(data) { this.levelIndex = data.levelIndex; this.score = data.score; }
  create() {
    const cx = this.scale.width / 2, cy = this.scale.height / 2;
    const last = isLastLevel(this.levelIndex, LEVELS.length);
    const title = last ? "ИГРА ПРОЙДЕНА!" : "УРОВЕНЬ ПРОЙДЕН!";
    this.add.text(cx, cy - 60, title, { fontSize: "40px", color: "#4caf50" }).setOrigin(0.5);
    this.add.text(cx, cy, `Очки: ${this.score}`, { fontSize: "24px", color: "#fff" }).setOrigin(0.5);
    const hint = last ? "[M] меню" : "[ПРОБЕЛ] дальше   [M] меню";
    this.add.text(cx, cy + 50, hint, { fontSize: "20px", color: "#b0bec5" }).setOrigin(0.5);

    if (!last) {
      this.input.keyboard.once("keydown-SPACE", () => {
        this.scene.start("Game", { levelIndex: nextLevelIndex(this.levelIndex), score: this.score });
        this.scene.launch("UI");
      });
    }
    this.input.keyboard.once("keydown-M", () => this.scene.start("Menu"));
  }
}
```

- [ ] **Step 3: Добавить LevelCompleteScene в `src/main.js`.**

- [ ] **Step 4: Проверить вручную**

- Дойти до флага → «Уровень пройден», [Пробел] переносит на следующий уровень с сохранением очков.
- На последнем уровне → «Игра пройдена», только [M] в меню.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/LevelCompleteScene.js src/scenes/GameScene.js src/main.js
git commit -m "feat: финиш по флагу и экран завершения уровня"
```

---

### Task 13: Документация (README + ASSETS)

**Files:**
- Create: `README.md`
- Create: `ASSETS.md`

- [ ] **Step 1: Написать `README.md`** со следующими разделами:
  - **Запуск:** `python3 -m http.server 8000` → `http://localhost:8000` (объяснить, что ES-модули требуют сервера, не `file://`).
  - **Тесты:** `npm test` (чистая логика — парсер, прогресс).
  - **Управление:** ←/→ или A/D, ↑/W/Пробел; в меню — клик/Enter; на экранах — R/Пробел/M.
  - **Формат уровней:** таблица символов legend, как добавить уровень в `src/levels.js`, формат `enemies` и `movingPlatforms` (координаты в тайлах).
  - **Чеклист ручного тестирования** (по одному пункту на механику): прыжок, стойка на тайлах, сбор монеты (рост счёта), шип→смерть, яма→смерть, враг сверху→убит+отскок, враг сбоку→урон, провоз на платформе, флаг→след. уровень, потеря 3 жизней→Game Over, переход между всеми 3 уровнями, победа на последнем.

- [ ] **Step 2: Написать `ASSETS.md`** — контракт ассетов:
  - Таблица ключей из `ASSET_KEYS` (`player`, `enemy`, `coin`, `spike`, `tile`, `platform`, `flag`) с размерами и описанием.
  - Пошаговая инструкция замены placeholder на спрайты: подготовить PNG/спрайт-листы под ключи и размеры → в `src/assets.js` заменить тело `createPlaceholderTextures` на `scene.load.*` (с примером для `load.image` и `load.spritesheet`) → описать и зарегистрировать анимации (idle/run/jump игрока, walk врага) в BootScene → подтвердить, что игровой код не меняется (ссылки по ключам).
  - Явно отметить: `tile` = статичный блок, `platform` = движущаяся платформа.

- [ ] **Step 3: Commit**

```bash
git add README.md ASSETS.md
git commit -m "docs: README (запуск, уровни, чеклист) и контракт ASSETS"
```

---

## Финальная проверка (после всех задач)

- [ ] `npm test` — все unit-тесты зелёные.
- [ ] Пройти все 3 уровня по чеклисту README в браузере, консоль без ошибок.
- [ ] Проверить, что замена графики действительно локализована в `src/assets.js` (бегло перечитать — нет хардкода форм/цветов вне assets.js и config.js).
