/* ============================================================
   editor.js — localStorage-backed site editor
   Reads saved state on page load, applies to DOM.
   Save button writes to localStorage + updates DOM live.
   ============================================================ */

(function () {

  /* ── DEFAULTS ──────────────────────────────────────────────── */
  const DEFAULTS = {
    // Group 1 — Band Identity
    bandName:     'San Diego Concert Band',
    foundedYear:  '1989',
    cityState:    'San Diego, CA',
    tagline:      'Symphonic Band · Marches · Show Tunes',
    contactEmail: 'SDCB@cox.net',
    addressLine1: 'PO Box 711534',
    addressLine2: 'Santee, CA 92071',
    facebookUrl:  '#',
    youtubeUrl:   '#',

    // Group 2 — Hero
    heroLine1:          'The San Diego',
    heroLine2:          'Concert Band',
    heroLabel:          'Performing Throughout San Diego Since 1989',
    heroBtnPrimaryText: 'See Upcoming Concerts',
    heroBtnPrimaryLink: '#concerts',
    heroBtnSecondaryText: 'Join the Band',
    heroBtnSecondaryLink: '#join',

    // Group 3 — Concerts
    concerts: [
      { name: 'Spring Spectacular',          date: 'May 18',  time: '3:00 PM',  venue: 'East County Performing Arts Center', desc: 'An afternoon of symphonic favorites, rousing marches, and beloved Broadway showstoppers.' },
      { name: 'Twilight in the Park',         date: 'Jun 22',  time: '6:15 PM',  venue: 'Balboa Park Organ Pavilion',         desc: 'Our beloved summer tradition under the open sky of Balboa Park.' },
      { name: 'Independence Day Celebration', date: 'Jun 29',  time: '2:00 PM',  venue: 'St. Dunstan\'s Church, San Carlos',  desc: 'Patriotic marches and Americana classics to kick off the Fourth of July weekend.' },
      { name: 'Summer Pops',                  date: 'Aug 3',   time: '6:00 PM',  venue: 'Poway Community Park',               desc: 'A casual evening of crowd favorites — bring a blanket and enjoy the music.' },
      { name: 'Holiday Concert',              date: 'Dec 13',  time: '3:00 PM',  venue: 'Joan B. Kroc Theater',               desc: 'The band\'s beloved annual holiday tradition, featuring seasonal classics and festive fanfares.' },
    ],

    // Group 4 — Genres
    genres: [
      { title: 'Symphonic Band', sub: 'Grand orchestral works for concert band', desc: 'From Holst to Grainger, performed with precision and power.', symbol: '𝄞', tint: 'violet' },
      { title: 'Marches',        sub: 'The pulse of tradition',                  desc: 'From Sousa to King, we carry the march forward with pride.',  symbol: '♩',     tint: 'amber' },
      { title: 'Show Tunes',     sub: 'The Great American Songbook',             desc: 'Broadway\'s finest, reimagined for full concert band.',         symbol: '♫', tint: 'coral' },
    ],

    // Group 5 — About
    aboutParagraph: 'Founded in 1989 as the La Mesa Community Band, the San Diego Concert Band has grown into one of Southern California\'s premier community ensembles — nearly 100 musicians drawn from every corner of life: educators, engineers, doctors, pilots, attorneys, nurses, college students, and active Navy and Marine Corps musicians. We perform throughout San Diego County and have taken our music to international stages. No audition is required — from novice to professional, every musician is welcome. The band is supported entirely by member dues, sponsorships, and individual donations.',
    stat1Number: '35+',  stat1Label: 'Years Performing',
    stat2Number: '~100', stat2Label: 'Musicians',
    stat3Number: '0',    stat3Label: 'Auditions Required',
    pullQuote:    '"Music is the shorthand of emotion."',
    pullQuoteAttr: '— Roy Anthony Jr., Music Director',

    // Group 6 — Conductor
    conductorName:   'ROY ANTHONY JR.',
    conductorTitle:  'Music Director',
    conductorSubhead: 'At the podium since the beginning',
    conductorBio:    'Roy Anthony Jr. has led the San Diego Concert Band for decades, bringing artistic vision and community spirit to every performance. A veteran music educator and conductor, he has directed district and community honor bands, served as conductor of the San Diego Civic Youth Orchestra, and guided the band from 50 members to nearly 100. Under his baton, the band has become one of Southern California\'s premier concert bands.',

    // Group 7 — Join
    joinHeadline:   'Play With Us',
    joinBody:       'No auditions. No barriers. Just a love of music. The San Diego Concert Band welcomes musicians of all backgrounds and skill levels. If you play a band instrument, there\'s a chair waiting for you.',
    rehearsalTime:  'Monday evenings · 7:00 PM',
    rehearsalLoc:   'East County Area · San Diego',
    joinCtaText:    'Get in Touch',
    joinCtaLink:    'mailto:SDCB@cox.net',

    // Group 8 — Support
    support: [
      { title: 'Attend a Concert',      desc: 'Your ticket directly supports the music.',          dyn: 'f'   },
      { title: 'Make a Donation',       desc: 'Every gift keeps the music playing.',                dyn: 'ff'  },
      { title: 'Corporate Sponsorship', desc: 'Partner with San Diego\'s premier concert band.',   dyn: 'fff' },
    ],
  };

  /* ── STATE MANAGEMENT ──────────────────────────────────────── */
  function loadState() {
    try {
      const raw = localStorage.getItem('sdcb_sunset');
      return raw ? JSON.parse(raw) : clone(DEFAULTS);
    } catch { return clone(DEFAULTS); }
  }

  function saveState(s) {
    localStorage.setItem('sdcb_sunset', JSON.stringify(s));
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  /* ── DOM HELPERS ───────────────────────────────────────────── */
  function set(id, val)  { const e = document.getElementById(id); if (e) e.textContent = val; }
  function href(id, val) { const e = document.getElementById(id); if (e) e.setAttribute('href', val); }

  /* ── APPLY TO DOM ──────────────────────────────────────────── */
  window.applyEdits = function (s) {
    if (!s) s = loadState();

    // Group 1
    set('nav-band-name', s.bandName);
    set('footer-band-name', s.bandName);
    set('mailing-address', `${s.bandName} · ${s.addressLine1} · ${s.addressLine2}`);
    href('footer-facebook', s.facebookUrl);
    href('footer-youtube', s.youtubeUrl);
    const emailEl = document.getElementById('footer-email');
    if (emailEl) { emailEl.textContent = s.contactEmail; emailEl.href = `mailto:${s.contactEmail}`; }

    // Group 2
    set('hero-line1', s.heroLine1);
    set('hero-line2', s.heroLine2);
    set('hero-label', s.heroLabel);
    set('hero-btn-primary', s.heroBtnPrimaryText);
    href('hero-btn-primary', s.heroBtnPrimaryLink);
    set('hero-btn-secondary', s.heroBtnSecondaryText);
    href('hero-btn-secondary', s.heroBtnSecondaryLink);
    set('hero-tagline', s.tagline);

    // Group 3
    renderConcerts(s.concerts);

    // Group 4
    renderGenres(s.genres);

    // Group 5
    set('about-paragraph', s.aboutParagraph);
    set('stat-1-number', s.stat1Number); set('stat-1-label', s.stat1Label);
    set('stat-2-number', s.stat2Number); set('stat-2-label', s.stat2Label);
    set('stat-3-number', s.stat3Number); set('stat-3-label', s.stat3Label);
    set('pull-quote', s.pullQuote);
    set('pull-quote-attr', s.pullQuoteAttr);

    // Group 6
    set('conductor-name-heading', s.conductorName);
    set('conductor-title-label', s.conductorTitle);
    set('conductor-subhead', s.conductorSubhead);
    set('conductor-bio', s.conductorBio);

    // Group 7
    set('join-title', s.joinHeadline);
    set('join-body', s.joinBody);
    set('rehearsal-time', s.rehearsalTime);
    set('rehearsal-location', s.rehearsalLoc);
    const joinCta = document.getElementById('join-cta');
    if (joinCta) { joinCta.textContent = s.joinCtaText; joinCta.href = s.joinCtaLink; }

    // Group 8
    renderSupport(s.support);
  };

  /* ── RENDER CONCERTS ────────────────────────────────────────── */
  function renderConcerts(concerts) {
    const grid = document.getElementById('concert-grid');
    if (!grid) return;
    grid.innerHTML = '';

    concerts.forEach((c, i) => {
      // Parse "Jun 22" → day "22", month "JUN"
      const parts = (c.date || '').trim().split(/\s+/);
      const month = (parts[0] || '').toUpperCase();
      const day   = parts[1] || '';

      const el = document.createElement('article');
      el.className = 'concert-card fade-up';
      el.style.setProperty('--stagger-index', i);
      el.innerHTML = `
        <div class="concert-card-inner">
          <div class="date-badge">
            <span class="badge-day">${day}</span>
            <span class="badge-month">${month}</span>
          </div>
          <h3 class="concert-title">${esc(c.name)}</h3>
          <p class="concert-venue">${esc(c.venue)}</p>
          <p class="concert-time">${esc(c.time)}</p>
          <p class="concert-desc">${esc(c.desc)}</p>
          <a href="#" class="concert-link">Learn More &rarr;</a>
        </div>
      `;
      grid.appendChild(el);
      if (window.observeFade) window.observeFade(el);
    });
  }

  /* ── RENDER GENRES ──────────────────────────────────────────── */
  function renderGenres(genres) {
    const wrap = document.getElementById('genre-panels');
    if (!wrap) return;
    wrap.innerHTML = '';

    genres.forEach((g, i) => {
      const reversed = i % 2 === 1;
      const el = document.createElement('div');
      el.className = `genre-panel${reversed ? ' reverse' : ''}`;

      // Icon column content — plain static symbol
      const iconHTML = `<span class="genre-symbol" aria-hidden="true">${esc(g.symbol)}</span>`;

      el.innerHTML = `
        <div class="genre-icon-col">
          ${iconHTML}
        </div>
        <div class="genre-text-col">
          <div class="genre-tint ${esc(g.tint)}">
            <span class="genre-label-tag">What We Play</span>
            <h3 class="genre-title">${esc(g.title)}</h3>
            <p class="genre-sub"><em>${esc(g.sub)}</em></p>
            <p class="genre-desc">${esc(g.desc)}</p>
          </div>
        </div>
      `;
      wrap.appendChild(el);
    });

    // Let scroll.js add slide animations
    if (window.observeGenres) window.observeGenres();
  }

  /* ── RENDER SUPPORT CARDS ───────────────────────────────────── */
  function renderSupport(cards) {
    const wrap = document.getElementById('support-cards');
    if (!wrap) return;
    wrap.innerHTML = '';

    cards.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'support-card';
      el.style.setProperty('--stagger-index', i);
      el.innerHTML = `
        <div class="support-card-top">
          <span class="support-dyn">${esc(c.dyn)}</span>
          <h3 class="support-title">${esc(c.title)}</h3>
        </div>
        <p class="support-desc">${esc(c.desc)}</p>
      `;
      wrap.appendChild(el);
    });

    if (window.observeSupport) window.observeSupport();
  }

  /* ── BUILD EDITOR FORM ──────────────────────────────────────── */
  function buildForm(s) {
    const form = document.getElementById('editor-form');
    if (!form) return;
    form.innerHTML = '';

    // Group 1
    form.appendChild(group('GROUP 1 — Band Identity', [
      field('bandName',     'Band Name',           'text',     s.bandName),
      field('foundedYear',  'Founded Year',         'text',     s.foundedYear),
      field('cityState',    'City / State',         'text',     s.cityState),
      field('tagline',      'Tagline',              'text',     s.tagline),
      field('contactEmail', 'Contact Email',        'text',     s.contactEmail),
      field('addressLine1', 'Mailing Address Line 1','text',    s.addressLine1),
      field('addressLine2', 'Mailing Address Line 2','text',    s.addressLine2),
      field('facebookUrl',  'Facebook URL',         'text',     s.facebookUrl),
      field('youtubeUrl',   'YouTube URL',          'text',     s.youtubeUrl),
    ]));

    // Group 2
    form.appendChild(group('GROUP 2 — Hero Section', [
      field('heroLine1',          'Headline Line 1',       'text', s.heroLine1),
      field('heroLine2',          'Headline Line 2',       'text', s.heroLine2),
      field('heroLabel',          'Top Label Text',        'text', s.heroLabel),
      field('heroBtnPrimaryText', 'Primary Button Text',   'text', s.heroBtnPrimaryText),
      field('heroBtnPrimaryLink', 'Primary Button Link',   'text', s.heroBtnPrimaryLink),
      field('heroBtnSecondaryText','Secondary Button Text','text', s.heroBtnSecondaryText),
      field('heroBtnSecondaryLink','Secondary Button Link','text', s.heroBtnSecondaryLink),
    ]));

    // Group 3 — Concerts (dynamic rows)
    form.appendChild(concertGroup(s.concerts));

    // Group 4 — Genres
    form.appendChild(genreGroup(s.genres));

    // Group 5 — About
    form.appendChild(group('GROUP 5 — About the Band', [
      field('aboutParagraph', 'About Paragraph',       'textarea', s.aboutParagraph),
      field('stat1Number',    'Stat 1 Number',         'text',     s.stat1Number),
      field('stat1Label',     'Stat 1 Label',          'text',     s.stat1Label),
      field('stat2Number',    'Stat 2 Number',         'text',     s.stat2Number),
      field('stat2Label',     'Stat 2 Label',          'text',     s.stat2Label),
      field('stat3Number',    'Stat 3 Number',         'text',     s.stat3Number),
      field('stat3Label',     'Stat 3 Label',          'text',     s.stat3Label),
      field('pullQuote',      'Pull Quote',            'text',     s.pullQuote),
      field('pullQuoteAttr',  'Pull Quote Attribution','text',     s.pullQuoteAttr),
    ]));

    // Group 6 — Conductor
    form.appendChild(group('GROUP 6 — Conductor', [
      field('conductorName',    'Conductor Name',    'text',     s.conductorName),
      field('conductorTitle',   'Conductor Title',   'text',     s.conductorTitle),
      field('conductorSubhead', 'Conductor Subhead', 'text',     s.conductorSubhead),
      field('conductorBio',     'Conductor Bio',     'textarea', s.conductorBio),
    ]));

    // Group 7 — Join
    form.appendChild(group('GROUP 7 — Join the Band', [
      field('joinHeadline',  'Section Headline',      'text',     s.joinHeadline),
      field('joinBody',      'Invite Paragraph',      'textarea', s.joinBody),
      field('rehearsalTime', 'Rehearsal Day & Time',  'text',     s.rehearsalTime),
      field('rehearsalLoc',  'Rehearsal Location',    'text',     s.rehearsalLoc),
      field('joinCtaText',   'CTA Button Text',       'text',     s.joinCtaText),
      field('joinCtaLink',   'CTA Button Link',       'text',     s.joinCtaLink),
    ]));

    // Group 8 — Support
    form.appendChild(supportGroup(s.support));
  }

  /* ── FIELD / GROUP BUILDERS ─────────────────────────────────── */
  function group(label, fields) {
    const g = document.createElement('div');
    g.className = 'editor-group';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'editor-group-toggle';
    btn.innerHTML = `${label} <span class="editor-chevron">▼</span>`;
    btn.addEventListener('click', () => g.classList.toggle('open'));
    const body = document.createElement('div');
    body.className = 'editor-group-body';
    fields.forEach(f => body.appendChild(f));
    g.appendChild(btn);
    g.appendChild(body);
    return g;
  }

  function field(key, label, type, value) {
    const wrap = document.createElement('div');
    wrap.className = 'editor-field';
    const lbl = document.createElement('label');
    lbl.htmlFor = 'ed_' + key;
    lbl.textContent = label;
    const inp = type === 'textarea'
      ? document.createElement('textarea')
      : document.createElement('input');
    inp.id = 'ed_' + key;
    inp.dataset.key = key;
    if (type !== 'textarea') inp.type = 'text';
    inp.value = value || '';
    if (type === 'textarea') {
      inp.rows = 3;
      grow(inp);
      inp.addEventListener('input', () => grow(inp));
    }
    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    return wrap;
  }

  function grow(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }

  function concertGroup(concerts) {
    const g = document.createElement('div');
    g.className = 'editor-group';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'editor-group-toggle';
    btn.innerHTML = 'GROUP 3 — Concerts <span class="editor-chevron">▼</span>';
    btn.addEventListener('click', () => g.classList.toggle('open'));
    const body = document.createElement('div');
    body.className = 'editor-group-body';
    const note = document.createElement('p');
    note.style.cssText = 'font-size:0.82rem;color:rgba(253,246,236,0.55);margin-bottom:1rem;font-style:italic;font-family:Lato,sans-serif;';
    note.textContent = 'Each concert has 5 fields: Name, Date, Time, Venue, and Description. Click "+ Add Concert" to add a new performance.';
    body.appendChild(note);
    const rowsWrap = document.createElement('div');
    rowsWrap.id = 'concert-rows';
    concerts.forEach(c => rowsWrap.appendChild(concertRow(c)));
    body.appendChild(rowsWrap);
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-add';
    addBtn.textContent = '+ Add Concert';
    addBtn.addEventListener('click', () => rowsWrap.appendChild(concertRow({})));
    body.appendChild(addBtn);
    g.appendChild(btn);
    g.appendChild(body);
    return g;
  }

  function concertRow(c) {
    const row = document.createElement('div');
    row.className = 'concert-row';
    row.innerHTML = `
      <div class="editor-field"><label>Concert Name</label><input type="text" class="c-name" value="${esc(c.name||'')}"/></div>
      <div class="editor-field"><label>Date (e.g. May 18)</label><input type="text" class="c-date" value="${esc(c.date||'')}"/></div>
      <div class="editor-field"><label>Time</label><input type="text" class="c-time" value="${esc(c.time||'')}"/></div>
      <div class="editor-field"><label>Venue</label><input type="text" class="c-venue" value="${esc(c.venue||'')}"/></div>
      <div class="editor-field concert-row-full"><label>Description</label><textarea class="c-desc" rows="2">${esc(c.desc||'')}</textarea></div>
    `;
    const rm = document.createElement('button');
    rm.type = 'button'; rm.className = 'btn-remove'; rm.textContent = '✕ Remove';
    rm.addEventListener('click', () => row.remove());
    row.appendChild(rm);
    return row;
  }

  function genreGroup(genres) {
    const g = document.createElement('div');
    g.className = 'editor-group';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'editor-group-toggle';
    btn.innerHTML = 'GROUP 4 — Music Genre Cards <span class="editor-chevron">▼</span>';
    btn.addEventListener('click', () => g.classList.toggle('open'));
    const body = document.createElement('div');
    body.className = 'editor-group-body';
    genres.forEach((genre, i) => {
      const sub = document.createElement('div');
      sub.className = 'genre-subgroup';
      sub.innerHTML = `<h4>${genre.title}</h4>`;
      sub.appendChild(field(`genre_${i}_title`,  'Title',      'text',     genre.title));
      sub.appendChild(field(`genre_${i}_sub`,    'Subheading', 'text',     genre.sub));
      sub.appendChild(field(`genre_${i}_desc`,   'Description','textarea', genre.desc));
      sub.appendChild(field(`genre_${i}_symbol`, 'Symbol/Icon (or "march" for beat bars)', 'text', genre.symbol));
      body.appendChild(sub);
    });
    g.appendChild(btn);
    g.appendChild(body);
    return g;
  }

  function supportGroup(cards) {
    const g = document.createElement('div');
    g.className = 'editor-group';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'editor-group-toggle';
    btn.innerHTML = 'GROUP 8 — Support the Band <span class="editor-chevron">▼</span>';
    btn.addEventListener('click', () => g.classList.toggle('open'));
    const body = document.createElement('div');
    body.className = 'editor-group-body';
    cards.forEach((c, i) => {
      const sub = document.createElement('div');
      sub.className = 'genre-subgroup';
      sub.innerHTML = `<h4>${c.title}</h4>`;
      sub.appendChild(field(`support_${i}_title`, 'Card Title',       'text',     c.title));
      sub.appendChild(field(`support_${i}_desc`,  'Card Description', 'textarea', c.desc));
      sub.appendChild(field(`support_${i}_dyn`,   'Dynamic Label',    'text',     c.dyn));
      body.appendChild(sub);
    });
    g.appendChild(btn);
    g.appendChild(body);
    return g;
  }

  /* ── READ FORM STATE ────────────────────────────────────────── */
  function readForm(current) {
    const s = clone(current);

    // Simple key→value fields
    document.querySelectorAll('[data-key]').forEach(el => {
      const k = el.dataset.key;
      if (k in s) s[k] = el.value;
    });

    // Concerts
    s.concerts = [];
    document.querySelectorAll('#concert-rows .concert-row').forEach(row => {
      s.concerts.push({
        name:  row.querySelector('.c-name').value,
        date:  row.querySelector('.c-date').value,
        time:  row.querySelector('.c-time').value,
        venue: row.querySelector('.c-venue').value,
        desc:  row.querySelector('.c-desc').value,
      });
    });

    // Genres
    s.genres = s.genres.map((g, i) => ({
      title:  val(`genre_${i}_title`,  g.title),
      sub:    val(`genre_${i}_sub`,    g.sub),
      desc:   val(`genre_${i}_desc`,   g.desc),
      symbol: val(`genre_${i}_symbol`, g.symbol),
      tint:   g.tint,
    }));

    // Support
    s.support = s.support.map((c, i) => ({
      title: val(`support_${i}_title`, c.title),
      desc:  val(`support_${i}_desc`,  c.desc),
      dyn:   val(`support_${i}_dyn`,   c.dyn),
    }));

    return s;
  }

  function val(id, fallback) {
    const el = document.getElementById('ed_' + id);
    return el ? el.value : fallback;
  }

  /* ── ESC HELPER ─────────────────────────────────────────────── */
  function esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/"/g,'&quot;')
      .replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ── TOAST ──────────────────────────────────────────────────── */
  function showToast() {
    const t = document.getElementById('toast');
    if (!t) return;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 3500);
  }

  /* ── INIT ────────────────────────────────────────────────────── */
  let state = loadState();

  buildForm(state);
  window.applyEdits(state);

  document.getElementById('btn-save').addEventListener('click', () => {
    state = readForm(state);
    saveState(state);
    window.applyEdits(state);
    showToast();
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('Reset all content to defaults? This cannot be undone.')) return;
    localStorage.removeItem('sdcb_sunset');
    state = clone(DEFAULTS);
    buildForm(state);
    window.applyEdits(state);
    showToast();
  });

})();
