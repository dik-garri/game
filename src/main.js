import { CONFIG, COLORS } from "./config.js";
import { BootScene } from "./scenes/BootScene.js";
import { MenuScene } from "./scenes/MenuScene.js";
import { GameScene } from "./scenes/GameScene.js";
import { UIScene } from "./scenes/UIScene.js";
import { GameOverScene } from "./scenes/GameOverScene.js";
import { LevelCompleteScene } from "./scenes/LevelCompleteScene.js";
import { EditorScene } from "./scenes/EditorScene.js";

const gameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.width,
  height: CONFIG.height,
  backgroundColor: COLORS.bg,
  pixelArt: true,
  physics: { default: "arcade", arcade: { gravity: { y: CONFIG.gravity }, debug: false } },
  scene: [BootScene, MenuScene, GameScene, UIScene, GameOverScene, LevelCompleteScene, EditorScene],
};

// eslint-disable-next-line no-new
new Phaser.Game(gameConfig);
