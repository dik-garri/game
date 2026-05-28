// Кинематическая платформа: двигается между start и start±range по оси.
// ВАЖНО: Arcade Physics НЕ переносит автоматически тело, стоящее на immovable-
// платформе. Поэтому платформа сама считает свой сдвиг за кадр (deltaX/deltaY),
// а GameScene вручную прибавляет его игроку, когда тот стоит сверху.
export class MovingPlatform extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, axis, rangePx, speed) {
    super(scene, x, y, "platform");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.axis = axis;
    this.minV = axis === "x" ? x - rangePx : y - rangePx;
    this.maxV = axis === "x" ? x + rangePx : y + rangePx;
    this.speed = speed;
    this.deltaX = 0; this.deltaY = 0;
    this.prevX = x; this.prevY = y;
    if (axis === "x") this.setVelocityX(speed); else this.setVelocityY(speed);
  }

  // Вызывается вручную из сцены ДО того, как сцена применит дельту к игроку.
  update() {
    // развернуть на границе с body.reset, чтобы body и sprite оставались синхронны
    // и не накапливался дрейф / фантомная скорость.
    if (this.axis === "x") {
      if (this.x <= this.minV && this.body.velocity.x < 0) { this.body.reset(this.minV, this.y); this.setVelocityX(this.speed); }
      else if (this.x >= this.maxV && this.body.velocity.x > 0) { this.body.reset(this.maxV, this.y); this.setVelocityX(-this.speed); }
    } else {
      if (this.y <= this.minV && this.body.velocity.y < 0) { this.body.reset(this.x, this.minV); this.setVelocityY(this.speed); }
      else if (this.y >= this.maxV && this.body.velocity.y > 0) { this.body.reset(this.x, this.maxV); this.setVelocityY(-this.speed); }
    }
    // сдвиг за прошедший кадр
    this.deltaX = this.x - this.prevX;
    this.deltaY = this.y - this.prevY;
    this.prevX = this.x;
    this.prevY = this.y;
  }

  // игрок стоит на платформе?
  // Основной путь — touching-флаги. Фолбэк по bbox используется на краях фрейм-тайминга,
  // но требует туземного контакта (touching.up), иначе игрок на статичном тайле в той же
  // строке, что и траектория платформы, был бы ложно «провезён».
  isRiding(player) {
    return (this.body.touching.up && player.body.touching.down)
      || (this.body.touching.up
          && player.body.bottom <= this.body.top + 4
          && player.body.right > this.body.left
          && player.body.left < this.body.right
          && player.body.blocked.down);
  }
}
