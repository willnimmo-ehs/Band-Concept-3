/* ============================================================
   orchestra.js — Orchestral Instruments Scroll Experience
   Real transcribed melodies · Synchronized score animation
   Web Audio API synthesis · AnalyserNode visualization

   THE UNION: a purpose-composed convergence in Bb minor, ♩=60.
   All four families share one key and one tempo so they sound
   genuinely beautiful together.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     PART 1 — PITCH UTILITIES
     Treble clef staff in SVG coordinate space.
     Reference: C4 (middle C) = y:95  Each diatonic step = 7px.
     Staff lines at y = 25,39,53,67,81 (F5,D5,B4,G4,E4 top→bottom).
     ============================================================ */

  const DIATONIC_STEP = { C:0, D:1, E:2, F:3, G:4, A:5, B:6 };

  function pitchToY(name) {
    const m = name.match(/^([A-G])(b|#)?(\d)$/);
    if (!m) return 70;
    const stepsFromC4 = (parseInt(m[3]) - 4) * 7 + DIATONIC_STEP[m[1]];
    return 95 - stepsFromC4 * 7;
  }

  function getAccidental(name) {
    const m = name.match(/^[A-G](b|#)/);
    return m ? m[1] : null;
  }

  function ledgerLinesFor(staffY) {
    const out = [];
    if (staffY >= 95) { for (let y = 95; y <= staffY; y += 14) out.push(y); }
    else if (staffY <= 11) { for (let y = 11; y >= staffY; y -= 14) out.push(y); }
    return out;
  }

  /* ============================================================
     PART 2 — NOTE SEQUENCES  (individual sections)
     ============================================================ */

  const PHRASES = {

    /* Barber — Adagio for Strings, Op.11 · Bb minor · ♩=60 */
    strings: {
      bpm: 60, loopBeats: 28, color: '#c9a84c',
      notes: [
        { displayPitch:'Bb3', freq:233.08, beat: 0,  dur:3   },
        { displayPitch:'C4',  freq:261.63, beat: 3,  dur:1   },
        { displayPitch:'Db4', freq:277.18, beat: 4,  dur:2   },
        { displayPitch:'C4',  freq:261.63, beat: 6,  dur:1   },
        { displayPitch:'Bb3', freq:233.08, beat: 7,  dur:2   },
        { displayPitch:'Bb3', freq:233.08, beat: 9,  dur:2   },
        { displayPitch:'C4',  freq:261.63, beat:11,  dur:1   },
        { displayPitch:'Db4', freq:277.18, beat:12,  dur:1   },
        { displayPitch:'Eb4', freq:311.13, beat:13,  dur:1   },
        { displayPitch:'F4',  freq:349.23, beat:14,  dur:2   },
        { displayPitch:'Gb4', freq:369.99, beat:16,  dur:2   },
        { displayPitch:'F4',  freq:349.23, beat:18,  dur:2   },
        { displayPitch:'Eb4', freq:311.13, beat:20,  dur:1   },
        { displayPitch:'Db4', freq:277.18, beat:21,  dur:1   },
        { displayPitch:'C4',  freq:261.63, beat:22,  dur:2   },
        { displayPitch:'Bb3', freq:233.08, beat:24,  dur:4   },
      ]
    },

    /* Debussy — Prélude à l'après-midi d'un faune · rubato ♩≈44 */
    woodwinds: {
      bpm: 44, loopBeats: 22, color: '#8fc4b0',
      notes: [
        { displayPitch:'C#5', freq:554.37, beat: 0,   dur:2.5 },
        { displayPitch:'C5',  freq:523.25, beat: 2.5, dur:2   },
        { displayPitch:'B4',  freq:493.88, beat: 4.5, dur:1.5 },
        { displayPitch:'Bb4', freq:466.16, beat: 6,   dur:1.5 },
        { displayPitch:'A4',  freq:440.00, beat: 7.5, dur:1.5 },
        { displayPitch:'Ab4', freq:415.30, beat: 9,   dur:1   },
        { displayPitch:'G4',  freq:392.00, beat:10,   dur:1.5 },
        { displayPitch:'F#4', freq:369.99, beat:11.5, dur:1.5 },
        { displayPitch:'G4',  freq:392.00, beat:13,   dur:2   },
        { displayPitch:'A4',  freq:440.00, beat:15,   dur:1.5 },
        { displayPitch:'Bb4', freq:466.16, beat:16.5, dur:2   },
        { displayPitch:'C5',  freq:523.25, beat:18.5, dur:3   },
      ]
    },

    /* Copland — Fanfare for the Common Man · ♩=69
       Audio at concert pitch; displayed one octave up for readability. */
    brass: {
      bpm: 69, loopBeats: 12, color: '#d4956a',
      notes: [
        { displayPitch:'G4', freq: 98.00, beat:0, dur:1 },
        { displayPitch:'G4', freq: 98.00, beat:1, dur:1 },
        { displayPitch:'C5', freq:130.81, beat:2, dur:3 },
        { displayPitch:'G5', freq:196.00, beat:5, dur:2 },
        { displayPitch:'E5', freq:164.81, beat:7, dur:1 },
        { displayPitch:'C5', freq:130.81, beat:8, dur:1 },
        { displayPitch:'G4', freq: 98.00, beat:9, dur:3 },
      ]
    },

    /* Ravel — Bolero · 2-bar snare+timpani pattern · ♩=76 */
    percussion: {
      bpm: 76, loopBeats: 6, color: '#b0b0b8',
      notes: [
        { displayPitch:'S', freq:0,      beat:0,    dur:0.5,  voice:'snare' },
        { displayPitch:'S', freq:0,      beat:0.5,  dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:0.75, dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:1,    dur:0.5,  voice:'snare' },
        { displayPitch:'S', freq:0,      beat:1.5,  dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:2,    dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:2.25, dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:2.5,  dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:2.75, dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:3,    dur:0.5,  voice:'snare' },
        { displayPitch:'S', freq:0,      beat:3.5,  dur:0.5,  voice:'snare' },
        { displayPitch:'S', freq:0,      beat:4,    dur:0.5,  voice:'snare' },
        { displayPitch:'S', freq:0,      beat:4.5,  dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:4.75, dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:5,    dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:5.25, dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:5.5,  dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:5.75, dur:0.25, voice:'snare' },
        { displayPitch:'T', freq: 65.41, beat:0,    dur:2,    voice:'timp'  },
        { displayPitch:'T', freq: 98.00, beat:3,    dur:2,    voice:'timp'  },
      ]
    }
  };

  /* ============================================================
     PART 3 — UNION PHRASES
     A purpose-composed convergence in Bb minor, ♩=60.
     All four families share tempo and tonality.

     CHORD PROGRESSION (i – V – i – bVI – V – i, very Barber):
       Beats  0–7  : Bb minor  (Bb – Db – F)
       Beats  8–11 : F major   (F  – A  – C)  — harmonic minor dominant
       Beats 12–15 : Bb minor  (Bb – Db – F)
       Beats 16–19 : Gb major  (Gb – Bb – Db) — the flat-VI, signature Barber
       Beats 20–23 : F major   (F  – A  – C)  — dominant return
       Beats 24–27 : Bb minor  (Bb – F  – Bb) — final resolution

     STRINGS  — Barber melody unchanged (already Bb minor at ♩=60)
     BRASS    — Sustained chord pads (French horn pad synthesis)
     WOODWINDS— Countermelody a sixth above the Barber melody
     PERCUSSION— Bolero snare pattern adapted to ♩=60 + Bb/F timpani
     ============================================================ */

  const UNION_PHRASES = {

    /* Strings: identical to PHRASES.strings — no change needed */
    strings: PHRASES.strings,

    /* Brass: long sustained chords voiced in Bb minor
       Three chord tones per harmony = 3 simultaneous note entries.
       noTimp:true prevents the solo-section's auto-timpani firing. */
    brass: {
      bpm: 60, loopBeats: 28, color: '#d4956a',
      notes: [
        // ── Bb minor (i), beats 0-7 ──────────────────────────
        { displayPitch:'Bb2', freq:116.54, beat: 0, dur:8, noTimp:true },
        { displayPitch:'F3',  freq:174.61, beat: 0, dur:8, noTimp:true },
        { displayPitch:'Bb3', freq:233.08, beat: 0, dur:8, noTimp:true },
        // ── F major (V), beats 8-11 ──────────────────────────
        { displayPitch:'F2',  freq: 87.31, beat: 8, dur:4, noTimp:true },
        { displayPitch:'A2',  freq:110.00, beat: 8, dur:4, noTimp:true },
        { displayPitch:'C3',  freq:130.81, beat: 8, dur:4, noTimp:true },
        // ── Bb minor (i), beats 12-15 ───────────────────────
        { displayPitch:'Bb2', freq:116.54, beat:12, dur:4, noTimp:true },
        { displayPitch:'Db3', freq:138.59, beat:12, dur:4, noTimp:true },
        { displayPitch:'F3',  freq:174.61, beat:12, dur:4, noTimp:true },
        // ── Gb major (bVI), beats 16-19 — the Barber bVI ────
        { displayPitch:'Gb2', freq: 92.50, beat:16, dur:4, noTimp:true },
        { displayPitch:'Bb2', freq:116.54, beat:16, dur:4, noTimp:true },
        { displayPitch:'Db3', freq:138.59, beat:16, dur:4, noTimp:true },
        // ── F major (V), beats 20-23 ────────────────────────
        { displayPitch:'F2',  freq: 87.31, beat:20, dur:4, noTimp:true },
        { displayPitch:'C3',  freq:130.81, beat:20, dur:4, noTimp:true },
        { displayPitch:'F3',  freq:174.61, beat:20, dur:4, noTimp:true },
        // ── Bb minor (i), beats 24-27 — final resolution ────
        { displayPitch:'Bb2', freq:116.54, beat:24, dur:4, noTimp:true },
        { displayPitch:'F3',  freq:174.61, beat:24, dur:4, noTimp:true },
        { displayPitch:'Bb3', freq:233.08, beat:24, dur:4, noTimp:true },
      ]
    },

    /* Woodwinds: countermelody a minor/major sixth above the Barber line.
       Contrary motion — strings ascend while woodwinds mirror the shape.
       Enters at beat 9 (matching the UNION_DELAYS.woodwinds = 9s / 9 beats). */
    woodwinds: {
      bpm: 60, loopBeats: 28, color: '#8fc4b0',
      notes: [
        // Harmonizing the second phrase of the Barber melody (beat 9 onward)
        // Strings:  Bb3  C4   Db4  Eb4  F4   Gb4  F4   Eb4  Db4  C4   Bb3(long)
        // WW 6th↑:  Gb4  Ab4  Bb4  C5   Db5  Eb5  Db5  C5   Bb4  Ab4  Gb4
        { displayPitch:'Gb4', freq:369.99, beat: 9,  dur:2   },  // over Bb3
        { displayPitch:'Ab4', freq:415.30, beat:11,  dur:1   },  // over C4
        { displayPitch:'Bb4', freq:466.16, beat:12,  dur:1   },  // over Db4
        { displayPitch:'C5',  freq:523.25, beat:13,  dur:1   },  // over Eb4
        { displayPitch:'Db5', freq:554.37, beat:14,  dur:2   },  // over F4
        { displayPitch:'Eb5', freq:622.25, beat:16,  dur:2   },  // over Gb4 (peak)
        { displayPitch:'Db5', freq:554.37, beat:18,  dur:2   },  // over F4 descent
        { displayPitch:'C5',  freq:523.25, beat:20,  dur:1   },  // over Eb4
        { displayPitch:'Bb4', freq:466.16, beat:21,  dur:1   },  // over Db4
        { displayPitch:'Ab4', freq:415.30, beat:22,  dur:2   },  // over C4
        { displayPitch:'Gb4', freq:369.99, beat:24,  dur:4   },  // over Bb3 (long close)
      ]
    },

    /* Percussion: Bolero snare at ♩=60 + Bb/F2 timpani (home key). */
    percussion: {
      bpm: 60, loopBeats: 6, color: '#b0b0b8',
      notes: [
        { displayPitch:'S', freq:0,      beat:0,    dur:0.5,  voice:'snare' },
        { displayPitch:'S', freq:0,      beat:0.5,  dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:0.75, dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:1,    dur:0.5,  voice:'snare' },
        { displayPitch:'S', freq:0,      beat:1.5,  dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:2,    dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:2.25, dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:2.5,  dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:2.75, dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:3,    dur:0.5,  voice:'snare' },
        { displayPitch:'S', freq:0,      beat:3.5,  dur:0.5,  voice:'snare' },
        { displayPitch:'S', freq:0,      beat:4,    dur:0.5,  voice:'snare' },
        { displayPitch:'S', freq:0,      beat:4.5,  dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:4.75, dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:5,    dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:5.25, dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:5.5,  dur:0.25, voice:'snare' },
        { displayPitch:'S', freq:0,      beat:5.75, dur:0.25, voice:'snare' },
        // Timpani: Bb2 on bar 1, F2 on bar 2 (Bb minor i–V pulse)
        { displayPitch:'T', freq:116.54, beat:0, dur:2, voice:'timp' },
        { displayPitch:'T', freq: 87.31, beat:3, dur:2, voice:'timp' },
      ]
    }
  };

  /* ============================================================
     PART 4 — AUDIO ENGINE
     ============================================================ */

  let audioCtx       = null;
  let masterGain     = null;
  let masterAnalyser = null;

  function initAudio() {
    if (audioCtx) return;
    audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.80, audioCtx.currentTime);

    // Dynamics compressor prevents clipping when all Union layers combine
    const comp = audioCtx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-14, audioCtx.currentTime);
    comp.knee.setValueAtTime(8,  audioCtx.currentTime);
    comp.ratio.setValueAtTime(4,  audioCtx.currentTime);
    comp.attack.setValueAtTime(0.04, audioCtx.currentTime);
    comp.release.setValueAtTime(0.22, audioCtx.currentTime);

    masterAnalyser = audioCtx.createAnalyser();
    masterAnalyser.fftSize = 2048;
    masterAnalyser.smoothingTimeConstant = 0.88;

    masterGain.connect(comp);
    comp.connect(masterAnalyser);
    masterAnalyser.connect(audioCtx.destination);

    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function makeWarmCurve(amount) {
    const N = 512, c = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const x = (i * 2) / N - 1;
      c[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return c;
  }

  /* ── STRINGS: Barber Adagio — sine + vibrato, 3-voice thirds ── */
  function scheduleStringNote(note, t0, dest) {
    const ctx = audioCtx;
    const ATTACK = 0.8, RELEASE = 2.0;
    const durSec = note.dur * (60 / PHRASES.strings.bpm);
    const tEnd   = t0 + durSec;

    [
      { freq: note.freq,                      gain: 0.52 },
      { freq: note.freq * Math.pow(2,-3/12), gain: 0.24 },
      { freq: note.freq * Math.pow(2,-7/12), gain: 0.14 },
    ].forEach(({ freq, gain: vGain }, vi) => {
      const osc    = ctx.createOscillator(); osc.type = 'sine';
      const lfo    = ctx.createOscillator(); lfo.type = 'sine';
      const lfoG   = ctx.createGain();
      const env    = ctx.createGain();

      osc.frequency.setValueAtTime(freq, t0);
      lfo.frequency.setValueAtTime(5.2 + vi * 0.12, t0);
      lfoG.gain.setValueAtTime(0, t0);
      lfoG.gain.linearRampToValueAtTime(3.0, t0 + ATTACK + 0.4);

      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(vGain, t0 + ATTACK);
      env.gain.setValueAtTime(vGain * 0.92, tEnd - RELEASE * 0.35);
      env.gain.exponentialRampToValueAtTime(0.001, tEnd + RELEASE * 0.4);

      lfo.connect(lfoG); lfoG.connect(osc.frequency);
      osc.connect(env);  env.connect(dest);

      osc.start(t0); lfo.start(t0);
      const stopT = tEnd + RELEASE + 0.1;
      osc.stop(stopT); lfo.stop(stopT);
    });
  }

  /* ── WOODWINDS: Debussy Faun — sine + breath noise + flutter ── */
  function scheduleWoodwindNote(note, t0, dest, bpmOverride) {
    const ctx    = audioCtx;
    const bpm    = bpmOverride || PHRASES.woodwinds.bpm;
    const ATTACK = 0.4, RELEASE = 0.9;
    const durSec = note.dur * (60 / bpm);
    const tEnd   = t0 + durSec;

    const osc  = ctx.createOscillator(); osc.type = 'sine';
    const lfo  = ctx.createOscillator(); lfo.type = 'sine';
    const lfoG = ctx.createGain();
    const env  = ctx.createGain();

    osc.frequency.setValueAtTime(note.freq, t0);
    lfo.frequency.setValueAtTime(3.2, t0);
    lfoG.gain.setValueAtTime(1.5, t0);

    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(0.44, t0 + ATTACK);
    env.gain.setValueAtTime(0.40, tEnd - 0.15);
    env.gain.linearRampToValueAtTime(0, tEnd + RELEASE * 0.45);

    lfo.connect(lfoG); lfoG.connect(osc.frequency);
    osc.connect(env);  env.connect(dest);

    // Breathy noise — bandpass at harmonic partial
    const noiseLen = Math.ceil(ctx.sampleRate * (durSec + RELEASE + 0.1));
    const buf      = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const nd       = buf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    const nSrc = ctx.createBufferSource(); nSrc.buffer = buf;
    const bpf  = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(note.freq * 1.6, t0);
    bpf.Q.setValueAtTime(14, t0);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0, t0);
    nGain.gain.linearRampToValueAtTime(0.055, t0 + ATTACK * 0.6);
    nGain.gain.setValueAtTime(0.04, tEnd - 0.1);
    nGain.gain.linearRampToValueAtTime(0, tEnd + RELEASE * 0.4);

    nSrc.connect(bpf); bpf.connect(nGain); nGain.connect(dest);

    osc.start(t0); lfo.start(t0); nSrc.start(t0);
    const stopT = tEnd + RELEASE + 0.15;
    osc.stop(stopT); lfo.stop(stopT); nSrc.stop(stopT);
  }

  /* ── BRASS (solo): Copland — sawtooth+square through WaveShaper ── */
  function scheduleBrassNote(note, t0, dest) {
    const ctx    = audioCtx;
    const ATTACK = 0.055, RELEASE = 0.65;
    const durSec = note.dur * (60 / PHRASES.brass.bpm);
    const tEnd   = t0 + durSec;

    const saw = ctx.createOscillator(); saw.type = 'sawtooth';
    const sq  = ctx.createOscillator(); sq.type  = 'square';
    saw.frequency.setValueAtTime(note.freq, t0);
    sq.frequency.setValueAtTime(note.freq, t0);

    const sawG = ctx.createGain(); sawG.gain.setValueAtTime(0.68, t0);
    const sqG  = ctx.createGain(); sqG.gain.setValueAtTime(0.32, t0);

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeWarmCurve(85); shaper.oversample = '4x';

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(2400, t0);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(0.80, t0 + ATTACK);
    env.gain.setValueAtTime(0.74, tEnd - RELEASE * 0.5);
    env.gain.exponentialRampToValueAtTime(0.001, tEnd + RELEASE * 0.4);

    saw.connect(sawG); sawG.connect(shaper);
    sq.connect(sqG);   sqG.connect(shaper);
    shaper.connect(lpf); lpf.connect(env); env.connect(dest);

    saw.start(t0); sq.start(t0);
    const stopT = tEnd + RELEASE + 0.1;
    saw.stop(stopT); sq.stop(stopT);

    // Timpani hit on first beat of each phrase (only solo section)
    if (note.beat === 0 && !note.noTimp) scheduleTimp(t0, 65.41, dest);
  }

  /* ── UNION BRASS: French horn pad — sine, soft attack, warm ── */
  function scheduleUnionBrassNote(note, t0, dest) {
    const ctx    = audioCtx;
    /* Long, slow attack like a held horn chord */
    const ATTACK = 1.1, RELEASE = 1.8;
    const durSec = note.dur * (60 / UNION_PHRASES.brass.bpm);
    const tEnd   = t0 + durSec;

    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, t0);

    // Gentle second harmonic for horn warmth
    const osc2 = ctx.createOscillator(); osc2.type = 'sine';
    osc2.frequency.setValueAtTime(note.freq * 2, t0);
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.12, t0);

    // Subtle vibrato after the attack settles
    const lfo = ctx.createOscillator(); lfo.type = 'sine';
    const lfoG = ctx.createGain();
    lfo.frequency.setValueAtTime(4.8, t0);
    lfoG.gain.setValueAtTime(0, t0);
    lfoG.gain.linearRampToValueAtTime(1.8, t0 + ATTACK + 0.6);
    lfo.connect(lfoG); lfoG.connect(osc.frequency);

    // Soft low-pass to keep it warm, not bright
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(900, t0);
    lpf.Q.setValueAtTime(0.7, t0);

    // Per-voice gain (one of three chord tones at a time)
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(0.28, t0 + ATTACK);
    env.gain.setValueAtTime(0.25, tEnd - RELEASE * 0.4);
    env.gain.exponentialRampToValueAtTime(0.001, tEnd + RELEASE * 0.5);

    osc.connect(lpf);
    osc2.connect(g2); g2.connect(lpf);
    lpf.connect(env);
    env.connect(dest);

    osc.start(t0); osc2.start(t0); lfo.start(t0);
    const stopT = tEnd + RELEASE + 0.1;
    osc.stop(stopT); osc2.stop(stopT); lfo.stop(stopT);
  }

  /* ── TIMPANI: pitched sine with pitch sag (the "thud" character) ── */
  function scheduleTimp(t0, freq, dest) {
    const ctx = audioCtx;
    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.72, t0 + 1.2);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.62, t0);
    env.gain.exponentialRampToValueAtTime(0.001, t0 + 2.6);

    osc.connect(env); env.connect(dest);
    osc.start(t0); osc.stop(t0 + 2.7);
  }

  /* ── SNARE: white noise burst through bandpass (Bolero) ── */
  function scheduleSnare(t0, dest) {
    const ctx   = audioCtx;
    const DECAY = 0.13;
    const len   = Math.ceil(ctx.sampleRate * (DECAY + 0.05));
    const buf   = ctx.createBuffer(1, len, ctx.sampleRate);
    const data  = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource(); src.buffer = buf;
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(1200, t0);
    bpf.Q.setValueAtTime(1.6, t0);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.52, t0);
    env.gain.exponentialRampToValueAtTime(0.001, t0 + DECAY);

    src.connect(bpf); bpf.connect(env); env.connect(dest);
    src.start(t0); src.stop(t0 + DECAY + 0.06);
  }

  /* ── PERCUSSION: route to snare or timpani ── */
  function schedulePercussionNote(note, t0, dest) {
    if      (note.voice === 'snare') scheduleSnare(t0, dest);
    else if (note.voice === 'timp')  scheduleTimp(t0, note.freq, dest);
  }

  // Scheduler lookup by section key
  const SCHEDULERS = {
    strings:    scheduleStringNote,
    woodwinds:  (n,t,d) => scheduleWoodwindNote(n, t, d, PHRASES.woodwinds.bpm),
    brass:      scheduleBrassNote,
    percussion: schedulePercussionNote,
  };

  // Union-specific schedulers (union uses its own phrases + synth)
  const UNION_SCHEDULERS = {
    strings:    scheduleStringNote,
    woodwinds:  (n,t,d) => scheduleWoodwindNote(n, t, d, 60), // ♩=60 always
    brass:      scheduleUnionBrassNote,
    percussion: schedulePercussionNote,
  };

  /* ============================================================
     PART 5 — PHRASE SEQUENCER
     Accepts a phrase object directly so both PHRASES and
     UNION_PHRASES can be used interchangeably.
     ============================================================ */

  const LOOK_AHEAD = 0.35;

  class PhraseSequencer {
    constructor(key, phrase, dest, schedulerFn) {
      this.key    = key;
      this.phrase = phrase;
      this.dest   = dest;
      this.fn     = schedulerFn;
      this.bps    = phrase.bpm / 60;
      this.loopSec= phrase.loopBeats / this.bps;
      this.startT = null;
      this.running= false;
      this._rafId = null;
      this._buildSchedule();
    }

    _buildSchedule() {
      this._sched= [];
      this._sIdx = 0;
      const notes = this.phrase.notes;
      const lSec  = this.loopSec;
      for (let loop = 0; loop < 200; loop++) {
        notes.forEach(n => {
          this._sched.push({ offsetSec: loop * lSec + n.beat / this.bps, note: n });
        });
      }
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.startT  = audioCtx.currentTime + 0.08;
      this._sIdx   = 0;
      this._tick();
    }

    stop() {
      this.running = false;
      if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    }

    _tick() {
      if (!this.running) return;
      const horizon = audioCtx.currentTime + LOOK_AHEAD;
      while (
        this._sIdx < this._sched.length &&
        this.startT + this._sched[this._sIdx].offsetSec <= horizon
      ) {
        const item = this._sched[this._sIdx];
        const t0   = this.startT + item.offsetSec;
        if (t0 >= audioCtx.currentTime - 0.04) {
          this.fn(item.note, t0, this.dest);
        }
        this._sIdx++;
      }
      this._rafId = requestAnimationFrame(() => this._tick());
    }

    getCurrentBeat() {
      if (!this.running || this.startT === null) return 0;
      const elapsed = Math.max(0, audioCtx.currentTime - this.startT);
      return (elapsed * this.bps) % this.phrase.loopBeats;
    }
  }

  /* Wall clock for score-only mode (no audio permission) */
  class WallClock {
    constructor(phrase) {
      this.phrase  = phrase;
      this.bps     = phrase.bpm / 60;
      this._start  = null;
      this.running = false;
    }
    start()  { this.running = true;  this._start = performance.now() / 1000; }
    stop()   { this.running = false; }
    getCurrentBeat() {
      if (!this.running || !this._start) return 0;
      const elapsed = performance.now() / 1000 - this._start;
      return (elapsed * this.bps) % this.phrase.loopBeats;
    }
  }

  /* ============================================================
     PART 6 — SVG SCORE RENDERER
     ============================================================ */

  const NS      = 'http://www.w3.org/2000/svg';
  const PPB     = 88;    // pixels per beat
  const PH_X    = 105;   // fixed playhead X
  const SVG_W   = 560;
  const SVG_H   = 160;
  const STAFF_YS= [25, 39, 53, 67, 81];

  function buildScore(svgEl, phrase, clock) {
    svgEl.innerHTML = '';
    const color  = phrase.color;
    const isPerc = phrase === PHRASES.percussion || phrase === UNION_PHRASES.percussion;
    const CREAM  = '#f0ece0';

    // Staff lines
    if (isPerc) {
      const l = document.createElementNS(NS,'line');
      l.setAttribute('x1','10'); l.setAttribute('x2', String(SVG_W-10));
      l.setAttribute('y1','80'); l.setAttribute('y2','80');
      l.setAttribute('stroke', color); l.setAttribute('stroke-width','1.2');
      l.setAttribute('opacity','0.4');
      svgEl.appendChild(l);
      // Percussion clef bars
      ['28','34'].forEach(cx => {
        const r = document.createElementNS(NS,'rect');
        r.setAttribute('x',cx); r.setAttribute('y','72');
        r.setAttribute('width','3'); r.setAttribute('height','16');
        r.setAttribute('fill', color); r.setAttribute('opacity','0.5');
        svgEl.appendChild(r);
      });
    } else {
      STAFF_YS.forEach(y => {
        const l = document.createElementNS(NS,'line');
        l.setAttribute('x1','10'); l.setAttribute('x2', String(SVG_W-10));
        l.setAttribute('y1', String(y)); l.setAttribute('y2', String(y));
        l.setAttribute('stroke', color); l.setAttribute('stroke-width','0.8');
        l.setAttribute('opacity','0.3');
        svgEl.appendChild(l);
      });
      const clef = document.createElementNS(NS,'text');
      clef.setAttribute('x','14'); clef.setAttribute('y', String(81+8));
      clef.setAttribute('font-size','60'); clef.setAttribute('font-family','serif');
      clef.setAttribute('fill', color); clef.setAttribute('opacity','0.45');
      clef.textContent = '𝄞';
      svgEl.appendChild(clef);
    }

    // Playhead glow + line
    const phGlow = document.createElementNS(NS,'rect');
    phGlow.setAttribute('x', String(PH_X-4)); phGlow.setAttribute('y','14');
    phGlow.setAttribute('width','8'); phGlow.setAttribute('height', String(SVG_H-18));
    phGlow.setAttribute('fill', color); phGlow.setAttribute('opacity','0.07');
    phGlow.setAttribute('rx','2');
    svgEl.appendChild(phGlow);

    const ph = document.createElementNS(NS,'line');
    ph.setAttribute('x1', String(PH_X)); ph.setAttribute('x2', String(PH_X));
    ph.setAttribute('y1','14'); ph.setAttribute('y2', String(SVG_H-8));
    ph.setAttribute('stroke', color); ph.setAttribute('stroke-width','1.5');
    ph.setAttribute('opacity','0.75');
    svgEl.appendChild(ph);

    // Build note elements
    const noteEls = phrase.notes.map(note => {
      const g = document.createElementNS(NS,'g');
      g.setAttribute('class','snote');

      if (isPerc) {
        const sz = note.voice === 'timp' ? 7 : 4.5;
        [[-1,-1,1,1],[1,-1,-1,1]].forEach(([x1,y1,x2,y2]) => {
          const l = document.createElementNS(NS,'line');
          l.setAttribute('x1', String(x1*sz)); l.setAttribute('x2', String(x2*sz));
          l.setAttribute('y1', String(y1*sz)); l.setAttribute('y2', String(y2*sz));
          l.setAttribute('stroke', CREAM);
          l.setAttribute('stroke-width', note.voice==='timp' ? '2' : '1.5');
          l.setAttribute('stroke-linecap','round');
          g.appendChild(l);
        });
        g.dataset.y = '80';
      } else {
        const staffY = pitchToY(note.displayPitch);
        g.dataset.y  = String(staffY);
        const acc    = getAccidental(note.displayPitch);

        if (acc) {
          const aEl = document.createElementNS(NS,'text');
          aEl.setAttribute('x','-11'); aEl.setAttribute('y','4');
          aEl.setAttribute('font-family','serif'); aEl.setAttribute('font-size','13');
          aEl.setAttribute('fill', CREAM); aEl.setAttribute('opacity','0.9');
          aEl.textContent = acc === 'b' ? '♭' : '♯';
          g.appendChild(aEl);
        }

        ledgerLinesFor(staffY).forEach(ly => {
          const ll = document.createElementNS(NS,'line');
          ll.setAttribute('x1','-10'); ll.setAttribute('x2','10');
          ll.setAttribute('y1', String(ly-staffY)); ll.setAttribute('y2', String(ly-staffY));
          ll.setAttribute('stroke', CREAM); ll.setAttribute('stroke-width','0.9');
          ll.setAttribute('opacity','0.65');
          g.appendChild(ll);
        });

        const head = document.createElementNS(NS,'ellipse');
        head.setAttribute('cx','0'); head.setAttribute('cy','0');
        head.setAttribute('rx','7'); head.setAttribute('ry','5');
        head.setAttribute('transform','rotate(-14)');
        head.setAttribute('fill', CREAM);
        head.setAttribute('class','nhead');
        g.appendChild(head);

        const stemUp = staffY > 53;
        const stem = document.createElementNS(NS,'line');
        if (stemUp) {
          stem.setAttribute('x1','6'); stem.setAttribute('x2','6');
          stem.setAttribute('y1','-4'); stem.setAttribute('y2','-30');
        } else {
          stem.setAttribute('x1','-6'); stem.setAttribute('x2','-6');
          stem.setAttribute('y1','4');  stem.setAttribute('y2','30');
        }
        stem.setAttribute('stroke', CREAM); stem.setAttribute('stroke-width','1.2');
        g.appendChild(stem);
      }

      svgEl.appendChild(g);
      return { el: g, note };
    });

    // Animation loop
    let animId = null, running = false;

    function frame() {
      if (!running) return;
      const currentBeat = clock.getCurrentBeat();
      const loopBeats   = phrase.loopBeats;

      noteEls.forEach(({ el, note }) => {
        let delta = note.beat - currentBeat;
        while (delta < -(loopBeats * 0.2)) delta += loopBeats;
        while (delta >   loopBeats * 0.8)  delta -= loopBeats;

        const x = PH_X + delta * PPB;
        const y = parseFloat(el.dataset.y) || 80;
        el.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);

        const atHead = Math.abs(delta) < (note.dur * 0.55 + 0.06);
        if (atHead !== (el.dataset.active === '1')) {
          el.dataset.active = atHead ? '1' : '0';
          const head = el.querySelector('.nhead');
          if (head) head.setAttribute('fill', atHead ? color : '#f0ece0');
          el.style.filter = atHead
            ? `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 2px ${color})`
            : '';
          phGlow.setAttribute('opacity', atHead ? '0.18' : '0.07');
        }

        el.setAttribute('visibility', (x > -30 && x < SVG_W + 30) ? 'visible' : 'hidden');
      });

      animId = requestAnimationFrame(frame);
    }

    return {
      start() { running = true;  frame(); },
      stop()  { running = false; if (animId) { cancelAnimationFrame(animId); animId = null; } },
    };
  }

  /* ============================================================
     PART 7 — SECTION STATE MANAGEMENT
     ============================================================ */

  let audioEnabled = false;
  let globalMuted  = false;
  let modalShown   = false;

  // key → { gainNode, sequencer, scoreAnim }
  // Union layers use key 'union_strings', 'union_brass', etc.
  const sections = {};

  /* Start a standard (non-union) section */
  function startSection(key) {
    if (sections[key]) return;
    const phrase   = PHRASES[key];
    const schedulerFn = SCHEDULERS[key];

    let clock;
    let gainNode = null;

    if (audioEnabled && !globalMuted && audioCtx) {
      gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.78, audioCtx.currentTime + 1.8);
      gainNode.connect(masterGain);
      clock = new PhraseSequencer(key, phrase, gainNode, schedulerFn);
      clock.start();
    } else {
      clock = new WallClock(phrase);
      clock.start();
    }

    const svgEl = document.querySelector(`#orch-${key} .orch-staff-svg`);
    let scoreAnim = null;
    if (svgEl) {
      scoreAnim = buildScore(svgEl, phrase, clock);
      scoreAnim.start();
    }

    sections[key] = { gainNode, sequencer: clock, scoreAnim };
  }

  /* Start a union layer (uses UNION_PHRASES + union schedulers + own gain) */
  function startUnionLayer(key) {
    const uKey = 'union_' + key;
    if (sections[uKey]) return;

    const phrase      = UNION_PHRASES[key];
    const schedulerFn = UNION_SCHEDULERS[key];
    const targetGain  = { strings:0.55, woodwinds:0.42, brass:0.38, percussion:0.28 }[key];

    let clock, gainNode = null;

    if (audioEnabled && !globalMuted && audioCtx) {
      gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 2.0);
      gainNode.connect(masterGain);
      clock = new PhraseSequencer(key, phrase, gainNode, schedulerFn);
      clock.start();
    } else {
      clock = new WallClock(phrase);
      clock.start();
    }

    sections[uKey] = { gainNode, sequencer: clock, scoreAnim: null };
  }

  function stopSection(key) {
    const s = sections[key];
    if (!s) return;
    s.scoreAnim?.stop();
    s.sequencer?.stop?.();
    if (s.gainNode && audioCtx) {
      const t = audioCtx.currentTime;
      s.gainNode.gain.cancelScheduledValues(t);
      s.gainNode.gain.setValueAtTime(s.gainNode.gain.value, t);
      s.gainNode.gain.linearRampToValueAtTime(0, t + 1.8);
    }
    delete sections[key];
  }

  /* ============================================================
     PART 8 — UNION: THE CONVERGENCE
     ============================================================ */

  const UNION_KEYS   = ['percussion', 'strings', 'brass', 'woodwinds'];
  const UNION_DELAYS = { percussion: 1.5, strings: 0, brass: 4, woodwinds: 9 };
  // strings at 0 = they're the anchor. percussion enters almost immediately.
  // Brass settles in at 4s. Woodwinds float in at 9s = beat 9, exactly when
  // the Barber melody begins its second phrase (the ascending line).

  const SEC_COLORS = {
    strings:    { r:201, g:168, b: 76 },
    woodwinds:  { r:143, g:196, b:176 },
    brass:      { r:212, g:149, b:106 },
    percussion: { r:176, g:176, b:184 },
  };

  let unionRunning   = false;
  let unionStartT    = null;
  let unionParticles = [];
  let unionAnimId    = null;

  function startUnion() {
    if (unionRunning) return;
    unionRunning = true;
    unionStartT  = performance.now() / 1000;
    unionParticles = [];

    if (audioEnabled && !globalMuted) {
      UNION_KEYS.forEach(key => {
        setTimeout(() => {
          if (!unionRunning) return;
          startUnionLayer(key);
          // Gently swell master gain as each layer enters
          if (masterGain && audioCtx) {
            const t = audioCtx.currentTime;
            const v = masterGain.gain.value;
            masterGain.gain.cancelScheduledValues(t);
            masterGain.gain.setValueAtTime(v, t);
            masterGain.gain.linearRampToValueAtTime(Math.min(v + 0.05, 1.0), t + 2.5);
          }
          spawnBurst(key);
        }, UNION_DELAYS[key] * 1000);
      });
    }

    // Typography reveal at 10 s
    setTimeout(() => {
      if (!unionRunning) return;
      const el = document.getElementById('union-text');
      if (el) el.classList.add('union-text-visible');
    }, 10000);

    // Gold flash at 12 s — stage lights hit full intensity
    setTimeout(() => {
      if (!unionRunning) return;
      const fl = document.getElementById('union-flash');
      if (!fl) return;
      fl.style.transition = 'none';
      fl.style.opacity    = '0.18';
      requestAnimationFrame(() => {
        fl.style.transition = 'opacity 0.5s ease-out';
        fl.style.opacity    = '0';
      });
    }, 12000);

    drawUnion();
  }

  function stopUnion() {
    unionRunning = false;
    if (unionAnimId) { cancelAnimationFrame(unionAnimId); unionAnimId = null; }
    UNION_KEYS.forEach(k => stopSection('union_' + k));
    unionParticles = [];
    const el = document.getElementById('union-text');
    if (el) el.classList.remove('union-text-visible');
  }

  function spawnBurst(key) {
    const canvas = document.getElementById('union-canvas');
    if (!canvas) return;
    const W = canvas.offsetWidth || 600, H = canvas.offsetHeight || 500;
    const CX = W/2, CY = H/2;
    const c  = SEC_COLORS[key];
    const si = UNION_KEYS.indexOf(key);

    for (let i = 0; i < 45; i++) {
      const side = si % 4, t = Math.random();
      let x, y, vx, vy;
      if      (side===0) { x=0;  y=t*H; vx= 1.1+Math.random()*0.8; vy=(CY-y)/H*1.8; }
      else if (side===1) { x=W;  y=t*H; vx=-(1.1+Math.random()*0.8); vy=(CY-y)/H*1.8; }
      else if (side===2) { x=t*W; y=0;  vx=(CX-x)/W*1.8; vy= 1.1+Math.random()*0.8; }
      else               { x=t*W; y=H;  vx=(CX-x)/W*1.8; vy=-(1.1+Math.random()*0.8); }

      unionParticles.push({
        x, y, vx, vy,
        r:c.r, g:c.g, b:c.b,
        alpha: 0.65+Math.random()*0.35,
        size:  1.4+Math.random()*2.2,
        age: 0, maxAge: 260+Math.random()*140,
        orbit: false,
        oR: 35+Math.random()*90,
        oS: (Math.random()>0.5?1:-1)*(0.008+Math.random()*0.015),
        oA: Math.random()*Math.PI*2,
      });
    }
  }

  function drawUnion() {
    if (!unionRunning) return;
    const canvas = document.getElementById('union-canvas');
    if (!canvas) { unionAnimId = requestAnimationFrame(drawUnion); return; }

    const ctx2 = canvas.getContext('2d');
    const W    = canvas.width  = canvas.offsetWidth  || 600;
    const H    = canvas.height = canvas.offsetHeight || 500;
    const CX   = W/2, CY = H/2;
    const now  = performance.now() / 1000;
    const age  = now - unionStartT;

    ctx2.clearRect(0, 0, W, H);

    /* ── Waveform rivers — one per section, converging to center ── */
    const buf = masterAnalyser
      ? (() => { const b = new Float32Array(masterAnalyser.fftSize); masterAnalyser.getFloatTimeDomainData(b); return b; })()
      : null;

    UNION_KEYS.forEach((key, li) => {
      const delay     = UNION_DELAYS[key];
      const layerAge  = age - delay;
      const alpha     = Math.max(0, Math.min(1, layerAge + 1));
      if (alpha <= 0) return;

      const c       = SEC_COLORS[key];
      const spread  = (li - 1.5) * (H * 0.22);
      const conv    = Math.max(0, Math.min(1, layerAge / 5));
      const yOff    = spread * (1 - conv);

      ctx2.save();
      ctx2.lineWidth   = 1.6 + li * 0.25;
      ctx2.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha * 0.55})`;
      ctx2.shadowColor = `rgba(${c.r},${c.g},${c.b},0.28)`;
      ctx2.shadowBlur  = 7;
      ctx2.beginPath();

      const pts = buf ? buf.length : 300;
      for (let i = 0; i <= pts; i++) {
        const sinY   = Math.sin(i * 0.055 + now * 1.3 + li * 0.8) * 18;
        const audioY = buf ? buf[Math.min(i, buf.length-1)] * H * 0.38 : 0;
        const y = CY + yOff + audioY * conv + sinY * (1 - conv * 0.65);
        if (i === 0) ctx2.moveTo(0, y);
        else         ctx2.lineTo(i * (W / pts), y);
      }
      ctx2.stroke();
      ctx2.restore();
    });

    /* ── Particles ── */
    const allIn = age > UNION_DELAYS.woodwinds + 1.5;

    for (let i = unionParticles.length - 1; i >= 0; i--) {
      const p = unionParticles[i];
      p.age++;

      if (!p.orbit && p.age > p.maxAge) {
        if (allIn) { p.orbit = true; p.age = 0; p.maxAge = 99999; }
        else { unionParticles.splice(i, 1); continue; }
      }

      if (p.orbit) {
        p.oA += p.oS;
        p.x   = CX + Math.cos(p.oA) * p.oR;
        p.y   = CY + Math.sin(p.oA) * p.oR;
      } else {
        p.x += p.vx; p.y += p.vy;
        const dx = CX-p.x, dy = CY-p.y;
        const d  = Math.sqrt(dx*dx+dy*dy);
        if (d < 90) { p.vx *= 0.93; p.vy *= 0.93; }
        if (d < 22 && allIn) p.orbit = true;
      }

      const lifeFrac = 1 - (p.orbit ? 0 : p.age/p.maxAge);
      const a = p.alpha * (p.orbit ? 0.65 : Math.min(1, lifeFrac * 4));

      ctx2.save();
      ctx2.fillStyle   = `rgba(${p.r},${p.g},${p.b},${a})`;
      ctx2.shadowColor = `rgba(${p.r},${p.g},${p.b},0.45)`;
      ctx2.shadowBlur  = p.orbit ? 5 : 3;
      ctx2.beginPath();
      ctx2.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx2.fill();
      ctx2.restore();
    }

    unionAnimId = requestAnimationFrame(drawUnion);
  }

  /* ============================================================
     PART 9 — DOM & OBSERVERS
     ============================================================ */

  const modal    = document.getElementById('orch-modal');
  const allowBtn = document.getElementById('orch-allow');
  const denyBtn  = document.getElementById('orch-deny');
  const muteBtn  = document.getElementById('orch-mute');
  const panels   = document.querySelectorAll('.orch-panel[data-instrument]');

  const panelObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const panel = entry.target;
      const key   = panel.dataset.instrument;

      if (entry.isIntersecting) {
        panel.classList.add('orch-active');
        if (muteBtn) muteBtn.hidden = false;
        if (key === 'union') startUnion();
        else startSection(key);
      } else {
        if (key === 'union') stopUnion();
        else stopSection(key);

        const anyVisible = Array.from(panels).some(p => {
          const r = p.getBoundingClientRect();
          return r.top < window.innerHeight && r.bottom > 0;
        });
        if (!anyVisible && muteBtn) muteBtn.hidden = true;
      }
    });
  }, { threshold: 0.40 });

  panels.forEach(p => panelObserver.observe(p));

  // Show modal the first time the section scrolls into view
  const triggerObs = new IntersectionObserver(entries => {
    if (modalShown || !modal) return;
    if (entries.some(e => e.isIntersecting)) {
      modalShown = true;
      modal.setAttribute('aria-hidden','false');
      modal.classList.add('visible');
      triggerObs.disconnect();
    }
  }, { threshold: 0.15 });

  const firstPanel = document.querySelector('.orch-panel[data-instrument]');
  if (firstPanel && modal) triggerObs.observe(firstPanel);

  allowBtn && allowBtn.addEventListener('click', () => {
    closeModal();
    initAudio();
    audioEnabled = true;
    if (muteBtn) muteBtn.hidden = false;
    // Restart active panels with audio now enabled
    panels.forEach(p => {
      if (!p.classList.contains('orch-active')) return;
      const key = p.dataset.instrument;
      if (key === 'union') { stopUnion(); startUnion(); }
      else { stopSection(key); startSection(key); }
    });
  });

  denyBtn && denyBtn.addEventListener('click', () => {
    closeModal();
    audioEnabled = false;
  });

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden','true');
  }

  muteBtn && muteBtn.addEventListener('click', () => {
    globalMuted = !globalMuted;
    muteBtn.setAttribute('aria-pressed', String(globalMuted));
    if (!audioCtx || !masterGain) return;
    const t = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setValueAtTime(masterGain.gain.value, t);
    masterGain.gain.linearRampToValueAtTime(globalMuted ? 0.001 : 0.80, t + 0.4);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal?.classList.contains('visible')) denyBtn?.click();
  });

})();
