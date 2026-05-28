import { LEVELS } from "../levels.js";

export class MenuScene extends Phaser.Scene {
  constructor() { super("Menu"); }
  create() {
    const cx = this.scale.width / 2;
    this.add.text(cx, 120, "ПЛАТФОРМЕР", { fontSize: "48px", color: "#fff" })
      .setOrigin(0.5);
    this.add.text(cx, 200, "← → или A/D — движение,  ↑/W/Пробел — прыжок",
      { fontSize: "18px", color: "#b0bec5" }).setOrigin(0.5);

    LEVELS.forEach((lvl, i) => {
      const t = this.add.text(cx, 280 + i * 50, `▶ ${i + 1}. ${lvl.name}`,
        { fontSize: "26px", color: "#4caf50" }).setOrigin(0.5).setInteractive();
      t.on("pointerover", () => t.setColor("#a5d6a7"));
      t.on("pointerout", () => t.setColor("#4caf50"));
      t.on("pointerdown", () => this.startLevel(i));
    });

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
