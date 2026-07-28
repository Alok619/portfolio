/* =========================================================
   ALOK KACHHAP — interactions (glass build)
   ========================================================= */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, lerp: 0.1 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const onScrollHandlers = [];
  const addScroll = (fn) => { onScrollHandlers.push(fn); fn(); };
  if (lenis) lenis.on('scroll', () => onScrollHandlers.forEach((f) => f()));
  else window.addEventListener('scroll', () => onScrollHandlers.forEach((f) => f()), { passive: true });

  /* ---------- anchor smooth scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(el, { offset: -10, duration: 1.4 });
      else el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- progress + nav hide ---------- */
  const bar = document.querySelector('.progress span');
  const nav = document.getElementById('nav');
  let lastY = 0;
  addScroll(() => {
    const h = document.documentElement;
    const y = h.scrollTop || document.body.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (nav) { if (y > lastY && y > 320) nav.classList.add('hide'); else nav.classList.remove('hide'); }
    lastY = y;
  });

  /* ---------- mobile menu ---------- */
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  function closeMenu() { if (menu) menu.classList.remove('open'); }
  burger && burger.addEventListener('click', () => menu && menu.classList.toggle('open'));

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .reveal-up').forEach((el) => io.observe(el));

  /* ---------- typewriter for the hero name ---------- */
  function startTypewriter() {
    const el = document.querySelector('[data-typewriter]');
    if (!el) return;
    const out = el.querySelector('.tw-text');
    const full = el.getAttribute('data-typewriter') || '';
    if (!out) return;
    if (reduce) { out.textContent = full; return; }   // reduced motion: show instantly
    let i = 0;
    const speed = 95;
    const tick = () => {
      out.textContent = full.slice(0, i);
      if (i++ < full.length) setTimeout(tick, speed);
    };
    tick();
  }

  /* ---------- preloader + hero entrance ---------- */
  const ssHero = document.querySelector('.hero-ss');
  const startHero = () => {
    if (ssHero) ssHero.classList.add('is-in');
    // begin typing as the name fades/rises in (its entrance delay is ~.64s)
    setTimeout(startTypewriter, 650);
  };
  const loaderEl = document.getElementById('loader');
  if (loaderEl) {
    let done = false;
    const countEl = document.getElementById('loaderCount');
    const reveal = () => {
      if (done) return; done = true;
      if (countEl) countEl.textContent = '100';
      loaderEl.classList.add('loader--out');   // curtain up
      startHero();                              // hero animates in as the loader lifts
      setTimeout(() => loaderEl.remove(), 1000);
    };
    const MIN = reduce ? 400 : 2000;            // let the logo animation play
    const t0 = performance.now();
    // tick the % counter up to 100 over the load window
    if (countEl) {
      const tick = () => {
        const p = Math.min(1, (performance.now() - t0) / MIN);
        countEl.textContent = Math.round(p * 100);
        if (p < 1 && !done) requestAnimationFrame(tick);
      };
      tick();
    }
    const onReady = () => setTimeout(reveal, Math.max(0, MIN - (performance.now() - t0)));
    if (document.readyState === 'complete') onReady();
    else window.addEventListener('load', onReady);
    setTimeout(reveal, reduce ? 1200 : 4500);   // safety fallback
  } else {
    requestAnimationFrame(() => requestAnimationFrame(startHero));
  }
  const contactSec = document.querySelector('.contact');
  if (contactSec) new IntersectionObserver((e, o) => {
    e.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); o.disconnect(); } });
  }, { threshold: 0.25 }).observe(contactSec);

  /* ---------- stat count-up ---------- */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    new IntersectionObserver((e, o) => {
      if (!e[0].isIntersecting) return;
      o.disconnect();
      if (reduce) { el.textContent = target; return; }
      let n = 0;
      const step = () => { n += Math.ceil(target / 24); if (n >= target) n = target; el.textContent = n; if (n < target) requestAnimationFrame(step); };
      step();
    }, { threshold: 0.6 }).observe(el);
  });

  /* ---------- philosophy word lighting ---------- */
  const words = Array.from(document.querySelectorAll('.philo__text .word'));
  if (words.length && !reduce) {
    const philo = document.querySelector('.philo__text');
    addScroll(() => {
      const rect = philo.getBoundingClientRect();
      const start = window.innerHeight * 0.85, end = window.innerHeight * 0.3;
      const prog = Math.min(1, Math.max(0, (start - rect.top) / (start - end + rect.height * 0.4)));
      const count = Math.round(prog * words.length);
      words.forEach((w, i) => w.classList.toggle('lit', i < count));
    });
  } else { words.forEach((w) => w.classList.add('lit')); }


  /* ---------- magnetic ---------- */
  if (!coarse && !reduce) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      el.addEventListener('mouseenter', () => { el.style.transition = 'transform .1s linear'; });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.3;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.3;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)'; el.style.transform = ''; });
    });
  }

  /* ---------- 3D glass tilt ---------- */
  if (!coarse && !reduce) {
    document.querySelectorAll('.tilt').forEach((el) => {
      const max = 7;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform .08s linear';
        el.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateY(-4px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
        el.style.transform = '';
      });
    });
  }

  /* ---------- 3D tilt card (InteractiveTravelCard port) ---------- */
  if (!coarse && !reduce) {
    document.querySelectorAll('[data-tcard]').forEach((card) => {
      const MAX = 10.5; // matches the React rotate range (±10.5deg)
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const xPct = (e.clientX - r.left) / r.width - 0.5;
        const yPct = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = 'transform .1s ease-out';
        card.style.transform = `rotateX(${-yPct * 2 * MAX}deg) rotateY(${xPct * 2 * MAX}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  /* ---------- location card tilt (LocationCard port, inside the drawer) ---------- */
  if (!coarse && !reduce) {
    document.querySelectorAll('[data-loccard]').forEach((card) => {
      const MAX = 10; // matches the React rotate range (±10deg)
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const xPct = (e.clientX - r.left) / r.width - 0.5;
        const yPct = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = 'transform .1s ease-out';
        card.style.transform = `rotateX(${-yPct * 2 * MAX}deg) rotateY(${xPct * 2 * MAX}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform .45s cubic-bezier(.16,1,.3,1)';
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  /* ---------- card drawer (glass, slides in from the left) ---------- */
  const drawer = document.getElementById('drawer');
  if (drawer) {
    const card = document.querySelector('[data-tcard]');
    const track = drawer.querySelector('[data-drawer-track]');
    const dots = Array.from(drawer.querySelectorAll('[data-drawer-go]'));

    const goTo = (i) => {
      if (track) track.style.transform = `translateX(${-i * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle('is-active', di === i));
    };
    const open = () => {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      document.documentElement.style.overflow = 'hidden';
    };
    const close = () => {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
    };

    if (card) card.addEventListener('click', (e) => { e.preventDefault(); open(); });
    drawer.querySelectorAll('[data-drawer-close]').forEach((el) => el.addEventListener('click', close));
    dots.forEach((d) => d.addEventListener('click', () => goTo(parseInt(d.getAttribute('data-drawer-go'), 10))));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) close(); });
  }

  /* ---------- flip gallery (photo gallery, port of FlipGallery) ---------- */
  const flipEl = document.querySelector('[data-flip]');
  if (flipEl) {
    const IMAGES = [
      { title: 'Munnar', file: 'Munnar.png' },
      { title: 'Above the clouds', file: 'Above the claude.png' },
      { title: 'Silent tree', file: 'Silent tree.png' },
      { title: 'Sun kissed', file: 'Sun kissed.png' },
      { title: 'Beach', file: 'Beach.png' },
      { title: 'Goa', file: 'Goa.png' },
      { title: 'Peace', file: 'Peace.png' },
      { title: 'Chennai', file: 'Chennai.png' },
      { title: 'Munnar', file: 'Munnar-1.png' },
      { title: 'IIT Roorkee', file: 'IIT Roorkee.png' },
      { title: 'Art gallery', file: 'Art gallery.png' },
      { title: 'Fun', file: 'Fun.png' }
    ].map((im) => ({ title: im.title, url: 'media/Gallary/' + encodeURIComponent(im.file) }));

    const FLIP_SPEED = 750;
    const timing = { duration: FLIP_SPEED, iterations: 1 };
    const topDown = [{ transform: 'rotateX(0)' }, { transform: 'rotateX(-90deg)' }, { transform: 'rotateX(-90deg)' }];
    const bottomDown = [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(90deg)' }, { transform: 'rotateX(0)' }];
    const topUp = [{ transform: 'rotateX(-90deg)' }, { transform: 'rotateX(-90deg)' }, { transform: 'rotateX(0)' }];
    const bottomUp = [{ transform: 'rotateX(0)' }, { transform: 'rotateX(90deg)' }, { transform: 'rotateX(90deg)' }];

    const unites = flipEl.querySelectorAll('.unite');
    let index = 0;

    const setImg = (el) => { el.style.backgroundImage = `url('${IMAGES[index].url}')`; };
    const setTitle = () => {
      flipEl.setAttribute('data-title', IMAGES[index].title);
      flipEl.style.setProperty('--title-y', '0');
      flipEl.style.setProperty('--title-opacity', '1');
    };

    const update = (reverse) => {
      flipEl.querySelector('.overlay-top').animate(reverse ? topUp : topDown, timing);
      flipEl.querySelector('.overlay-bottom').animate(reverse ? bottomUp : bottomDown, timing);
      flipEl.style.setProperty('--title-y', '-1rem');
      flipEl.style.setProperty('--title-opacity', '0');
      flipEl.setAttribute('data-title', '');
      // swap images, delaying the trailing halves so the flip reads continuously
      unites.forEach((el, idx) => {
        const delay = (reverse && idx !== 1 && idx !== 2) || (!reverse && (idx === 1 || idx === 2)) ? FLIP_SPEED - 200 : 0;
        setTimeout(() => setImg(el), delay);
      });
      setTimeout(setTitle, FLIP_SPEED * 0.5);
    };

    const go = (inc) => { index = (index + inc + IMAGES.length) % IMAGES.length; update(inc < 0); };

    unites.forEach(setImg);
    setTitle();
    const prev = flipEl.parentElement.querySelector('[data-flip-prev]');
    const next = flipEl.parentElement.querySelector('[data-flip-next]');
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
  }

  /* ---------- parallax media ---------- */
  if (!reduce) {
    const items = document.querySelectorAll('[data-parallax]');
    addScroll(() => {
      const vh = window.innerHeight;
      items.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const prog = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.backgroundPosition = `center calc(50% + ${prog * 26}px)`;
        const art = el.querySelector ? el : null;
        el.style.setProperty('--shift', `${prog * 26}px`);
      });
    });
  }

  /* ---------- music player (port of MusicPlayer widget) ---------- */
  const mp = document.querySelector('[data-player]');
  if (mp) {
    const tracks = [
      { title: 'Head In The Clouds', artist: 'Hayd', cover: 'media/covers/Song1.jpg', src: 'media/music/Song1.mp3' },
      { title: 'Apocalypse', artist: 'Cigarettes After Sex', cover: 'media/covers/Song2.jpg', src: 'media/music/Song2.mp3' },
      { title: 'The Night We Met', artist: 'Lord Huron', cover: 'media/covers/Song3.jpg', src: 'media/music/Song3.mp3' },
      { title: 'Yellow', artist: 'Coldplay', cover: 'media/covers/Song4.jpg', src: 'media/music/Song4.mp3' }
    ];
    const $ = (s) => mp.querySelector(s);
    const audio = $('[data-audio]'), spin = $('[data-spin]'), cover = $('[data-cover]');
    const artistEl = $('[data-artist]'), titleEl = $('[data-title]');
    const bar = $('[data-bar]'), fill = $('[data-fill]'), curEl = $('[data-cur]'), durEl = $('[data-dur]');
    const toggleBtn = $('[data-toggle]'), shuffleBtn = $('[data-shuffle]'), loopBtn = $('[data-loop]');
    const PLAY = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 5v14l11-7z"/></svg>';
    const PAUSE = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 5h3v14H6zM15 5h3v14h-3z"/></svg>';

    let index = 0, order = tracks.map((_, i) => i), shuffled = false, loopMode = 'off';
    const fmt = (s) => isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00';
    const render = () => { const t = tracks[index]; artistEl.textContent = t.artist; titleEl.textContent = t.title; cover.src = t.cover; };

    const burst = { from: 0, start: 0, active: false, pending: false };
    const load = (i, autoplay, dir) => {
      index = i; audio.src = tracks[i].src; audio.load(); render();
      if (dir) { burst.from = dir === 'prev' ? 360 : -360; burst.pending = true; }
      if (autoplay) audio.play().catch(() => {});
    };
    const next = () => {
      const pos = order.indexOf(index), np = pos + 1;
      if (np >= order.length) { if (loopMode === 'all') load(order[0], !audio.paused, 'next'); else { audio.pause(); audio.currentTime = 0; } return; }
      load(order[np], !audio.paused, 'next');
    };
    const prev = () => {
      if (audio.currentTime > 3) { audio.currentTime = 0; return; }
      const pos = order.indexOf(index), pp = pos - 1;
      if (pp < 0) { if (loopMode === 'all') load(order[order.length - 1], !audio.paused, 'prev'); else audio.currentTime = 0; return; }
      load(order[pp], !audio.paused, 'prev');
    };

    toggleBtn.addEventListener('click', () => { if (audio.paused) audio.play().catch(() => {}); else audio.pause(); });
    $('[data-prev]').addEventListener('click', prev);
    $('[data-next]').addEventListener('click', next);
    shuffleBtn.addEventListener('click', () => {
      shuffled = !shuffled;
      if (shuffled) { const r = tracks.map((_, i) => i).filter((x) => x !== index); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } order = [index, ...r]; }
      else order = tracks.map((_, i) => i);
      shuffleBtn.classList.toggle('is-active', shuffled);
    });
    loopBtn.addEventListener('click', () => {
      loopMode = loopMode === 'off' ? 'all' : loopMode === 'all' ? 'one' : 'off';
      loopBtn.classList.toggle('is-active', loopMode !== 'off');
      loopBtn.classList.toggle('mode-one', loopMode === 'one');
    });
    bar.addEventListener('click', (e) => { const r = bar.getBoundingClientRect(); if (audio.duration) audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration; });

    const music = mp.closest('[data-music]');
    audio.addEventListener('play', () => { mp.classList.add('is-playing'); if (music) music.classList.add('is-playing'); toggleBtn.innerHTML = PAUSE; toggleBtn.setAttribute('aria-label', 'Pause'); });
    audio.addEventListener('pause', () => { mp.classList.remove('is-playing'); if (music) music.classList.remove('is-playing'); toggleBtn.innerHTML = PLAY; toggleBtn.setAttribute('aria-label', 'Play'); });
    // equalizer CTA — reveal + autoplay on open, hide + pause on close
    if (music) {
      const fab = music.querySelector('[data-music-toggle]');
      let hideT, pinned = false;
      const show = () => { clearTimeout(hideT); music.classList.add('is-open'); };
      const hide = () => { if (pinned) return; hideT = setTimeout(() => music.classList.remove('is-open'), 200); };
      // hover reveals the player; leaving hides it (music keeps playing in the background)
      music.addEventListener('mouseenter', show);
      music.addEventListener('mouseleave', hide);
      // tap (touch / no hover) pins it open, tap again closes
      fab.addEventListener('click', () => { pinned = !pinned; if (pinned) show(); else { music.classList.remove('is-open'); } });
    }
    audio.addEventListener('loadedmetadata', () => { durEl.textContent = fmt(audio.duration); });
    audio.addEventListener('timeupdate', () => { curEl.textContent = fmt(audio.currentTime); if (audio.duration) { fill.style.width = (audio.currentTime / audio.duration * 100) + '%'; durEl.textContent = fmt(audio.duration); } });
    audio.addEventListener('ended', () => { if (loopMode === 'one') { audio.currentTime = 0; audio.play().catch(() => {}); } else next(); });

    audio.src = tracks[0].src; audio.load(); render(); toggleBtn.innerHTML = PLAY;

    // disc spin physics
    const SPIN_MAX = 0.4375, BURST = 620; let rot = 0, vel = 0;
    (function discLoop(now) {
      const playing = !audio.paused;
      if (playing) vel += (SPIN_MAX - vel) * 0.2; else { vel *= 0.96; if (vel < 0.001) vel = 0; }
      rot += vel;
      if (burst.pending) { burst.start = now; burst.pending = false; burst.active = true; }
      let b = 0;
      if (burst.active) { const t = (now - burst.start) / BURST; if (t >= 1) burst.active = false; else b = burst.from * Math.pow(1 - t, 3); }
      spin.style.transform = `rotate(${rot + b}deg)`;
      requestAnimationFrame(discLoop);
    })(performance.now());

    // scales visualizer (idle motion, animates while playing)
    const scales = $('[data-scales]'), COLS = 10, ROWS = 10;
    const sineOut = (x) => Math.sin((x * Math.PI) / 2), sineIn = (x) => 1 - Math.cos((x * Math.PI) / 2), sineInOut = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
    const lerp = (a, b, t) => a + (b - a) * t;
    const PA_DUR = 1.5, PA_TO = 11, PA_STEP = 3 / (COLS - 1), PB_DUR = 1, S_FROM = 0.133, S_TO = 0.8;
    const colEls = [], circEls = [];
    const NS = 'http://www.w3.org/2000/svg';
    if (scales) {
      const mask = document.createElementNS(NS, 'mask'); mask.setAttribute('id', 'scalesMask');
      const mr = document.createElementNS(NS, 'rect'); mr.setAttribute('width', '10'); mr.setAttribute('height', '10'); mr.setAttribute('fill', '#fff');
      mask.appendChild(mr); scales.appendChild(mask);
      for (let c = 0; c < COLS; c++) {
        const g = document.createElementNS(NS, 'g'); g.style.transform = `translate(${c * 10}px,0px)`;
        const rowArr = [];
        for (let r = 0; r < ROWS; r++) {
          const cell = document.createElementNS(NS, 'g'); cell.setAttribute('mask', 'url(#scalesMask)'); cell.setAttribute('transform', `translate(0 ${r * 10})`);
          const circ = document.createElementNS(NS, 'circle'); circ.setAttribute('cx', '5'); circ.setAttribute('cy', '5'); circ.setAttribute('r', '5');
          circ.style.transformBox = 'fill-box'; circ.style.transformOrigin = 'center';
          cell.appendChild(circ); g.appendChild(cell); rowArr.push(circ);
        }
        scales.appendChild(g); colEls.push(g); circEls.push(rowArr);
      }
      let tAcc = 50, last = performance.now();
      (function scalesLoop(now) {
        const dt = now - last; last = now;
        if (!audio.paused) tAcc += dt / 1000;
        const time = tAcc;
        for (let c = 0; c < COLS; c++) {
          const localA = time - c * PA_STEP, periodA = PA_DUR * 2, cycA = ((localA % periodA) + periodA) % periodA;
          const ay = cycA < PA_DUR ? PA_TO * sineInOut(cycA / PA_DUR) : PA_TO * sineInOut(1 - (cycA - PA_DUR) / PA_DUR);
          colEls[c].style.transform = `translate(${c * 10}px,${ay}px)`;
          for (let r = 0; r < ROWS; r++) {
            const frac = r / ROWS, yFrom = lerp(77, -77, frac), yTo = lerp(c, -c, frac);
            const localB = time - c / COLS, periodB = PB_DUR * 2, cycB = ((localB % periodB) + periodB) % periodB;
            const e = cycB < PB_DUR ? sineOut(cycB / PB_DUR) : sineIn(1 - (cycB - PB_DUR) / PB_DUR);
            const ty = lerp(yFrom, yTo, e), s = lerp(S_FROM, S_TO, e);
            circEls[c][r].style.transform = `translateY(${ty}px) scale(${s})`;
          }
        }
        requestAnimationFrame(scalesLoop);
      })(performance.now());
    }
  }

  /* ---------- year ---------- */
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
