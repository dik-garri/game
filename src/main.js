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
  // FIT масштабирует игру 832×512 под любой экран с сохранением пропорций,
  // CENTER_BOTH центрирует. Координаты ввода Phaser пересчитывает сам — тач
  // на телефоне попадает в нужные точки.
  scale: {
    parent: "game-root",
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CONFIG.width,
    height: CONFIG.height,
  },
  backgroundColor: COLORS.bg,
  pixelArt: true,
  // до 3 одновременных касаний: двигаться и прыгать одной рукой/двумя пальцами.
  input: { activePointers: 3 },
  physics: { default: "arcade", arcade: { gravity: { y: CONFIG.gravity }, debug: false } },
  scene: [BootScene, MenuScene, GameScene, UIScene, GameOverScene, LevelCompleteScene, EditorScene],
};

// eslint-disable-next-line no-new
new Phaser.Game(gameConfig);
