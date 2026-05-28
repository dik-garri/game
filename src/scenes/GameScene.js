import { CONFIG } from "../config.js";
import { LEVELS } from "../levels.js";
import { parseLevel } from "../logic/parseLevel.js";
import { Player } from "../entities/Player.js";

export class GameScene extends Phaser.Scene {
  constructor() { super("Game"); }

  // Жизни сбрасываются на каждый вход в уровень (3 на уровень — см. CONFIG.livesPerLevel).
  // При рестарте уровня после смерти Task 9 будет передавать оставшиеся жизни через data.
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

    // сообщить UI стартовые значения
    // TODO(Task 8): UIScene создаётся через scene.launch и её create() выполняется
    // ПОСЛЕ этого emit. Если HUD не получает стартовые значения — Task 8 должна
    // принимать их через scene.launch("UI", {...}) и читать в UIScene.init().
    this.events.emit("hud-init", { lives: this.lives, score: this.score, level: this.levelIndex + 1 });
  }

  update() {
    this.player.update();
  }
}
