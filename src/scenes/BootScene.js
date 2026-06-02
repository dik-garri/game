import { createPlaceholderTextures, applyLoadedSprites, SPRITE_FILES } from "../assets.js";

export class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }

  preload() {
    // Загружаем спрайты Kenney под суффиксом _raw — потом апскейлим до целевых
    // размеров и сохраняем под основным ключом (см. applyLoadedSprites).
    for (const [key, path] of Object.entries(SPRITE_FILES)) {
      this.load.image(`${key}_raw`, path);
    }
    // Если файл не загрузится — просто останется placeholder, всё работает.
    this.load.on("loaderror", (file) => {
      console.warn(`Не удалось загрузить ${file.key} (${file.url}) — используется placeholder`);
    });
  }

  create() {
    createPlaceholderTextures(this); // фолбэк для всего + всегда spike
    applyLoadedSprites(this);         // заменяем placeholder’ы загруженными спрайтами
    this.scene.start("Menu");
  }
}
