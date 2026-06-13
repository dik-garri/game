import { LEVELS } from "../levels.js";
import { CONFIG } from "../config.js";
import { nextLevelIndex, isLastLevel } from "../logic/progress.js";
import { sfx } from "../sounds.js";
import { markCompleted } from "../progressStore.js";

export class LevelCompleteScene extends Phaser.Scene {
  constructor() { super("LevelComplete"); }
  init(data) {
    this.levelIndex = data.levelIndex;
    this.score = data.score;
    this.fromEditor = !!data.fromEditor;
    this.customLevel = data.customLevel ?? null;
  }

  // Кнопка-тап (для мобилок) + действие. Клавиши биндятся отдельно.
  button(x, y, label, action) {
    const t = this.add.text(x, y, label, {
      fontSize: "22px", color: "#fff", backgroundColor: "#2f6fc4",
      padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setInteractive();
    t.on("pointerover", () => t.setColor("#ffd54f"));
    t.on("pointerout", () => t.setColor("#fff"));
    t.on("pointerdown", action);
    return t;
  }

  create() {
    sfx.win();
    if (!this.fromEditor) {
      const levelName = LEVELS[this.levelIndex]?.name;
      if (levelName) markCompleted(levelName, this.score);
    }
    const cx = this.scale.width / 2, cy = this.scale.height / 2;

    if (this.fromEditor) {
      this.add.text(cx, cy - 50, "УРОВЕНЬ ПРОЙДЕН (тест)",
        { fontSize: "32px", color: "#4caf50" }).setOrigin(0.5);
      this.add.text(cx, cy - 8, `Очки: ${this.score}`,
        { fontSize: "22px", color: "#fff" }).setOrigin(0.5);
      const toEditor = () => this.scene.start("Editor", { level: this.customLevel });
      this.button(cx, cy + 50, "🔧 В конструктор", toEditor);
      this.input.keyboard.once("keydown-ENTER", toEditor);
      this.input.keyboard.once("keydown-M", toEditor);
      return;
    }

    const last = isLastLevel(this.levelIndex, LEVELS.length);
    const title = last ? "ИГРА ПРОЙДЕНА!" : "УРОВЕНЬ ПРОЙДЕН!";
    this.add.text(cx, cy - 70, title, { fontSize: "40px", color: "#4caf50" }).setOrigin(0.5);
    this.add.text(cx, cy - 24, `Очки: ${this.score}`, { fontSize: "24px", color: "#fff" }).setOrigin(0.5);

    const toMenu = () => this.scene.start("Menu");
    if (last) {
      this.button(cx, cy + 40, "≡ В меню", toMenu);
      this.input.keyboard.once("keydown-SPACE", toMenu);
      this.input.keyboard.once("keydown-M", toMenu);
    } else {
      const next = () => {
        const n = nextLevelIndex(this.levelIndex);
        this.scene.start("Game", { levelIndex: n, lives: CONFIG.livesPerLevel, score: this.score });
        this.scene.launch("UI", { lives: CONFIG.livesPerLevel, score: this.score, level: n + 1 });
      };
      this.button(cx - 95, cy + 40, "▶ Дальше", next);
      this.button(cx + 95, cy + 40, "≡ Меню", toMenu);
      this.input.keyboard.once("keydown-SPACE", next);
      this.input.keyboard.once("keydown-M", toMenu);
    }
  }
}
