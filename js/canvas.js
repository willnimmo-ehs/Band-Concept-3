/* ============================================================
   canvas.js — "The Living Score"
   Background: fixed canvas with drifting score notation
   Panels: sticky staff canvases with notes floating upward
   ============================================================ */

(function () {

  /* ── SHARED CONSTANTS ────────────────────────────────────────── */
  const NOTE_SYMS    = ['♩','♪','♫','♬','♯','♭','♮'];
  const CLEF         = '𝄞';
  const BASS_CLEF    = '𝄢';
  const DYNAMIC_SYMS = ['pp','p','mp','mf','f','ff'];
  const GOLD         = '#c9a84c';
  const CREAM        = '#f0ece0';

  /* ══════════════════════════════════════════════════════════════
     BACKGROUND CANVAS
     Full-page fixed layer with very faint drifting notation
     ══════════════════════════════════════════════════════════════ */
  (function initBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, time = 0, last = 0;
    const particles = [];

    /* Spawn a background notation particle */
    function spawn() {
      const roll = Math.random();
      let type, symbol, size, alpha, rot, rotV;

      if (roll < 0.12) {
        // Large treble clef watermark
        type   = 'clef';
        symbol = Math.random() < 0.75 ? CLEF : BASS_CLEF;
        size   = 90 + Math.random() * 130;
        alpha  = 0.018 + Math.random() * 0.025;
        rot    = (Math.random() - 0.5) * 0.35;
        rotV   = (Math.random() - 0.5) * 0.0006;
      } else if (roll < 0.65) {
        // Small floating note
        type   = 'note';
        symbol = NOTE_SYMS[Math.floor(Math.random() * NOTE_SYMS.length)];
        size   = 14 + Math.random() * 20;
        alpha  = 0.04 + Math.random() * 0.09;
        rot    = (Math.random() - 0.5) * 0.3;
        rotV   = (Math.random() - 0.5) * 0.0008;
      } else {
        // Dynamic marking
        type   = 'dyn';
        symbol = DYNAMIC_SYMS[Math.floor(Math.random() * DYNAMIC_SYMS.length)];
        size   = 11 + Math.random() * 12;
        alpha  = 0.04 + Math.random() * 0.06;
        rot    = 0;
        rotV   = 0;
      }

      particles.push({
        type, symbol, size, rot, rotV,
        x:  Math.random() * W,
        y:  H + 50,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(0.18 + Math.random() * 0.28),
        alpha,
        maxAlpha: alpha,
        life: 0,
        maxLife: 1200 + Math.random() * 800,
      });
    }

    /* Faint horizontal staff-line groups — scroll slowly downward */
    function drawStaves() {
      ctx.save();
      ctx.strokeStyle = 'rgba(201,168,76,0.045)';
      ctx.lineWidth = 0.6;

      const lineGap  = 5;     // px between lines in a staff
      const groupH   = lineGap * 4;
      const interGap = 110;   // px gap between staff groups
      const period   = groupH + interGap;

      // Drift staves downward very slowly
      const offset = (time * 6) % period;

      let y = offset - period;
      while (y < H + period) {
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(0, y + i * lineGap);
          ctx.lineTo(W, y + i * lineGap);
          ctx.stroke();
        }
        y += period;
      }
      ctx.restore();
    }

    function drawParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.rot += p.rotV;
        p.life++;

        if (p.y < -200 || p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        // Fade in then fade out
        const fade = p.life < 60 ? p.life / 60 :
                     p.life > p.maxLife - 80 ? (p.maxLife - p.life) / 80 : 1;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.maxAlpha * fade;
        ctx.fillStyle = CREAM;
        ctx.textAlign = 'center';

        if (p.type === 'dyn') {
          ctx.font = `italic ${p.size}px 'Lato', sans-serif`;
        } else {
          ctx.font = `${p.size}px serif`;
        }
        ctx.fillText(p.symbol, 0, 0);
        ctx.restore();
      }
    }

    function bgLoop(ts) {
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts; time += dt;

      ctx.clearRect(0, 0, W, H);
      drawStaves();
      drawParticles();

      // Gentle spawn rate
      if (Math.random() < 0.018 * dt * 60 && particles.length < 55) {
        spawn();
      }

      requestAnimationFrame(bgLoop);
    }

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      // Pre-scatter particles so it doesn't start empty
      while (particles.length < 28) {
        spawn();
        particles[particles.length - 1].y = Math.random() * H;
        particles[particles.length - 1].life = Math.floor(Math.random() * 400);
      }
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(bgLoop);
  })();


  /* ══════════════════════════════════════════════════════════════
     STAFF PANEL CANVASES
     Left + right sticky panels: scrolling staff lines + floating notes
     ══════════════════════════════════════════════════════════════ */
  function initPanel(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, time = 0, last = 0;
    const notes = [];

    /* Spawn a note that will drift upward */
    function spawnNote() {
      notes.push({
        x:     W * (0.12 + Math.random() * 0.76),
        y:     H + 25,
        vy:    -(0.55 + Math.random() * 0.75),
        sym:   NOTE_SYMS[Math.floor(Math.random() * NOTE_SYMS.length)],
        size:  12 + Math.random() * 15,
        alpha: 0.18 + Math.random() * 0.32,
        rot:   (Math.random() - 0.5) * 0.25,
      });
    }

    /* Horizontal staff lines — slowly drift upward */
    function drawStaves() {
      const lineGap  = 6;     // px between lines in one staff
      const staffH   = lineGap * 4;
      const interGap = 44;    // gap between stave groups
      const period   = staffH + interGap;

      // Staff lines drift upward
      const offset = period - (time * 14) % period;

      ctx.save();
      ctx.lineWidth = 0.8;

      let y = offset - period;
      while (y < H + period) {
        for (let i = 0; i < 5; i++) {
          const lineY = y + i * lineGap;
          // Subtle gradient: lines brighter in the center of the panel
          ctx.strokeStyle = 'rgba(201,168,76,0.20)';
          ctx.beginPath();
          ctx.moveTo(6, lineY);
          ctx.lineTo(W - 6, lineY);
          ctx.stroke();
        }
        y += period;
      }

      // Single thin vertical barline through the center
      ctx.strokeStyle = 'rgba(201,168,76,0.10)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(W * 0.5, 0);
      ctx.lineTo(W * 0.5, H);
      ctx.stroke();

      ctx.restore();
    }

    /* The notes floating upward */
    function drawNotes() {
      for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i];
        n.y += n.vy;
        if (n.y < -30) { notes.splice(i, 1); continue; }

        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.rot);
        ctx.globalAlpha = n.alpha;
        ctx.fillStyle = CREAM;
        ctx.font = `${n.size}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(n.sym, 0, 0);
        ctx.restore();
      }
    }

    /* A large faint clef anchors the bottom */
    function drawClef() {
      ctx.save();
      const sz = Math.min(W * 0.6, 60);
      ctx.globalAlpha = 0.20;
      ctx.fillStyle = GOLD;
      ctx.font = `${sz}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(CLEF, W / 2, H - 8);
      ctx.restore();
    }

    function panelLoop(ts) {
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts; time += dt;

      ctx.clearRect(0, 0, W, H);
      drawStaves();
      drawNotes();
      drawClef();

      if (Math.random() < 0.03 * dt * 60 && notes.length < 22) {
        spawnNote();
      }

      requestAnimationFrame(panelLoop);
    }

    function resize() {
      W = canvas.width  = canvas.offsetWidth  || canvas.parentElement.offsetWidth;
      H = canvas.height = canvas.offsetHeight || window.innerHeight;
      while (notes.length < 10) {
        spawnNote();
        notes[notes.length - 1].y = Math.random() * H;
      }
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(panelLoop);
  }

  initPanel('panel-left');
  initPanel('panel-right');

})();
