import { LEVELS } from "../levels.js";

export class MenuScene extends Phaser.Scene {
  constructor() { super("Menu"); }
  create() {
    const cx = this.scale.width / 2;
    this.add.text(cx, 70, "ПЛАТФОРМЕР", { fontSize: "44px", color: "#fff" })
      .setOrigin(0.5);
    this.add.text(cx, 130, "← → или A/D — движение,  ↑/W/Пробел — прыжок",
      { fontSize: "16px", color: "#b0bec5" }).setOrigin(0.5);

    LEVELS.forEach((lvl, i) => {
      const t = this.add.text(cx, 190 + i * 42, `▶ ${i + 1}. ${lvl.name}`,
        { fontSize: "22px", color: "#4caf50" }).setOrigin(0.5).setInteractive();
      t.on("pointerover", () => t.setColor("#a5d6a7"));
      t.on("pointerout", () => t.setColor("#4caf50"));
      t.on("pointerdown", () => this.startLevel(i));
    });

    // Конструктор
    const editorBtn = this.add.text(cx, 190 + LEVELS.length * 42 + 30,
      "🔧 Открыть конструктор уровней",
      { fontSize: "20px", color: "#ffd54f" })
      .setOrigin(0.5).setInteractive();
    editorBtn.on("pointerover", () => editorBtn.setColor("#fff176"));
    editorBtn.on("pointerout", () => editorBtn.setColor("#ffd54f"));
    editorBtn.on("pointerdown", () => this.scene.start("Editor"));

    // Enter — начать с первого уровня
    this.input.keyboard.once("keydown-ENTER", () => this.startLevel(0));
  }

  startLevel(index) {
    // Передаём UI стартовые значения сразу, т.к. её create() выполняется ПОСЛЕ
    // GameScene.create() — иначе UI пропустит первый 'hud-init' event.
    // (Жизни и счёт обнуляются на каждый вход в уровень.)
    this.scene.start("Game", { levelIndex: index });
    this.scene.launch("UI", { lives: 3, score: 0, level: index + 1 });
  }
}
