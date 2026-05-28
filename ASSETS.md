# Контракт ассетов

Инструкция по замене placeholder-графики на настоящие спрайты.

---

## Принцип

Весь игровой код обращается к текстурам **только по строковым ключам** (например, `"player"`, `"tile"`). Реестр ключей и их размеры определены в `src/assets.js`. При переходе на настоящую графику **менять нужно только этот файл** — остальной код трогать не придётся.

---

## Реестр ключей

`T = CONFIG.tileSize = 32` (см. `src/config.js`).

| Ключ | Размер (px) | Что это | Где используется |
|---|---|---|---|
| `player` | 28×30 (`T−4` × `T−2`) | спрайт игрока | `src/entities/Player.js` |
| `enemy` | 26×26 (`T−6` × `T−6`) | спрайт врага | `src/entities/Enemy.js` |
| `coin` | 16×16 (`T/2` × `T/2`) | монета (placeholder — круг) | `GameScene` — группа `coins` |
| `spike` | 32×32 (`T` × `T`) | шип (placeholder — треугольник; хитбокс — нижняя половина) | `GameScene` — группа `spikes` |
| `tile` | 32×32 (`T` × `T`) | статичный блок земли из ASCII-карты | `GameScene` — группа `solids` |
| `platform` | 64×16 (`T*2` × `T/2`) | движущаяся платформа | `src/entities/MovingPlatform.js` |
| `flag` | 32×32 (`T` × `T`) | финишный флаг | `GameScene` — объект `flag` |

**Различие `tile` и `platform`:** `tile` — статичный твёрдый блок из ASCII-карты (`=`); `platform` — текстура для движущейся платформы (класс `MovingPlatform`).

---

## Шаги замены на настоящие спрайты

### 1. Подготовить файлы ассетов

Создать PNG-файлы (или спрайт-листы) под каждый ключ с указанными размерами. Рекомендуемое расположение — папка `assets/` в корне проекта:

```
assets/
  player.png    — 28×30 px (или спрайт-лист для анимаций)
  enemy.png     — 26×26 px (или спрайт-лист)
  coin.png      — 16×16 px
  spike.png     — 32×32 px
  tile.png      — 32×32 px
  platform.png  — 64×16 px
  flag.png      — 32×32 px
```

### 2. Переписать `src/assets.js`

Текущая функция `createPlaceholderTextures(scene)` генерирует текстуры через `scene.make.graphics()`. При переходе на реальные ассеты нужно использовать Phaser-загрузчик.

Так как `BootScene` вызывает `createPlaceholderTextures` в `create()`, а загрузка файлов должна происходить в `preload()`, переносим логику в `BootScene` напрямую — см. ниже.

---

### Подход А — статичные изображения (без анимаций)

Отредактировать `src/scenes/BootScene.js`:

```js
import { createPlaceholderTextures } from "../assets.js"; // можно убрать

export class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }

  preload() {
    this.load.image("player",   "assets/player.png");
    this.load.image("enemy",    "assets/enemy.png");
    this.load.image("coin",     "assets/coin.png");
    this.load.image("spike",    "assets/spike.png");
    this.load.image("tile",     "assets/tile.png");
    this.load.image("platform", "assets/platform.png");
    this.load.image("flag",     "assets/flag.png");
  }

  create() {
    // createPlaceholderTextures(this); — больше не нужно
    this.scene.start("Menu");
  }
}
```

Тело функции `createPlaceholderTextures` в `src/assets.js` можно оставить как fallback или удалить.

---

### Подход Б — спрайт-листы с анимациями

Если у игрока и врага есть кадры анимации:

```js
export class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }

  preload() {
    this.load.spritesheet("player", "assets/player.png",
      { frameWidth: 28, frameHeight: 30 });
    this.load.spritesheet("enemy", "assets/enemy.png",
      { frameWidth: 26, frameHeight: 26 });
    this.load.image("coin",     "assets/coin.png");
    this.load.image("spike",    "assets/spike.png");
    this.load.image("tile",     "assets/tile.png");
    this.load.image("platform", "assets/platform.png");
    this.load.image("flag",     "assets/flag.png");
  }

  create() {
    // Регистрация анимаций
    this.anims.create({
      key: "player-run",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 7 }),
      frameRate: 12, repeat: -1
    });
    this.anims.create({
      key: "player-idle",
      frames: [{ key: "player", frame: 0 }]
    });
    this.anims.create({
      key: "player-jump",
      frames: [{ key: "player", frame: 8 }]
    });
    this.anims.create({
      key: "enemy-walk",
      frames: this.anims.generateFrameNumbers("enemy", { start: 0, end: 3 }),
      frameRate: 6, repeat: -1
    });

    this.scene.start("Menu");
  }
}
```

### 3. Подключить анимации в сущностях (только для подхода Б)

В `src/entities/Player.js`, метод `update()`:

```js
update() {
  const left  = this.cursors.left.isDown  || this.keys.a.isDown;
  const right = this.cursors.right.isDown || this.keys.d.isDown;
  const jump  = this.cursors.up.isDown    || this.keys.w.isDown || this.keys.space.isDown;

  if (left)       this.setVelocityX(-CONFIG.playerSpeed);
  else if (right) this.setVelocityX(CONFIG.playerSpeed);
  else            this.setVelocityX(0);

  if (jump && this.body.blocked.down) this.setVelocityY(CONFIG.jumpVelocity);

  // Анимации
  if (!this.body.blocked.down)    this.anims.play("player-jump", true);
  else if (left || right)         this.anims.play("player-run",  true);
  else                            this.anims.play("player-idle", true);
}
```

В `src/entities/Enemy.js`, метод `update()` — добавить в конец:

```js
this.anims.play("enemy-walk", true);
```

### 4. Игровой код менять не нужно

Все обращения к текстурам идут по ключам (`"player"`, `"enemy"` и т.д.). Размеры физических тел `Player`/`Enemy` заданы в их конструкторах — Phaser берёт размер первого кадра спрайт-листа автоматически. Если новые спрайты крупнее или меньше указанных размеров — подрегулировать через `setSize` / `setOffset` в конструкторах сущностей.

### 5. Проверить чеклист из README

После замены ассетов пройти [чеклист ручного тестирования](README.md#чеклист-ручного-тестирования). Особое внимание:

- **Хитбокс шипа** по-прежнему занимает нижнюю половину тайла (`setSize(T−6, T/2)` + `setOffset(3, T/2)` в `GameScene.create()`). Убедиться, что новый спрайт шипа визуально совпадает с хитбоксом.
- **Прыжок на врага сверху**: допуск в `GameScene` — `enemy.body.height * 0.5`. Если высота нового спрайта врага сильно отличается от 26 px — скорректировать `setSize` в конструкторе `Enemy`.

---

## Где добавлять новые анимации

- Все анимации регистрируются в `BootScene.create()` после загрузки ассетов.
- Имена ключей анимаций — произвольные строки; ссылки на них только в `Player.js` и `Enemy.js`.
- Дополнительные ключи текстур (фон, частицы и т.п.) добавлять в `ASSET_KEYS` в `src/assets.js` для документирования контракта.
