export const loseLife = (lives) => Math.max(0, lives - 1);
export const isGameOver = (lives) => lives <= 0;
export const nextLevelIndex = (i) => i + 1;
export const isLastLevel = (i, total) => i >= total - 1;
