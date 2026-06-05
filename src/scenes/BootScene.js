import { createPlaceholderTextures, applyLoadedSprites, SPRITE_FILES } from "../assets.js";
import { loadPhoto, PLAYER_FRAMES } from "../heroPhoto.js";

export class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }

  preload() {
    // Спрайты Kenney под суффиксом _raw — потом апскейлим до целевых размеров.
    for (const [key, path] of Object.entries(SPRITE_FILES)) {
      this.load.image(`${key}_raw`, path);
    }
    // Кастомный герой (если есть) — спрайт-лист из localStorage: 3 кадра 28×42.
    const photo = loadPhoto();
    if (photo) {
      this.load.spritesheet("hero_sheet", photo, {
        frameWidth: PLAYER_FRAMES.frameWidth,
        frameHeight: PLAYER_FRAMES.frameHeight,
      });
    }
    this.load.on("loaderror", (file) => {
      console.warn(`Не удалось загрузить ${file.key} (${file.url}) — используется placeholder`);
    });
  }

  create() {
    createPlaceholderTextures(this);  // фолбэк-плашки + всегда spike
    applyLoadedSprites(this);          // спрайты Kenney → ключи (player = дефолт)

    if (this.textures.exists("hero_sheet")) {
      // Анимированный фото-герой. Регистрируем анимации (один раз на игру).
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
