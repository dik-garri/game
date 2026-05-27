import { test } from "node:test";
import assert from "node:assert/strict";
import { loseLife, isGameOver, nextLevelIndex, isLastLevel } from "../src/logic/progress.js";

test("loseLife уменьшает жизни, не уходя ниже 0", () => {
  assert.equal(loseLife(3), 2);
  assert.equal(loseLife(0), 0);
});

test("isGameOver истинно при 0 жизней", () => {
  assert.equal(isGameOver(0), true);
  assert.equal(isGameOver(1), false);
});

test("nextLevelIndex и isLastLevel учитывают общее число уровней", () => {
  assert.equal(nextLevelIndex(0), 1);
  assert.equal(isLastLevel(2, 3), true);
  assert.equal(isLastLevel(1, 3), false);
});
