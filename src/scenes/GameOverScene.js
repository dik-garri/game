import { CONFIG } from "../config.js";
import { sfx } from "../sounds.js";

export class GameOverScene extends Phaser.Scene {
  constructor() { super("GameOver"); }
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
    sfx.gameover();
    const cx = this.scale.width / 2, cy = this.scale.height / 2;
    this.add.text(cx, cy - 70, "ИГРА ОКОНЧЕНА", { fontSize: "44px", color: "#e53935" }).setOrigin(0.5);
    this.add.text(cx, cy - 24, `Очки: ${this.score}`, { fontSize: "24px", color: "#fff" }).setOrigin(0.5);

    if (this.fromEditor) {
      const toEditor = () => this.scene.start("Editor", { level: this.customLevel });
      this.button(cx, cy + 40, "🔧 В конструктор", toEditor);
      this.input.keyboard.once("keydown-ENTER", toEditor);
      this.input.keyboard.once("keydown-M", toEditor);
      return;
    }

    const restart = () => {
      this.scene.stop("UI");
      this.scene.start("Game", { levelIndex: this.levelIndex, lives: CONFIG.livesPerLevel, score: this.score });
      this.scene.launch("UI", { lives: CONFIG.livesPerLevel, score: this.score, level: this.levelIndex + 1 });
    };
    const toMenu = () => this.scene.start("Menu");
    this.button(cx - 95, cy + 40, "↻ Заново", restart);
    this.button(cx + 95, cy + 40, "≡ Меню", toMenu);
    this.input.keyboard.once("keydown-SPACE", restart);
    this.input.keyboard.once("keydown-M", toMenu);
  }
}
