# Спрайты

Источник: [Kenney Pixel Platformer Pack v1.2](https://kenney.nl/assets/pixel-platformer) от Kenney (www.kenney.nl).

Лицензия: **CC0** (Creative Commons Zero) — можно использовать в личных,
образовательных и коммерческих целях без атрибуции (но мы всё равно её даём 🙂).

## Сопоставление с ключами игры

| Файл          | Размер | Из пака                         | Используется как |
|---------------|--------|---------------------------------|------------------|
| `tile.png`    | 18×18  | `Tiles/tile_0001.png`           | поверхность земли с травой (`tile`) |
| `dirt.png`    | 18×18  | `Tiles/tile_0004.png`           | земля без травы, подземные блоки (`dirt`) |
| `coin.png`    | 18×18  | `Tiles/tile_0151.png`           | монета (`coin`) |
| `flag.png`    | 18×18  | `Tiles/tile_0111.png`           | финишный флаг (`flag`) |
| `platform.png`| 18×18  | `Tiles/tile_0006.png`           | движущаяся платформа (`platform`) |
| `player.png`  | 18×18  | `Tiles/Characters/tile_0000.png`| игрок-зелёный (`player`) |
| `enemy.png`   | 18×18  | `Tiles/Characters/tile_0026.png`| враг-слизень (`enemy`) |

**`spike`** в паке нет — генерируется кодом как треугольник
(см. `src/assets.js → createPlaceholderTextures`).
