/* ============================================================================
   HAPPY BIRTHDAY PRITI — SCRIPT
   ----------------------------------------------------------------------------
   TABLE OF CONTENTS (search for these headers):
     0.  CONFIG                 <-- EDIT dates / names / counts here
     1.  UTILITIES
     2.  LOADER + ENTER SCREEN
     3.  MUSIC PLAYER
     4.  CURSOR GLOW + TRAIL
     5.  SCROLL PROGRESS + FLOATING NAV
     6.  SCROLL REVEAL (IntersectionObserver)
     7.  LETTER-BY-LETTER TITLES
     8.  CONFETTI ENGINE (reusable, global canvas)
     9.  FIREWORKS ENGINE (reusable, per-section canvas)
     10. SECTION 1 — HERO (balloons + particles)
     11. SECTION 2 — CAKE (candles + smoke)
     12. SECTION 4 — GALLERY (15 unique reveal animations + lazy load)
     13. SECTION 5 — MEMORY BOOK (page turn)
     14. SECTION 8 — FLOATING CAROUSEL
     15. SECTION 9 — STARS (twinkle, shooting stars, parallax)
     16. SECTION 10 — LANTERN
     17. SECTION 11 — COUNTDOWN
     18. SECTION 12 — STATS COUNTERS
     19. SECTION 13 — MEMORY TREE
     20. SECTION 14 — FINAL EXPLOSION
     21. SECTION 15 — ENDING FIREWORKS + SURPRISE BUTTON
     22. KONAMI CODE EASTER EGG
     23. INIT
   ============================================================================ */
