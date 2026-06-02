import { CONFIG } from "../config.js";
import { sfx } from "../sounds.js";

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "player");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(false); // падение в яму = смерть
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({ a: "A", d: "D", w: "W", space: "SPACE" });
    // Состояние touch-управления (пишется в GameScene из pointer-событий).
    this.touch = { left: false, right: false, jumpQueued: false };
  }

  update() {
    const left = this.cursors.left.isDown || this.keys.a.isDown || this.touch.left;
    const right = this.cursors.right.isDown || this.keys.d.isDown || this.touch.right;
    const jumpHeld = this.cursors.up.isDown || this.keys.w.isDown || this.keys.space.isDown;
    const jump = jumpHeld || this.touch.jumpQueued;

    if (left) this.setVelocityX(-CONFIG.playerSpeed);
    else if (right) this.setVelocityX(CONFIG.playerSpeed);
    else this.setVelocityX(0);

    if (jump && this.body.blocked.down) {
      this.setVelocityY(CONFIG.jumpVelocity);
      sfx.jump();
    }
    this.touch.jumpQueued = false; // потребляем одиночный «прыжок» из свайпа
  }
}
