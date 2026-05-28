import { CONFIG, COLORS } from "./config.js";
import { BootScene } from "./scenes/BootScene.js";
import { MenuScene } from "./scenes/MenuScene.js";
// GameScene/UIScene/LevelCompleteScene/GameOverScene добавляются в Task 7–12.

const gameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.width,
  height: CONFIG.height,
  backgroundColor: COLORS.bg,
  pixelArt: true,
  physics: { default: "arcade", arcade: { gravity: { y: CONFIG.gravity }, debug: false } },
  scene: [BootScene, MenuScene],
};

// eslint-disable-next-line no-new
new Phaser.Game(gameConfig);
