let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function tick(ctx: AudioContext, time: number, freq = 900, duration = 0.04) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(0.07, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.start(time);
  osc.stop(time + duration);
}

export function playStartBeep() {
  const ctx = getAudioCtx();
  tick(ctx, ctx.currentTime, 660, 0.06);
}

export function scheduleDeceptiveTicks(durationSeconds: number): () => void {
  const ctx = getAudioCtx();
  const startTime = ctx.currentTime;
  const timeouts: ReturnType<typeof setTimeout>[] = [];

  // Clusters of fake ticks at wrong rhythms to confuse the user
  const fakePaces = [0.7, 0.85, 1.15, 1.3]; // off from 1.0s
  const clusters = Math.floor(durationSeconds / 2);

  for (let i = 0; i < clusters; i++) {
    const pace = fakePaces[Math.floor(Math.random() * fakePaces.length)];
    const clusterStart = 0.5 + Math.random() * (durationSeconds - 1.5);
    const tickCount = 2 + Math.floor(Math.random() * 3);

    for (let j = 0; j < tickCount; j++) {
      const when = startTime + clusterStart + j * pace;
      if (when - startTime < durationSeconds) {
        const delay = (when - ctx.currentTime) * 1000;
        if (delay > 0) {
          const t = setTimeout(() => {
            const now = ctx.currentTime;
            tick(ctx, now, 500 + Math.random() * 300, 0.03);
          }, delay);
          timeouts.push(t);
        }
      }
    }
  }

  return () => timeouts.forEach(clearTimeout);
}
