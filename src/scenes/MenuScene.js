import { LEVELS } from "../levels.js";
import { getProgress, resetProgress } from "../progressStore.js";
import { isMuted, toggleMute } from "../sounds.js";

export class MenuScene extends Phaser.Scene {
  constructor() { super("Menu"); }

  create() {
    const cx = this.scale.width / 2;
    this.add.text(cx, 70, "ПЛАТФОРМЕР", { fontSize: "44px", color: "#fff" })
      .setOrigin(0.5);
    this.add.text(cx, 130, "← → или A/D — движение,  ↑/W/Пробел — прыжок",
      { fontSize: "16px", color: "#b0bec5" }).setOrigin(0.5);

    LEVELS.forEach((lvl, i) => {
      const prog = getProgress(lvl.name);
      const tick = prog?.completed ? "✓ " : "";
      const best = prog?.completed ? `   ★ ${prog.bestScore}` : "";
      const label = `${tick}▶ ${i + 1}. ${lvl.name}${best}`;
      const t = this.add.text(cx, 190 + i * 42, label,
        { fontSize: "22px", color: prog?.completed ? "#a5d6a7" : "#4caf50" })
        .setOrigin(0.5).setInteractive();
      t.on("pointerover", () => t.setColor(prog?.completed ? "#c8e6c9" : "#a5d6a7"));
      t.on("pointerout", () => t.setColor(prog?.completed ? "#a5d6a7" : "#4caf50"));
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

    // Mute-кнопка в правом верхнем углу.
    this.muteBtn = this.add.text(this.scale.width - 16, 16, this.muteIcon(),
      { fontSize: "24px", color: "#b0bec5" })
      .setOrigin(1, 0).setInteractive();
    this.muteBtn.on("pointerdown", () => {
      toggleMute();
      this.muteBtn.setText(this.muteIcon());
    });

    // Сброс прогресса в левом верхнем углу (с подтверждением).
    const resetBtn = this.add.text(16, 16, "↻ сброс",
      { fontSize: "14px", color: "#666" })
      .setInteractive();
    resetBtn.on("pointerover", () => resetBtn.setColor("#999"));
    resetBtn.on("pointerout", () => resetBtn.setColor("#666"));
    resetBtn.on("pointerdown", () => {
      if (confirm("Сбросить весь прогресс (пройдено / лучшие счёты)?")) {
        resetProgress();
        this.scene.restart();
      }
    });

    // Enter — начать с первого уровня
    this.input.keyboard.once("keydown-ENTER", () => this.startLevel(0));
  }

  muteIcon() { return isMuted() ? "🔇" : "🔊"; }

  startLevel(index) {
    this.scene.start("Game", { levelIndex: index });
    this.scene.launch("UI", { lives: 3, score: 0, level: index + 1 });
  }
}
