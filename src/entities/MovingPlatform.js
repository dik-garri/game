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
    // Отключаем автоматический «провоз» Phaser-ом (friction.x по умолчанию = 1):
    // он работает только по X и складывается с нашим ручным deltaX → игрок едет
    // в 2× быстрее платформы. Единственный механизм провоза — наш deltaX/deltaY.
    this.body.friction.x = 0;
    this.body.friction.y = 0;
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
  // Жёсткая bbox-проверка: ноги игрока должны быть ВПРИТЫК к верху платформы
  // (dy ≈ 0), а не «где-то выше». Иначе игрок на floating-тайле row 4 ловит
  // X-платформу с row 5, проезжающую на 32 px ниже, и едет вместе с ней.
  isRiding(player) {
    const dy = player.body.bottom - this.body.top;
    if (dy < -2 || dy > 4) return false;
    if (player.body.right <= this.body.left) return false;
    if (player.body.left >= this.body.right) return false;
    return player.body.blocked.down;
  }
}
