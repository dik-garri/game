import { createPlaceholderTextures } from "../assets.js";
import { loadPhoto, PLAYER_FRAMES } from "../heroPhoto.js";

export class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }

  preload() {
    // Вся графика рисуется кодом (см. assets.js). Внешний ассет один — кастомный
    // фото-герой из localStorage (спрайт-лист 3 кадра 28×42), если загружен.
    const photo = loadPhoto();
    if (photo) {
      this.load.spritesheet("hero_sheet", photo, {
        frameWidth: PLAYER_FRAMES.frameWidth,
        frameHeight: PLAYER_FRAMES.frameHeight,
      });
    }
  }

  create() {
    createPlaceholderTextures(this); // рисует все текстуры кодом

    if (this.textures.exists("hero_sheet")) {
      if (!this.anims.exists("hero-idle")) {
        this.anims.create({
          key: "hero-idle",
          frames: [{ key: "hero_sheet", frame: 0 }],
          frameRate: 1,
        });
        this.anims.create({
          key: "hero-walk",
          frames: this.anims.generateFrameNumbers("hero_sheet", { frames: [1, 2] }),
          frameRate: 5,
          repeat: -1,
        });
      }
      this.registry.set("playerKey", "hero_sheet");
      this.registry.set("playerAnimated", true);
    } else {
      this.registry.set("playerKey", "player");
      this.registry.set("playerAnimated", false);
    }

    this.scene.start("Menu");
  }
}
