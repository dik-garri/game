import { CONFIG } from "../config.js";
import { ASSET_KEYS, PLAYER_BODY } from "../assets.js";
import { sfx } from "../sounds.js";

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Текстура: анимированный фото-герой ("hero_sheet") или статичный дефолт.
    const key = scene.registry.get("playerKey") || "player";
    super(scene, x, y, key);
    this.animated = !!scene.registry.get("playerAnimated");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Текстура 28×42 (голова сверху). Коллизия — 28×30 по центру текстуры,
    // чтобы спавн и физика были идентичны прежним (тело центрировано на спрайте,
    // голова визуально выступает над ним). Offset по Y центрирует тело.
    const offY = (ASSET_KEYS.player.h - PLAYER_BODY.h) / 2; // (42-30)/2 = 6
    this.body.setSize(PLAYER_BODY.w, PLAYER_BODY.h);
    this.body.setOffset((ASSET_KEYS.player.w - PLAYER_BODY.w) / 2, offY);
    this.setCollideWorldBounds(false); // падение в яму = смерть
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({ a: "A", d: "D", w: "W", space: "SPACE" });
    // Состояние touch-управления (пишется в GameScene из pointer-событий).
    this.touch = { left: false, right: false, jumpQueued: false };
    if (this.animated) this.play("hero-idle");
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

    // Анимация: шагаем при горизонтальном движении, иначе стоим.
    if (this.animated) {
      const moving = Math.abs(this.body.velocity.x) > 1;
      this.play(moving ? "hero-walk" : "hero-idle", true);
    }
  }
}
