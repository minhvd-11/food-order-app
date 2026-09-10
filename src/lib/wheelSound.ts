"use client";

/**
 * Sound effects for the food wheel.
 *
 * Everything is synthesised with the Web Audio API on the fly, so the feature
 * ships without any audio asset. Browsers only allow audio after a user
 * gesture, hence `unlockAudio()` which must run inside the click handler.
 */

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const Ctor =
    window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!Ctor) return null;

  try {
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === "suspended") void audioCtx.resume();
  } catch {
    // Audio is a nice-to-have: never let it break the spin.
    return null;
  }

  return audioCtx;
}

/** Call from inside a user gesture to unlock playback. */
export function unlockAudio() {
  getCtx();
}

/**
 * One notch of the reel clicking past the window.
 * `intensity` (0 → 1) makes the early, fast ticks brighter than the late ones.
 */
export function playTick(intensity = 1) {
  const ctx = getCtx();
  if (!ctx) return;

  const level = Math.min(1, Math.max(0, intensity));
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(760 + 420 * level, now);
  osc.frequency.exponentialRampToValueAtTime(280, now + 0.05);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.03 + 0.035 * level, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.09);
}

/**
 * The bed that plays underneath the whole spin: a filtered saw with a slow
 * wobble that opens up as the reel flies and closes as it settles.
 * Returns a stopper that fades it out.
 */
export function startSpinBed(durationMs = 5000): () => void {
  const ctx = getCtx();
  if (!ctx) return () => {};

  const now = ctx.currentTime;
  const seconds = durationMs / 1000;

  const osc = ctx.createOscillator();
  const wobble = ctx.createOscillator();
  const wobbleDepth = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(110, now);

  wobble.type = "sine";
  wobble.frequency.setValueAtTime(7, now);
  wobbleDepth.gain.setValueAtTime(5, now);
  wobble.connect(wobbleDepth);
  wobbleDepth.connect(osc.frequency);

  filter.type = "lowpass";
  filter.Q.setValueAtTime(6, now);
  filter.frequency.setValueAtTime(260, now);
  filter.frequency.linearRampToValueAtTime(1400, now + seconds * 0.25);
  filter.frequency.linearRampToValueAtTime(220, now + seconds);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.25);
  gain.gain.setValueAtTime(0.045, now + seconds * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.012, now + seconds);

  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(now);
  wobble.start(now);

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;

    const at = ctx.currentTime;
    gain.gain.cancelScheduledValues(at);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
    osc.stop(at + 0.25);
    wobble.stop(at + 0.25);
  };
}

/** Little arpeggio when the reel lands on a dish. */
export function playWin() {
  const ctx = getCtx();
  if (!ctx) return;

  const start = ctx.currentTime + 0.02;
  // C5 – E5 – G5 – C6
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
    const at = start + index * 0.09;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, at);

    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.38);

    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.4);
  });
}
