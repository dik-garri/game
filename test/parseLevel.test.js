import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLevel } from "../src/logic/parseLevel.js";

const sample = {
  name: "T",
  tileSize: 32,
  map: [
    "....",
    "C...",
    "P..F",
    "^===",
  ],
  legend: {
    "=": "tile", "^": "spike", C: "coin", P: "player", F: "flag", ".": "empty",
  },
};

test("конвертирует символы карты в объекты с пиксельными координатами", () => {
  const r = parseLevel(sample);
  // player в строке 2, столбце 0 → x=0*32+16, y=2*32+16 (центр тайла)
  assert.deepEqual(r.player, { x: 16, y: 80 });
  assert.deepEqual(r.flag, { x: 3 * 32 + 16, y: 2 * 32 + 16 });
});

test("собирает монеты, шипы и тайлы списками", () => {
  const r = parseLevel(sample);
  assert.equal(r.coins.length, 1);
  assert.deepEqual(r.coins[0], { x: 16, y: 48 });
  assert.equal(r.spikes.length, 1);
  assert.equal(r.tiles.length, 3);
});

test("'empty' и неизвестные символы не создают объектов", () => {
  const r = parseLevel({
    ...sample,
    map: ["?.", ".."],
    legend: { ".": "empty" },
  });
  assert.equal(r.tiles.length, 0);
  assert.equal(r.coins.length, 0);
});

test("при отсутствии player возвращает дефолтную позицию и флаг hadStart=false", () => {
  const r = parseLevel({ ...sample, map: ["..", "=="], });
  assert.equal(r.hadStart, false);
  assert.ok(r.player); // дефолт, не null
});

test("вычисляет worldHeight по числу строк для определения падения в яму", () => {
  const r = parseLevel(sample);
  assert.equal(r.worldHeight, 4 * 32);
  assert.equal(r.worldWidth, 4 * 32);
});