(function(){
  'use strict';

  /* ==========================================================================
     0. CONFIG — personalize your site here
     ========================================================================== */
  const CONFIG = {
    friendName: 'Priti',

    // EDIT: her real birth date "YYYY-MM-DD" — powers the Countdown section
    // (Section 11 shows the exact years/months/days/hours/minutes/seconds since this date)
    birthDate: '2001-10-09',

    // EDIT: roughly when your friendship began — used only as a fallback label, optional
    friendshipStartDate: '2022-12-03',

    // Number of photos expected in /assets/photos/ (photo1.jpg ... photoN.jpg)
    photoCount: 15,

    defaultVolume: 0.5,
  };

  const PHOTOS = Array.from({ length: CONFIG.photoCount }, (_, i) => `assets/photos/photo${i + 1}.jpg`);

  // EDIT: short captions shown on hover in the gallery — keep them in order of the photos above
  const GALLERY_CAPTIONS = [
    'Where the story began', 'A completely ordinary, unforgettable day', 'Laughing about something silly',
    'One of the good days', 'Somewhere in between plans', 'Talking about everything and nothing',
    'A memory worth keeping', 'The kind of day you replay later', 'Just another great afternoon',
    'A little chaos, a lot of fun', 'Proof that some days are just better', 'Still smiling about this one',
    'A quiet kind of happy', 'Another one for the album', 'To many more like this'
  ];

  /* ==========================================================================
     1. UTILITIES
     ========================================================================== */
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (min, max) => Math.random() * (max - min) + min;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUCE_MOTION) document.body.classList.add('reduced-motion');
  const IS_TOUCH = matchMedia('(hover:none)').matches;

  function sizeCanvas(canvas){
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * DPR));
    canvas.height = Math.max(1, Math.floor(rect.height * DPR));
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    return { w: rect.width, h: rect.height };
  }

  // runs onEnter/onExit when el crosses the viewport — used to pause offscreen canvases
  function onVisibility(el, onEnter, onExit){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => e.isIntersecting ? onEnter() : (onExit && onExit()));
    }, { threshold: 0.01 });
    io.observe(el);
    return io;
  }

  /* ==========================================================================
     2. LOADER + ENTER SCREEN
     ========================================================================== */
  function initLoader(){
    const loader = $('#loader');
    const barFill = $('#loader-bar-fill');
    const sparkWrap = $('#loader-sparks');
    const enterScreen = $('#enter-screen');
    const enterBtn = $('#enter-btn');

    // decorative sparks around the gift
    for (let i = 0; i < 14; i++){
      const s = document.createElement('span');
      s.className = 'loader-spark';
      s.style.left = rand(10, 90) + '%';
      s.style.top = rand(30, 90) + '%';
      s.style.animationDelay = rand(0, 2.2) + 's';
      s.style.background = i % 2 ? 'var(--rose)' : 'var(--gold)';
      sparkWrap.appendChild(s);
    }

    // simulate progress while real assets (fonts/first photos) load in background
    let progress = 0;
    const timer = setInterval(() => {
      progress += rand(4, 12);
      if (progress >= 100){
        progress = 100;
        clearInterval(timer);
        finishLoading();
      }
      barFill.style.width = progress + '%';
    }, 180);

    function finishLoading(){
      setTimeout(() => {
        loader.classList.add('hidden');
        enterScreen.classList.add('visible');
      }, 400);
    }

    function begin(){
      enterScreen.classList.remove('visible');
      document.body.classList.remove('no-scroll');
      startMusicOnGesture();
      revealHeroSequence();
    }

    enterBtn.addEventListener('click', begin);
    loader.addEventListener('click', () => { if (progress >= 100) begin(); });
    document.body.classList.add('no-scroll');
  }

  function revealHeroSequence(){
    // small nudge so the hero's timed CSS animations feel intentional post-entry
    document.documentElement.classList.add('entered');
  }

  /* ==========================================================================
     3. MUSIC PLAYER
     ========================================================================== */
  let musicStarted = false;
  function initMusicPlayer(){
    const player = $('#music-player');
    const audio = $('#bg-music');
    const toggle = $('#music-toggle');
    const volume = $('#music-volume');
    const muteBtn = $('#music-mute');

    audio.volume = CONFIG.defaultVolume;
    volume.value = CONFIG.defaultVolume;
    let lastVolume = CONFIG.defaultVolume;

    function play(){
      audio.play().then(() => {
        player.classList.add('playing');
      }).catch(() => { /* file missing or blocked — fail silently, controls remain usable */ });
    }
    function pause(){ audio.pause(); player.classList.remove('playing'); }

    toggle.addEventListener('click', () => {
      if (audio.paused) { play(); musicStarted = true; } else { pause(); }
    });
    volume.addEventListener('input', () => {
      audio.volume = parseFloat(volume.value);
      audio.muted = audio.volume === 0;
    });
    muteBtn.addEventListener('click', () => {
      if (audio.muted || audio.volume === 0){
        audio.muted = false;
        audio.volume = lastVolume || CONFIG.defaultVolume;
        volume.value = audio.volume;
      } else {
        lastVolume = audio.volume;
        audio.muted = true;
      }
    });

    window.__playBirthdayMusic = play;
  }
  function startMusicOnGesture(){
    if (musicStarted) return;
    musicStarted = true;
    window.__playBirthdayMusic && window.__playBirthdayMusic();
  }

  /* ==========================================================================
     4. CURSOR GLOW + TRAIL
     ========================================================================== */
  function initCursorFX(){
    if (IS_TOUCH || REDUCE_MOTION) return;
    const glow = $('#cursor-glow');
    const canvas = $('#trail-canvas');
    const ctx = canvas.getContext('2d');
    let w, h;
    function resize(){ w = canvas.width = innerWidth * DPR; h = canvas.height = innerHeight * DPR; canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px'; }
    resize(); addEventListener('resize', resize);

    let mx = innerWidth / 2, my = innerHeight / 2;
    const particles = [];
    addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      glow.style.transform = `translate(${mx}px, ${my}px)`;
      if (Math.random() < 0.5){
        particles.push({ x: mx, y: my, r: rand(1.5, 3), life: 0, max: 40, hue: Math.random() < 0.5 ? '255,143,179' : '178,141,255' });
      }
    }, { passive: true });

    function loop(){
      ctx.clearRect(0, 0, w, h);
      for (let i = particles.length - 1; i >= 0; i--){
        const p = particles[i];
        p.life++;
        const t = p.life / p.max;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.hue},${1 - t})`;
        ctx.arc(p.x * DPR, p.y * DPR, p.r * DPR * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fill();
        if (t >= 1) particles.splice(i, 1);
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ==========================================================================
     5. SCROLL PROGRESS + FLOATING NAV
     ========================================================================== */
  function initScrollChrome(){
    const bar = $('#scroll-progress');
    const navButtons = $$('#floating-nav button');
    const sections = navButtons.map(b => $(b.dataset.target)).filter(Boolean);

    let ticking = false;
    function update(){
      const doc = document.documentElement;
      const scrolled = doc.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      bar.style.width = (height > 0 ? (scrolled / height) * 100 : 0) + '%';

      let activeIdx = 0;
      const mid = scrolled + innerHeight * 0.4;
      sections.forEach((s, i) => { if (s.offsetTop <= mid) activeIdx = i; });
      navButtons.forEach((b, i) => b.classList.toggle('active', i === activeIdx));

      updateTreeLeaves();
      ticking = false;
    }
    addEventListener('scroll', () => { if (!ticking){ requestAnimationFrame(update); ticking = true; } }, { passive: true });
    addEventListener('resize', update);
    update();

    navButtons.forEach(b => b.addEventListener('click', () => {
      const target = $(b.dataset.target);
      if (target) target.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'start' });
    }));
  }

  /* ==========================================================================
     6. SCROLL REVEAL
     ========================================================================== */
  function initScrollReveal(){
    const targets = $$('.reveal, .reveal-scale, .reveal-left, .reveal-right');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    targets.forEach((el, i) => {
      el.style.transitionDelay = REDUCE_MOTION ? '0s' : Math.min(i % 6, 5) * 0.08 + 's';
      io.observe(el);
    });
  }

  /* ==========================================================================
     7. LETTER-BY-LETTER TITLES
     ========================================================================== */
  function initLetterTitles(){
    $$('[data-text]').forEach(el => {
      const text = el.dataset.text;
      el.setAttribute('aria-label', text);
      el.innerHTML = text.split('').map((ch, i) =>
        `<span class="ch" style="animation-delay:${(i * 0.045).toFixed(2)}s">${ch === ' ' ? '&nbsp;' : ch}</span>`
      ).join('');
    });
  }

  /* ==========================================================================
     8. CONFETTI ENGINE — reusable global full-screen burst
     ========================================================================== */
  const Confetti = (function(){
    let canvas, ctx, particles = [], raf = null;
    function ensureCanvas(){
      if (canvas) return;
      canvas = document.createElement('canvas');
      canvas.id = 'global-confetti-canvas';
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
      const resize = () => { canvas.width = innerWidth * DPR; canvas.height = innerHeight * DPR; canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px'; };
      resize(); addEventListener('resize', resize);
    }
    function burst(x, y, count){
      if (REDUCE_MOTION) return;
      ensureCanvas();
      const colors = ['#ff8fb3', '#b28dff', '#ffd27a', '#8ecbff', '#fff8f0'];
      for (let i = 0; i < count; i++){
        particles.push({
          x, y,
          vx: rand(-6, 6), vy: rand(-13, -5),
          w: rand(5, 11), h: rand(4, 14),
          rot: rand(0, 360), vr: rand(-9, 9),
          color: colors[i % colors.length],
          life: 0, max: rand(70, 130),
        });
      }
      if (!raf) loop();
    }
    function fireworksBurst(x, y, count){ burst(x, y, count || 60); }
    function loop(){
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--){
        const p = particles[i];
        p.vy += 0.28; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
        const t = p.life / p.max;
        ctx.save();
        ctx.translate(p.x * DPR, p.y * DPR);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.globalAlpha = Math.max(0, 1 - t);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        if (t >= 1) particles.splice(i, 1);
      }
      raf = particles.length ? requestAnimationFrame(loop) : null;
    }
    return { burst, fireworksBurst };
  })();

  /* ==========================================================================
     9. FIREWORKS ENGINE — reusable per-section canvas (rockets + bursts)
     ========================================================================== */
  function createFireworks(canvas){
    const ctx = canvas.getContext('2d');
    let w, h, rockets = [], sparks = [], raf = null, active = false, spawnTimer = null;
    const colors = ['#ff8fb3', '#ffd27a', '#b28dff', '#8ecbff', '#fff8f0'];

    function resize(){ const s = sizeCanvas(canvas); w = s.w; h = s.h; }
    resize(); addEventListener('resize', resize);

    function spawnRocket(){
      rockets.push({
        x: rand(w * 0.15, w * 0.85), y: h,
        targetY: rand(h * 0.18, h * 0.5),
        vy: rand(-8.5, -6.5),
        color: colors[Math.floor(rand(0, colors.length))],
      });
    }
    function explode(x, y, color){
      const count = REDUCE_MOTION ? 0 : 46;
      for (let i = 0; i < count; i++){
        const angle = (Math.PI * 2 * i) / count;
        const speed = rand(1.5, 4.5);
        sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0, max: rand(40, 70), color });
      }
    }
    function tick(){
      ctx.clearRect(0, 0, w * DPR, h * DPR);
      rockets.forEach((r, i) => {
        r.y += r.vy; r.vy += 0.05;
        ctx.beginPath();
        ctx.fillStyle = r.color;
        ctx.arc(r.x * DPR, r.y * DPR, 2.4 * DPR, 0, Math.PI * 2);
        ctx.fill();
        if (r.y <= r.targetY){ explode(r.x, r.y, r.color); rockets.splice(i, 1); }
      });
      sparks.forEach((s, i) => {
        s.life++; s.x += s.vx; s.vy += 0.045; s.y += s.vy;
        const t = s.life / s.max;
        ctx.beginPath();
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, 1 - t);
        ctx.arc(s.x * DPR, s.y * DPR, 2 * DPR, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (t >= 1) sparks.splice(i, 1);
      });
      if (active) raf = requestAnimationFrame(tick);
    }
    function start(){
      if (active) return;
      active = true;
      tick();
      spawnTimer = setInterval(() => { if (!REDUCE_MOTION) spawnRocket(); }, 900);
      spawnRocket();
    }
    function stop(){
      active = false;
      clearInterval(spawnTimer);
      if (raf) cancelAnimationFrame(raf);
    }
    function burstOnce(n){ for (let i = 0; i < (n || 3); i++) setTimeout(spawnRocket, i * 260); if (!active){ active = true; tick(); setTimeout(() => { active = false; }, 2600); } }
    return { start, stop, burstOnce };
  }

  /* ==========================================================================
     10. SECTION 1 — HERO
     ========================================================================== */
  function initHero(){
    // floating balloons
    const field = $('#balloon-field');
    const hues = ['linear-gradient(160deg,#ff8fb3,#ff6f9c)', 'linear-gradient(160deg,#b28dff,#8a5cff)', 'linear-gradient(160deg,#ffd27a,#ff9f6b)', 'linear-gradient(160deg,#8ecbff,#5aa9ff)'];
    const count = REDUCE_MOTION ? 0 : (innerWidth < 640 ? 5 : 9);
    for (let i = 0; i < count; i++){
      const b = document.createElement('div');
      b.className = 'balloon';
      b.style.left = rand(4, 92) + '%';
      b.style.background = hues[i % hues.length];
      b.style.animationDuration = rand(14, 24) + 's';
      b.style.animationDelay = rand(0, 12) + 's' ;
      field.appendChild(b);
    }

    // hero ambient particles (fireflies / sparkles)
    const canvas = $('#hero-particles');
    if (!REDUCE_MOTION){
      const ctx = canvas.getContext('2d');
      let w, h, parts = [];
      function resize(){ const s = sizeCanvas(canvas); w = s.w; h = s.h; parts = Array.from({ length: 46 }, makeParticle); }
      function makeParticle(){ return { x: rand(0, w), y: rand(0, h), r: rand(0.6, 2.2), s: rand(0.2, 0.7), a: rand(0, 1), da: rand(0.006, 0.02) }; }
      resize(); addEventListener('resize', resize);
      let active = false;
      function tick(){
        ctx.clearRect(0, 0, w * DPR, h * DPR);
        parts.forEach(p => {
          p.a += p.da; if (p.a > 1 || p.a < 0) p.da *= -1;
          p.y -= p.s; if (p.y < -5) p.y = h + 5;
          ctx.beginPath();
          ctx.fillStyle = `rgba(255,230,190,${clamp(p.a, 0, 1)})`;
          ctx.arc(p.x * DPR, p.y * DPR, p.r * DPR, 0, Math.PI * 2);
          ctx.fill();
        });
        if (active) requestAnimationFrame(tick);
      }
      onVisibility(canvas.closest('section'), () => { active = true; tick(); }, () => { active = false; });
    }

    $('#hero-cta').addEventListener('click', () => {
      const rect = $('#hero-cta').getBoundingClientRect();
      Confetti.burst(rect.left + rect.width / 2, rect.top, 90);
      $('#cake-section').scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
    });
  }

  /* ==========================================================================
     11. SECTION 2 — CAKE
     ========================================================================== */
  function initCake(){
    const section = $('#cake-section');
    const candles = $$('.candle', section);
    const smokeContainer = $('#smoke-container');
    const hint = $('#cake-hint');
    const blowBtn = $('#cake-blow-btn');
    let blownCount = 0;

    function smokeAt(x, y){
      if (REDUCE_MOTION) return;
      for (let i = 0; i < 6; i++){
        const s = document.createElement('span');
        s.className = 'cake-smoke';
        s.style.left = x + 'px'; s.style.top = y + 'px';
        smokeContainer.appendChild(s);
        const dx = rand(-20, 20), dy = -rand(40, 90);
        const anim = s.animate([
          { transform: 'translate(0,0) scale(1)', opacity: 0.6 },
          { transform: `translate(${dx}px, ${dy}px) scale(2.6)`, opacity: 0 }
        ], { duration: 1400 + i * 120, easing: 'ease-out' });
        anim.onfinish = () => s.remove();
      }
    }

    function blowCandle(candleEl){
      const flame = $('.candle-flame', candleEl);
      if (!flame || flame.classList.contains('out')) return;
      const rect = flame.getBoundingClientRect();
      const stageRect = section.querySelector('.cake-stage').getBoundingClientRect();
      flame.classList.add('out');
      smokeAt(rect.left - stageRect.left + rect.width / 2, rect.top - stageRect.top);
      blownCount++;
      if (blownCount >= candles.length){
        section.classList.add('blown');
        hint.textContent = 'Wish made. Here\'s to a wonderful year ahead 🎉';
        const btnRect = blowBtn.getBoundingClientRect();
        Confetti.burst(btnRect.left + btnRect.width / 2, btnRect.top, 140);
      }
    }

    candles.forEach(c => c.addEventListener('click', () => blowCandle(c)));
    blowBtn.addEventListener('click', () => candles.forEach((c, i) => setTimeout(() => blowCandle(c), i * 260)));
  }

  /* ==========================================================================
     12. SECTION 4 — GALLERY
     ========================================================================== */
  const ANIM_CLASSES = ['anim-fade','anim-zoom','anim-rotate','anim-polaroid','anim-float','anim-flip','anim-slide','anim-stack','anim-3d','anim-glass','anim-wall','anim-album','anim-swing'];

  function initGallery(){
    const grid = $('#gallery-grid');
    const frag = document.createDocumentFragment();

    PHOTOS.forEach((src, i) => {
      const card = document.createElement('div');
      card.className = `photo-card ${ANIM_CLASSES[i % ANIM_CLASSES.length]}`;
      const img = document.createElement('img');
      img.alt = `${CONFIG.friendName} — ${GALLERY_CAPTIONS[i] || 'a favourite memory'}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.dataset.src = src;
      img.addEventListener('error', () => {
        card.innerHTML = `<div class="photo-placeholder">Photo ${i + 1}<br>coming soon 🎂</div>`;
      }, { once: true });
      const cap = document.createElement('div');
      cap.className = 'ph-caption';
      cap.textContent = GALLERY_CAPTIONS[i] || `Memory ${i + 1}`;
      card.appendChild(img); card.appendChild(cap);
      frag.appendChild(card);
    });
    grid.appendChild(frag);

    // lazy-load images and reveal animation together via IntersectionObserver
    const cards = $$('.photo-card', grid);
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        const img = $('img', card);
        if (img && img.dataset.src){ img.src = img.dataset.src; delete img.dataset.src; }
        card.classList.add('in-view');
        io.unobserve(card);
      });
    }, { threshold: 0.12, rootMargin: '80px 0px' });
    cards.forEach(c => io.observe(c));

    // preload the first few photos so the top of the gallery feels instant
    PHOTOS.slice(0, 3).forEach(src => { const im = new Image(); im.src = src; });
  }

  /* ==========================================================================
     13. SECTION 5 — MEMORY BOOK
     ========================================================================== */
  function initBook(){
    const pages = $$('.book-page');
    const prev = $('#book-prev');
    const next = $('#book-next');
    let current = 0; // number of pages turned

    function render(){
      pages.forEach((p, i) => {
        p.classList.toggle('turned', i < current);
        p.style.zIndex = i < current ? i + 1 : pages.length - i;
      });
      prev.disabled = current === 0;
      next.disabled = current >= pages.length;
    }
    next.addEventListener('click', () => { if (current < pages.length){ current++; render(); } });
    prev.addEventListener('click', () => { if (current > 0){ current--; render(); } });
    pages.forEach(p => p.addEventListener('click', () => { if (!p.classList.contains('turned') && current === pages.indexOf(p)){ current++; render(); } }));
    render();
  }

  /* ==========================================================================
     14. SECTION 8 — FLOATING CAROUSEL
     ========================================================================== */
  function initCarousel(){
    const track = $('#carousel-track');
    const set = [...PHOTOS, ...PHOTOS]; // duplicated for seamless infinite loop
    set.forEach((src, i) => {
      const item = document.createElement('div');
      item.className = 'carousel-item';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = `${CONFIG.friendName} memory`;
      img.src = src;
      img.addEventListener('error', () => { item.innerHTML = '<div class="photo-placeholder">✨</div>'; }, { once: true });
      item.appendChild(img);
      track.appendChild(item);
    });
  }

  /* ==========================================================================
     15. SECTION 9 — STARS
     ========================================================================== */
  function initStars(){
    const canvas = $('#stars-canvas');
    const section = $('#stars-section');
    const ctx = canvas.getContext('2d');
    let w, h, stars = [], shooting = [], active = false, mouse = { x: -999, y: -999 };

    function resize(){
      const s = sizeCanvas(canvas); w = s.w; h = s.h;
      const density = innerWidth < 640 ? 110 : 190;
      stars = Array.from({ length: density }, () => ({
        x: rand(0, w), y: rand(0, h), r: rand(0.5, 1.8), tw: rand(0, Math.PI * 2), speed: rand(0.01, 0.03),
      }));
    }
    resize(); addEventListener('resize', resize);

    section.addEventListener('mousemove', (e) => { const r = section.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    section.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

    function maybeSpawnShootingStar(){
      if (REDUCE_MOTION) return;
      if (Math.random() < 0.008){
        shooting.push({ x: rand(0, w * 0.6), y: rand(0, h * 0.3), vx: rand(6, 10), vy: rand(3, 5), life: 0, max: 40 });
      }
    }
    function tick(){
      ctx.clearRect(0, 0, w * DPR, h * DPR);
      stars.forEach(s => {
        s.tw += s.speed;
        const twinkle = 0.5 + Math.sin(s.tw) * 0.5;
        let px = s.x, py = s.y;
        const dx = mouse.x - s.x, dy = mouse.y - s.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140){ px -= dx * 0.04; py -= dy * 0.04; }
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${0.35 + twinkle * 0.65})`;
        ctx.arc(px * DPR, py * DPR, s.r * DPR, 0, Math.PI * 2);
        ctx.fill();
        if (dist < 120){
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255,210,122,${(1 - dist / 120) * 0.35})`;
          ctx.lineWidth = 1;
          ctx.moveTo(mouse.x * DPR, mouse.y * DPR);
          ctx.lineTo(px * DPR, py * DPR);
          ctx.stroke();
        }
      });
      maybeSpawnShootingStar();
      shooting.forEach((s, i) => {
        s.x += s.vx; s.y += s.vy; s.life++;
        ctx.beginPath();
        const grad = ctx.createLinearGradient(s.x * DPR, s.y * DPR, (s.x - s.vx * 6) * DPR, (s.y - s.vy * 6) * DPR);
        grad.addColorStop(0, 'rgba(255,255,255,.95)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad; ctx.lineWidth = 2;
        ctx.moveTo(s.x * DPR, s.y * DPR);
        ctx.lineTo((s.x - s.vx * 6) * DPR, (s.y - s.vy * 6) * DPR);
        ctx.stroke();
        if (s.life > s.max) shooting.splice(i, 1);
      });
      if (active) requestAnimationFrame(tick);
    }
    onVisibility(section, () => { active = true; tick(); }, () => { active = false; });
  }

  /* ==========================================================================
     16. SECTION 10 — LANTERN
     ========================================================================== */
  const WISH_MESSAGES = [
    'May every wish you make quietly come true.',
    'May this year bring you calm, clarity, and plenty of good news.',
    'May you keep finding reasons to laugh this hard.',
    'May the good moments outnumber the hard ones by far.',
    'May you be as proud of yourself as everyone around you already is.',
  ];
  function initLantern(){
    const lantern = $('#lantern');
    const wishText = $('#lantern-wish');
    let launching = false;
    let msgIndex = 0;

    function release(){
      if (launching) return;
      launching = true;
      lantern.classList.add('launched');
      wishText.textContent = WISH_MESSAGES[msgIndex % WISH_MESSAGES.length];
      msgIndex++;
      requestAnimationFrame(() => wishText.classList.add('show'));
      const rect = lantern.getBoundingClientRect();
      Confetti.burst(rect.left, rect.top, 30);
      setTimeout(() => {
        lantern.classList.remove('launched');
        launching = false;
      }, REDUCE_MOTION ? 200 : 5000);
    }
    lantern.addEventListener('click', release);
    lantern.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); release(); } });
  }

  /* ==========================================================================
     17. SECTION 11 — COUNTDOWN (age since birth date)
     ========================================================================== */
  function initCountdown(){
    const birth = new Date(CONFIG.birthDate);
    if (isNaN(birth.getTime())) return;
    const els = {
      y: $('#cd-years'), mo: $('#cd-months'), d: $('#cd-days'),
      h: $('#cd-hours'), mi: $('#cd-minutes'), s: $('#cd-seconds'),
    };
    function update(){
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      let days = now.getDate() - birth.getDate();
      let hours = now.getHours() - birth.getHours();
      let minutes = now.getMinutes() - birth.getMinutes();
      let seconds = now.getSeconds() - birth.getSeconds();

      if (seconds < 0){ seconds += 60; minutes--; }
      if (minutes < 0){ minutes += 60; hours--; }
      if (hours < 0){ hours += 24; days--; }
      if (days < 0){ const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0); days += prevMonth.getDate(); months--; }
      if (months < 0){ months += 12; years--; }

      els.y.textContent = String(Math.max(0, years)).padStart(2, '0');
      els.mo.textContent = String(Math.max(0, months)).padStart(2, '0');
      els.d.textContent = String(Math.max(0, days)).padStart(2, '0');
      els.h.textContent = String(Math.max(0, hours)).padStart(2, '0');
      els.mi.textContent = String(Math.max(0, minutes)).padStart(2, '0');
      els.s.textContent = String(Math.max(0, seconds)).padStart(2, '0');
    }
    update();
    setInterval(update, 1000);
  }

  /* ==========================================================================
     18. SECTION 12 — STATS COUNTERS
     ========================================================================== */
  function initStatCounters(){
    const values = $$('.stat-value');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    values.forEach(v => io.observe(v));

    function animateCount(el){
      const target = parseFloat(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || '';
      const duration = REDUCE_MOTION ? 1 : 1600;
      const start = performance.now();
      function frame(now){
        const t = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased).toLocaleString() + suffix;
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
  }

  /* ==========================================================================
     19. SECTION 13 — MEMORY TREE
     ========================================================================== */
  const TREE_CAPTIONS = [
    'A day that started ordinary and became a favourite memory.',
    'One of those afternoons neither of us wanted to end.',
    'A conversation that turned into a core memory.',
    'Small moment, big smile.',
    'The kind of day worth replaying.',
    'Proof that the best plans are the unplanned ones.',
    'A memory that still makes us laugh.',
    'Here\'s to many more like this one.',
  ];
  function updateTreeLeaves(){
    const section = $('#tree-section');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const total = section.offsetHeight - innerHeight;
    if (total <= 0) return;
    const progress = clamp(-rect.top / total, 0, 1);
    const leaves = $$('.tree-leaf');
    const showCount = Math.round(progress * leaves.length);
    leaves.forEach((leaf, i) => leaf.classList.toggle('show', i < showCount));
  }
  function initMemoryTree(){
    const modal = $('#leaf-modal');
    const modalImg = $('#leaf-modal-img');
    const modalText = $('#leaf-modal-text');
    const closeBtn = $('#leaf-modal-close');

    function openLeaf(i){
      modalImg.src = PHOTOS[i % PHOTOS.length];
      modalImg.alt = `${CONFIG.friendName} memory`;
      modalImg.onerror = () => { modalImg.style.display = 'none'; };
      modalText.textContent = TREE_CAPTIONS[i % TREE_CAPTIONS.length];
      modal.classList.add('open');
      document.body.classList.add('no-scroll');
      closeBtn.focus();
    }
    function closeLeaf(){
      modal.classList.remove('open');
      document.body.classList.remove('no-scroll');
    }
    $$('.tree-leaf').forEach(leaf => leaf.addEventListener('click', () => openLeaf(parseInt(leaf.dataset.index, 10))));
    closeBtn.addEventListener('click', closeLeaf);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeLeaf(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeLeaf(); });
  }

  /* ==========================================================================
     20. SECTION 14 — FINAL EXPLOSION
     ========================================================================== */
  function initExplosion(){
    const stage = $('#explosion-stage');
    const canvas = $('#explosion-canvas');
    const fw = createFireworks(canvas);
    const subset = PHOTOS.slice(0, 10);

    subset.forEach((src, i) => {
      const el = document.createElement('div');
      el.className = 'explosion-photo';
      const angle = (Math.PI * 2 * i) / subset.length;
      const dist = rand(160, 340);
      el.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
      el.style.setProperty('--ty', Math.sin(angle) * dist * 0.6 + 'px');
      el.style.setProperty('--tr', rand(-40, 40) + 'deg');
      el.style.left = 'calc(50% - 60px)';
      el.style.top = 'calc(50% - 75px)';
      const img = document.createElement('img');
      img.loading = 'lazy'; img.decoding = 'async'; img.src = src; img.alt = `${CONFIG.friendName} memory`;
      img.addEventListener('error', () => { el.innerHTML = '<div class="photo-placeholder">✨</div>'; }, { once: true });
      el.appendChild(img);
      stage.appendChild(el);
    });

    let triggered = false;
    onVisibility($('#explosion-section'), () => {
      fw.start();
      if (!triggered){
        triggered = true;
        $$('.explosion-photo', stage).forEach((el, i) => setTimeout(() => el.classList.add('burst'), i * 90));
        const rect = stage.getBoundingClientRect();
        Confetti.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 100);
      }
    }, () => fw.stop());
  }

  /* ==========================================================================
     21. SECTION 15 — ENDING + SURPRISE BUTTON
     ========================================================================== */
  function initEnding(){
    const canvas = $('#fireworks-canvas');
    const fw = createFireworks(canvas);
    onVisibility($('#ending-section'), () => fw.start(), () => fw.stop());

    const overlay = $('#celebration-overlay');
    const overlayCanvas = $('#celebration-canvas');
    const overlayFw = createFireworks(overlayCanvas);
    const closeBtn = $('#celebration-close');

    function openCelebration(){
      overlay.classList.add('show');
      document.body.classList.add('no-scroll');
      sizeCanvas(overlayCanvas);
      overlayFw.start();
      Confetti.burst(innerWidth / 2, innerHeight * 0.3, 160);
    }
    function closeCelebration(){
      overlay.classList.remove('show');
      document.body.classList.remove('no-scroll');
      overlayFw.stop();
    }
    $('#surprise-btn').addEventListener('click', openCelebration);
    closeBtn.addEventListener('click', closeCelebration);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCelebration(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('show')) closeCelebration(); });

    window.__openCelebration = openCelebration;
  }

  /* ==========================================================================
     22. KONAMI CODE EASTER EGG
     ========================================================================== */
  function initKonami(){
    const sequence = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let pos = 0;
    addEventListener('keydown', (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === sequence[pos]) { pos++; if (pos === sequence.length){ pos = 0; window.__openCelebration && window.__openCelebration(); } }
      else { pos = key === sequence[0] ? 1 : 0; }
    });
  }

  /* ==========================================================================
     23. INIT
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initMusicPlayer();
    initCursorFX();
    initScrollChrome();
    initLetterTitles();
    initScrollReveal();
    initHero();
    initCake();
    initGallery();
    initBook();
    initCarousel();
    initStars();
    initLantern();
    initCountdown();
    initStatCounters();
    initMemoryTree();
    initExplosion();
    initEnding();
    initKonami();
  });
})();
