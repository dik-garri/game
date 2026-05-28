import { createPlaceholderTextures } from "../assets.js";

export class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }
  create() {
    createPlaceholderTextures(this);
    this.scene.start("Menu");
  }
}
