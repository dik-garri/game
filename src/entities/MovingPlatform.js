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
  // Чистая bbox-проверка: ноги игрока в пределах 4px над верхом платформы,
  // горизонтальное перекрытие, игрок на земле. touching.up НЕ используем —
  // после шага физики платформа уезжает на доли пикселя за кадр, флаг моргает
  // и игрок соскальзывал. Ложный «провоз» по этой проверке возможен, только
  // если статичный тайл стоит ровно на пути платформы; в текущих уровнях
  // такого нет (см. levels.js).
  isRiding(player) {
    return player.body.bottom <= this.body.top + 4
      && player.body.right > this.body.left
      && player.body.left < this.body.right
      && player.body.blocked.down;
  }
}
