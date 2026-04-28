/* ============================================================
   orchestra.js — Orchestral Instruments Scroll Experience
   Real transcribed melodies · Synchronized score animation
   Web Audio API synthesis · AnalyserNode visualization
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     PART 1 — PITCH UTILITIES
     Staff Y positions follow treble clef standard notation.
     Reference: C4 (middle C) = y 95 in the SVG coordinate system.
     Each diatonic step = 7px. Staff lines at y = 25,39,53,67,81
     (F5, D5, B4, G4, E4 — treble clef bottom→top reversed).
     ============================================================ */

  const DIATONIC_STEP = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

  /**
   * Convert a pitch name like 'Bb3', 'C#5', 'G4' to a staff Y coordinate.
   * Accidentals (b/#) do NOT affect Y — they only add a glyph.
   */
  function pitchToY(name) {
    const m = name.match(/^([A-G])(b|#)?(\d)$/);
    if (!m) return 70;
    const letter = m[1], octave = parseInt(m[3]);
    const stepsFromC4 = (octave - 4) * 7 + DIATONIC_STEP[letter];
    return 95 - stepsFromC4 * 7;
  }

  /** Return 'b', '#', or null for the accidental in a pitch name. */
  function getAccidental(name) {
    const m = name.match(/^[A-G](b|#)/);
    return m ? m[1] : null;
  }

  /**
   * Return Y positions of ledger lines required for a note at staffY.
   * Lines below staff start at 95 (C4) every 14px.
   * Lines above staff start at 11 (A5) every 14px upward.
   */
  function ledgerLinesFor(staffY) {
    const out = [];
    if (staffY >= 95) {
      for (let y = 95; y <= staffY; y += 14) out.push(y);
    } else if (staffY <= 11) {
      for (let y = 11; y >= staffY; y -= 14) out.push(y);
    }
    return out;
  }

  /* ============================================================
     PART 2 — NOTE SEQUENCES (exact transcriptions)

     Each note object:
       displayPitch  — name used for staff Y (e.g. 'Bb3')
       freq          — AUDIO frequency in Hz (concert pitch)
       beat          — start position in beats from phrase top
       dur           — duration in beats
       voice         — (percussion only) 'snare' | 'timp'

     Brass notes: displayed one octave up for treble-clef readability;
     audio uses the actual concert-pitch frequency written in freq.
     ============================================================ */

  const PHRASES = {

    /* ----------------------------------------------------------
       STRINGS — Barber: Adagio for Strings, Op. 11
       Key: Bb minor · Tempo: ♩ = 60 · 4/4 time
       Opening cello melody, first phrase (28 beats ≈ 28 s)
       ---------------------------------------------------------- */
    strings: {
      bpm: 60,
      loopBeats: 28,
      color: '#c9a84c',       // gold
      notes: [
        // Bar 1-2: opening Bb — long, mournful
        { displayPitch: 'Bb3', freq: 233.08, beat:  0,  dur: 3   },
        { displayPitch: 'C4',  freq: 261.63, beat:  3,  dur: 1   },
        // Bar 3: rise to Db4
        { displayPitch: 'Db4', freq: 277.18, beat:  4,  dur: 2   },
        { displayPitch: 'C4',  freq: 261.63, beat:  6,  dur: 1   },
        { displayPitch: 'Bb3', freq: 233.08, beat:  7,  dur: 2   },
        // Bar 5: repeat opening phrase
        { displayPitch: 'Bb3', freq: 233.08, beat:  9,  dur: 2   },
        { displayPitch: 'C4',  freq: 261.63, beat: 11,  dur: 1   },
        // Bar 6-7: ascending line toward the climax
        { displayPitch: 'Db4', freq: 277.18, beat: 12,  dur: 1   },
        { displayPitch: 'Eb4', freq: 311.13, beat: 13,  dur: 1   },
        { displayPitch: 'F4',  freq: 349.23, beat: 14,  dur: 2   },
        { displayPitch: 'Gb4', freq: 369.99, beat: 16,  dur: 2   },
        // Bar 8: descent back home
        { displayPitch: 'F4',  freq: 349.23, beat: 18,  dur: 2   },
        { displayPitch: 'Eb4', freq: 311.13, beat: 20,  dur: 1   },
        { displayPitch: 'Db4', freq: 277.18, beat: 21,  dur: 1   },
        { displayPitch: 'C4',  freq: 261.63, beat: 22,  dur: 2   },
        // Final resolution: long Bb
        { displayPitch: 'Bb3', freq: 233.08, beat: 24,  dur: 4   },
      ]
    },

    /* ----------------------------------------------------------
       WOODWINDS — Debussy: Prélude à l'après-midi d'un faune
       Rubato ♩ ≈ 44 · Opening chromatic flute descent
       22-beat phrase ≈ 30 s
       ---------------------------------------------------------- */
    woodwinds: {
      bpm: 44,
      loopBeats: 22,
      color: '#8fc4b0',       // teal-green
      notes: [
        // Descending chromatic line: C#5 → F#4
        { displayPitch: 'C#5', freq: 554.37, beat:  0,   dur: 2.5 },
        { displayPitch: 'C5',  freq: 523.25, beat:  2.5, dur: 2   },
        { displayPitch: 'B4',  freq: 493.88, beat:  4.5, dur: 1.5 },
        { displayPitch: 'Bb4', freq: 466.16, beat:  6,   dur: 1.5 },
        { displayPitch: 'A4',  freq: 440.00, beat:  7.5, dur: 1.5 },
        { displayPitch: 'Ab4', freq: 415.30, beat:  9,   dur: 1   },
        { displayPitch: 'G4',  freq: 392.00, beat: 10,   dur: 1.5 },
        { displayPitch: 'F#4', freq: 369.99, beat: 11.5, dur: 1.5 },
        // Curl back upward (the characteristic Debussy turn)
        { displayPitch: 'G4',  freq: 392.00, beat: 13,   dur: 2   },
        { displayPitch: 'A4',  freq: 440.00, beat: 15,   dur: 1.5 },
        { displayPitch: 'Bb4', freq: 466.16, beat: 16.5, dur: 2   },
        { displayPitch: 'C5',  freq: 523.25, beat: 18.5, dur: 3   },
      ]
    },

    /* ----------------------------------------------------------
       BRASS — Copland: Fanfare for the Common Man
       ♩ = 69 · Concert pitch in freq; displayed one octave up.
       12-beat phrase ≈ 10.4 s
       ---------------------------------------------------------- */
    brass: {
      bpm: 69,
      loopBeats: 12,
      color: '#d4956a',       // copper
      notes: [
        // Two staccato Gs — the iconic announcement
        { displayPitch: 'G4',  freq:  98.00, beat:  0, dur: 1   }, // G2 concert
        { displayPitch: 'G4',  freq:  98.00, beat:  1, dur: 1   },
        // Held C — the grand gesture
        { displayPitch: 'C5',  freq: 130.81, beat:  2, dur: 3   }, // C3 concert
        // Descent: G → E → C → G
        { displayPitch: 'G5',  freq: 196.00, beat:  5, dur: 2   }, // G3 concert
        { displayPitch: 'E5',  freq: 164.81, beat:  7, dur: 1   }, // E3 concert
        { displayPitch: 'C5',  freq: 130.81, beat:  8, dur: 1   }, // C3 concert
        { displayPitch: 'G4',  freq:  98.00, beat:  9, dur: 3   }, // G2 — long close
      ]
    },

    /* ----------------------------------------------------------
       PERCUSSION — Ravel: Bolero
       ♩ = 76 · 3/4 time · 2-bar snare + timpani pattern (6 beats)
       ---------------------------------------------------------- */
    percussion: {
      bpm: 76,
      loopBeats: 6,
      color: '#b0b0b8',       // silver
      notes: [
        // ── Bar 1 snare pattern (Bolero's famous 17-note cell) ──
        { displayPitch: 'S', freq: 0, beat: 0,    dur: 0.5,  voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 0.5,  dur: 0.25, voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 0.75, dur: 0.25, voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 1,    dur: 0.5,  voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 1.5,  dur: 0.25, voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 2,    dur: 0.25, voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 2.25, dur: 0.25, voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 2.5,  dur: 0.25, voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 2.75, dur: 0.25, voice: 'snare' },
        // ── Bar 2 snare pattern ──
        { displayPitch: 'S', freq: 0, beat: 3,    dur: 0.5,  voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 3.5,  dur: 0.5,  voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 4,    dur: 0.5,  voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 4.5,  dur: 0.25, voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 4.75, dur: 0.25, voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 5,    dur: 0.25, voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 5.25, dur: 0.25, voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 5.5,  dur: 0.25, voice: 'snare' },
        { displayPitch: 'S', freq: 0, beat: 5.75, dur: 0.25, voice: 'snare' },
        // ── Timpani: C2 on bar 1, G2 on bar 2 ──
        { displayPitch: 'T', freq:  65.41, beat: 0, dur: 2, voice: 'timp' },
        { displayPitch: 'T', freq:  98.00, beat: 3, dur: 2, voice: 'timp' },
      ]
    }
  };

  /* ============================================================
     PART 3 — AUDIO ENGINE
     ============================================================ */

  let audioCtx   = null;
  let masterGain = null;
  let masterAnalyser = null;

  function initAudio() {
    if (audioCtx) return;
    audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.82, audioCtx.currentTime);

    masterAnalyser = audioCtx.createAnalyser();
    masterAnalyser.fftSize = 2048;
    masterAnalyser.smoothingTimeConstant = 0.88;

    masterGain.connect(masterAnalyser);
    masterAnalyser.connect(audioCtx.destination);

    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  /* WaveShaper curve for warm brass/reed harmonic saturation */
  function makeWarmCurve(amount) {
    const N = 512, curve = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const x = (i * 2) / N - 1;
      curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  /* ---- STRINGS: Barber Adagio — sine with vibrato + layered thirds ---- */
  function scheduleStringNote(note, t0, dest) {
    const ctx = audioCtx;
    const ATTACK = 0.8, RELEASE = 2.0;
    const durSec = note.dur * (60 / PHRASES.strings.bpm);
    const tEnd   = t0 + durSec;

    // Three-voice texture: root + minor third below + fifth below
    const voices = [
      { freq: note.freq,                       gain: 0.52 },
      { freq: note.freq * Math.pow(2,-3/12),  gain: 0.24 }, // minor third below
      { freq: note.freq * Math.pow(2,-7/12),  gain: 0.14 }, // fifth below
    ];

    voices.forEach(({ freq, gain: vGain }, vi) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);

      // Vibrato LFO — begins after the bow attack settles
      const lfo     = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(5.2 + vi * 0.12, t0);
      lfoGain.gain.setValueAtTime(0, t0);
      lfoGain.gain.linearRampToValueAtTime(3.0, t0 + ATTACK + 0.4);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      // Amplitude envelope: slow bow attack, long sostenuto release
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(vGain, t0 + ATTACK);
      env.gain.setValueAtTime(vGain * 0.92, tEnd - RELEASE * 0.35);
      env.gain.exponentialRampToValueAtTime(0.001, tEnd + RELEASE * 0.4);

      osc.connect(env);
      env.connect(dest);
      osc.start(t0);
      lfo.start(t0);
      const stopT = tEnd + RELEASE + 0.1;
      osc.stop(stopT);
      lfo.stop(stopT);
    });
  }

  /* ---- WOODWINDS: Debussy Faun — sine with breath noise + flutter LFO ---- */
  function scheduleWoodwindNote(note, t0, dest) {
    const ctx = audioCtx;
    const ATTACK = 0.4, RELEASE = 0.9;
    const durSec = note.dur * (60 / PHRASES.woodwinds.bpm);
    const tEnd   = t0 + durSec;

    // Main flute tone: sine oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, t0);

    // Breath flutter: slow LFO ±1.5 Hz at 3.2 Hz
    const lfo     = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(3.2, t0);
    lfoGain.gain.setValueAtTime(1.5, t0);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(0.44, t0 + ATTACK);
    env.gain.setValueAtTime(0.40, tEnd - 0.15);
    env.gain.linearRampToValueAtTime(0, tEnd + RELEASE * 0.45);

    osc.connect(env);
    env.connect(dest);

    // Breathy noise layer: filtered white noise for airy overtones
    const noiseLen = Math.ceil(ctx.sampleRate * (durSec + RELEASE + 0.1));
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    const nSrc = ctx.createBufferSource();
    nSrc.buffer = noiseBuf;

    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(note.freq * 1.6, t0); // harmonic partial
    bpf.Q.setValueAtTime(14, t0);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0, t0);
    nGain.gain.linearRampToValueAtTime(0.055, t0 + ATTACK * 0.6);
    nGain.gain.setValueAtTime(0.04, tEnd - 0.1);
    nGain.gain.linearRampToValueAtTime(0, tEnd + RELEASE * 0.4);

    nSrc.connect(bpf);
    bpf.connect(nGain);
    nGain.connect(dest);

    osc.start(t0);
    lfo.start(t0);
    nSrc.start(t0);
    const stopT = tEnd + RELEASE + 0.15;
    osc.stop(stopT);
    lfo.stop(stopT);
    nSrc.stop(stopT);
  }

  /* ---- BRASS: Copland — sawtooth+square through WaveShaper + timpani ---- */
  function scheduleBrassNote(note, t0, dest) {
    const ctx = audioCtx;
    const ATTACK = 0.055, RELEASE = 0.65;
    const durSec = note.dur * (60 / PHRASES.brass.bpm);
    const tEnd   = t0 + durSec;

    // Sawtooth (70%) + square (30%) mix for rich brass timbre
    const saw = ctx.createOscillator(); saw.type = 'sawtooth';
    const sq  = ctx.createOscillator(); sq.type  = 'square';
    saw.frequency.setValueAtTime(note.freq, t0);
    sq.frequency.setValueAtTime(note.freq, t0);

    const sawG = ctx.createGain(); sawG.gain.setValueAtTime(0.68, t0);
    const sqG  = ctx.createGain(); sqG.gain.setValueAtTime(0.32, t0);

    // WaveShaper for harmonic warmth / brashness
    const shaper = ctx.createWaveShaper();
    shaper.curve = makeWarmCurve(85);
    shaper.oversample = '4x';

    // Low-pass to remove harsh aliasing
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(2400, t0);
    lpf.Q.setValueAtTime(0.9, t0);

    // Hard attack, medium sustain, clean release
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

    // Timpani: hit on first beat of each phrase loop (beat === 0)
    if (note.beat === 0) {
      scheduleTimp(t0, 65.41, dest); // C2
    }
  }

  /* Low timpani hit: sine with pitch sag + exponential decay */
  function scheduleTimp(t0, freq, dest) {
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.72, t0 + 1.2); // thud droop

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.65, t0);
    env.gain.exponentialRampToValueAtTime(0.001, t0 + 2.6);

    osc.connect(env); env.connect(dest);
    osc.start(t0); osc.stop(t0 + 2.7);
  }

  /* Snare hit: white noise burst through bandpass filter */
  function scheduleSnare(t0, dest) {
    const ctx = audioCtx;
    const DECAY = 0.13;
    const len   = Math.ceil(ctx.sampleRate * (DECAY + 0.05));
    const buf   = ctx.createBuffer(1, len, ctx.sampleRate);
    const data  = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(1200, t0);
    bpf.Q.setValueAtTime(1.6, t0);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.55, t0);
    env.gain.exponentialRampToValueAtTime(0.001, t0 + DECAY);

    src.connect(bpf); bpf.connect(env); env.connect(dest);
    src.start(t0); src.stop(t0 + DECAY + 0.06);
  }

  /* ---- PERCUSSION: route each note to snare or timpani ---- */
  function schedulePercussionNote(note, t0, dest) {
    if (note.voice === 'snare') scheduleSnare(t0, dest);
    else if (note.voice === 'timp') scheduleTimp(t0, note.freq, dest);
  }

  const SCHEDULERS = {
    strings:    scheduleStringNote,
    woodwinds:  scheduleWoodwindNote,
    brass:      scheduleBrassNote,
    percussion: schedulePercussionNote,
  };

  /* ============================================================
     PART 4 — PHRASE SEQUENCER
     Schedules audio notes ahead of time (look-ahead buffer pattern).
     Also provides getCurrentBeat() for score animation sync.
     ============================================================ */

  const LOOK_AHEAD = 0.35; // seconds to look ahead when scheduling

  class PhraseSequencer {
    constructor(key, dest) {
      this.key      = key;
      this.dest     = dest;
      this.phrase   = PHRASES[key];
      this.bps      = this.phrase.bpm / 60;
      this.loopSec  = this.phrase.loopBeats / this.bps;
      this.startT   = null; // audioCtx.currentTime when started
      this.running  = false;
      this._rafId   = null;
      // Flat pre-sorted list: { offsetSec, note } — expanded to many loops
      this._buildSchedule();
    }

    _buildSchedule() {
      this._sched  = [];
      this._sIdx   = 0;
      const loops  = 200; // enough for a very long session
      const notes  = this.phrase.notes;
      const lSec   = this.loopSec;
      for (let loop = 0; loop < loops; loop++) {
        notes.forEach(n => {
          this._sched.push({
            offsetSec: loop * lSec + n.beat / this.bps,
            note: n,
          });
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
        if (t0 >= audioCtx.currentTime - 0.04) { // don't schedule past notes
          SCHEDULERS[this.key](item.note, t0, this.dest);
        }
        this._sIdx++;
      }
      this._rafId = requestAnimationFrame(() => this._tick());
    }

    /* Beat position within the loop (0 → loopBeats), continuous */
    getCurrentBeat() {
      if (!this.running || this.startT === null) return 0;
      const elapsed = Math.max(0, audioCtx.currentTime - this.startT);
      return (elapsed * this.bps) % this.phrase.loopBeats;
    }

    /* Elapsed seconds since start (for Union stagger timing) */
    getElapsed() {
      if (!this.startT) return 0;
      return Math.max(0, audioCtx.currentTime - this.startT);
    }
  }

  /* ============================================================
     PART 5 — WALL-CLOCK SEQUENCER (score-only, no audio)
     Used when the user denies audio permission.
     ============================================================ */

  class WallClock {
    constructor(key) {
      this.key     = key;
      this.phrase  = PHRASES[key];
      this.bps     = this.phrase.bpm / 60;
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
     Builds the staff and animates notes scrolling past the playhead.
     Notes are positioned on a virtual tape; the playhead is fixed.
     ============================================================ */

  const NS        = 'http://www.w3.org/2000/svg';
  const PPB       = 88;    // pixels per beat on the virtual tape
  const PH_X      = 105;  // playhead fixed screen X in SVG units
  const SVG_W     = 560;
  const SVG_H     = 160;

  // Staff line Y positions (treble clef, see pitchToY reference)
  const STAFF_YS  = [25, 39, 53, 67, 81];

  function buildScore(svgEl, key, clock) {
    svgEl.innerHTML = '';
    const phrase = PHRASES[key];
    const color  = phrase.color;
    const isPerc = key === 'percussion';
    const CREAM  = '#f0ece0';

    /* ── Static staff lines ── */
    if (isPerc) {
      // Single percussion staff line at Y=80
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', '10'); l.setAttribute('x2', String(SVG_W - 10));
      l.setAttribute('y1', '80'); l.setAttribute('y2', '80');
      l.setAttribute('stroke', color);
      l.setAttribute('stroke-width', '1.2');
      l.setAttribute('opacity', '0.4');
      svgEl.appendChild(l);

      // Percussion clef (two vertical bars)
      ['28','34'].forEach(cx => {
        const b = document.createElementNS(NS, 'rect');
        b.setAttribute('x', cx); b.setAttribute('y', '72');
        b.setAttribute('width', '3'); b.setAttribute('height', '16');
        b.setAttribute('fill', color); b.setAttribute('opacity', '0.5');
        svgEl.appendChild(b);
      });
    } else {
      STAFF_YS.forEach(y => {
        const l = document.createElementNS(NS, 'line');
        l.setAttribute('x1', '10'); l.setAttribute('x2', String(SVG_W - 10));
        l.setAttribute('y1', String(y)); l.setAttribute('y2', String(y));
        l.setAttribute('stroke', color);
        l.setAttribute('stroke-width', '0.8');
        l.setAttribute('opacity', '0.3');
        svgEl.appendChild(l);
      });
      // Treble clef
      const clef = document.createElementNS(NS, 'text');
      clef.setAttribute('x', '14');
      clef.setAttribute('y', String(81 + 8));
      clef.setAttribute('font-size', '60');
      clef.setAttribute('font-family', 'serif');
      clef.setAttribute('fill', color);
      clef.setAttribute('opacity', '0.45');
      clef.textContent = '𝄞';
      svgEl.appendChild(clef);
    }

    /* ── Playhead: fixed vertical gold line with soft glow ── */
    const phGlow = document.createElementNS(NS, 'rect');
    phGlow.setAttribute('x', String(PH_X - 4));
    phGlow.setAttribute('y', '14');
    phGlow.setAttribute('width', '8');
    phGlow.setAttribute('height', String(SVG_H - 18));
    phGlow.setAttribute('fill', color);
    phGlow.setAttribute('opacity', '0.07');
    phGlow.setAttribute('rx', '2');
    svgEl.appendChild(phGlow);

    const ph = document.createElementNS(NS, 'line');
    ph.setAttribute('x1', String(PH_X)); ph.setAttribute('x2', String(PH_X));
    ph.setAttribute('y1', '14');         ph.setAttribute('y2', String(SVG_H - 8));
    ph.setAttribute('stroke', color);
    ph.setAttribute('stroke-width', '1.5');
    ph.setAttribute('opacity', '0.75');
    svgEl.appendChild(ph);

    /* ── Build note elements ── */
    const notes   = phrase.notes;
    const noteEls = notes.map(note => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'snote');

      if (isPerc) {
        // Percussion: 'x' notehead on the single line
        const sz = note.voice === 'timp' ? 7 : 4.5;
        [[-1,-1,1,1],[1,-1,-1,1]].forEach(([x1,y1,x2,y2]) => {
          const l = document.createElementNS(NS, 'line');
          l.setAttribute('x1', String(x1*sz)); l.setAttribute('x2', String(x2*sz));
          l.setAttribute('y1', String(y1*sz)); l.setAttribute('y2', String(y2*sz));
          l.setAttribute('stroke', CREAM);
          l.setAttribute('stroke-width', note.voice === 'timp' ? '2' : '1.5');
          l.setAttribute('stroke-linecap', 'round');
          g.appendChild(l);
        });
        g.dataset.y = '80';
      } else {
        const staffY = pitchToY(note.displayPitch);
        g.dataset.y  = String(staffY);
        const acc    = getAccidental(note.displayPitch);

        // Accidental glyph (♭ or ♯) to the left of the notehead
        if (acc) {
          const aEl = document.createElementNS(NS, 'text');
          aEl.setAttribute('x', '-11');
          aEl.setAttribute('y', '4');
          aEl.setAttribute('font-family', 'serif');
          aEl.setAttribute('font-size', '13');
          aEl.setAttribute('fill', CREAM);
          aEl.setAttribute('opacity', '0.9');
          aEl.textContent = acc === 'b' ? '♭' : '♯';
          g.appendChild(aEl);
        }

        // Ledger lines when note is above or below the staff
        ledgerLinesFor(staffY).forEach(ly => {
          const ll = document.createElementNS(NS, 'line');
          ll.setAttribute('x1', '-10'); ll.setAttribute('x2', '10');
          ll.setAttribute('y1', String(ly - staffY));
          ll.setAttribute('y2', String(ly - staffY));
          ll.setAttribute('stroke', CREAM);
          ll.setAttribute('stroke-width', '0.9');
          ll.setAttribute('opacity', '0.65');
          g.appendChild(ll);
        });

        // Notehead: slightly tilted ellipse (standard music notation shape)
        const head = document.createElementNS(NS, 'ellipse');
        head.setAttribute('cx', '0'); head.setAttribute('cy', '0');
        head.setAttribute('rx', '7'); head.setAttribute('ry', '5');
        head.setAttribute('transform', 'rotate(-14)');
        head.setAttribute('fill', CREAM);
        head.setAttribute('class', 'nhead');
        g.appendChild(head);

        // Stem: up if note is below middle B4 (staff Y > 53), else down
        const stemUp = staffY > 53;
        const stem = document.createElementNS(NS, 'line');
        if (stemUp) {
          stem.setAttribute('x1','6'); stem.setAttribute('x2','6');
          stem.setAttribute('y1','-4'); stem.setAttribute('y2','-30');
        } else {
          stem.setAttribute('x1','-6'); stem.setAttribute('x2','-6');
          stem.setAttribute('y1','4'); stem.setAttribute('y2','30');
        }
        stem.setAttribute('stroke', CREAM);
        stem.setAttribute('stroke-width', '1.2');
        g.appendChild(stem);
      }

      svgEl.appendChild(g);
      return { el: g, note };
    });

    /* ── Animation loop ── */
    let animId  = null;
    let running = false;

    function frame() {
      if (!running) return;
      const currentBeat = clock.getCurrentBeat();
      const loopBeats   = phrase.loopBeats;

      noteEls.forEach(({ el, note }) => {
        // Distance in beats from current position to this note.
        // Normalize so the note is always placed in the upcoming window
        // (0 → loopBeats ahead, wrapping seamlessly).
        let delta = note.beat - currentBeat;
        // Bring delta into range (-loopBeats*0.25, loopBeats*0.75)
        // so notes behind the playhead still show briefly then wrap right
        while (delta < -(loopBeats * 0.2)) delta += loopBeats;
        while (delta >   loopBeats * 0.8)  delta -= loopBeats;

        const x = PH_X + delta * PPB;
        const y = parseFloat(el.dataset.y) || 80;

        el.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);

        // Highlight when crossing the playhead
        const atHead = Math.abs(delta) < (note.dur * 0.55 + 0.06);
        const cur    = el.dataset.active === '1';
        if (atHead !== cur) {
          el.dataset.active = atHead ? '1' : '0';
          const head = el.querySelector('.nhead');
          if (head) head.setAttribute('fill', atHead ? color : CREAM);
          el.style.filter = atHead
            ? `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 2px ${color})`
            : '';
          phGlow.setAttribute('opacity', atHead ? '0.18' : '0.07');
        }

        // Cull off-screen notes
        el.setAttribute('visibility', (x > -30 && x < SVG_W + 30) ? 'visible' : 'hidden');
      });

      animId = requestAnimationFrame(frame);
    }

    return {
      start() { running = true; frame(); },
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
  const sections = {};

  function startSection(key) {
    if (sections[key]) return; // already running

    let clock;
    let gainNode = null;

    if (audioEnabled && !globalMuted) {
      gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.78, audioCtx.currentTime + 1.8);
      gainNode.connect(masterGain);

      clock = new PhraseSequencer(key, gainNode);
      clock.start();
    } else {
      clock = new WallClock(key);
      clock.start();
    }

    const svgEl = document.querySelector(`#orch-${key} .orch-staff-svg`);
    let scoreAnim = null;
    if (svgEl) {
      scoreAnim = buildScore(svgEl, key, clock);
      scoreAnim.start();
    }

    sections[key] = { gainNode, sequencer: clock, scoreAnim };
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
     PART 8 — UNION SECTION: THE CONVERGENCE
     Full-canvas waveform rivers + particle constellation +
     staggered audio layers + typography reveal + gold flash.
     ============================================================ */

  const UNION_KEYS   = ['percussion', 'strings', 'brass', 'woodwinds'];
  // Seconds after unionStartTime each layer enters
  const UNION_DELAYS = { percussion: 1.5, strings: 4, brass: 6.5, woodwinds: 9 };

  const SEC_COLORS = {
    strings:    { r: 201, g: 168, b:  76 }, // gold
    woodwinds:  { r: 143, g: 196, b: 176 }, // teal
    brass:      { r: 212, g: 149, b: 106 }, // copper
    percussion: { r: 176, g: 176, b: 184 }, // silver
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

    // Schedule each audio layer with a real-time setTimeout
    if (audioEnabled && !globalMuted) {
      UNION_KEYS.forEach(key => {
        setTimeout(() => {
          if (!unionRunning) return;
          startSection(key);
          // Swell master gain as each new layer arrives
          if (masterGain && audioCtx) {
            const t = audioCtx.currentTime;
            const v = masterGain.gain.value;
            masterGain.gain.cancelScheduledValues(t);
            masterGain.gain.setValueAtTime(v, t);
            masterGain.gain.linearRampToValueAtTime(Math.min(v + 0.06, 1.0), t + 2.2);
          }
          spawnBurst(key);
        }, UNION_DELAYS[key] * 1000);
      });
    }

    // Typography reveal at 10 s
    setTimeout(() => {
      if (!unionRunning) return;
      const textEl = document.getElementById('union-text');
      if (textEl) textEl.classList.add('union-text-visible');
    }, 10000);

    // Gold flash at 12 s — like stage lights hitting full intensity
    setTimeout(() => {
      if (!unionRunning) return;
      const flash = document.getElementById('union-flash');
      if (!flash) return;
      flash.style.transition = 'none';
      flash.style.opacity    = '0.18';
      requestAnimationFrame(() => {
        flash.style.transition = 'opacity 0.5s ease-out';
        flash.style.opacity    = '0';
      });
    }, 12000);

    drawUnion();
  }

  function stopUnion() {
    unionRunning = false;
    if (unionAnimId) { cancelAnimationFrame(unionAnimId); unionAnimId = null; }
    UNION_KEYS.forEach(stopSection);
    unionParticles = [];
    const textEl = document.getElementById('union-text');
    if (textEl) textEl.classList.remove('union-text-visible');
  }

  /* Spawn particle burst from screen edges, color-coded per section */
  function spawnBurst(key) {
    const canvas = document.getElementById('union-canvas');
    if (!canvas) return;
    const W = canvas.offsetWidth  || 600;
    const H = canvas.offsetHeight || 500;
    const CX = W / 2, CY = H / 2;
    const c  = SEC_COLORS[key];
    const sideIdx = UNION_KEYS.indexOf(key);

    for (let i = 0; i < 45; i++) {
      const side = sideIdx % 4;
      const t    = Math.random();
      let x, y, vx, vy;
      if      (side === 0) { x = 0;  y = t*H; vx = 1.1+Math.random()*0.8; vy = (CY-y)/H*1.8; }
      else if (side === 1) { x = W;  y = t*H; vx = -(1.1+Math.random()*0.8); vy = (CY-y)/H*1.8; }
      else if (side === 2) { x = t*W; y = 0;  vx = (CX-x)/W*1.8; vy = 1.1+Math.random()*0.8; }
      else                 { x = t*W; y = H;  vx = (CX-x)/W*1.8; vy = -(1.1+Math.random()*0.8); }

      unionParticles.push({
        x, y, vx, vy,
        r: c.r, g: c.g, b: c.b,
        alpha:  0.65 + Math.random() * 0.35,
        size:   1.4 + Math.random() * 2.2,
        age: 0, maxAge: 260 + Math.random() * 140,
        orbit: false,
        oR:  35 + Math.random() * 90,
        oS:  (Math.random() > 0.5 ? 1 : -1) * (0.008 + Math.random() * 0.015),
        oA:  Math.random() * Math.PI * 2,
      });
    }
  }

  /* Main Union canvas render loop */
  function drawUnion() {
    if (!unionRunning) return;
    const canvas = document.getElementById('union-canvas');
    if (!canvas) { unionAnimId = requestAnimationFrame(drawUnion); return; }

    const ctx2 = canvas.getContext('2d');
    const W    = canvas.width  = canvas.offsetWidth  || 600;
    const H    = canvas.height = canvas.offsetHeight || 500;
    const CX   = W / 2, CY = H / 2;
    const now  = performance.now() / 1000;
    const age  = now - unionStartT;

    ctx2.clearRect(0, 0, W, H);

    /* ── Waveform rivers ── */
    const hasAnalyser = !!masterAnalyser;
    const buf = hasAnalyser ? new Float32Array(masterAnalyser.fftSize) : null;
    if (hasAnalyser) masterAnalyser.getFloatTimeDomainData(buf);

    UNION_KEYS.forEach((key, li) => {
      const delay      = UNION_DELAYS[key];
      const layerAge   = age - delay;
      const layerAlpha = Math.max(0, Math.min(1, layerAge + 1));
      if (layerAlpha <= 0) return;

      const c = SEC_COLORS[key];
      // Rivers start spread out vertically and converge to center as layer matures
      const spread     = (li - 1.5) * (H * 0.24);
      const converge   = Math.max(0, Math.min(1, layerAge / 5));
      const yOff       = spread * (1 - converge);

      ctx2.save();
      ctx2.lineWidth   = 1.6 + li * 0.25;
      ctx2.strokeStyle = `rgba(${c.r},${c.g},${c.b},${layerAlpha * 0.55})`;
      ctx2.shadowColor = `rgba(${c.r},${c.g},${c.b},0.28)`;
      ctx2.shadowBlur  = 7;
      ctx2.beginPath();

      const pts = hasAnalyser ? buf.length : 280;
      const dX  = W / pts;
      for (let i = 0; i <= pts; i++) {
        // Blend audio data with a decorative sine so it looks good even when quiet
        const sinY  = Math.sin(i * 0.055 + now * 1.3 + li * 0.8) * 18;
        const audioY = hasAnalyser ? buf[Math.min(i, buf.length-1)] * H * 0.38 : 0;
        const y = CY + yOff + audioY * converge + sinY * (1 - converge * 0.65);
        if (i === 0) ctx2.moveTo(0, y);
        else         ctx2.lineTo(i * dX, y);
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
        const dx = CX - p.x, dy = CY - p.y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < 90) { p.vx *= 0.93; p.vy *= 0.93; }
        if (d < 22 && allIn) p.orbit = true;
      }

      const lifeFrac = 1 - (p.orbit ? 0 : p.age / p.maxAge);
      const a = p.alpha * (p.orbit ? 0.65 : Math.min(1, lifeFrac * 4));

      ctx2.save();
      ctx2.fillStyle   = `rgba(${p.r},${p.g},${p.b},${a})`;
      ctx2.shadowColor = `rgba(${p.r},${p.g},${p.b},0.45)`;
      ctx2.shadowBlur  = p.orbit ? 5 : 3;
      ctx2.beginPath();
      ctx2.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.restore();
    }

    unionAnimId = requestAnimationFrame(drawUnion);
  }

  /* ============================================================
     PART 9 — DOM INTEGRATION
     ============================================================ */

  const modal    = document.getElementById('orch-modal');
  const allowBtn = document.getElementById('orch-allow');
  const denyBtn  = document.getElementById('orch-deny');
  const muteBtn  = document.getElementById('orch-mute');
  const panels   = document.querySelectorAll('.orch-panel[data-instrument]');

  /* Activate / deactivate based on scroll position */
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

        // Hide mute button when no panel is in view
        const anyVisible = Array.from(panels).some(p => {
          const r = p.getBoundingClientRect();
          return r.top < window.innerHeight && r.bottom > 0;
        });
        if (!anyVisible && muteBtn) muteBtn.hidden = true;
      }
    });
  }, { threshold: 0.40 });

  panels.forEach(p => panelObserver.observe(p));

  /* Show audio modal the first time the section enters view */
  const triggerObs = new IntersectionObserver(entries => {
    if (modalShown || !modal) return;
    if (entries.some(e => e.isIntersecting)) {
      modalShown = true;
      modal.setAttribute('aria-hidden', 'false');
      modal.classList.add('visible');
      triggerObs.disconnect();
    }
  }, { threshold: 0.15 });

  const firstPanel = document.querySelector('.orch-panel[data-instrument]');
  if (firstPanel && modal) triggerObs.observe(firstPanel);

  /* Allow audio */
  allowBtn && allowBtn.addEventListener('click', () => {
    closeModal();
    initAudio();
    audioEnabled = true;
    if (muteBtn) muteBtn.hidden = false;
    // Restart any panels that are already visible (score-only → audio mode)
    panels.forEach(p => {
      if (!p.classList.contains('orch-active')) return;
      const key = p.dataset.instrument;
      if (key === 'union') { stopUnion(); startUnion(); }
      else { stopSection(key); startSection(key); }
    });
  });

  /* Deny audio — score animation continues with wall clock */
  denyBtn && denyBtn.addEventListener('click', () => {
    closeModal();
    audioEnabled = false;
  });

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
  }

  /* Mute / unmute via master gain ramp */
  muteBtn && muteBtn.addEventListener('click', () => {
    globalMuted = !globalMuted;
    muteBtn.setAttribute('aria-pressed', String(globalMuted));
    if (!audioCtx || !masterGain) return;
    const t = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setValueAtTime(masterGain.gain.value, t);
    masterGain.gain.linearRampToValueAtTime(globalMuted ? 0.001 : 0.82, t + 0.4);
  });

  /* Keyboard escape closes modal */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal?.classList.contains('visible')) {
      denyBtn && denyBtn.click();
    }
  });

})();
