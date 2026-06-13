import { CONFIG } from "../config.js";
import { LEVELS } from "../levels.js";
import { parseLevel } from "../logic/parseLevel.js";
import { Player } from "../entities/Player.js";
import { Enemy } from "../entities/Enemy.js";
import { loseLife, isGameOver } from "../logic/progress.js";
import { MovingPlatform } from "../entities/MovingPlatform.js";
import { sfx } from "../sounds.js";

export class GameScene extends Phaser.Scene {
  constructor() { super("Game"); }

  // Жизни сбрасываются на каждый вход в уровень (3 на уровень — см. CONFIG.livesPerLevel).
  // При рестарте уровня после смерти жизни/счёт передаются через data.
  // customLevel + fromEditor — данные приходят из конструктора (см. EditorScene.testLevel).
  init(data) {
    this.levelIndex = data.levelIndex ?? 0;
    this.lives = data.lives ?? CONFIG.livesPerLevel;
    this.score = data.score ?? 0;
    this.customLevel = data.customLevel ?? null;
    this.fromEditor = !!data.fromEditor;
  }

  create() {
    const level = this.customLevel ?? LEVELS[this.levelIndex];
    const parsed = parseLevel(level);
    if (!parsed.hadStart) console.error("Уровень без точки старта P");

    // Мир глубже карты: земля заполняется до низу экрана, в пропастях — лава.
    const ts = CONFIG.tileSize;
    const worldH = Math.max(parsed.worldHeight, CONFIG.height);
    this.physics.world.setBounds(0, 0, parsed.worldWidth, worldH);
    this.cameras.main.setBackgroundColor(0x7ec8e3); // голубое небо
    this.isDead = false;
    this.won = false;

    // белые облака в небе (параллакс + лёгкий дрейф)
    const cloudCount = Math.max(3, Math.ceil(parsed.worldWidth / 300));
    for (let i = 0; i < cloudCount; i++) {
      const x = 80 + i * 300 + (i % 2) * 120;
      const y = 26 + (i % 3) * 26;
      const cl = this.add.image(x, y, "cloud")
        .setScrollFactor(0.6).setDepth(-3).setAlpha(0.95)
        .setScale(0.8 + (i % 3) * 0.25);
      this.tweens.add({
        targets: cl, x: x + 40,
        duration: 5000 + i * 350, yoyo: true, repeat: -1, ease: "Sine.inOut",
      });
    }

    // статичные тайлы из карты: трава-сверху у поверхности, земля без травы —
    // если прямо над тайлом есть ещё тайл (подземный блок).
    this.solids = this.physics.add.staticGroup();
    const tileSet = new Set(
      parsed.tiles.map((t) => `${Math.round((t.x - ts / 2) / ts)},${Math.round((t.y - ts / 2) / ts)}`)
    );
    parsed.tiles.forEach((t) => {
      const col = Math.round((t.x - ts / 2) / ts);
      const row = Math.round((t.y - ts / 2) / ts);
      const hasTileAbove = tileSet.has(`${col},${row - 1}`);
      this.solids.create(t.x, t.y, hasTileAbove ? "dirt" : "tile");
    });

    // Заполнение ниже карты: под колонками с полом — земля (визуально, до низу);
    // в колонках-пропастях — лава (с проверкой касания на смерть).
    this.lava = this.physics.add.staticGroup();
    const mapRows = level.map.length;
    const cols = Math.round(parsed.worldWidth / ts);
    const fillRows = Math.ceil(worldH / ts);
    const isSolid = (r, c) => (level.map[r] || "")[c] === "=";
    for (let c = 0; c < cols; c++) {
      if (isSolid(mapRows - 1, c)) {
        // колонка с полом → визуальная земля до низу (без коллизии — игрок
        // стоит на верхних тайлах из карты)
        for (let r = mapRows; r < fillRows; r++) {
          this.add.image(c * ts + ts / 2, r * ts + ts / 2, "dirt").setDepth(-1);
        }
      } else {
        // пропасть → лава от нижнего ряда карты до низу.
        // Все ряды — глубокая лава (тело для смерти), верхний ряд накрываем
        // анимированной «бурлящей» поверхностью.
        for (let r = mapRows - 1; r < fillRows; r++) {
          this.lava.create(c * ts + ts / 2, r * ts + ts / 2, "lavaDeep");
        }
        this.add.sprite((c + 0.5) * ts, (mapRows - 1 + 0.5) * ts, "lavaTop0")
          .play("lava-surface");
      }
    }

    // шипы (урон, не препятствие). Тело уменьшаем к основанию треугольника,
    // чтобы не убивало на пустых верхних углах тайла — иначе ощущается нечестно.
    this.spikes = this.physics.add.staticGroup();
    parsed.spikes.forEach((s) => {
      const spike = this.spikes.create(s.x, s.y, "spike");
      // setSize/setOffset на StaticBody сами обновляют staticTree —
      // refreshBody() здесь не нужен (и метод живёт на спрайте, не на body).
      spike.body.setSize(CONFIG.tileSize - 6, CONFIG.tileSize / 2);
      spike.body.setOffset(3, CONFIG.tileSize / 2);
    });

    // монеты
    this.coins = this.physics.add.staticGroup();
    parsed.coins.forEach((c) => this.coins.create(c.x, c.y, "coin"));

    // флаг (overlap-обработчик регистрируется ниже)
    if (parsed.flag) this.flag = this.physics.add.staticImage(parsed.flag.x, parsed.flag.y, "flag");

    // игрок
    this.player = new Player(this, parsed.player.x, parsed.player.y);
    this.physics.add.collider(this.player, this.solids);

    // смерть от лавы
    this.physics.add.overlap(this.player, this.lava, () => this.die(), null, this);

    // камера следует за игроком
    this.cameras.main.setBounds(0, 0, parsed.worldWidth, worldH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // сбор монет
    this.physics.add.overlap(this.player, this.coins, (_p, coin) => {
      coin.destroy();
      this.score += CONFIG.coinScore;
      this.events.emit("score-changed", this.score);
      sfx.coin();
    });

    // смерть от шипов
    this.physics.add.overlap(this.player, this.spikes, () => this.die(), null, this);

    // враги
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
        sfx.enemyKill();
      } else {
        this.die();
      }
    }, null, this);

    // движущиеся платформы
    this.platforms = this.add.group();
    (level.movingPlatforms ?? []).forEach((p) => {
      const mp = new MovingPlatform(
        this, p.x * T + T / 2, p.y * T + T / 2, p.axis, p.range * T, p.speed
      );
      this.platforms.add(mp);
      this.physics.add.collider(this.player, mp);
      this.physics.add.collider(this.enemies, mp);
    });

    // финиш по флагу — победа уровня
    if (this.flag) {
      this.physics.add.overlap(this.player, this.flag, () => {
        if (this.isDead || this.won) return;
        this.won = true;
        this.scene.stop("UI");
        this.scene.start("LevelComplete", {
          levelIndex: this.levelIndex, score: this.score,
          fromEditor: this.fromEditor, customLevel: this.customLevel,
        });
      }, null, this);
    }

    // сообщить UI стартовые значения
    // Стартовые значения HUD передаются явно через scene.launch("UI", ...) из MenuScene/LevelComplete/GameOver;
    this.events.emit("hud-init", { lives: this.lives, score: this.score, level: this.levelIndex + 1 });

    this.setupTouchInput();

    // выход в меню в любой момент по Esc
    this.input.keyboard.on("keydown-ESC", () => this.exitToMenu());
  }

  exitToMenu() {
    this.scene.stop("UI");
    this.scene.start("Menu");
  }

  // Экранные кнопки управления (только на тач-устройствах). Мультитач:
  // можно держать ◀/▶ и одновременно жать ⤴ (разные пальцы = разные pointer'ы).
  setupTouchInput() {
    if (!this.sys.game.device.input.touch) return; // на десктопе не показываем
    const touch = this.player.touch;
    const H = this.scale.height, W = this.scale.width;
    const R = 42;

    const btn = (x, y, label, onDown, onUp) => {
      const circle = this.add.circle(x, y, R, 0xffffff, 0.18)
        .setScrollFactor(0).setDepth(2000).setStrokeStyle(3, 0xffffff, 0.5)
        .setInteractive({ useHandCursor: false });
      this.add.text(x, y, label, { fontSize: "30px", color: "#ffffff" })
        .setOrigin(0.5).setScrollFactor(0).setDepth(2001).setAlpha(0.8);
      circle.on("pointerdown", onDown);
      circle.on("pointerup", onUp);
      circle.on("pointerout", onUp);   // палец увели за кнопку — отпускаем
      return circle;
    };

    btn(70, H - 60, "◀", () => { touch.left = true; }, () => { touch.left = false; });
    btn(170, H - 60, "▶", () => { touch.right = true; }, () => { touch.right = false; });
    btn(W - 70, H - 60, "⤴", () => { touch.jump = true; }, () => { touch.jump = false; });
  }

  update() {
    if (this.isDead || this.won) return;
    this.player.update();

    // Упор по горизонтали: за левый/правый край мира не выпускаем (раньше игрок
    // уходил в пустоту и падал → умирал). Вертикаль не трогаем — падение в яму
    // должно убивать.
    const bounds = this.physics.world.bounds;
    const body = this.player.body;
    if (body.x < 0) { this.player.x -= body.x; body.setVelocityX(0); }
    else if (body.right > bounds.width) { this.player.x -= body.right - bounds.width; body.setVelocityX(0); }

    if (this.player.y > bounds.height + 64) this.die();
    // обновляем платформы и провозим игрока, если он стоит сверху
    this.platforms.getChildren().forEach((p) => {
      p.update();
      if (p.isRiding(this.player)) {
        this.player.x += p.deltaX;
        this.player.y += p.deltaY;
      }
    });
    this.enemies.getChildren().forEach((e) => e.update());
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.lives = loseLife(this.lives);
    this.events.emit("life-changed", this.lives);
    this.cameras.main.flash(150, 255, 0, 0);
    sfx.hit();
    this.time.delayedCall(400, () => {
      if (isGameOver(this.lives)) {
        this.scene.stop("UI");
        this.scene.start("GameOver", {
          levelIndex: this.levelIndex, score: this.score,
          fromEditor: this.fromEditor, customLevel: this.customLevel,
        });
      } else {
        // рестарт уровня с сохранёнными жизнями и счётом
        this.scene.restart({
          levelIndex: this.levelIndex, lives: this.lives, score: this.score,
          customLevel: this.customLevel, fromEditor: this.fromEditor,
        });
      }
    });
  }
}
