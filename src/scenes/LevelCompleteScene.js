import { LEVELS } from "../levels.js";
import { CONFIG } from "../config.js";
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
        const next = nextLevelIndex(this.levelIndex);
        // На следующий уровень — свежие 3 жизни, накопленный счёт сохраняем.
        this.scene.start("Game", { levelIndex: next, lives: CONFIG.livesPerLevel, score: this.score });
        this.scene.launch("UI", { lives: CONFIG.livesPerLevel, score: this.score, level: next + 1 });
      });
    }
    this.input.keyboard.once("keydown-M", () => this.scene.start("Menu"));
  }
}
