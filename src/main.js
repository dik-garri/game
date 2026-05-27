import { CONFIG, COLORS } from "./config.js";

// Сцены импортируются и добавляются в массив scene по мере реализации задач.
const gameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.width,
  height: CONFIG.height,
  backgroundColor: COLORS.bg,
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: { gravity: { y: CONFIG.gravity }, debug: false },
  },
  scene: [], // заполняется в последующих задачах
};

// eslint-disable-next-line no-new
new Phaser.Game(gameConfig);
