// Чистая функция: объект уровня → списки игровых объектов в пикселях.
// Координаты объектов — центр соответствующего тайла.
export function parseLevel(level) {
  const ts = level.tileSize;
  const legend = level.legend ?? {};
  const result = {
    tiles: [], spikes: [], coins: [],
    player: { x: ts / 2, y: ts / 2 },
    flag: null,
    hadStart: false,
    worldWidth: 0,
    worldHeight: level.map.length * ts,
  };

  level.map.forEach((row, r) => {
    // worldWidth = ширина самой широкой строки карты (строки могут быть разной длины)
    result.worldWidth = Math.max(result.worldWidth, row.length * ts);
    for (let c = 0; c < row.length; c++) {
      const kind = legend[row[c]];
      if (!kind || kind === "empty") continue;
      const pos = { x: c * ts + ts / 2, y: r * ts + ts / 2 };
      switch (kind) {
        case "tile": result.tiles.push(pos); break;
        case "spike": result.spikes.push(pos); break;
        case "coin": result.coins.push(pos); break;
        case "flag": result.flag = pos; break;
        case "player": result.player = pos; result.hadStart = true; break;
        default: console.warn(`parseLevel: неизвестный тип "${kind}" (строка ${r}, столбец ${c})`);
      }
    }
  });

  return result;
}
