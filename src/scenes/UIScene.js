export class UIScene extends Phaser.Scene {
  constructor() { super("UI"); }

  init(data) {
    // Стартовые значения передаются явно из MenuScene (через scene.launch),
    // потому что UIScene.create() выполняется ПОЗЖЕ GameScene.create() и не
    // успевает поймать его 'hud-init' event.
    this.cur = {
      lives: data.lives ?? 3,
      score: data.score ?? 0,
      level: data.level ?? 1,
    };
  }

  create() {
    const style = { fontSize: "20px", color: "#ffffff" };
    this.livesText = this.add.text(16, 12, "", style);
    this.scoreText = this.add.text(16, 38, "", style);
    this.levelText = this.add.text(this.scale.width - 16, 12, "", style).setOrigin(1, 0);

    this.render();

    const game = this.scene.get("Game");
    const onScore = (score) => { this.cur.score = score; this.render(); };
    const onLives = (lives) => { this.cur.lives = lives; this.render(); };
    const onHudInit = (d) => { this.cur = { ...this.cur, ...d }; this.render(); };

    game.events.on("score-changed", onScore);
    game.events.on("life-changed", onLives);
    game.events.on("hud-init", onHudInit);

    // Снять слушатели при остановке UIScene, чтобы не плодить дубликаты
    // при последующих scene.launch("UI", ...).
    this.events.once("shutdown", () => {
      game.events.off("score-changed", onScore);
      game.events.off("life-changed", onLives);
      game.events.off("hud-init", onHudInit);
    });
  }

  render() {
    this.livesText.setText(`❤ ${this.cur.lives}`);
    this.scoreText.setText(`★ ${this.cur.score}`);
    this.levelText.setText(`Уровень ${this.cur.level}`);
  }
}
