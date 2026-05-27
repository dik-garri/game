export const CONFIG = {
  width: 832,            // 26 тайлов * 32
  height: 512,           // 16 тайлов * 32
  tileSize: 32,
  gravity: 1200,
  playerSpeed: 220,
  jumpVelocity: -560,
  enemySpeed: 60,
  livesPerLevel: 3,
  coinScore: 10,
  enemyBounce: -300,     // отскок после прыжка на врага
};

// Цвета placeholder-графики (заменяются при переходе на спрайты)
export const COLORS = {
  bg: 0x1e2a3a,
  player: 0x4caf50,
  enemy: 0xe53935,
  coin: 0xffd54f,
  spike: 0xb0bec5,
  tile: 0x6d4c41,
  platform: 0x8d6e63,
  flag: 0x42a5f5,
};
