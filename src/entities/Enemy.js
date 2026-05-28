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
    // Детерминированно задаём направление каждый кадр.
    // Раньше я только разворачивал на границах — но если по какой-то причине
    // velocity обнулилась (коллизия, group-defaults), enemy замирал навсегда.
    // Теперь устойчиво: всегда выставляем нужный знак скорости.
    let dir;
    if (this.x <= this.minX) dir = 1;        // на левой границе — едем вправо
    else if (this.x >= this.maxX) dir = -1;  // на правой — влево
    else if (this.body.velocity.x > 0) dir = 1;
    else if (this.body.velocity.x < 0) dir = -1;
    else dir = 1;                            // velocity занулилась — пнём вправо
    this.setVelocityX(dir * CONFIG.enemySpeed);
  }
}
