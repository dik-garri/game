import { CONFIG } from "../config.js";

export class GameOverScene extends Phaser.Scene {
  constructor() { super("GameOver"); }
  init(data) {
    this.levelIndex = data.levelIndex;
    this.score = data.score;
    this.fromEditor = !!data.fromEditor;
    this.customLevel = data.customLevel ?? null;
  }
  create() {
    const cx = this.scale.width / 2, cy = this.scale.height / 2;
    this.add.text(cx, cy - 60, "ИГРА ОКОНЧЕНА", { fontSize: "44px", color: "#e53935" }).setOrigin(0.5);
    this.add.text(cx, cy, `Очки: ${this.score}`, { fontSize: "24px", color: "#fff" }).setOrigin(0.5);

    if (this.fromEditor) {
      // Тестовый прогон из конструктора — возврат в редактор.
      this.add.text(cx, cy + 50, "[ENTER] в конструктор",
        { fontSize: "20px", color: "#b0bec5" }).setOrigin(0.5);
      this.input.keyboard.once("keydown-ENTER",
        () => this.scene.start("Editor", { level: this.customLevel }));
      this.input.keyboard.once("keydown-M",
        () => this.scene.start("Editor", { level: this.customLevel }));
      return;
    }

    this.add.text(cx, cy + 50, "[R] заново   [M] меню",
      { fontSize: "20px", color: "#b0bec5" }).setOrigin(0.5);
    this.input.keyboard.once("keydown-R", () => {
      this.scene.stop("UI");
      this.scene.start("Game", { levelIndex: this.levelIndex, lives: CONFIG.livesPerLevel, score: this.score });
      this.scene.launch("UI", { lives: CONFIG.livesPerLevel, score: this.score, level: this.levelIndex + 1 });
    });
    this.input.keyboard.once("keydown-M", () => this.scene.start("Menu"));
  }
}
