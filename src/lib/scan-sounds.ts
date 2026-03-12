// ─── Shared scan sound effects (Web Audio API) ──────────────────────────────
// Reusable across QrScannerModal, RecebirModal, and [id] detail page.
// Uses Web Audio API — no audio files needed. Silent fallback if unavailable.

function getAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

/** Rising two-tone arpeggio (B5 → E6) — success / coin-collect feel */
export function playScanSuccessSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const playTone = (freq: number, start: number, dur: number, vol: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    gain.gain.setValueAtTime(vol, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur);
  };
  playTone(988, 0, 0.12, 0.3);     // B5
  playTone(1319, 0.08, 0.2, 0.25); // E6
}

/** Descending three-tone buzz (A4 → E4 → A3) — unmistakable error */
export function playScanErrorSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const playTone = (freq: number, start: number, dur: number, vol: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    gain.gain.setValueAtTime(vol, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur);
  };
  playTone(440, 0, 0.12, 0.2);     // A4
  playTone(330, 0.1, 0.18, 0.2);   // E4
  playTone(220, 0.22, 0.25, 0.15); // A3
}
