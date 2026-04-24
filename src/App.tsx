import { useState, useEffect, useRef, useCallback } from "react";
import type { Mode, GameResult } from "./game";
import { generateTarget, calcScore, formatTime } from "./game";
import { playStartBeep, scheduleDeceptiveTicks } from "./audio";
import "./App.css";

type Phase = "home" | "reveal" | "timing" | "result";

const MODE_LABELS: Record<Mode, string> = {
  easy: "EASY",
  medium: "MEDIUM",
  hard: "HARD",
};

const MODE_DESCS: Record<Mode, string> = {
  easy: "whole seconds",
  medium: "decimal precision",
  hard: "deceptive noise",
};

const SCORE_LABEL = (s: number) => {
  if (s >= 9.9) return "alright buddy put your timer away"; 
  if (s >= 9.5) return "just a little closer";
  if (s >= 9.0) return "nerd";
  if (s >= 8.5) return "great, i guess";
  if (s >= 8.0) return "alright";
  if (s >= 7.0) return "good-ish";
  if (s >= 6.0) return "mediocre";
  if (s >= 5.0) return "could be worse";
  if (s >= 4.0) return "so close yet so far";
  if (s >= 3.0) return "rough watch";
  if (s >= 2.0) return "yikes";
  if (s >= 1.0) return "embarrassing";
  if (s >= 0.5) return "clueless";
  return "give up";
};

export default function App() {
  const [mode, setMode] = useState<Mode>("easy");
  const [phase, setPhase] = useState<Phase>("home");
  const [hoverMode, setHoverMode] = useState<Mode | null>(null);
  const [target, setTarget] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [revealCountdown, setRevealCountdown] = useState(3);
  const [scoreAnim, setScoreAnim] = useState(0);

  const startTimeRef = useRef<number>(0);
  const cancelTicksRef = useRef<(() => void) | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (cancelTicksRef.current) {
      cancelTicksRef.current();
      cancelTicksRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const startGame = useCallback(() => {
    clearTimers();
    const t = generateTarget(mode);
    setTarget(t);
    setRevealCountdown(3);
    setPhase("reveal");

    let count = 3;
    countdownRef.current = setInterval(() => {
      count -= 1;
      setRevealCountdown(count);
      if (count <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
      }
    }, 1000);

    revealTimerRef.current = setTimeout(() => {
      clearTimers();
      playStartBeep();
      startTimeRef.current = performance.now();
      if (mode === "hard") {
        cancelTicksRef.current = scheduleDeceptiveTicks(t);
      }
      setPhase("timing");
    }, 3000);
  }, [mode, clearTimers]);

  const stopTimer = useCallback(() => {
    if (phase !== "timing") return;
    clearTimers();
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const r = calcScore(target, elapsed);
    setResult(r);
    setScoreAnim(0);
    setPhase("result");
    setTimeout(() => setScoreAnim(r.score), 50);
  }, [phase, target, clearTimers]);

  const reset = useCallback(() => {
    setPhase("home");
    setResult(null);
  }, []);

  useEffect(() => {
    if (phase !== "timing") return;
    const handler = () => stopTimer();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, stopTimer]);

  return (
    <div className={`app phase-${phase}`}>
      {phase === "home" && (
        <div className="screen home" data-glow={hoverMode ?? "default"}>
          <h1 className="title">timefli.gg</h1>
          <p className="subtitle">count</p>

          <div className="mode-tabs">
            {(["easy", "medium", "hard"] as Mode[]).map((m) => (
              <button
                key={m}
                className={`mode-tab ${mode === m ? "active" : ""}`}
                onClick={() => setMode(m)}
                onMouseEnter={() => setHoverMode(m)}
                onMouseLeave={() => setHoverMode(null)}
              >
                <span className="mode-name">{MODE_LABELS[m]}</span>
                <span className="mode-desc">{MODE_DESCS[m]}</span>
              </button>
            ))}
          </div>

          <button className="btn-start" onClick={startGame}>
            START
          </button>
        </div>
      )}

      {phase === "reveal" && (
        <div className="screen reveal">
          <p className="reveal-label">memorize this</p>
          <div className="target-display">{formatTime(target, mode)}</div>
          <div className="reveal-countdown">
            {revealCountdown > 0 ? revealCountdown : "GO"}
          </div>
        </div>
      )}

      {phase === "timing" && (
        <button className="screen timing tap-zone" onClick={stopTimer}>
          <div className="pulse-ring" />
          <div className="tap-hint">PRESS ANYTHING TO STOP</div>
        </button>
      )}

      {phase === "result" && result && (
        <div className="screen result">
          <div className="score-label">{SCORE_LABEL(result.score)}</div>
          <div className="score-display">
            <span className="score-num">{scoreAnim.toFixed(1)}</span>
            <span className="score-denom">/10</span>
          </div>

          <div className="score-bar-track">
            <div
              className="score-bar-fill"
              style={{ width: `${scoreAnim * 10}%` }}
            />
          </div>

          <div className="result-stats">
            <div className="stat">
              <span className="stat-label">target</span>
              <span className="stat-val">{formatTime(result.target, mode)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">yours</span>
              <span className="stat-val">{result.elapsed.toFixed(2)}s</span>
            </div>
            <div className="stat">
              <span className="stat-label">off by</span>
              <span className="stat-val diff">{result.diff.toFixed(2)}s</span>
            </div>
          </div>

          <div className="result-actions">
            <button className="btn-start" onClick={startGame}>
              AGAIN
            </button>
            <button className="btn-ghost" onClick={reset}>
              MENU
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
