import { CONFIG } from "../config.js";

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "player");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(false); // падение в яму = смерть (Task 9)
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({ a: "A", d: "D", w: "W", space: "SPACE" });
  }

  update() {
    const left = this.cursors.left.isDown || this.keys.a.isDown;
    const right = this.cursors.right.isDown || this.keys.d.isDown;
    const jump = this.cursors.up.isDown || this.keys.w.isDown || this.keys.space.isDown;

    if (left) this.setVelocityX(-CONFIG.playerSpeed);
    else if (right) this.setVelocityX(CONFIG.playerSpeed);
    else this.setVelocityX(0);

    if (jump && this.body.blocked.down) this.setVelocityY(CONFIG.jumpVelocity);
  }
}
