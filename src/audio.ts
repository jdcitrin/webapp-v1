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

let humNodes: { osc: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;

export function startHardHum() {
  const ctx = getAudioCtx();
  if (humNodes) return;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 1.2);
  gain.connect(ctx.destination);

  // Deep sine drone at 40Hz with a very slow pitch wobble
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(40, ctx.currentTime);

  // Subtle second sine one octave up for a bit of body
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(80, ctx.currentTime);
  const osc2gain = ctx.createGain();
  osc2gain.gain.setValueAtTime(0.4, ctx.currentTime);
  osc2.connect(osc2gain);
  osc2gain.connect(gain);

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(0.25, ctx.currentTime);
  lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  osc.connect(gain);
  osc.start();
  osc2.start();
  lfo.start();

  humNodes = { osc, osc2, gain };
}

export function stopHardHum() {
  if (!humNodes) return;
  const ctx = getAudioCtx();
  humNodes.gain.gain.setValueAtTime(humNodes.gain.gain.value, ctx.currentTime);
  humNodes.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
  const { osc, osc2 } = humNodes;
  humNodes = null;
  setTimeout(() => { osc.stop(); osc2.stop(); }, 900);
}
