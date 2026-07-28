  (function () {
    // Cover video: play from the start each time it scrolls into view; pause when it leaves.
    var v = document.querySelector('.cover-img');
    if (v) {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { try { v.currentTime = 0; } catch (err) {} v.play().catch(function () {}); }
            else { v.pause(); }
          });
        }, { threshold: 0.4 }).observe(v);
      } else {
        v.play && v.play().catch(function () {});
      }
    }
  })();

  (function () {
    // Prototype mockup video: play from the start each time it scrolls into view.
    var mv = document.querySelector('.desktop-mock__screen');
    if (mv && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { try { mv.currentTime = 0; } catch (err) {} mv.play().catch(function () {}); }
          else { mv.pause(); }
        });
      }, { threshold: 0.25 }).observe(mv);
    }
  })();

  (function () {
    // Accordion (What I learned): single-open, collapsible.
    Array.prototype.forEach.call(document.querySelectorAll('[data-accordion]'), function (acc) {
      var items = acc.querySelectorAll('.acc-item');
      Array.prototype.forEach.call(items, function (item) {
        var btn = item.querySelector('.acc-trigger');
        btn.addEventListener('click', function () {
          var wasOpen = item.classList.contains('is-open');
          Array.prototype.forEach.call(items, function (i) {
            i.classList.remove('is-open');
            i.querySelector('.acc-trigger').setAttribute('aria-expanded', 'false');
          });
          if (!wasOpen) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
        });
      });
    });
  })();

  (function () {
    // Scroll reveal: each section's elements fade + rise in a staggered cascade.
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('.cs-hero .wrap, section .wrap'), function (wrap) {
      Array.prototype.forEach.call(wrap.children, function (k, i) {
        k.classList.add('reveal');
        k.style.transitionDelay = Math.min(i * 0.08, 0.4) + 's';
        io.observe(k);
      });
    });
  })();

  (function () {
    // Design-system tiles open a lightbox with the full board image(s).
    var lb = document.getElementById('lightbox');
    if (lb) {
      var imgsWrap = lb.querySelector('.lb__imgs');
      var titleEl = lb.querySelector('.lb__title');

      function open(title, list) {
        titleEl.textContent = title || '';
        imgsWrap.innerHTML = '';
        list.split(',').forEach(function (src) {
          src = src.trim();
          if (!src) return;
          var img = document.createElement('img');
          img.src = src; img.alt = title || ''; img.loading = 'lazy';
          imgsWrap.appendChild(img);
        });
        lb.hidden = false; lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        lb.scrollTop = 0;
      }
      function openVideo(title, src) {
        titleEl.textContent = title || '';
        imgsWrap.innerHTML = '';
        var vid = document.createElement('video');
        vid.src = src; vid.controls = true; vid.autoplay = true; vid.muted = true; vid.playsInline = true; vid.className = 'lb__video';
        imgsWrap.appendChild(vid);
        lb.hidden = false; lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        lb.scrollTop = 0;
        vid.play().catch(function () {});
      }
      function close() {
        lb.hidden = true; lb.setAttribute('aria-hidden', 'true');
        imgsWrap.innerHTML = '';
        document.body.style.overflow = '';
      }

      Array.prototype.forEach.call(document.querySelectorAll('[data-gallery]'), function (tile) {
        tile.addEventListener('click', function () {
          open(tile.getAttribute('data-title'), tile.getAttribute('data-gallery') || '');
        });
      });

      var proto = document.querySelector('.desktop-mock__screen');
      if (proto) {
        proto.addEventListener('click', function () {
          proto.pause();
          openVideo('Campaign creation flow', proto.currentSrc || proto.src);
        });
      }
      lb.querySelector('.lb__close').addEventListener('click', close);
      lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) close(); });
    }
  })();

  (function () {
    // Animated tabs (Features): sliding pill + animated content swap.
    Array.prototype.forEach.call(document.querySelectorAll('[data-tabs]'), function (root) {
      var pill = root.querySelector('.tabs__pill');
      var btns = root.querySelectorAll('.tabs__btn');
      var panels = root.querySelectorAll('[data-panel]');

      function movePill(btn) {
        pill.style.left = btn.offsetLeft + 'px';
        pill.style.top = btn.offsetTop + 'px';
        pill.style.width = btn.offsetWidth + 'px';
        pill.style.height = btn.offsetHeight + 'px';
      }
      function activate(id) {
        Array.prototype.forEach.call(btns, function (b) {
          var on = b.getAttribute('data-tab') === id;
          b.classList.toggle('is-active', on);
          if (on) movePill(b);
        });
        Array.prototype.forEach.call(panels, function (p) {
          p.hidden = p.getAttribute('data-panel') !== id;
        });
      }

      Array.prototype.forEach.call(btns, function (b) {
        b.addEventListener('click', function () { activate(b.getAttribute('data-tab')); });
      });

      // position the pill under the initial active tab once laid out
      var active = root.querySelector('.tabs__btn.is-active') || btns[0];
      requestAnimationFrame(function () { movePill(active); });
      window.addEventListener('resize', function () {
        movePill(root.querySelector('.tabs__btn.is-active') || btns[0]);
      });
    });
  })();

  (function () {
    // Spotlight hover: a soft brand-blue glow follows the cursor across each card.
    Array.prototype.forEach.call(document.querySelectorAll('.card'), function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      card.addEventListener('mouseenter', function () { card.style.setProperty('--spot-o', '1'); });
      card.addEventListener('mouseleave', function () { card.style.setProperty('--spot-o', '0'); });
    });
  })();

  (function () {
    // Before/after comparison sliders — drag anywhere on a frame to compare.
    function pointX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }

    Array.prototype.forEach.call(document.querySelectorAll('.ba'), function (ba) {
      var dragging = false;

      function setP(clientX) {
        var r = ba.getBoundingClientRect();
        var p = ((clientX - r.left) / r.width) * 100;
        p = Math.max(0, Math.min(100, p));
        ba.style.setProperty('--p', p + '%');
      }
      function down(e) { dragging = true; ba.classList.add('is-drag'); setP(pointX(e)); e.preventDefault(); }
      function move(e) { if (!dragging) return; setP(pointX(e)); }
      function up() { dragging = false; ba.classList.remove('is-drag'); }

      ba.addEventListener('mousedown', down);
      ba.addEventListener('touchstart', down, { passive: false });
      window.addEventListener('mousemove', move);
      window.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('mouseup', up);
      window.addEventListener('touchend', up);
    });
  })();

  (function () {
    // Dynamic-island table of contents, built from each page's section titles.
    var titles = Array.prototype.slice.call(document.querySelectorAll('.sec-title'));
    if (titles.length < 2) return;

    var items = [];
    titles.forEach(function (t) {
      var sec = t.closest('section, header');
      if (!sec) return;
      if (!sec.id) sec.id = 'sec-' + (items.length + 1);
      var text = (t.getAttribute('data-toc-title') || t.textContent || '').trim();
      items.push({ id: sec.id, text: text, el: sec });
    });
    if (!items.length) return;

    var root = document.createElement('div');
    root.className = 'toc';
    root.innerHTML =
      '<div class="toc__backdrop"></div>' +
      '<div class="toc__island">' +
        '<div class="toc__pill">' +
          '<span class="toc__dot"></span>' +
          '<span class="toc__label">Contents</span>' +
          '<svg class="toc__ring" width="24" height="24"><circle class="toc__ring-bg" cx="12" cy="12" r="10.75"></circle><circle class="toc__ring-fg" cx="12" cy="12" r="10.75"></circle></svg>' +
        '</div>' +
        '<div class="toc__panel">' +
          '<div class="toc__head"><span>Table of contents</span>' +
            '<button class="toc__close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
          '</div>' +
          '<div class="toc__list"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);

    var island = root.querySelector('.toc__island');
    var labelEl = root.querySelector('.toc__label');
    var listEl = root.querySelector('.toc__list');
    var ringFg = root.querySelector('.toc__ring-fg');
    var circ = 2 * Math.PI * 10.75;
    ringFg.setAttribute('stroke-dasharray', circ.toFixed(2));
    ringFg.setAttribute('stroke-dashoffset', circ.toFixed(2));

    function open() { root.classList.add('is-open'); }
    function close() { root.classList.remove('is-open'); }
    function goTo(el) { window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); }

    var btns = {};
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.className = 'toc__item';
      b.innerHTML = '<span></span><i></i>';
      b.querySelector('span').textContent = it.text;
      b.addEventListener('click', function (e) { e.stopPropagation(); goTo(it.el); close(); });
      listEl.appendChild(b);
      btns[it.id] = b;
    });

    island.addEventListener('click', function () { if (!root.classList.contains('is-open')) open(); });
    root.querySelector('.toc__close').addEventListener('click', function (e) { e.stopPropagation(); close(); });
    root.querySelector('.toc__backdrop').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    var activeId = null;
    function setActive(it) {
      if (it.id === activeId) return;
      activeId = it.id;
      labelEl.textContent = it.text;
      Object.keys(btns).forEach(function (k) { btns[k].classList.toggle('is-active', k === it.id); });
    }
    function onScroll() {
      var active = items[0];
      for (var i = 0; i < items.length; i++) {
        if (items[i].el.getBoundingClientRect().top <= 120) active = items[i]; else break;
      }
      setActive(active);
      var total = document.documentElement.scrollHeight - window.innerHeight;
      var pct = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0;
      ringFg.setAttribute('stroke-dashoffset', (circ - (pct / 100) * circ).toFixed(2));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  })();
