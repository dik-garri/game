import { createPlaceholderTextures, applyLoadedSprites, upscaleRawIntoKey, SPRITE_FILES } from "../assets.js";
import { loadPhoto } from "../heroPhoto.js";

export class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }

  preload() {
    // Спрайты Kenney под суффиксом _raw — потом апскейлим до целевых размеров.
    for (const [key, path] of Object.entries(SPRITE_FILES)) {
      this.load.image(`${key}_raw`, path);
    }
    // Кастомное фото героя (если есть в localStorage) — тоже под суффиксом _raw.
    const photo = loadPhoto();
    if (photo) this.load.image("player_photo_raw", photo);

    this.load.on("loaderror", (file) => {
      console.warn(`Не удалось загрузить ${file.key} (${file.url}) — используется placeholder`);
    });
  }

  create() {
    createPlaceholderTextures(this);         // фолбэк-плашки + всегда spike
    applyLoadedSprites(this);                // подмена placeholder спрайтами Kenney
    // Фото героя поверх стандартного player-спрайта (если юзер загрузил).
    upscaleRawIntoKey(this, "player_photo_raw", "player");
    this.scene.start("Menu");
  }
}
