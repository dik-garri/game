import { CONFIG } from "../config.js";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  // minX/maxX — границы патруля в пикселях
  constructor(scene, x, y, minX, maxX) {
    super(scene, x, y, "enemy");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.minX = minX; this.maxX = maxX;
    this.setVelocityX(CONFIG.enemySpeed);
    this.setCollideWorldBounds(false);
  }

  update() {
    if (this.x <= this.minX && this.body.velocity.x < 0) this.setVelocityX(CONFIG.enemySpeed);
    else if (this.x >= this.maxX && this.body.velocity.x > 0) this.setVelocityX(-CONFIG.enemySpeed);
  }
}
