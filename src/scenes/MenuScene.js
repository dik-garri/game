import { LEVELS } from "../levels.js";
import { getProgress, resetProgress } from "../progressStore.js";
import { isMuted, toggleMute } from "../sounds.js";
import { savePhoto, clearPhoto, hasPhoto } from "../heroPhoto.js";

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
    const editorY = 190 + LEVELS.length * 42 + 30;
    const editorBtn = this.add.text(cx, editorY,
      "🔧 Открыть конструктор уровней",
      { fontSize: "20px", color: "#ffd54f" })
      .setOrigin(0.5).setInteractive();
    editorBtn.on("pointerover", () => editorBtn.setColor("#fff176"));
    editorBtn.on("pointerout", () => editorBtn.setColor("#ffd54f"));
    editorBtn.on("pointerdown", () => this.scene.start("Editor"));

    // Фото героя
    const photoLabel = hasPhoto() ? "📷 Сменить фото героя" : "📷 Загрузить фото героя";
    const photoBtn = this.add.text(cx, editorY + 36, photoLabel,
      { fontSize: "16px", color: "#90caf9" })
      .setOrigin(0.5).setInteractive();
    photoBtn.on("pointerover", () => photoBtn.setColor("#bbdefb"));
    photoBtn.on("pointerout", () => photoBtn.setColor("#90caf9"));
    photoBtn.on("pointerdown", () => this.openPhotoPicker());

    if (hasPhoto()) {
      const resetPhoto = this.add.text(cx, editorY + 58, "(вернуть стандартного)",
        { fontSize: "12px", color: "#777" })
        .setOrigin(0.5).setInteractive();
      resetPhoto.on("pointerover", () => resetPhoto.setColor("#aaa"));
      resetPhoto.on("pointerout", () => resetPhoto.setColor("#777"));
      resetPhoto.on("pointerdown", () => {
        clearPhoto();
        location.reload();
      });
    }

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

  openPhotoPicker() {
    const input = document.getElementById("hero-photo-input");
    if (!input) return;
    // Перезаписываем onchange каждый раз (а не addEventListener), чтобы при
    // повторных открытиях не вешать новые обработчики поверх старых.
    input.value = "";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        await savePhoto(file, 32);
        // Простейший способ применить — перезагрузить страницу, BootScene
        // подхватит фото из localStorage и заменит текстуру player.
        location.reload();
      } catch (e) {
        alert("Не получилось: " + e.message);
      }
    };
    input.click();
  }

  startLevel(index) {
    this.scene.start("Game", { levelIndex: index });
    this.scene.launch("UI", { lives: 3, score: 0, level: index + 1 });
  }
}
