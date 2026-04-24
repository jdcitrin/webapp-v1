export type Mode = "easy" | "medium" | "hard";

export interface GameResult {
  target: number;
  elapsed: number;
  score: number;
  diff: number;
}

export function generateTarget(mode: Mode): number {
  if (mode === "easy") {
    return Math.floor(Math.random() * 11) + 5; // 5–15
  }
  // medium and hard: one decimal place
  const raw = 5 + Math.random() * 10; // 5.0–15.0
  return Math.round(raw * 10) / 10;
}

export function calcScore(target: number, elapsed: number): GameResult {
  const diff = Math.abs(elapsed - target);
  // Score 10 for 0 diff, degrades linearly, floored at 0
  const score = Math.max(0, 10 * (1 - diff / target));
  return { target, elapsed, score, diff };
}

export function formatTime(seconds: number, mode: Mode): string {
  if (mode === "easy") return `${seconds}s`;
  return `${seconds.toFixed(1)}s`;
}
