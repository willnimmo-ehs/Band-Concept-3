/* audio.js — Web Audio API engine for score interactivity */
const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;

  function ensureCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.55;
    masterGain.connect(ctx.destination);
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Core tone — clarinet-ish (triangle wave through a warm filter)
  function playTone(freq, duration, velocity = 0.65) {
    ensureCtx(); resume();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    // Second harmonic for richness
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;

    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    g2.gain.value = 0.18;

    const masterEnv = ctx.createGain();
    masterEnv.gain.setValueAtTime(0, now);
    masterEnv.gain.linearRampToValueAtTime(velocity, now + 0.025);
    masterEnv.gain.setValueAtTime(velocity * 0.75, now + 0.12);
    masterEnv.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2400;
    filter.Q.value = 0.8;

    osc.connect(g1); osc2.connect(g2);
    g1.connect(filter); g2.connect(filter);
    filter.connect(masterEnv);
    masterEnv.connect(masterGain);

    osc.start(now); osc2.start(now);
    osc.stop(now + duration + 0.05); osc2.stop(now + duration + 0.05);
  }

  function playNote(midi, duration = 1.0, velocity = 0.65) {
    playTone(midiToFreq(midi), duration, velocity);
  }

  function playChord(midis, duration = 2.0, velocity = 0.4) {
    ensureCtx();
    const perVol = Math.max(0.15, velocity / Math.sqrt(midis.length));
    midis.forEach(m => playNote(m, duration, perVol));
  }

  // Bb-major concert band fanfare
  function playFanfare(onBeat) {
    ensureCtx(); resume();
    const seq = [
      { midi: 58, t: 0,    d: 0.28 },  // Bb3
      { midi: 65, t: 0.30, d: 0.28 },  // F4
      { midi: 70, t: 0.60, d: 0.28 },  // Bb4
      { midi: 65, t: 0.90, d: 0.18 },  // F4
      { midi: 70, t: 1.10, d: 0.18 },  // Bb4
      { midi: 72, t: 1.30, d: 0.18 },  // C5
      { midi: 74, t: 1.50, d: 0.38 },  // D5
      { midi: 70, t: 1.90, d: 1.20 },  // Bb4 (held)
      // Accompanying chords
      { midi: 46, t: 0,    d: 1.95, v: 0.3 }, // Bb2
      { midi: 53, t: 0,    d: 1.95, v: 0.3 }, // F3
    ];
    seq.forEach((n, i) => {
      setTimeout(() => {
        playNote(n.midi, n.d, n.v || 0.7);
        if (onBeat) onBeat(i, n);
      }, n.t * 1000);
    });
    return seq[seq.length - 1].t * 1000 + 1200; // total duration ms
  }

  // March-style dotted rhythm for marches genre
  function playMarch() {
    ensureCtx(); resume();
    const pattern = [
      { midi: 65, t: 0,    d: 0.22, v: 0.7 }, // F4 dotted
      { midi: 65, t: 0.33, d: 0.10, v: 0.5 }, // F4 short
      { midi: 67, t: 0.45, d: 0.22, v: 0.7 }, // G4
      { midi: 65, t: 0.68, d: 0.22, v: 0.6 }, // F4
      { midi: 62, t: 0.90, d: 0.22, v: 0.65},  // D4
      { midi: 65, t: 1.13, d: 0.45, v: 0.7 }, // F4 half
    ];
    pattern.forEach(n => setTimeout(() => playNote(n.midi, n.d, n.v), n.t * 1000));
  }

  // Lyrical Broadway phrase for show tunes
  function playLyrical() {
    ensureCtx(); resume();
    const phrase = [
      { midi: 72, t: 0,    d: 0.45, v: 0.55 }, // C5
      { midi: 74, t: 0.50, d: 0.45, v: 0.55 }, // D5
      { midi: 76, t: 1.00, d: 0.45, v: 0.60 }, // E5
      { midi: 77, t: 1.50, d: 1.00, v: 0.65 }, // F5 (sustained)
    ];
    phrase.forEach(n => setTimeout(() => playNote(n.midi, n.d, n.v), n.t * 1000));
  }

  // Grand chord for symphonic band
  function playSymphonic() {
    ensureCtx(); resume();
    // Bb major voicing: Bb2, F3, Bb3, D4, F4, Bb4
    setTimeout(() => playChord([46, 53, 58, 62, 65, 70], 2.2, 0.38), 0);
  }

  return { playNote, playChord, playFanfare, playMarch, playLyrical, playSymphonic, ensureCtx, resume };
})();
