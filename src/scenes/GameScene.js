import { CONFIG } from "../config.js";
import { LEVELS } from "../levels.js";
import { parseLevel } from "../logic/parseLevel.js";
import { Player } from "../entities/Player.js";
import { Enemy } from "../entities/Enemy.js";
import { loseLife, isGameOver } from "../logic/progress.js";
import { MovingPlatform } from "../entities/MovingPlatform.js";

export class GameScene extends Phaser.Scene {
  constructor() { super("Game"); }

  // Жизни сбрасываются на каждый вход в уровень (3 на уровень — см. CONFIG.livesPerLevel).
  // При рестарте уровня после смерти жизни/счёт передаются через data.
  init(data) {
    this.levelIndex = data.levelIndex ?? 0;
    this.lives = data.lives ?? CONFIG.livesPerLevel;
    this.score = data.score ?? 0;
  }

  create() {
    const level = LEVELS[this.levelIndex];
    const parsed = parseLevel(level);
    if (!parsed.hadStart) console.error("Уровень без точки старта P");

    this.physics.world.setBounds(0, 0, parsed.worldWidth, parsed.worldHeight);
    this.isDead = false;

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
      spike.body.refreshBody();
    });

    // монеты
    this.coins = this.physics.add.staticGroup();
    parsed.coins.forEach((c) => this.coins.create(c.x, c.y, "coin"));

    // флаг (overlap-обработчик добавляется в Task 12 — финиш уровня)
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

    // сообщить UI стартовые значения
    // TODO(Task 8): UIScene создаётся через scene.launch и её create() выполняется
    // ПОСЛЕ этого emit. Если HUD не получает стартовые значения — Task 8 должна
    // принимать их через scene.launch("UI", {...}) и читать в UIScene.init().
    this.events.emit("hud-init", { lives: this.lives, score: this.score, level: this.levelIndex + 1 });
  }

  update() {
    if (this.isDead) return;
    this.player.update();
    if (this.player.y > this.physics.world.bounds.height + 64) this.die();
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
    this.time.delayedCall(400, () => {
      if (isGameOver(this.lives)) {
        this.scene.stop("UI");
        this.scene.start("GameOver", { levelIndex: this.levelIndex, score: this.score });
      } else {
        // рестарт уровня с сохранёнными жизнями и счётом
        this.scene.restart({ levelIndex: this.levelIndex, lives: this.lives, score: this.score });
      }
    });
  }
}
