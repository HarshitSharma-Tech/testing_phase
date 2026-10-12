// ============================================================
// VINTAGE FINVEST — main.js
// Clean, Fast, High-Performance Interactive Engine
// ============================================================

import {
  CURATED_AMCS,
  CURATED_SCHEMES,
  fetchSchemeData,
  fetchLatestNav,
  searchSchemes,
  isDirectGrowth,
  calculateRealSIP,
  calculateRealSTP,
  calculateRealSWP,
  calculateRealLumpsumSIP,
  calculateRealStepUpSIP,
  MFDataError
} from './src/services/mfData.js';

(function () {
  'use strict';

  // ——— NAV SCROLL BEHAVIOUR ———
  const nav = document.getElementById('site-nav');
  const topBar = document.getElementById('top-bar');

  function updateNav() {
    const isTopBarVisible = topBar && getComputedStyle(topBar).display !== 'none';
    const topBarH = isTopBarVisible ? topBar.offsetHeight : 0;
    const scrolled = window.scrollY > 40;
    if (scrolled) {
      nav.classList.add('scrolled');
      nav.style.top = '0';
    } else {
      nav.classList.remove('scrolled');
      nav.style.top = topBarH ? topBarH + 'px' : '0';
    }
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  window.addEventListener('resize', updateNav, { passive: true });
  updateNav();

  // ——— MOBILE DRAWER ———
  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('nav-drawer');

  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const isOpen = toggle.classList.toggle('open');
      drawer.classList.toggle('open', isOpen);
      drawer.setAttribute('aria-hidden', !isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ——— SCROLL JOURNEY & ORIENTATION SYSTEM ("Never Lost") ———
  (function initScrollJourney() {
    const progressBar = document.getElementById('top-scroll-progress');
    const dock = document.getElementById('scroll-journey-dock');
    const fill = document.getElementById('journey-progress-fill');
    const msbText = document.getElementById('msb-text');
    const journeyItems = document.querySelectorAll('.journey-item');
    const navLinks = document.querySelectorAll('.site-nav .nav-link');

    const sectionsMeta = [
      { id: 'hero', title: 'The Firm', navHrefs: ['index.html', '#hero'] },
      { id: 'about', title: 'Our Story', navHrefs: ['about.html'] },
      { id: 'services', title: 'Wealth Disciplines', navHrefs: ['services.html'] },
      { id: 'portfolio-calculators', title: 'Wealth Calculators', navHrefs: ['#portfolio-calculators', 'calculators.html'] },
      { id: 'approach', title: 'Advisory Protocol', navHrefs: ['services.html'] },
      { id: 'team', title: 'Senior Stewards', navHrefs: ['team.html'] },
      { id: 'testimonials', title: 'Client Perspectives', navHrefs: ['about.html'] },
      { id: 'portal-hub', title: 'Digital Ecosystem', navHrefs: ['services.html'] },
      { id: 'consult', title: 'Private Consultation', navHrefs: ['contact.html'] }
    ];

    // Filter to existing elements
    const sectionEls = sectionsMeta
      .map(s => ({ ...s, el: document.getElementById(s.id) }))
      .filter(s => s.el !== null);

    if (sectionEls.length === 0) return;

    let ticking = false;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollJourney();
          ticking = false;
        });
        ticking = true;
      }
    }

    function updateScrollJourney() {
      const scrollY = window.scrollY || window.pageYOffset;
      const totalH = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPct = totalH > 0 ? Math.min(Math.max(scrollY / totalH, 0), 1) : 0;

      // Update progress bar & dock fill
      if (progressBar) {
        progressBar.style.width = (scrollPct * 100) + '%';
        progressBar.setAttribute('aria-valuenow', Math.round(scrollPct * 100));
      }
      if (fill) {
        fill.style.height = (scrollPct * 100) + '%';
      }

      // Determine active section (trigger line at 38% viewport height)
      const triggerY = window.innerHeight * 0.38;
      let activeItem = sectionEls[0];

      for (let i = 0; i < sectionEls.length; i++) {
        const rect = sectionEls[i].el.getBoundingClientRect();
        if (rect.top <= triggerY && rect.bottom > triggerY) {
          activeItem = sectionEls[i];
          break;
        } else if (rect.top <= triggerY) {
          activeItem = sectionEls[i];
        }
      }

      // Update Journey Dock active node
      if (dock) {
        journeyItems.forEach(item => {
          const target = item.getAttribute('data-target');
          if (target === activeItem.id) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }

      // Update Mobile Section Badge
      if (msbText && msbText.textContent !== activeItem.title) {
        msbText.textContent = activeItem.title;
      }

      // Update Desktop Navbar active link
      if (navLinks.length > 0) {
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          const isMatch = activeItem.navHrefs.some(nh => href === nh || href.endsWith(nh));
          if (isMatch) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    }

    // Pip click navigation
    if (dock) {
      dock.querySelectorAll('.journey-pip').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const parentItem = btn.closest('.journey-item');
          if (!parentItem) return;
          const targetId = parentItem.getAttribute('data-target');
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateScrollJourney();
  })();
  // HERO CRYSTAL RAIN — confined to hero section only
  // Canvas: #hero-canvas (position:absolute inside .hero)
  // Hero has overflow:hidden — particles are clipped naturally.
  // Click/touch: hero element only, coords relative to hero rect.
  // IntersectionObserver: pauses when hero scrolls out of view.
  // ============================================================
  (function() {
    var cvs = document.getElementById('hero-canvas');
    if (!cvs) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ctx = cvs.getContext('2d');
    var W = 0, H = 0, dpr = 1;
    var rain   = [];
    var clicks = [];
    var raf    = null;
    var heroVisible = true;
    var tabVisible  = !document.hidden;
    var mouse = { x: -9999, y: -9999, active: false };

    var GOLDS = [
      '255, 198, 20',   // Radiant 24K Gold
      '245, 178, 25',   // Rich Amber Gold
      '255, 215, 60',   // Bright Solar Gold
      '220, 165, 30',   // Deep Antique Gold
      '255, 190, 40',   // Warm Champagne Gold
      '235, 160, 15',   // Burnished Gold
    ];

    var isMobile = window.innerWidth < 768;
    var RAIN_N   = isMobile ? 55 : 90;

    // ── Resize: match the hero section dimensions ─────────────
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = cvs.parentElement ? cvs.parentElement.getBoundingClientRect() : cvs.getBoundingClientRect();
      W = rect.width  || window.innerWidth;
      H = rect.height || window.innerHeight;
      cvs.width  = Math.round(W * dpr);
      cvs.height = Math.round(H * dpr);
      if (ctx.resetTransform) ctx.resetTransform();
      ctx.scale(dpr, dpr);
    }

    // ── Particle: falls from above hero top to hero bottom ────
    function mkRain(prefill) {
      var xNorm = Math.pow(Math.random(), 1.6);
      var x = xNorm * W * 0.62 + (Math.random() - 0.5) * 60;
      var y = prefill ? -10 + Math.random() * (H + 10) : -(8 + Math.random() * 80);
      var sz = (1.1 + Math.random() * 2.6) * 1.15 * 0.80; // Decreased size by 20%
      return {
        x: x, y: y, sz: sz,
        vx: (Math.random() - 0.35) * 0.16 * 0.70, // Reduced speed by 30%
        vy: (0.75 + Math.random() * 1.55) * 0.294 * 0.70, // Reduced speed by 30%
        rot : Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.012 * 0.70,
        swA : 0.12 + Math.random() * 0.40,
        swF : (0.011 + Math.random() * 0.021) * 0.31 * 0.70,
        swP : Math.random() * Math.PI * 2,
        a   : 0.65 + Math.random() * 0.35,
        twF : 0.016 + Math.random() * 0.034,
        twP : Math.random() * Math.PI * 2,
        col : GOLDS[Math.floor(Math.random() * GOLDS.length)],
        typ : Math.random() < 0.38 ? 0 : (Math.random() < 0.52 ? 1 : 2),
      };
    }

    // ── Click crystal: coords are relative to hero rect ───────
    function mkClick(cx, cy) {
      var sz   = (1.8 + Math.random() * 2.2) * 1.15 * 0.80; // Decreased size by 20%
      var life = 260 + Math.floor(Math.random() * 160);
      return {
        x: cx, y: cy, sz: sz,
        vx: (Math.random() - 0.5) * 0.17 * 0.70, // Reduced speed by 30%
        vy: (0.4 + Math.random() * 0.6) * 0.294 * 0.70, // Reduced speed by 30%
        rot : Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.012 * 0.70,
        swA : 0.1 + Math.random() * 0.3,
        swF : (0.01 + Math.random() * 0.02) * 0.31 * 0.70,
        swP : Math.random() * Math.PI * 2,
        a   : 0.95 + Math.random() * 0.05,
        life: life, maxL: life,
        col : GOLDS[Math.floor(Math.random() * GOLDS.length)],
        typ : Math.random() < 0.38 ? 0 : (Math.random() < 0.52 ? 1 : 2),
      };
    }

    // ── Draw helpers ──────────────────────────────────────────
    function dDiamond(x, y, sz, rot, a, col) {
      ctx.save(); ctx.globalAlpha = Math.min(1, a * 1.1);
      ctx.translate(x, y); ctx.rotate(rot);
      var w = sz, h = sz * 1.82;
      ctx.shadowColor = 'rgba(' + col + ',0.95)'; ctx.shadowBlur = sz * 4.2;
      ctx.beginPath();
      ctx.moveTo(0,-h); ctx.lineTo(w,-h*0.17); ctx.lineTo(w*0.56,h*0.70);
      ctx.lineTo(0,h); ctx.lineTo(-w*0.56,h*0.70); ctx.lineTo(-w,-h*0.17);
      ctx.closePath();
      var g = ctx.createLinearGradient(-w,-h,w,h);
      g.addColorStop(0,    'rgba(255,255,220,' + a + ')');
      g.addColorStop(0.35, 'rgba(' + col + ',' + a + ')');
      g.addColorStop(1,    'rgba(200,140,20,' + (a*0.85) + ')');
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 0.60; ctx.strokeStyle = 'rgba(255,245,160,' + (a*0.95) + ')';
      ctx.beginPath(); ctx.moveTo(0,-h); ctx.lineTo(0,h);
      ctx.moveTo(-w,-h*0.17); ctx.lineTo(w,-h*0.17); ctx.stroke();
      ctx.shadowBlur = sz*1.5; ctx.beginPath();
      ctx.arc(w*0.16,-h*0.40,sz*0.24,0,Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,240,' + Math.min(1, a * 1.15) + ')'; ctx.fill();
      ctx.restore();
    }
    function dStar(x, y, sz, rot, a, col) {
      ctx.save(); ctx.globalAlpha = Math.min(1, a * 1.1);
      ctx.translate(x, y); ctx.rotate(rot);
      ctx.shadowColor = 'rgba(' + col + ',0.98)'; ctx.shadowBlur = sz*4.8;
      var arm = sz*1.9, hw = sz*0.24;
      ctx.beginPath(); ctx.moveTo(0,-arm);
      ctx.quadraticCurveTo(hw,-hw,arm,0); ctx.quadraticCurveTo(hw,hw,0,arm);
      ctx.quadraticCurveTo(-hw,hw,-arm,0); ctx.quadraticCurveTo(-hw,-hw,0,-arm);
      ctx.closePath();
      var sg = ctx.createRadialGradient(0,0,0,0,0,arm);
      sg.addColorStop(0, 'rgba(255,255,230,' + a + ')');
      sg.addColorStop(0.42, 'rgba(' + col + ',' + a + ')');
      sg.addColorStop(1, 'rgba(190,130,20,' + (a*0.80) + ')');
      ctx.fillStyle = sg; ctx.fill();
      ctx.shadowBlur = sz*1.3; ctx.beginPath();
      ctx.arc(0,0,sz*0.38,0,Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,245,' + Math.min(1,a*1.25) + ')'; ctx.fill();
      ctx.restore();
    }
    function dGem(x, y, sz, a, col) {
      ctx.save(); ctx.globalAlpha = Math.min(1, a * 1.1);
      ctx.shadowColor = 'rgba(' + col + ',0.95)'; ctx.shadowBlur = sz*3.8;
      ctx.beginPath(); ctx.arc(x,y,sz*0.85,0,Math.PI*2);
      var g = ctx.createRadialGradient(x-sz*0.26,y-sz*0.26,sz*0.04,x,y,sz*0.85);
      g.addColorStop(0,'rgba(255,255,230,' + a + ')');
      g.addColorStop(0.45,'rgba(' + col + ',' + a + ')');
      g.addColorStop(1,'rgba(180,120,15,' + (a*0.80) + ')');
      ctx.fillStyle = g; ctx.fill(); ctx.restore();
    }
    function drawP(p, a) {
      if      (p.typ === 0) dDiamond(p.x,p.y,p.sz,p.rot,a,p.col);
      else if (p.typ === 1) dStar(p.x,p.y,p.sz,p.rot,a,p.col);
      else                  dGem(p.x,p.y,p.sz,a,p.col);
    }

    // ── Main loop ─────────────────────────────────────────────
    function tick(ts) {
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < rain.length; i++) {
        var p = rain[i];
        p.swP += p.swF;
        p.x   += p.vx + Math.sin(p.swP) * p.swA;
        p.y   += p.vy;
        p.rot += p.rotV;

        var boostAlpha = 1;
        if (mouse.active) {
          var dx = mouse.x - p.x;
          var dy = mouse.y - p.y;
          var distSq = dx * dx + dy * dy;
          var radius = 175;
          if (distSq < radius * radius && distSq > 9) {
            var dist = Math.sqrt(distSq);
            var norm = (radius - dist) / radius; // 1 at cursor center, 0 at outer boundary
            var force = norm * norm * 0.052; // smooth quadratic magnetic pull
            p.x += dx * force;
            p.y += dy * force;
            p.rot += p.rotV * (1 + norm * 2.5);
            boostAlpha = 1 + norm * 0.35;
          }
        }

        var fadeIn  = Math.min(1, p.y / 40);
        var fadeOut = Math.min(1, (H - p.y) / 40);
        var fade    = Math.max(0, Math.min(fadeIn, fadeOut));
        var tw      = 0.76 + 0.24 * Math.sin(ts * 0.0007 * p.twF * 60 + p.twP);
        var a       = Math.min(1, p.a * fade * tw * boostAlpha);
        if (a > 0.008) drawP(p, a);
        if (p.y > H + 22 || p.x > W + 60 || p.x < -60) rain[i] = mkRain(false);
      }

      for (var j = clicks.length - 1; j >= 0; j--) {
        var c = clicks[j];
        c.swP += c.swF;
        c.x   += c.vx + Math.sin(c.swP) * c.swA;
        c.y   += c.vy;
        c.rot += c.rotV;

        if (mouse.active) {
          var cdx = mouse.x - c.x;
          var cdy = mouse.y - c.y;
          var cDistSq = cdx * cdx + cdy * cdy;
          var cRadius = 150;
          if (cDistSq < cRadius * cRadius && cDistSq > 9) {
            var cDist = Math.sqrt(cDistSq);
            var cNorm = (cRadius - cDist) / cRadius;
            var cForce = cNorm * cNorm * 0.038;
            c.x += cdx * cForce;
            c.y += cdy * cForce;
          }
        }

        c.life--;
        var t  = Math.max(0, c.life / c.maxL);
        var ca = c.a * (t < 0.15 ? (t / 0.15) : Math.pow(t, 0.7));
        if (ca > 0.008) drawP(c, ca);
        // Remove if faded or fell below hero
        if (c.life <= 0 || c.y > H + 30) clicks.splice(j, 1);
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }

    // ── Pool init ─────────────────────────────────────────────
    function init() {
      rain = [];
      for (var i = 0; i < RAIN_N; i++) rain.push(mkRain(true));
    }

    function isAlive() { return heroVisible && tabVisible; }

    function start() {
      if (!raf && isAlive()) raf = requestAnimationFrame(tick);
    }
    function stop() {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      // Clear canvas when paused so no ghost particles remain
      ctx.clearRect(0, 0, W, H);
    }

    // ── Hero IntersectionObserver — pauses when scrolled away ─
    var heroSection = cvs.closest('section') || cvs.parentElement;

    var heroObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(en) {
        heroVisible = en.isIntersecting;
        if (heroVisible) {
          start();
        } else {
          stop();
          clicks = []; // drop pending click crystals
        }
      });
    }, { threshold: 0.05 });
    heroObs.observe(heroSection);

    // ── Tab visibility ────────────────────────────────────────
    document.addEventListener('visibilitychange', function() {
      tabVisible = !document.hidden;
      tabVisible ? start() : stop();
    });

    // ── Click / touch — coordinates relative to hero rect ─────
    // Use heroSection as the event target; canvas has pointer-events:none
    var BLOCKED = 'a,button,input,select,textarea,[role="button"]';
    var lastTap = 0;

    heroSection.addEventListener('click', function(e) {
      if (!heroVisible) return;
      if (e.target.closest(BLOCKED)) return;
      var rect = heroSection.getBoundingClientRect();
      var cx = e.clientX - rect.left;
      var cy = e.clientY - rect.top;
      // Only spawn if within hero bounds
      if (cx < 0 || cy < 0 || cx > W || cy > H) return;
      clicks.push(mkClick(cx, cy));
      if (clicks.length > 50) clicks.splice(0, clicks.length - 50);
    }, { passive: true });

    heroSection.addEventListener('touchend', function(e) {
      if (!heroVisible) return;
      var now = Date.now();
      if (now - lastTap < 350) return;
      lastTap = now;
      if (e.target.closest(BLOCKED)) return;
      var t    = e.changedTouches[0];
      var rect = heroSection.getBoundingClientRect();
      var cx = t.clientX - rect.left;
      var cy = t.clientY - rect.top;
      if (cx < 0 || cy < 0 || cx > W || cy > H) return;
      clicks.push(mkClick(cx, cy));
      if (clicks.length > 50) clicks.splice(0, clicks.length - 50);
    }, { passive: true });

    // ── Mouse & Pointer tracking for dynamic interactive attraction ──
    function updatePointer(clientX, clientY) {
      if (!heroVisible) {
        mouse.active = false;
        return;
      }
      var rect = heroSection.getBoundingClientRect();
      var px = clientX - rect.left;
      var py = clientY - rect.top;
      // Active within or slightly beyond hero boundaries
      if (px >= -50 && px <= W + 50 && py >= -50 && py <= H + 50) {
        mouse.x = px;
        mouse.y = py;
        mouse.active = true;
      } else {
        mouse.active = false;
      }
    }

    function onPointerMove(e) {
      updatePointer(e.clientX, e.clientY);
    }

    function onPointerLeave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('pointerdown', onPointerMove, { passive: true });

    window.addEventListener('touchmove', function(e) {
      if (e.touches && e.touches[0]) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchend', onPointerLeave, { passive: true });
    window.addEventListener('touchcancel', onPointerLeave, { passive: true });

    // ── Resize ────────────────────────────────────────────────
    var rTimer;
    window.addEventListener('resize', function() {
      clearTimeout(rTimer);
      rTimer = setTimeout(function() { resize(); init(); }, 180);
    }, { passive: true });

    // ── Boot ─────────────────────────────────────────────────
    resize();
    init();
    start();
  }());

  // ——— SCROLL REVEAL OBSERVER ———
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.04, rootMargin: '0px 0px 60px 0px' });

    revealEls.forEach(el => observer.observe(el));
  }

  // ——— SMOOTH SCROLL (for anchor links) ———
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#' || !href) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navH = nav ? nav.offsetHeight : 80;
        const y = target.getBoundingClientRect().top + window.scrollY - navH - 20;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  // ——— COUNTER ANIMATION ———
  function animateCounter(el, target, duration = 1800) {
    const isDecimal = target % 1 !== 0;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = target * ease;
      el.textContent = isDecimal ? val.toFixed(1) : Math.floor(val).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(step);
  }

  const statEls = document.querySelectorAll('.stat-value, .trust-item-value');
  if (statEls.length) {
    const statObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const raw = el.textContent.replace(/[^0-9.]/g, '');
          const num = parseFloat(raw);
          if (!isNaN(num)) animateCounter(el, num);
          statObs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    statEls.forEach(el => statObs.observe(el));
  }

  // ——— HERO SCROLL BUTTON ———
  const heroScroll = document.getElementById('hero-scroll');
  if (heroScroll) {
    heroScroll.addEventListener('click', () => {
      const trustBar = document.querySelector('.trust-bar') || document.querySelector('.about-section');
      if (trustBar) {
        window.scrollTo({ top: trustBar.offsetTop, behavior: 'smooth' });
      }
    });
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) heroScroll.style.opacity = '0';
      else heroScroll.style.opacity = '1';
    }, { passive: true });
  }

  // ——— HERO VIDEO: PLAY ONCE & HOLD FINAL RESTING IMAGE ———
  const heroVideo = document.getElementById('hero-video');
  const heroPoster = document.getElementById('hero-poster');

  if (heroVideo) {
    heroVideo.addEventListener('ended', function () {
      heroVideo.pause();
      if (heroPoster) {
        heroPoster.style.display = 'block';
        heroPoster.style.opacity = '1';
      }
    });
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (heroVideo) heroVideo.pause();
    if (heroPoster) heroPoster.style.display = 'block';
  }

  // ——— ACTIVE NAV LINK DETECTION ———
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // ——— MASTER CALCULATOR SUITE TABS ———
  const calcTabs = document.querySelectorAll('.calc-tab-btn');
  const calcPanels = document.querySelectorAll('.calc-tab-panel');

  function activateCalcTab(tabId) {
    if (!tabId) return;
    const targetTab = document.querySelector(`.calc-tab-btn[data-tab="${tabId}"]`);
    const targetPanel = document.getElementById(tabId);
    if (targetTab && targetPanel) {
      calcTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      calcPanels.forEach(p => p.classList.remove('active'));

      targetTab.classList.add('active');
      targetTab.setAttribute('aria-selected', 'true');
      targetPanel.classList.add('active');
    }
  }

  if (calcTabs.length && calcPanels.length) {
    calcTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');
        activateCalcTab(targetId);
      });
    });

    // Check if initial hash matches a calculator tab
    if (window.location.hash) {
      const hashId = window.location.hash.replace('#', '');
      activateCalcTab(hashId);
    }

    window.addEventListener('hashchange', () => {
      if (window.location.hash) {
        const hashId = window.location.hash.replace('#', '');
        activateCalcTab(hashId);
      }
    });

    // Dedicated Wealth Planners section quick-open buttons
    document.querySelectorAll('[data-open-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTabId = btn.getAttribute('data-open-tab');
        if (targetTabId) {
          e.preventDefault();
          activateCalcTab(targetTabId);

          // Dedicated Wealth Planners automatically open in Real Historical Mode
          if (targetTabId === 'sip-basic-tab') {
            const sipRealBtn = document.getElementById('sip-btn-mode-real');
            if (sipRealBtn) sipRealBtn.click();
          } else if (targetTabId === 'stp-calc-tab') {
            const stpRealBtn = document.getElementById('stp-btn-mode-real');
            if (stpRealBtn) stpRealBtn.click();
          } else if (targetTabId === 'swp-calc-tab') {
            const swpRealBtn = document.getElementById('swp-btn-mode-real');
            if (swpRealBtn) swpRealBtn.click();
          }

          const studioEl = document.getElementById('portfolio-calculators');
          if (studioEl) {
            studioEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          const targetTabBtn = document.querySelector(`.calc-tab-btn[data-tab="${targetTabId}"]`);
          if (targetTabBtn) {
            targetTabBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
          history.replaceState(null, '', `#${targetTabId}`);
        }
      });
    });
  }

  // Currency helper (Indian Lakhs / Crores)
  function formatINR(val) {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
      return '₹ 0';
    }
    const isNeg = val < 0;
    const absVal = Math.abs(val);
    let str = '';
    if (absVal >= 10000000) {
      const cr = (absVal / 10000000).toFixed(2).replace(/\.00$/, '');
      str = `₹ ${cr} Cr`;
    } else if (absVal >= 100000) {
      const lk = (absVal / 100000).toFixed(2).replace(/\.00$/, '');
      str = `₹ ${lk} Lakhs`;
    } else {
      str = `₹ ${Math.round(absVal).toLocaleString('en-IN')}`;
    }
    return isNeg ? `-${str}` : str;
  }

  // ——— 1. REAL MUTUAL FUND DATA & BASIC SIP CALCULATOR ———
  const sipBasicMonthlyRange = document.getElementById('sip-basic-monthly-range');
  const sipBasicRateRange = document.getElementById('sip-basic-rate-range');
  const sipBasicHorizonRange = document.getElementById('sip-basic-horizon-range');
  const sipBasicMonthlyVal = document.getElementById('sip-basic-monthly-val');
  const sipBasicRateVal = document.getElementById('sip-basic-rate-val');
  const sipBasicHorizonVal = document.getElementById('sip-basic-horizon-val');
  const sipBasicTotalWealth = document.getElementById('sip-basic-total-wealth');
  const sipBasicTotalGain = document.getElementById('sip-basic-total-gain');
  const sipBasicTotalInvested = document.getElementById('sip-basic-total-invested');
  const sipBasicMultiplier = document.getElementById('sip-basic-multiplier');
  const sipBasicBadge = document.getElementById('sip-basic-badge');
  const sipBasicBarInvested = document.getElementById('sip-basic-bar-invested');
  const sipBasicBarGains = document.getElementById('sip-basic-bar-gains');
  const sipBasicLegInv = document.getElementById('sip-basic-leg-inv');
  const sipBasicLegGain = document.getElementById('sip-basic-leg-gain');
  const sipBasicRatioLbl = document.getElementById('sip-basic-ratio-lbl');

  // Real Data Elements
  const sipBtnModeReal = document.getElementById('sip-btn-mode-real');
  const sipBtnModeHypo = document.getElementById('sip-btn-mode-hypo');
  const sipRealControls = document.getElementById('sip-real-controls');
  const sipHypoRateGroup = document.getElementById('sip-hypo-rate-group');
  const sipAmcSelect = document.getElementById('sip-amc-select');
  const sipSchemeSelect = document.getElementById('sip-scheme-select');
  const sipFundCategory = document.getElementById('sip-fund-category');
  const sipFundNavChip = document.getElementById('sip-fund-nav-chip');
  const sipDayVal = document.getElementById('sip-day-val');
  const sipDayPills = document.getElementById('sip-day-pills');
  const sipHorizonLabel = document.getElementById('sip-horizon-label');
  const sipRealMetricsGrid = document.getElementById('sip-real-metrics-grid');
  const sipUnitsVal = document.getElementById('sip-units-val');
  const sipNavVal = document.getElementById('sip-nav-val');
  const sipAbsReturnVal = document.getElementById('sip-abs-return-val');
  const sipCagrReturnVal = document.getElementById('sip-cagr-return-val');
  const sipEngineTitle = document.getElementById('sip-engine-title');
  const sipWealthLabel = document.getElementById('sip-wealth-label');
  const sipGainLabel = document.getElementById('sip-gain-label');
  const sipDisclaimerText = document.getElementById('sip-disclaimer-text');
  const sipRealErrorBanner = document.getElementById('sip-real-error-banner');
  const sipSchemeSearchInput = document.getElementById('sip-scheme-search-input');
  const sipSchemeSearchBtn = document.getElementById('sip-scheme-search-btn');

  if (sipBasicMonthlyRange && sipBasicHorizonRange) {
    // Calculator suite defaults to hypothetical projection mode as per Section 3
    let sipMode = 'hypothetical';
    let sipSelectedDay = 1; // Default to 1st of month matching AMFI factsheet standard
    let currentSchemeData = null;
    let isFetchingScheme = false;
    const sipPeriodDatesChip = document.getElementById('sip-period-dates-chip');

    // Populate AMCs
    if (sipAmcSelect) {
      sipAmcSelect.innerHTML = CURATED_AMCS.map(amc => `<option value="${amc.id}">${amc.name}</option>`).join('');
    }

    function updateSipSchemeOptions(amcId) {
      if (!sipSchemeSelect) return;
      const schemes = CURATED_SCHEMES.filter(s => s.amc === amcId && (s.type === 'equity' || s.type === 'hybrid'));
      sipSchemeSelect.innerHTML = schemes.map(s => `<option value="${s.code}">${s.name}</option>`).join('');
      if (schemes.length > 0) {
        onSipSchemeChange(schemes[0].code);
      }
    }

    function showSipError(message) {
      if (!sipRealErrorBanner) return;
      sipRealErrorBanner.style.display = 'flex';
      sipRealErrorBanner.innerHTML = `
        <div><strong>Live Data Feed Error:</strong> ${message}</div>
        <div style="font-size:12px; color:#FCA5A5;">Real NAV calculations cannot proceed without verified AMFI data. You may switch to mathematical projection mode:</div>
        <button type="button" class="switch-to-hypo-btn" id="sip-error-switch-btn">Switch to Hypothetical CAGR Projection</button>
      `;
      const switchBtn = document.getElementById('sip-error-switch-btn');
      if (switchBtn && sipBtnModeHypo) {
        switchBtn.addEventListener('click', () => {
          sipBtnModeHypo.click();
        });
      }
    }

    function clearSipError() {
      if (sipRealErrorBanner) {
        sipRealErrorBanner.style.display = 'none';
        sipRealErrorBanner.innerHTML = '';
      }
    }

    async function onSipSchemeChange(code) {
      clearSipError();
      const scheme = CURATED_SCHEMES.find(s => s.code === parseInt(code, 10));
      if (scheme && sipFundCategory) {
        sipFundCategory.textContent = scheme.category;
      }
      if (sipFundNavChip) {
        sipFundNavChip.innerHTML = '<span class="pulse-dot"></span> NAV: Fetching live data...';
      }
      isFetchingScheme = true;
      try {
        const data = await fetchSchemeData(code);
        currentSchemeData = data;
        clearSipError();
        if (sipFundNavChip) {
          sipFundNavChip.innerHTML = `<span class="pulse-dot"></span> NAV: ₹ ${data.latestNav.toFixed(2)} (${data.latestDate})`;
        }
        recalculateSIP();
      } catch (err) {
        currentSchemeData = null;
        if (sipFundNavChip) {
          sipFundNavChip.innerHTML = '<span style="color:#ef4444;">Unable to load live NAV</span>';
        }
        showSipError(err.message || 'Failed to retrieve AMFI historical records.');
      } finally {
        isFetchingScheme = false;
      }
    }

    // Dynamic Search Handler
    async function handleSipSchemeSearch() {
      if (!sipSchemeSearchInput) return;
      const query = sipSchemeSearchInput.value.trim();
      if (!query || query.length < 2) return;

      if (sipFundNavChip) {
        sipFundNavChip.innerHTML = '<span class="pulse-dot"></span> Searching AMFI database...';
      }

      try {
        const results = await searchSchemes(query);
        const directGrowthResults = results.filter(r => r.isDirectGrowth);
        if (directGrowthResults.length === 0) {
          showSipError(`No Direct Plan - Growth schemes found matching "${query}". Please refine your query.`);
          return;
        }

        clearSipError();
        // Append search results to scheme select
        const optionsHtml = directGrowthResults.slice(0, 20).map(r => `<option value="${r.code}">${r.name}</option>`).join('');
        if (sipSchemeSelect) {
          sipSchemeSelect.innerHTML = optionsHtml;
          onSipSchemeChange(directGrowthResults[0].code);
        }
      } catch (err) {
        showSipError(err.message || 'Scheme search query failed.');
      }
    }

    if (sipSchemeSearchBtn) {
      sipSchemeSearchBtn.addEventListener('click', handleSipSchemeSearch);
    }
    if (sipSchemeSearchInput) {
      sipSchemeSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSipSchemeSearch();
        }
      });
    }

    if (sipAmcSelect) {
      sipAmcSelect.addEventListener('change', (e) => {
        updateSipSchemeOptions(e.target.value);
      });
    }

    if (sipSchemeSelect) {
      sipSchemeSelect.addEventListener('change', (e) => {
        onSipSchemeChange(e.target.value);
      });
    }

    if (sipDayPills) {
      sipDayPills.querySelectorAll('.radio-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          sipDayPills.querySelectorAll('.radio-pill-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          sipSelectedDay = parseInt(btn.dataset.day, 10);
          if (sipDayVal) sipDayVal.textContent = `${sipSelectedDay}th of every month`;
          recalculateSIP();
        });
      });
    }

    // Toggle Modes
    if (sipBtnModeReal && sipBtnModeHypo) {
      sipBtnModeReal.addEventListener('click', () => {
        sipMode = 'real';
        sipBtnModeReal.classList.add('active');
        sipBtnModeHypo.classList.remove('active');
        if (sipRealControls) sipRealControls.style.display = 'block';
        if (sipHypoRateGroup) sipHypoRateGroup.style.display = 'none';
        if (sipRealMetricsGrid) sipRealMetricsGrid.style.display = 'grid';
        if (sipHorizonLabel) sipHorizonLabel.textContent = 'Historical SIP Period';
        if (sipEngineTitle) sipEngineTitle.textContent = 'Real NAV Historical Simulation Engine';
        if (sipWealthLabel) sipWealthLabel.textContent = 'Simulated Portfolio Valuation';
        if (sipGainLabel) sipGainLabel.textContent = 'Simulated Wealth Gain / Alpha';
        if (sipDisclaimerText) {
          sipDisclaimerText.innerHTML = '<strong>*Historical Simulation Notice:</strong> Calculated using actual historical daily AMFI NAV time-series. Mutual fund investments are subject to market risks; past performance does not predict or guarantee future returns.';
        }
        if (sipBasicHorizonRange) {
          sipBasicHorizonRange.max = '10';
          if (parseInt(sipBasicHorizonRange.value, 10) > 10) sipBasicHorizonRange.value = '5';
        }
        if (!currentSchemeData && sipAmcSelect) {
          updateSipSchemeOptions(sipAmcSelect.value || CURATED_AMCS[0].id);
        } else {
          recalculateSIP();
        }
      });

      sipBtnModeHypo.addEventListener('click', () => {
        sipMode = 'hypothetical';
        sipBtnModeHypo.classList.add('active');
        sipBtnModeReal.classList.remove('active');
        clearSipError();
        if (sipRealControls) sipRealControls.style.display = 'none';
        if (sipHypoRateGroup) sipHypoRateGroup.style.display = 'block';
        if (sipRealMetricsGrid) sipRealMetricsGrid.style.display = 'none';
        if (sipHorizonLabel) sipHorizonLabel.textContent = 'Investment Time Period';
        if (sipEngineTitle) sipEngineTitle.textContent = 'SIP Compounding Model';
        if (sipWealthLabel) sipWealthLabel.textContent = 'Expected Future Wealth';
        if (sipGainLabel) sipGainLabel.textContent = 'Estimated Wealth Gain';
        if (sipDisclaimerText) {
          sipDisclaimerText.innerHTML = '<strong>*Statutory Disclaimer:</strong> Projections calculate smooth compounded growth at assumed CAGR. Mutual Fund investments are subject to market risks; read all scheme-related documents carefully.';
        }
        if (sipBasicHorizonRange) sipBasicHorizonRange.max = '35';
        recalculateSIP();
      });
    }

    function calculateHypotheticalSIP() {
      const monthly = parseFloat(sipBasicMonthlyRange.value);
      const rate = parseFloat(sipBasicRateRange ? sipBasicRateRange.value : 13) / 100;
      const years = parseInt(sipBasicHorizonRange.value, 10);
      const monthlyRate = rate / 12;
      const months = years * 12;

      sipBasicMonthlyVal.textContent = `${formatINR(monthly)} / month`;
      if (sipBasicRateVal) sipBasicRateVal.textContent = `${(rate * 100).toFixed(1)}% p.a.*`;
      sipBasicHorizonVal.textContent = `${years} Year${years > 1 ? 's' : ''}`;
      if (sipBasicBadge) sipBasicBadge.textContent = `${years} Year Horizon`;

      const invested = monthly * months;
      const futureValue = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
      const gain = Math.max(0, futureValue - invested);
      const multiplier = (futureValue / invested).toFixed(2);

      if (sipBasicTotalWealth) sipBasicTotalWealth.textContent = formatINR(futureValue);
      if (sipBasicTotalGain) sipBasicTotalGain.textContent = `+${formatINR(gain)}`;
      if (sipBasicTotalInvested) sipBasicTotalInvested.textContent = formatINR(invested);
      if (sipBasicMultiplier) sipBasicMultiplier.textContent = `${multiplier}x`;
      if (sipBasicLegInv) sipBasicLegInv.textContent = formatINR(invested);
      if (sipBasicLegGain) sipBasicLegGain.textContent = formatINR(gain);

      const invRatio = Math.round((invested / futureValue) * 100);
      const gainRatio = 100 - invRatio;
      if (sipBasicBarInvested) sipBasicBarInvested.style.width = `${invRatio}%`;
      if (sipBasicBarGains) sipBasicBarGains.style.width = `${gainRatio}%`;
      if (sipBasicRatioLbl) sipBasicRatioLbl.textContent = `${gainRatio}% Gains : ${invRatio}% Principal`;
    }

    function recalculateSIP() {
      const monthly = parseFloat(sipBasicMonthlyRange.value);
      const years = parseInt(sipBasicHorizonRange.value, 10);
      sipBasicMonthlyVal.textContent = `${formatINR(monthly)} / month`;
      sipBasicHorizonVal.textContent = `${years} Year${years > 1 ? 's' : ''}`;

      if (sipMode === 'hypothetical' || !currentSchemeData) {
        if (sipPeriodDatesChip) {
          sipPeriodDatesChip.textContent = `Forward Projection (Assumed CAGR)`;
        }
        calculateHypotheticalSIP();
        return;
      }

      // Real Historical Simulation
      const result = calculateRealSIP({
        schemeData: currentSchemeData,
        monthlyAmount: monthly,
        sipDay: sipSelectedDay,
        years
      });

      if (sipBasicBadge) sipBasicBadge.textContent = `${years} Yr Historical Backtest`;
      if (sipPeriodDatesChip) {
        sipPeriodDatesChip.textContent = `${result.firstInstallmentDate} to ${result.lastInstallmentDate} (${result.installmentsCount} Installments)`;
      }
      if (sipBasicTotalWealth) sipBasicTotalWealth.textContent = formatINR(result.currentValuation);
      if (sipBasicTotalGain) sipBasicTotalGain.textContent = `${result.netGain >= 0 ? '+' : ''}${formatINR(result.netGain)}`;
      if (sipBasicTotalInvested) sipBasicTotalInvested.textContent = formatINR(result.totalInvested);
      
      const mult = result.totalInvested > 0 ? (result.currentValuation / result.totalInvested).toFixed(2) : '1.00';
      if (sipBasicMultiplier) sipBasicMultiplier.textContent = `${mult}x`;

      if (sipUnitsVal) sipUnitsVal.textContent = `${result.totalUnits.toFixed(3)} units`;
      if (sipNavVal) sipNavVal.textContent = `₹ ${result.latestNav.toFixed(2)} (${result.latestNavDate})`;
      if (sipAbsReturnVal) sipAbsReturnVal.textContent = `${result.absoluteReturnPercent >= 0 ? '+' : ''}${result.absoluteReturnPercent.toFixed(2)}%`;
      if (sipCagrReturnVal) sipCagrReturnVal.textContent = `${result.annualizedReturnPercent >= 0 ? '+' : ''}${result.annualizedReturnPercent.toFixed(2)}% p.a. (XIRR)`;

      if (sipBasicLegInv) sipBasicLegInv.textContent = formatINR(result.totalInvested);
      if (sipBasicLegGain) sipBasicLegGain.textContent = formatINR(result.netGain);

      const invRatio = result.currentValuation > 0 ? Math.round((result.totalInvested / result.currentValuation) * 100) : 50;
      const gainRatio = Math.max(0, 100 - invRatio);
      if (sipBasicBarInvested) sipBasicBarInvested.style.width = `${invRatio}%`;
      if (sipBasicBarGains) sipBasicBarGains.style.width = `${gainRatio}%`;
      if (sipBasicRatioLbl) sipBasicRatioLbl.textContent = `${gainRatio}% Growth : ${invRatio}% Capital`;
    }

    sipBasicMonthlyRange.addEventListener('input', recalculateSIP);
    sipBasicHorizonRange.addEventListener('input', recalculateSIP);
    if (sipBasicRateRange) sipBasicRateRange.addEventListener('input', recalculateSIP);

    // Default to Real Mutual Fund NAV Data mode so live NAV data is visible on initial load
    if (sipBtnModeReal) {
      sipBtnModeReal.click();
    } else {
      recalculateSIP();
    }
  }

  // ——— 2. LUMPSUM & SIP CALCULATOR ———
  const lsLumpRange = document.getElementById('ls-lump-range');
  const lsSipRange = document.getElementById('ls-sip-range');
  const lsHorizonRange = document.getElementById('ls-horizon-range');
  const lsRateRange = document.getElementById('ls-rate-range');
  const lsLumpVal = document.getElementById('ls-lump-val');
  const lsSipVal = document.getElementById('ls-sip-val');
  const lsHorizonVal = document.getElementById('ls-horizon-val');
  const lsRateVal = document.getElementById('ls-rate-val');
  const lsHorizonLabel = document.getElementById('ls-horizon-label');
  const lsHorizonTicks = document.getElementById('ls-horizon-ticks');
  const lsRateGroup = document.getElementById('ls-rate-group');
  const lsBtnModeReal = document.getElementById('ls-btn-mode-real');
  const lsBtnModeHypo = document.getElementById('ls-btn-mode-hypo');
  const lsRealControls = document.getElementById('ls-real-controls');
  const lsRealErrorBanner = document.getElementById('ls-real-error-banner');
  const lsSchemeSearchInput = document.getElementById('ls-scheme-search-input');
  const lsSchemeSearchBtn = document.getElementById('ls-scheme-search-btn');
  const lsAmcSelect = document.getElementById('ls-amc-select');
  const lsSchemeSelect = document.getElementById('ls-scheme-select');
  const lsFundCategory = document.getElementById('ls-fund-category');
  const lsFundNavChip = document.getElementById('ls-fund-nav-chip');
  const lsDayVal = document.getElementById('ls-day-val');
  const lsDayPills = document.getElementById('ls-day-pills');
  const lsEngineTitle = document.getElementById('ls-engine-title');
  const lsBadge = document.getElementById('ls-badge');
  const lsPeriodDatesChip = document.getElementById('ls-period-dates-chip');
  const lsWealthLbl = document.getElementById('ls-wealth-lbl');
  const lsTotalWealth = document.getElementById('ls-total-wealth');
  const lsGainLbl = document.getElementById('ls-gain-lbl');
  const lsTotalGain = document.getElementById('ls-total-gain');
  const lsInvestedLbl = document.getElementById('ls-invested-lbl');
  const lsTotalInvested = document.getElementById('ls-total-invested');
  const lsYieldLbl = document.getElementById('ls-yield-lbl');
  const lsLumpGrowVal = document.getElementById('ls-lump-grow-val');
  const lsRealMetricsGrid = document.getElementById('ls-real-metrics-grid');
  const lsRealLumpUnits = document.getElementById('ls-real-lump-units');
  const lsRealSipUnits = document.getElementById('ls-real-sip-units');
  const lsRealTotalUnits = document.getElementById('ls-real-total-units');
  const lsRealNavDisplay = document.getElementById('ls-real-nav-display');
  const lsRealAbsReturn = document.getElementById('ls-real-abs-return');
  const lsRealXirr = document.getElementById('ls-real-xirr');
  const lsRealSipOutlay = document.getElementById('ls-real-sip-outlay');
  const lsRealTxCount = document.getElementById('ls-real-tx-count');
  const lsBarInvested = document.getElementById('ls-bar-invested');
  const lsBarGains = document.getElementById('ls-bar-gains');
  const lsLegInv = document.getElementById('ls-leg-inv');
  const lsLegGain = document.getElementById('ls-leg-gain');
  const lsRatioLbl = document.getElementById('ls-ratio-lbl');
  const lsDisclaimerBox = document.getElementById('ls-disclaimer-box');

  if (lsLumpRange && lsSipRange && lsHorizonRange) {
    let lsMode = 'hypothetical';
    let lsSelectedDay = 1;
    let currentLsSchemeData = null;
    let isFetchingLsScheme = false;

    if (lsAmcSelect) {
      lsAmcSelect.innerHTML = CURATED_AMCS.map(amc => `<option value="${amc.id}">${amc.name}</option>`).join('');
    }

    function updateLsSchemeOptions(amcId) {
      if (!lsSchemeSelect) return;
      const schemes = CURATED_SCHEMES.filter(s => s.amc === amcId && (s.type === 'equity' || s.type === 'hybrid'));
      lsSchemeSelect.innerHTML = schemes.map(s => `<option value="${s.code}">${s.name}</option>`).join('');
      if (schemes.length > 0) {
        onLsSchemeChange(schemes[0].code);
      }
    }

    function showLsError(message) {
      if (!lsRealErrorBanner) return;
      lsRealErrorBanner.style.display = 'flex';
      lsRealErrorBanner.innerHTML = `
        <div><strong>Live Data Feed Error:</strong> ${message}</div>
        <div style="font-size:12px; color:#FCA5A5;">Real NAV simulations require verified AMFI data. You may switch to mathematical projection mode:</div>
        <button type="button" class="switch-to-hypo-btn" id="ls-error-switch-btn">Switch to Hypothetical CAGR Projection</button>
      `;
      const switchBtn = document.getElementById('ls-error-switch-btn');
      if (switchBtn && lsBtnModeHypo) {
        switchBtn.addEventListener('click', () => {
          lsBtnModeHypo.click();
        });
      }
    }

    function clearLsError() {
      if (lsRealErrorBanner) {
        lsRealErrorBanner.style.display = 'none';
        lsRealErrorBanner.innerHTML = '';
      }
    }

    async function onLsSchemeChange(code) {
      clearLsError();
      const scheme = CURATED_SCHEMES.find(s => s.code === parseInt(code, 10));
      if (scheme && lsFundCategory) {
        lsFundCategory.textContent = scheme.category;
      }
      if (lsFundNavChip) {
        lsFundNavChip.innerHTML = '<span class="pulse-dot"></span> NAV: Fetching live data...';
      }
      isFetchingLsScheme = true;
      try {
        const data = await fetchSchemeData(code);
        currentLsSchemeData = data;
        clearLsError();
        if (lsFundNavChip) {
          lsFundNavChip.innerHTML = `<span class="pulse-dot"></span> NAV: ₹ ${data.latestNav.toFixed(2)} (${data.latestDate})`;
        }
        recalculateLumpsumSIP();
      } catch (err) {
        currentLsSchemeData = null;
        if (lsFundNavChip) {
          lsFundNavChip.innerHTML = '<span style="color:#ef4444;">Unable to load live NAV</span>';
        }
        showLsError(err.message || 'Failed to retrieve AMFI historical records.');
      } finally {
        isFetchingLsScheme = false;
      }
    }

    async function handleLsSchemeSearch() {
      if (!lsSchemeSearchInput) return;
      const query = lsSchemeSearchInput.value.trim();
      if (!query || query.length < 2) return;

      if (lsFundNavChip) {
        lsFundNavChip.innerHTML = '<span class="pulse-dot"></span> Searching AMFI database...';
      }

      try {
        const results = await searchSchemes(query);
        const directGrowthResults = results.filter(r => r.isDirectGrowth);
        if (directGrowthResults.length === 0) {
          showLsError(`No Direct Plan - Growth schemes found matching "${query}". Please refine your query.`);
          return;
        }

        clearLsError();
        const optionsHtml = directGrowthResults.slice(0, 20).map(r => `<option value="${r.code}">${r.name}</option>`).join('');
        if (lsSchemeSelect) {
          lsSchemeSelect.innerHTML = optionsHtml;
          onLsSchemeChange(directGrowthResults[0].code);
        }
      } catch (err) {
        showLsError(err.message || 'Scheme search query failed.');
      }
    }

    if (lsSchemeSearchBtn) lsSchemeSearchBtn.addEventListener('click', handleLsSchemeSearch);
    if (lsSchemeSearchInput) {
      lsSchemeSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleLsSchemeSearch();
        }
      });
    }

    if (lsAmcSelect) {
      lsAmcSelect.addEventListener('change', (e) => {
        updateLsSchemeOptions(e.target.value);
      });
    }

    if (lsSchemeSelect) {
      lsSchemeSelect.addEventListener('change', (e) => {
        onLsSchemeChange(e.target.value);
      });
    }

    if (lsDayPills) {
      lsDayPills.querySelectorAll('.radio-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          lsDayPills.querySelectorAll('.radio-pill-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          lsSelectedDay = parseInt(btn.dataset.day, 10);
          if (lsDayVal) lsDayVal.textContent = `${lsSelectedDay}${lsSelectedDay === 1 ? 'st' : 'th'} of every month`;
          recalculateLumpsumSIP();
        });
      });
    }

    // Mode switching for Lumpsum & SIP
    if (lsBtnModeReal && lsBtnModeHypo) {
      lsBtnModeReal.addEventListener('click', () => {
        lsMode = 'real';
        lsBtnModeReal.classList.add('active');
        lsBtnModeHypo.classList.remove('active');
        if (lsRealControls) lsRealControls.style.display = 'block';
        if (lsRateGroup) lsRateGroup.style.display = 'none';
        if (lsRealMetricsGrid) lsRealMetricsGrid.style.display = 'grid';
        if (lsHorizonLabel) lsHorizonLabel.textContent = 'Historical Investment Period';
        if (lsEngineTitle) lsEngineTitle.textContent = 'Real NAV Historical Simulation Engine';
        if (lsWealthLbl) lsWealthLbl.innerHTML = 'Simulated Portfolio Valuation <span class="live-nav-chip"><span class="pulse-dot"></span> Live NAV</span>';
        if (lsGainLbl) lsGainLbl.textContent = 'Simulated Capital Gain / Alpha';
        if (lsInvestedLbl) lsInvestedLbl.textContent = 'Total Capital Invested';
        if (lsYieldLbl) lsYieldLbl.textContent = 'Lumpsum Component Value';
        if (lsDisclaimerBox) {
          lsDisclaimerBox.innerHTML = '<strong>*Historical Simulation Notice:</strong> Calculated using actual historical AMFI daily NAV time-series. Mutual fund investments are subject to market risks; past performance does not guarantee future results.';
        }
        if (lsHorizonRange) {
          lsHorizonRange.max = '10';
          if (parseInt(lsHorizonRange.value, 10) > 10) lsHorizonRange.value = '5';
          if (lsHorizonTicks) {
            lsHorizonTicks.innerHTML = '<span>1 Yr</span><span>3 Yrs</span><span>5 Yrs</span><span>10 Yrs</span>';
          }
        }
        if (!currentLsSchemeData && lsAmcSelect) {
          updateLsSchemeOptions(lsAmcSelect.value || CURATED_AMCS[0].id);
        } else {
          recalculateLumpsumSIP();
        }
      });

      lsBtnModeHypo.addEventListener('click', () => {
        lsMode = 'hypothetical';
        lsBtnModeHypo.classList.add('active');
        lsBtnModeReal.classList.remove('active');
        clearLsError();
        if (lsRealControls) lsRealControls.style.display = 'none';
        if (lsRateGroup) lsRateGroup.style.display = 'block';
        if (lsRealMetricsGrid) lsRealMetricsGrid.style.display = 'none';
        if (lsHorizonLabel) lsHorizonLabel.textContent = 'Investment Duration';
        if (lsEngineTitle) lsEngineTitle.textContent = 'Hybrid Compounding Model';
        if (lsWealthLbl) lsWealthLbl.innerHTML = 'Total Future Value <span class="illustrative-pill">Hypothetical</span>';
        if (lsGainLbl) lsGainLbl.textContent = 'Estimated Total Gain';
        if (lsInvestedLbl) lsInvestedLbl.textContent = 'Total Principal Outlay';
        if (lsYieldLbl) lsYieldLbl.textContent = 'Lumpsum Yield Contribution';
        if (lsPeriodDatesChip) lsPeriodDatesChip.textContent = '';
        if (lsDisclaimerBox) {
          lsDisclaimerBox.innerHTML = '<strong>*Statutory Disclaimer:</strong> Lumpsum and SIP compounding simulations assume regular annual CAGR. Mutual Fund investments are subject to market risks; read all scheme documents.';
        }
        if (lsHorizonRange) {
          lsHorizonRange.max = '30';
          if (lsHorizonTicks) {
            lsHorizonTicks.innerHTML = '<span>1 Yr</span><span>10 Yrs</span><span>20 Yrs</span><span>30 Yrs</span>';
          }
        }
        recalculateLumpsumSIP();
      });
    }

    function recalculateLumpsumSIP() {
      const lump = parseFloat(lsLumpRange.value) || 0;
      const sip = parseFloat(lsSipRange.value) || 0;
      const years = parseInt(lsHorizonRange.value, 10) || 1;

      if (lsLumpVal) lsLumpVal.textContent = formatINR(lump);
      if (lsSipVal) lsSipVal.textContent = `${formatINR(sip)} / month`;
      if (lsHorizonVal) lsHorizonVal.textContent = `${years} Year${years > 1 ? 's' : ''}`;

      if (lsMode === 'real') {
        if (!currentLsSchemeData || isFetchingLsScheme) {
          return;
        }

        try {
          clearLsError();
          const res = calculateRealLumpsumSIP({
            schemeData: currentLsSchemeData,
            lumpsumAmount: lump,
            monthlyAmount: sip,
            sipDay: lsSelectedDay,
            years
          });

          if (lsBadge) lsBadge.textContent = `${years} Year Historical NAV`;
          if (lsPeriodDatesChip) lsPeriodDatesChip.textContent = `${res.firstInstallmentDate} → ${res.latestNavDate}`;
          if (lsTotalWealth) lsTotalWealth.textContent = formatINR(res.currentValuation);
          if (lsTotalGain) lsTotalGain.textContent = `${res.netGain >= 0 ? '+' : '-'}${formatINR(Math.abs(res.netGain))}`;
          if (lsTotalInvested) lsTotalInvested.textContent = formatINR(res.totalInvested);
          if (lsLumpGrowVal) lsLumpGrowVal.textContent = formatINR(res.lumpsumValuation);

          // Real stat boxes
          if (lsRealLumpUnits) lsRealLumpUnits.textContent = res.initialLumpsumUnits.toFixed(3);
          if (lsRealSipUnits) lsRealSipUnits.textContent = res.sipUnits.toFixed(3);
          if (lsRealTotalUnits) lsRealTotalUnits.textContent = res.totalUnits.toFixed(3);
          if (lsRealNavDisplay) lsRealNavDisplay.textContent = `₹ ${res.latestNav.toFixed(2)} (${res.latestNavDate})`;
          if (lsRealAbsReturn) lsRealAbsReturn.textContent = `${res.absoluteReturnPercent >= 0 ? '+' : ''}${res.absoluteReturnPercent.toFixed(2)}%`;
          if (lsRealXirr) lsRealXirr.textContent = `${res.annualizedReturnPercent.toFixed(2)}% p.a.`;
          if (lsRealSipOutlay) lsRealSipOutlay.textContent = formatINR(res.totalSipInvested);
          if (lsRealTxCount) lsRealTxCount.textContent = `${res.installmentsCount + (res.initialLumpsum > 0 ? 1 : 0)} executions`;

          if (lsLegInv) lsLegInv.textContent = formatINR(res.totalInvested);
          if (lsLegGain) lsLegGain.textContent = formatINR(Math.max(0, res.netGain));

          const invRatio = res.currentValuation > 0 ? Math.min(100, Math.round((res.totalInvested / res.currentValuation) * 100)) : 100;
          const gainRatio = Math.max(0, 100 - invRatio);
          if (lsBarInvested) lsBarInvested.style.width = `${invRatio}%`;
          if (lsBarGains) lsBarGains.style.width = `${gainRatio}%`;
          if (lsRatioLbl) lsRatioLbl.textContent = `${gainRatio}% Growth : ${invRatio}% Capital`;
        } catch (err) {
          showLsError(err.message || 'Error executing historical simulation.');
        }
      } else {
        // Hypothetical Projection
        const rate = lsRateRange ? (parseFloat(lsRateRange.value) / 100) : 0.13;
        const monthlyRate = rate / 12;
        const months = years * 12;

        if (lsRateVal) lsRateVal.textContent = `${(rate * 100).toFixed(1)}% p.a.*`;
        if (lsBadge) lsBadge.textContent = 'Combined Portfolio';
        if (lsPeriodDatesChip) lsPeriodDatesChip.textContent = '';

        const lumpFV = lump * Math.pow(1 + rate, years);
        const sipFV = monthlyRate > 0 ? (sip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)) : (sip * months);
        const totalInvested = lump + (sip * months);
        const totalWealth = lumpFV + sipFV;
        const totalGain = Math.max(0, totalWealth - totalInvested);

        if (lsTotalWealth) lsTotalWealth.textContent = formatINR(totalWealth);
        if (lsTotalGain) lsTotalGain.textContent = `+${formatINR(totalGain)}`;
        if (lsTotalInvested) lsTotalInvested.textContent = formatINR(totalInvested);
        if (lsLumpGrowVal) lsLumpGrowVal.textContent = formatINR(lumpFV);
        if (lsLegInv) lsLegInv.textContent = formatINR(totalInvested);
        if (lsLegGain) lsLegGain.textContent = formatINR(totalGain);

        const invRatio = totalWealth > 0 ? Math.min(100, Math.round((totalInvested / totalWealth) * 100)) : 100;
        const gainRatio = Math.max(0, 100 - invRatio);
        if (lsBarInvested) lsBarInvested.style.width = `${invRatio}%`;
        if (lsBarGains) lsBarGains.style.width = `${gainRatio}%`;
        if (lsRatioLbl) lsRatioLbl.textContent = `${gainRatio}% Growth : ${invRatio}% Capital`;
      }
    }

    lsLumpRange.addEventListener('input', recalculateLumpsumSIP);
    lsSipRange.addEventListener('input', recalculateLumpsumSIP);
    lsHorizonRange.addEventListener('input', recalculateLumpsumSIP);
    if (lsRateRange) lsRateRange.addEventListener('input', recalculateLumpsumSIP);

    // Default to Real Mutual Fund NAV Data mode so live NAV data is visible on initial load
    if (lsBtnModeReal) {
      lsBtnModeReal.click();
    } else {
      recalculateLumpsumSIP();
    }
  }

  // ——— 3. STEP-UP SIP CALCULATOR ———
  const sipMonthlyRange = document.getElementById('sip-monthly-range');
  const sipStepupRange = document.getElementById('sip-stepup-range');
  const sipHorizonRange = document.getElementById('sip-horizon-range');
  const sipRateRange = document.getElementById('sip-rate-range');
  const sipMonthlyVal = document.getElementById('sip-monthly-val');
  const sipStepupVal = document.getElementById('sip-stepup-val');
  const sipHorizonVal = document.getElementById('sip-horizon-val');
  const sipRateVal = document.getElementById('sip-rate-val');
  const stepupMonthlyLbl = document.getElementById('stepup-monthly-lbl');
  const stepupHorizonLabel = document.getElementById('stepup-horizon-label');
  const stepupHorizonTicks = document.getElementById('stepup-horizon-ticks');
  const stepupRateGroup = document.getElementById('stepup-rate-group');
  const stepupBtnModeReal = document.getElementById('stepup-btn-mode-real');
  const stepupBtnModeHypo = document.getElementById('stepup-btn-mode-hypo');
  const stepupRealControls = document.getElementById('stepup-real-controls');
  const stepupRealErrorBanner = document.getElementById('stepup-real-error-banner');
  const stepupSchemeSearchInput = document.getElementById('stepup-scheme-search-input');
  const stepupSchemeSearchBtn = document.getElementById('stepup-scheme-search-btn');
  const stepupAmcSelect = document.getElementById('stepup-amc-select');
  const stepupSchemeSelect = document.getElementById('stepup-scheme-select');
  const stepupFundCategory = document.getElementById('stepup-fund-category');
  const stepupFundNavChip = document.getElementById('stepup-fund-nav-chip');
  const stepupDayVal = document.getElementById('stepup-day-val');
  const stepupDayPills = document.getElementById('stepup-day-pills');
  const stepupEngineTitle = document.getElementById('stepup-engine-title');
  const stepupPeriodDatesChip = document.getElementById('stepup-period-dates-chip');
  const stepupWealthLbl = document.getElementById('stepup-wealth-lbl');
  const sipTotalWealth = document.getElementById('sip-total-wealth');
  const stepupGainLbl = document.getElementById('stepup-gain-lbl');
  const sipTotalGain = document.getElementById('sip-total-gain');
  const stepupInvestedLbl = document.getElementById('stepup-invested-lbl');
  const sipTotalInvested = document.getElementById('sip-total-invested');
  const stepupStat4Lbl = document.getElementById('stepup-stat4-lbl');
  const sipAdvantage = document.getElementById('sip-advantage');
  const sipBadge = document.getElementById('sip-badge');
  const stepupRealMetricsGrid = document.getElementById('stepup-real-metrics-grid');
  const stepupRealUnits = document.getElementById('stepup-real-units');
  const stepupRealNavDisplay = document.getElementById('stepup-real-nav-display');
  const stepupRealAbsReturn = document.getElementById('stepup-real-abs-return');
  const stepupRealXirr = document.getElementById('stepup-real-xirr');
  const stepupRealScheduleList = document.getElementById('stepup-real-schedule-list');
  const stepupRealTxCount = document.getElementById('stepup-real-tx-count');
  const sipBarInvested = document.getElementById('sip-bar-invested');
  const sipBarGains = document.getElementById('sip-bar-gains');
  const sipLegInv = document.getElementById('sip-leg-inv');
  const sipLegGain = document.getElementById('sip-leg-gain');
  const sipRatioLbl = document.getElementById('sip-ratio-lbl');
  const stepupDisclaimerBox = document.getElementById('stepup-disclaimer-box');

  if (sipMonthlyRange && sipStepupRange && sipHorizonRange) {
    let stepupMode = 'hypothetical';
    let stepupSelectedDay = 1;
    let currentStepupSchemeData = null;
    let isFetchingStepupScheme = false;

    if (stepupAmcSelect) {
      stepupAmcSelect.innerHTML = CURATED_AMCS.map(amc => `<option value="${amc.id}">${amc.name}</option>`).join('');
    }

    function updateStepupSchemeOptions(amcId) {
      if (!stepupSchemeSelect) return;
      const schemes = CURATED_SCHEMES.filter(s => s.amc === amcId && (s.type === 'equity' || s.type === 'hybrid'));
      stepupSchemeSelect.innerHTML = schemes.map(s => `<option value="${s.code}">${s.name}</option>`).join('');
      if (schemes.length > 0) {
        onStepupSchemeChange(schemes[0].code);
      }
    }

    function showStepupError(message) {
      if (!stepupRealErrorBanner) return;
      stepupRealErrorBanner.style.display = 'flex';
      stepupRealErrorBanner.innerHTML = `
        <div><strong>Live Data Feed Error:</strong> ${message}</div>
        <div style="font-size:12px; color:#FCA5A5;">Real NAV simulations require verified AMFI data. You may switch to mathematical projection mode:</div>
        <button type="button" class="switch-to-hypo-btn" id="stepup-error-switch-btn">Switch to Hypothetical CAGR Projection</button>
      `;
      const switchBtn = document.getElementById('stepup-error-switch-btn');
      if (switchBtn && stepupBtnModeHypo) {
        switchBtn.addEventListener('click', () => {
          stepupBtnModeHypo.click();
        });
      }
    }

    function clearStepupError() {
      if (!stepupRealErrorBanner) return;
      stepupRealErrorBanner.style.display = 'none';
      stepupRealErrorBanner.innerHTML = '';
    }

    async function onStepupSchemeChange(code) {
      clearStepupError();
      const scheme = CURATED_SCHEMES.find(s => s.code === parseInt(code, 10));
      if (scheme && stepupFundCategory) {
        stepupFundCategory.textContent = scheme.category;
      }
      if (stepupFundNavChip) {
        stepupFundNavChip.innerHTML = '<span class="pulse-dot"></span> NAV: Fetching live data...';
      }
      isFetchingStepupScheme = true;
      try {
        const data = await fetchSchemeData(code);
        currentStepupSchemeData = data;
        clearStepupError();
        if (stepupFundNavChip) {
          stepupFundNavChip.innerHTML = `<span class="pulse-dot"></span> NAV: ₹ ${data.latestNav.toFixed(2)} (${data.latestDate})`;
        }
        recalculateStepUpSIP();
      } catch (err) {
        currentStepupSchemeData = null;
        if (stepupFundNavChip) {
          stepupFundNavChip.innerHTML = '<span style="color:#ef4444;">Unable to load live NAV</span>';
        }
        showStepupError(err.message || 'Failed to retrieve AMFI historical records.');
      } finally {
        isFetchingStepupScheme = false;
      }
    }

    async function handleStepupSchemeSearch() {
      if (!stepupSchemeSearchInput) return;
      const query = stepupSchemeSearchInput.value.trim();
      if (!query || query.length < 2) return;

      if (stepupFundNavChip) {
        stepupFundNavChip.innerHTML = '<span class="pulse-dot"></span> Searching AMFI database...';
      }

      try {
        const results = await searchSchemes(query);
        const directGrowthResults = results.filter(r => r.isDirectGrowth);
        if (directGrowthResults.length === 0) {
          showStepupError(`No Direct Plan - Growth schemes found matching "${query}". Please refine your query.`);
          return;
        }

        clearStepupError();
        const optionsHtml = directGrowthResults.slice(0, 20).map(r => `<option value="${r.code}">${r.name}</option>`).join('');
        if (stepupSchemeSelect) {
          stepupSchemeSelect.innerHTML = optionsHtml;
          onStepupSchemeChange(directGrowthResults[0].code);
        }
      } catch (err) {
        showStepupError(err.message || 'Scheme search query failed.');
      }
    }

    if (stepupSchemeSearchBtn) stepupSchemeSearchBtn.addEventListener('click', handleStepupSchemeSearch);
    if (stepupSchemeSearchInput) {
      stepupSchemeSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleStepupSchemeSearch();
        }
      });
    }

    if (stepupAmcSelect) {
      stepupAmcSelect.addEventListener('change', (e) => {
        updateStepupSchemeOptions(e.target.value);
      });
    }

    if (stepupSchemeSelect) {
      stepupSchemeSelect.addEventListener('change', (e) => {
        onStepupSchemeChange(e.target.value);
      });
    }

    if (stepupDayPills) {
      stepupDayPills.querySelectorAll('.radio-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          stepupDayPills.querySelectorAll('.radio-pill-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          stepupSelectedDay = parseInt(btn.dataset.day, 10);
          if (stepupDayVal) stepupDayVal.textContent = `${stepupSelectedDay}${stepupSelectedDay === 1 ? 'st' : 'th'} of every month`;
          recalculateStepUpSIP();
        });
      });
    }

    // Mode switching for Step-Up SIP
    if (stepupBtnModeReal && stepupBtnModeHypo) {
      stepupBtnModeReal.addEventListener('click', () => {
        stepupMode = 'real';
        stepupBtnModeReal.classList.add('active');
        stepupBtnModeHypo.classList.remove('active');
        if (stepupRealControls) stepupRealControls.style.display = 'block';
        if (stepupRateGroup) stepupRateGroup.style.display = 'none';
        if (stepupRealMetricsGrid) stepupRealMetricsGrid.style.display = 'grid';
        if (stepupHorizonLabel) stepupHorizonLabel.textContent = 'Historical SIP Period';
        if (stepupMonthlyLbl) stepupMonthlyLbl.textContent = 'Starting Monthly Investment';
        if (stepupEngineTitle) stepupEngineTitle.textContent = 'Real NAV Step-Up Simulation Engine';
        if (stepupWealthLbl) stepupWealthLbl.innerHTML = 'Simulated Portfolio Valuation <span class="live-nav-chip"><span class="pulse-dot"></span> Live NAV</span>';
        if (stepupGainLbl) stepupGainLbl.textContent = 'Simulated Capital Gain / Alpha';
        if (stepupInvestedLbl) stepupInvestedLbl.textContent = 'Total Capital Invested';
        if (stepupStat4Lbl) stepupStat4Lbl.textContent = 'Annual Step-Up Rate';
        if (stepupDisclaimerBox) {
          stepupDisclaimerBox.innerHTML = '<strong>*Historical Simulation Notice:</strong> Calculated using actual historical AMFI daily NAV time-series with annual SIP increments. Mutual fund investments are subject to market risks; past performance does not guarantee future results.';
        }
        if (sipHorizonRange) {
          sipHorizonRange.max = '10';
          if (parseInt(sipHorizonRange.value, 10) > 10) sipHorizonRange.value = '5';
          if (stepupHorizonTicks) {
            stepupHorizonTicks.innerHTML = '<span>1 Yr</span><span>3 Yrs</span><span>5 Yrs</span><span>10 Yrs</span>';
          }
        }
        if (!currentStepupSchemeData && stepupAmcSelect) {
          updateStepupSchemeOptions(stepupAmcSelect.value || CURATED_AMCS[0].id);
        } else {
          recalculateStepUpSIP();
        }
      });

      stepupBtnModeHypo.addEventListener('click', () => {
        stepupMode = 'hypothetical';
        stepupBtnModeHypo.classList.add('active');
        stepupBtnModeReal.classList.remove('active');
        clearStepupError();
        if (stepupRealControls) stepupRealControls.style.display = 'none';
        if (stepupRateGroup) stepupRateGroup.style.display = 'block';
        if (stepupRealMetricsGrid) stepupRealMetricsGrid.style.display = 'none';
        if (stepupHorizonLabel) stepupHorizonLabel.textContent = 'Investment Duration';
        if (stepupMonthlyLbl) stepupMonthlyLbl.textContent = 'Initial Monthly Investment';
        if (stepupEngineTitle) stepupEngineTitle.textContent = 'Step-Up Compounding Engine';
        if (stepupWealthLbl) stepupWealthLbl.innerHTML = 'Expected Future Corpus <span class="illustrative-pill">Hypothetical</span>';
        if (stepupGainLbl) stepupGainLbl.textContent = 'Estimated Wealth Gain';
        if (stepupInvestedLbl) stepupInvestedLbl.textContent = 'Total Amount Invested';
        if (stepupStat4Lbl) stepupStat4Lbl.textContent = 'Step-Up Advantage vs Flat';
        if (stepupPeriodDatesChip) stepupPeriodDatesChip.textContent = '';
        if (stepupDisclaimerBox) {
          stepupDisclaimerBox.innerHTML = '<strong>*Statutory Disclosure:</strong> Step-Up SIP projections calculate annual contribution increments with constant CAGR compounding for illustrative modeling. Mutual Fund investments are subject to market risks.';
        }
        if (sipHorizonRange) {
          sipHorizonRange.max = '30';
          if (stepupHorizonTicks) {
            stepupHorizonTicks.innerHTML = '<span>1 Yr</span><span>10 Yrs</span><span>20 Yrs</span><span>30 Yrs</span>';
          }
        }
        recalculateStepUpSIP();
      });
    }

    function recalculateStepUpSIP() {
      const initialMonthly = parseFloat(sipMonthlyRange.value) || 0;
      const stepUpPercent = parseFloat(sipStepupRange.value) || 0;
      const years = parseInt(sipHorizonRange.value, 10) || 1;

      if (sipMonthlyVal) sipMonthlyVal.textContent = `${formatINR(initialMonthly)} / month`;
      if (sipStepupVal) sipStepupVal.textContent = stepUpPercent === 0 ? '0% (Flat SIP)' : `${stepUpPercent.toFixed(0)}% per year`;
      if (sipHorizonVal) sipHorizonVal.textContent = `${years} Year${years > 1 ? 's' : ''}`;

      if (stepupMode === 'real') {
        if (!currentStepupSchemeData || isFetchingStepupScheme) {
          return;
        }

        try {
          clearStepupError();
          const res = calculateRealStepUpSIP({
            schemeData: currentStepupSchemeData,
            initialMonthlyAmount: initialMonthly,
            stepUpPercent,
            sipDay: stepupSelectedDay,
            years
          });

          if (sipBadge) sipBadge.textContent = `${years} Year Historical Step-Up`;
          if (stepupPeriodDatesChip) stepupPeriodDatesChip.textContent = `${res.firstInstallmentDate} → ${res.latestNavDate}`;
          if (sipTotalWealth) sipTotalWealth.textContent = formatINR(res.currentValuation);
          if (sipTotalGain) sipTotalGain.textContent = `${res.netGain >= 0 ? '+' : '-'}${formatINR(Math.abs(res.netGain))}`;
          if (sipTotalInvested) sipTotalInvested.textContent = formatINR(res.totalInvested);
          if (sipAdvantage) sipAdvantage.textContent = stepUpPercent === 0 ? 'Flat (0%)' : `+${stepUpPercent.toFixed(0)}% / yr`;

          // Real stat boxes
          if (stepupRealUnits) stepupRealUnits.textContent = res.totalUnits.toFixed(3);
          if (stepupRealNavDisplay) stepupRealNavDisplay.textContent = `₹ ${res.latestNav.toFixed(2)} (${res.latestNavDate})`;
          if (stepupRealAbsReturn) stepupRealAbsReturn.textContent = `${res.absoluteReturnPercent >= 0 ? '+' : ''}${res.absoluteReturnPercent.toFixed(2)}%`;
          if (stepupRealXirr) stepupRealXirr.textContent = `${res.annualizedReturnPercent.toFixed(2)}% p.a.`;
          if (stepupRealTxCount) stepupRealTxCount.textContent = `${res.installmentsCount} monthly installments executed`;

          if (stepupRealScheduleList && res.annualSchedule) {
            stepupRealScheduleList.innerHTML = res.annualSchedule.map(s => 
              `<span style="background:rgba(200,169,110,0.12); padding:3px 8px; border-radius:4px; border:1px solid rgba(200,169,110,0.25);">Yr ${s.year}: ${formatINR(s.monthlyAmount)}/mo</span>`
            ).join('');
          }

          if (sipLegInv) sipLegInv.textContent = formatINR(res.totalInvested);
          if (sipLegGain) sipLegGain.textContent = formatINR(Math.max(0, res.netGain));

          const invRatio = res.currentValuation > 0 ? Math.min(100, Math.round((res.totalInvested / res.currentValuation) * 100)) : 100;
          const gainRatio = Math.max(0, 100 - invRatio);
          if (sipBarInvested) sipBarInvested.style.width = `${invRatio}%`;
          if (sipBarGains) sipBarGains.style.width = `${gainRatio}%`;
          if (sipRatioLbl) sipRatioLbl.textContent = `${gainRatio}% Growth : ${invRatio}% Capital`;
        } catch (err) {
          showStepupError(err.message || 'Error executing historical simulation.');
        }
      } else {
        // Hypothetical Projection
        const stepUpDecimal = stepUpPercent / 100;
        const annualRate = sipRateRange ? (parseFloat(sipRateRange.value) / 100) : 0.13;
        const monthlyRate = annualRate / 12;

        if (sipRateVal) sipRateVal.textContent = `${(annualRate * 100).toFixed(1)}% p.a.*`;
        if (sipBadge) sipBadge.textContent = stepUpPercent === 0 ? 'Regular Flat SIP' : `+${stepUpPercent.toFixed(0)}% Annual Step-Up`;
        if (stepupPeriodDatesChip) stepupPeriodDatesChip.textContent = '';

        let totalInvested = 0;
        let futureValue = 0;
        const totalMonths = years * 12;

        for (let m = 1; m <= totalMonths; m++) {
          const yearIndex = Math.floor((m - 1) / 12);
          const currentMonthly = initialMonthly * Math.pow(1 + stepUpDecimal, yearIndex);
          totalInvested += currentMonthly;
          futureValue += currentMonthly * Math.pow(1 + monthlyRate, totalMonths - m + 1);
        }

        let flatFV = 0;
        for (let m = 1; m <= totalMonths; m++) {
          flatFV += initialMonthly * Math.pow(1 + monthlyRate, totalMonths - m + 1);
        }

        const totalGain = Math.max(0, futureValue - totalInvested);
        const advantage = Math.max(0, futureValue - flatFV);

        if (sipTotalWealth) sipTotalWealth.textContent = formatINR(futureValue);
        if (sipTotalGain) sipTotalGain.textContent = `+${formatINR(totalGain)}`;
        if (sipTotalInvested) sipTotalInvested.textContent = formatINR(totalInvested);
        if (sipAdvantage) sipAdvantage.textContent = stepUpPercent === 0 ? '₹ 0 (Base)' : `+${formatINR(advantage)}`;
        if (sipLegInv) sipLegInv.textContent = formatINR(totalInvested);
        if (sipLegGain) sipLegGain.textContent = formatINR(totalGain);

        const invRatio = futureValue > 0 ? Math.min(100, Math.round((totalInvested / futureValue) * 100)) : 100;
        const gainRatio = Math.max(0, 100 - invRatio);
        if (sipBarInvested) sipBarInvested.style.width = `${invRatio}%`;
        if (sipBarGains) sipBarGains.style.width = `${gainRatio}%`;
        if (sipRatioLbl) sipRatioLbl.textContent = `${gainRatio}% Growth : ${invRatio}% Capital`;
      }
    }

    sipMonthlyRange.addEventListener('input', recalculateStepUpSIP);
    sipStepupRange.addEventListener('input', recalculateStepUpSIP);
    sipHorizonRange.addEventListener('input', recalculateStepUpSIP);
    if (sipRateRange) sipRateRange.addEventListener('input', recalculateStepUpSIP);

    // Default to Real Mutual Fund NAV Data mode so live NAV data is visible on initial load
    if (stepupBtnModeReal) {
      stepupBtnModeReal.click();
    } else {
      recalculateStepUpSIP();
    }
  }

  // ——— 4. SIP - COST OF DELAY CALCULATOR ———
  const delaySipRange = document.getElementById('delay-sip-range');
  const delayYearsRange = document.getElementById('delay-years-range');
  const delayHorizonRange = document.getElementById('delay-horizon-range');
  const delayRateRange = document.getElementById('delay-rate-range');
  const delaySipVal = document.getElementById('delay-sip-val');
  const delayYearsVal = document.getElementById('delay-years-val');
  const delayHorizonVal = document.getElementById('delay-horizon-val');
  const delayRateVal = document.getElementById('delay-rate-val');
  const delayCostVal = document.getElementById('delay-cost-val');
  const delayCatchupSip = document.getElementById('delay-catchup-sip');
  const delayOntimeWealth = document.getElementById('delay-ontime-wealth');
  const delayDelayedWealth = document.getElementById('delay-delayed-wealth');
  const delayBadge = document.getElementById('delay-badge');
  const delayBarDelayed = document.getElementById('delay-bar-delayed');
  const delayBarLoss = document.getElementById('delay-bar-loss');
  const delayLegDelayed = document.getElementById('delay-leg-delayed');
  const delayLegLoss = document.getElementById('delay-leg-loss');
  const delayRatioLbl = document.getElementById('delay-ratio-lbl');

  if (delaySipRange && delayYearsRange && delayHorizonRange && delayRateRange) {
    function calculateCostOfDelay() {
      const sip = parseFloat(delaySipRange.value);
      const delayYrs = parseInt(delayYearsRange.value, 10);
      const horizonYrs = parseInt(delayHorizonRange.value, 10);
      const rate = parseFloat(delayRateRange.value) / 100;
      const monthlyRate = rate / 12;

      delaySipVal.textContent = `${formatINR(sip)} / month`;
      delayYearsVal.textContent = `${delayYrs} Year${delayYrs > 1 ? 's' : ''}`;
      delayHorizonVal.textContent = `${horizonYrs} Year${horizonYrs > 1 ? 's' : ''}`;
      delayRateVal.textContent = `${(rate * 100).toFixed(1)}% p.a.*`;
      if (delayBadge) delayBadge.textContent = `${delayYrs} Year Delay Penalty`;

      const ontimeMonths = horizonYrs * 12;
      const ontimeWealth = sip * ((Math.pow(1 + monthlyRate, ontimeMonths) - 1) / monthlyRate) * (1 + monthlyRate);

      const delayedMonths = Math.max(0, (horizonYrs - delayYrs) * 12);
      const delayedWealth = delayedMonths > 0 ? sip * ((Math.pow(1 + monthlyRate, delayedMonths) - 1) / monthlyRate) * (1 + monthlyRate) : 0;
      const costOfDelay = Math.max(0, ontimeWealth - delayedWealth);

      const catchupSIP = delayedMonths > 0 ? (ontimeWealth * monthlyRate) / ((Math.pow(1 + monthlyRate, delayedMonths) - 1) * (1 + monthlyRate)) : 0;

      if (delayCostVal) delayCostVal.textContent = `-${formatINR(costOfDelay)}`;
      if (delayCatchupSip) delayCatchupSip.textContent = `${formatINR(catchupSIP)} / mo`;
      if (delayOntimeWealth) delayOntimeWealth.textContent = formatINR(ontimeWealth);
      if (delayDelayedWealth) delayDelayedWealth.textContent = formatINR(delayedWealth);
      if (delayLegDelayed) delayLegDelayed.textContent = formatINR(delayedWealth);
      if (delayLegLoss) delayLegLoss.textContent = formatINR(costOfDelay);

      const delayedRatio = Math.round((delayedWealth / ontimeWealth) * 100);
      const lossRatio = 100 - delayedRatio;
      if (delayBarDelayed) delayBarDelayed.style.width = `${delayedRatio}%`;
      if (delayBarLoss) delayBarLoss.style.width = `${lossRatio}%`;
      if (delayRatioLbl) delayRatioLbl.textContent = `${lossRatio}% Wealth Destroyed by Delay`;
    }

    delaySipRange.addEventListener('input', calculateCostOfDelay);
    delayYearsRange.addEventListener('input', calculateCostOfDelay);
    delayHorizonRange.addEventListener('input', calculateCostOfDelay);
    delayRateRange.addEventListener('input', calculateCostOfDelay);
    calculateCostOfDelay();
  }

  // ——— 5. SIP TENURE CALCULATOR ———
  const tenureTargetRange = document.getElementById('tenure-target-range');
  const tenureSipRange = document.getElementById('tenure-sip-range');
  const tenureRateRange = document.getElementById('tenure-rate-range');
  const tenureTargetVal = document.getElementById('tenure-target-val');
  const tenureSipVal = document.getElementById('tenure-sip-val');
  const tenureRateVal = document.getElementById('tenure-rate-val');
  const tenureResultYears = document.getElementById('tenure-result-years');
  const tenureTotalGain = document.getElementById('tenure-total-gain');
  const tenureTotalInvested = document.getElementById('tenure-total-invested');
  const tenureBadge = document.getElementById('tenure-badge');
  const tenureBarInvested = document.getElementById('tenure-bar-invested');
  const tenureBarGain = document.getElementById('tenure-bar-gain');
  const tenureLegInv = document.getElementById('tenure-leg-inv');
  const tenureLegGain = document.getElementById('tenure-leg-gain');
  const tenureRatioLbl = document.getElementById('tenure-ratio-lbl');

  if (tenureTargetRange && tenureSipRange && tenureRateRange) {
    function calculateSIPTenure() {
      const targetCorpus = parseFloat(tenureTargetRange.value) * 100000;
      const sip = parseFloat(tenureSipRange.value);
      const rate = parseFloat(tenureRateRange.value) / 100;
      const monthlyRate = rate / 12;

      tenureTargetVal.textContent = formatINR(targetCorpus);
      tenureSipVal.textContent = `${formatINR(sip)} / month`;
      tenureRateVal.textContent = `${(rate * 100).toFixed(1)}% p.a.*`;
      if (tenureBadge) tenureBadge.textContent = `Target: ${formatINR(targetCorpus)}`;

      // Formula: n = ln(1 + (Target * i) / (P * (1+i))) / ln(1+i)
      const numerator = Math.log(1 + (targetCorpus * monthlyRate) / (sip * (1 + monthlyRate)));
      const denominator = Math.log(1 + monthlyRate);
      const totalMonths = Math.ceil(numerator / denominator);

      const years = Math.floor(totalMonths / 12);
      const remMonths = totalMonths % 12;

      const totalInvested = sip * totalMonths;
      const totalGain = Math.max(0, targetCorpus - totalInvested);

      if (tenureResultYears) tenureResultYears.textContent = `${years} Yrs ${remMonths > 0 ? remMonths + ' Mos' : ''}`;
      if (tenureTotalGain) tenureTotalGain.textContent = `+${formatINR(totalGain)}`;
      if (tenureTotalInvested) tenureTotalInvested.textContent = formatINR(totalInvested);
      if (tenureLegInv) tenureLegInv.textContent = formatINR(totalInvested);
      if (tenureLegGain) tenureLegGain.textContent = formatINR(totalGain);

      const invRatio = Math.min(100, Math.max(0, Math.round((totalInvested / targetCorpus) * 100)));
      const gainRatio = 100 - invRatio;
      if (tenureBarInvested) tenureBarInvested.style.width = `${invRatio}%`;
      if (tenureBarGain) tenureBarGain.style.width = `${gainRatio}%`;
      if (tenureRatioLbl) tenureRatioLbl.textContent = `${gainRatio}% Growth : ${invRatio}% Principal`;
    }

    tenureTargetRange.addEventListener('input', calculateSIPTenure);
    tenureSipRange.addEventListener('input', calculateSIPTenure);
    tenureRateRange.addEventListener('input', calculateSIPTenure);
    calculateSIPTenure();
  }

  // ——— 6. REAL MUTUAL FUND DATA & STP CALCULATOR ———
  const stpSourceRange = document.getElementById('stp-source-range');
  const stpTransferRange = document.getElementById('stp-transfer-range');
  const stpHorizonRange = document.getElementById('stp-horizon-range');
  const stpSourceRateRange = document.getElementById('stp-source-rate-range');
  const stpTargetRateRange = document.getElementById('stp-target-rate-range');
  const stpSourceVal = document.getElementById('stp-source-val');
  const stpTransferVal = document.getElementById('stp-transfer-val');
  const stpHorizonVal = document.getElementById('stp-horizon-val');
  const stpRatesVal = document.getElementById('stp-rates-val');
  const stpTotalWealth = document.getElementById('stp-total-wealth');
  const stpNetGain = document.getElementById('stp-net-gain');
  const stpTargetWealth = document.getElementById('stp-target-wealth');
  const stpSourceRem = document.getElementById('stp-source-rem');
  const stpBarTarget = document.getElementById('stp-bar-target');
  const stpBarSource = document.getElementById('stp-bar-source');
  const stpLegTarget = document.getElementById('stp-leg-target');
  const stpLegSource = document.getElementById('stp-leg-source');
  const stpRatioLbl = document.getElementById('stp-ratio-lbl');

  // Real STP Elements
  const stpBtnModeReal = document.getElementById('stp-btn-mode-real');
  const stpBtnModeHypo = document.getElementById('stp-btn-mode-hypo');
  const stpRealControls = document.getElementById('stp-real-controls');
  const stpHypoRatesGroup = document.getElementById('stp-hypo-rates-group');
  const stpSourceSchemeSelect = document.getElementById('stp-source-scheme-select');
  const stpTargetSchemeSelect = document.getElementById('stp-target-scheme-select');
  const stpSourceNavChip = document.getElementById('stp-source-nav-chip');
  const stpTargetNavChip = document.getElementById('stp-target-nav-chip');
  const stpRealMetricsGrid = document.getElementById('stp-real-metrics-grid');
  const stpTargetUnitsVal = document.getElementById('stp-target-units-val');
  const stpSourceUnitsVal = document.getElementById('stp-source-units-val');
  const stpAbsGainVal = document.getElementById('stp-abs-gain-val');
  const stpTransfersCountVal = document.getElementById('stp-transfers-count-val');

  if (stpSourceRange && stpTransferRange && stpHorizonRange) {
    let stpMode = 'real';
    let sourceFundData = null;
    let targetFundData = null;

    // Populate STP Schemes
    if (stpSourceSchemeSelect && stpTargetSchemeSelect) {
      const debtSchemes = CURATED_SCHEMES.filter(s => s.type === 'debt');
      const equitySchemes = CURATED_SCHEMES.filter(s => s.type === 'equity');

      stpSourceSchemeSelect.innerHTML = debtSchemes.map(s => `<option value="${s.code}">${s.name}</option>`).join('');
      stpTargetSchemeSelect.innerHTML = equitySchemes.map(s => `<option value="${s.code}">${s.name}</option>`).join('');

      async function loadStpData() {
        const sCode = stpSourceSchemeSelect.value;
        const tCode = stpTargetSchemeSelect.value;
        if (stpSourceNavChip) stpSourceNavChip.innerHTML = '<span class="pulse-dot"></span> NAV: Fetching...';
        if (stpTargetNavChip) stpTargetNavChip.innerHTML = '<span class="pulse-dot"></span> NAV: Fetching...';
        try {
          const [sData, tData] = await Promise.all([
            fetchSchemeData(sCode),
            fetchSchemeData(tCode)
          ]);
          sourceFundData = sData;
          targetFundData = tData;
          if (stpSourceNavChip) stpSourceNavChip.innerHTML = `<span class="pulse-dot"></span> NAV: ₹ ${sData.latestNav.toFixed(2)}`;
          if (stpTargetNavChip) stpTargetNavChip.innerHTML = `<span class="pulse-dot"></span> NAV: ₹ ${tData.latestNav.toFixed(2)}`;
          recalculateSTP();
        } catch (e) {
          console.error('STP fetch error:', e);
        }
      }

      stpSourceSchemeSelect.addEventListener('change', loadStpData);
      stpTargetSchemeSelect.addEventListener('change', loadStpData);
      loadStpData();
    }

    if (stpBtnModeReal && stpBtnModeHypo) {
      stpBtnModeReal.addEventListener('click', () => {
        stpMode = 'real';
        stpBtnModeReal.classList.add('active');
        stpBtnModeHypo.classList.remove('active');
        if (stpRealControls) stpRealControls.style.display = 'block';
        if (stpHypoRatesGroup) stpHypoRatesGroup.style.display = 'none';
        if (stpRealMetricsGrid) stpRealMetricsGrid.style.display = 'grid';
        recalculateSTP();
      });

      stpBtnModeHypo.addEventListener('click', () => {
        stpMode = 'hypothetical';
        stpBtnModeHypo.classList.add('active');
        stpBtnModeReal.classList.remove('active');
        if (stpRealControls) stpRealControls.style.display = 'none';
        if (stpHypoRatesGroup) stpHypoRatesGroup.style.display = 'block';
        if (stpRealMetricsGrid) stpRealMetricsGrid.style.display = 'none';
        recalculateSTP();
      });
    }

    function calculateHypotheticalSTP() {
      const sourceCorpus = parseFloat(stpSourceRange.value);
      const transferMonthly = parseFloat(stpTransferRange.value);
      const years = parseInt(stpHorizonRange.value, 10);
      const sourceRate = parseFloat(stpSourceRateRange ? stpSourceRateRange.value : 6.5) / 100;
      const targetRate = parseFloat(stpTargetRateRange ? stpTargetRateRange.value : 13.5) / 100;
      const sourceMonthlyRate = sourceRate / 12;
      const targetMonthlyRate = targetRate / 12;
      const months = years * 12;

      let curSource = sourceCorpus;
      let curTarget = 0;

      for (let m = 1; m <= months; m++) {
        const sourceGrowth = curSource * sourceMonthlyRate;
        const actualTransfer = Math.min(curSource + sourceGrowth, transferMonthly);
        curSource = Math.max(0, curSource + sourceGrowth - actualTransfer);

        const targetGrowth = curTarget * targetMonthlyRate;
        curTarget = curTarget + targetGrowth + actualTransfer;
      }

      const totalWealth = curSource + curTarget;
      const netGain = Math.max(0, totalWealth - sourceCorpus);

      if (stpTotalWealth) stpTotalWealth.textContent = formatINR(totalWealth);
      if (stpNetGain) stpNetGain.textContent = `+${formatINR(netGain)}`;
      if (stpTargetWealth) stpTargetWealth.textContent = formatINR(curTarget);
      if (stpSourceRem) stpSourceRem.textContent = formatINR(curSource);
      if (stpLegTarget) stpLegTarget.textContent = formatINR(curTarget);
      if (stpLegSource) stpLegSource.textContent = formatINR(curSource);

      const targetRatio = Math.round((curTarget / totalWealth) * 100);
      const sourceRatio = 100 - targetRatio;
      if (stpBarTarget) stpBarTarget.style.width = `${targetRatio}%`;
      if (stpBarSource) stpBarSource.style.width = `${sourceRatio}%`;
      if (stpRatioLbl) stpRatioLbl.textContent = `${targetRatio}% Equity : ${sourceRatio}% Debt`;
    }

    function recalculateSTP() {
      const sourceCorpus = parseFloat(stpSourceRange.value);
      const transferMonthly = parseFloat(stpTransferRange.value);
      const years = parseInt(stpHorizonRange.value, 10);

      stpSourceVal.textContent = formatINR(sourceCorpus);
      stpTransferVal.textContent = `${formatINR(transferMonthly)} / month`;
      stpHorizonVal.textContent = `${years} Year${years > 1 ? 's' : ''}`;

      if (stpMode === 'hypothetical' || !sourceFundData || !targetFundData) {
        calculateHypotheticalSTP();
        return;
      }

      // Real Historical STP simulation
      const result = calculateRealSTP({
        sourceData: sourceFundData,
        targetData: targetFundData,
        initialCorpus: sourceCorpus,
        monthlyTransfer: transferMonthly,
        transferDay: 10,
        years
      });

      if (stpTotalWealth) stpTotalWealth.textContent = formatINR(result.totalWealth);
      if (stpNetGain) stpNetGain.textContent = `+${formatINR(result.netGain)}`;
      if (stpTargetWealth) stpTargetWealth.textContent = formatINR(result.targetValuation);
      if (stpSourceRem) stpSourceRem.textContent = formatINR(result.remainingSourceValuation);

      if (stpTargetUnitsVal) stpTargetUnitsVal.textContent = `${result.targetUnitsAccumulated.toFixed(2)} units`;
      if (stpSourceUnitsVal) stpSourceUnitsVal.textContent = `${result.sourceUnitsRemaining.toFixed(2)} units`;
      if (stpAbsGainVal) stpAbsGainVal.textContent = `+${result.absoluteReturnPercent.toFixed(1)}%`;
      if (stpTransfersCountVal) stpTransfersCountVal.textContent = `${result.transfersCount} months`;

      if (stpLegTarget) stpLegTarget.textContent = formatINR(result.targetValuation);
      if (stpLegSource) stpLegSource.textContent = formatINR(result.remainingSourceValuation);

      const targetRatio = result.totalWealth > 0 ? Math.round((result.targetValuation / result.totalWealth) * 100) : 50;
      const sourceRatio = 100 - targetRatio;
      if (stpBarTarget) stpBarTarget.style.width = `${targetRatio}%`;
      if (stpBarSource) stpBarSource.style.width = `${sourceRatio}%`;
      if (stpRatioLbl) stpRatioLbl.textContent = `${targetRatio}% Equity : ${sourceRatio}% Debt`;
    }

    stpSourceRange.addEventListener('input', recalculateSTP);
    stpTransferRange.addEventListener('input', recalculateSTP);
    stpHorizonRange.addEventListener('input', recalculateSTP);
    if (stpSourceRateRange) stpSourceRateRange.addEventListener('input', recalculateSTP);
    if (stpTargetRateRange) stpTargetRateRange.addEventListener('input', recalculateSTP);
    // Default to Real Historical NAV Data mode so live NAV data is visible on initial load
    if (stpBtnModeReal) {
      stpBtnModeReal.click();
    } else {
      recalculateSTP();
    }
  }

  // ——— 7. REAL MUTUAL FUND DATA & SWP CALCULATOR ———
  const swpCorpusRange = document.getElementById('swp-corpus-range');
  const swpWithdrawRange = document.getElementById('swp-withdraw-range');
  const swpHorizonRange = document.getElementById('swp-horizon-range');
  const swpRateRange = document.getElementById('swp-rate-range');
  const swpCorpusVal = document.getElementById('swp-corpus-val');
  const swpWithdrawVal = document.getElementById('swp-withdraw-val');
  const swpHorizonVal = document.getElementById('swp-horizon-val');
  const swpRateVal = document.getElementById('swp-rate-val');
  const swpTotalWithdrawn = document.getElementById('swp-total-withdrawn');
  const swpFinalBalance = document.getElementById('swp-final-balance');
  const swpHealthBadge = document.getElementById('swp-health-badge');
  const swpSustainText = document.getElementById('swp-sustain-text');
  const swpBarWithdrawn = document.getElementById('swp-bar-withdrawn');
  const swpBarRemaining = document.getElementById('swp-bar-remaining');
  const swpLegWithdrawn = document.getElementById('swp-leg-withdrawn');
  const swpLegBalance = document.getElementById('swp-leg-balance');

  // Real SWP Elements
  const swpBtnModeReal = document.getElementById('swp-btn-mode-real');
  const swpBtnModeHypo = document.getElementById('swp-btn-mode-hypo');
  const swpRealControls = document.getElementById('swp-real-controls');
  const swpHypoRateGroup = document.getElementById('swp-hypo-rate-group');
  const swpSchemeSelect = document.getElementById('swp-scheme-select');
  const swpFundCategory = document.getElementById('swp-fund-category');
  const swpFundNavChip = document.getElementById('swp-fund-nav-chip');
  const swpRealMetricsGrid = document.getElementById('swp-real-metrics-grid');
  const swpUnitsVal = document.getElementById('swp-units-val');
  const swpNavVal = document.getElementById('swp-nav-val');
  const swpNetBenefitVal = document.getElementById('swp-net-benefit-val');
  const swpPayoutsCountVal = document.getElementById('swp-payouts-count-val');

  if (swpCorpusRange && swpWithdrawRange && swpHorizonRange) {
    let swpMode = 'real';
    let swpFundData = null;

    if (swpSchemeSelect) {
      const swpEligibleSchemes = CURATED_SCHEMES.filter(s => s.type === 'hybrid' || s.type === 'equity');
      swpSchemeSelect.innerHTML = swpEligibleSchemes.map(s => `<option value="${s.code}">${s.name}</option>`).join('');

      async function loadSwpData() {
        const code = swpSchemeSelect.value;
        const scheme = CURATED_SCHEMES.find(s => s.code === parseInt(code, 10));
        if (scheme && swpFundCategory) swpFundCategory.textContent = scheme.category;
        if (swpFundNavChip) swpFundNavChip.innerHTML = '<span class="pulse-dot"></span> NAV: Fetching...';
        try {
          const data = await fetchSchemeData(code);
          swpFundData = data;
          if (swpFundNavChip) swpFundNavChip.innerHTML = `<span class="pulse-dot"></span> NAV: ₹ ${data.latestNav.toFixed(2)} (${data.latestDate})`;
          recalculateSWP();
        } catch (e) {
          console.error('SWP fetch error:', e);
        }
      }

      swpSchemeSelect.addEventListener('change', loadSwpData);
      loadSwpData();
    }

    if (swpBtnModeReal && swpBtnModeHypo) {
      swpBtnModeReal.addEventListener('click', () => {
        swpMode = 'real';
        swpBtnModeReal.classList.add('active');
        swpBtnModeHypo.classList.remove('active');
        if (swpRealControls) swpRealControls.style.display = 'block';
        if (swpHypoRateGroup) swpHypoRateGroup.style.display = 'none';
        if (swpRealMetricsGrid) swpRealMetricsGrid.style.display = 'grid';
        if (swpHorizonRange) {
          swpHorizonRange.max = '10';
          if (parseInt(swpHorizonRange.value, 10) > 10) swpHorizonRange.value = '5';
        }
        recalculateSWP();
      });

      swpBtnModeHypo.addEventListener('click', () => {
        swpMode = 'hypothetical';
        swpBtnModeHypo.classList.add('active');
        swpBtnModeReal.classList.remove('active');
        if (swpRealControls) swpRealControls.style.display = 'none';
        if (swpHypoRateGroup) swpHypoRateGroup.style.display = 'block';
        if (swpRealMetricsGrid) swpRealMetricsGrid.style.display = 'none';
        if (swpHorizonRange) swpHorizonRange.max = '35';
        recalculateSWP();
      });
    }

    function calculateHypotheticalSWP() {
      const corpusLakhs = parseFloat(swpCorpusRange.value);
      const initialCorpus = corpusLakhs * 100000;
      const monthlyWithdraw = parseFloat(swpWithdrawRange.value);
      const years = parseInt(swpHorizonRange.value, 10);
      const annualRate = parseFloat(swpRateRange ? swpRateRange.value : 9) / 100;
      const monthlyRate = annualRate / 12;

      let currentBalance = initialCorpus;
      let totalWithdrawn = 0;
      let depletedMonth = 0;
      const totalMonths = years * 12;

      for (let m = 1; m <= totalMonths; m++) {
        const growth = currentBalance * monthlyRate;
        currentBalance = currentBalance + growth - monthlyWithdraw;

        if (currentBalance <= 0 && depletedMonth === 0) {
          depletedMonth = m;
          currentBalance = 0;
          totalWithdrawn += (monthlyWithdraw + currentBalance);
          break;
        } else {
          totalWithdrawn += monthlyWithdraw;
        }
      }

      if (swpTotalWithdrawn) swpTotalWithdrawn.textContent = formatINR(totalWithdrawn);
      if (swpFinalBalance) swpFinalBalance.textContent = formatINR(currentBalance);
      if (swpLegWithdrawn) swpLegWithdrawn.textContent = formatINR(totalWithdrawn);
      if (swpLegBalance) swpLegBalance.textContent = formatINR(currentBalance);

      if (depletedMonth > 0) {
        const depYears = (depletedMonth / 12).toFixed(1);
        if (swpHealthBadge) {
          swpHealthBadge.className = 'swp-status-pill warning';
          swpHealthBadge.textContent = `✦ Depletes in ${depYears} Yrs`;
        }
        if (swpSustainText) swpSustainText.textContent = 'Withdrawal rate exceeds portfolio yield';
        if (swpBarWithdrawn) swpBarWithdrawn.style.width = '100%';
        if (swpBarRemaining) swpBarRemaining.style.width = '0%';
      } else {
        const isGrowing = currentBalance >= initialCorpus;
        if (swpHealthBadge) {
          swpHealthBadge.className = 'swp-status-pill sustainable';
          swpHealthBadge.textContent = isGrowing ? '✦ Highly Sustainable (Growing)' : '✦ Sustainable Longevity';
        }
        if (swpSustainText) swpSustainText.textContent = isGrowing ? 'Corpus expands while funding withdrawals' : 'Safe withdrawal corridor maintained';

        const totalPool = totalWithdrawn + currentBalance;
        const withRatio = Math.round((totalWithdrawn / totalPool) * 100);
        const remRatio = 100 - withRatio;
        if (swpBarWithdrawn) swpBarWithdrawn.style.width = `${withRatio}%`;
        if (swpBarRemaining) swpBarRemaining.style.width = `${remRatio}%`;
      }
    }

    function recalculateSWP() {
      const corpusLakhs = parseFloat(swpCorpusRange.value);
      const initialCorpus = corpusLakhs * 100000;
      const monthlyWithdraw = parseFloat(swpWithdrawRange.value);
      const years = parseInt(swpHorizonRange.value, 10);

      swpCorpusVal.textContent = formatINR(initialCorpus);
      swpWithdrawVal.textContent = `${formatINR(monthlyWithdraw)} / month`;
      swpHorizonVal.textContent = `${years} Year${years > 1 ? 's' : ''}`;

      if (swpMode === 'hypothetical' || !swpFundData) {
        calculateHypotheticalSWP();
        return;
      }

      // Real Historical SWP
      const result = calculateRealSWP({
        schemeData: swpFundData,
        initialCorpus,
        monthlyWithdrawal: monthlyWithdraw,
        withdrawDay: 10,
        years
      });

      if (swpTotalWithdrawn) swpTotalWithdrawn.textContent = formatINR(result.totalWithdrawn);
      if (swpFinalBalance) swpFinalBalance.textContent = formatINR(result.remainingValuation);

      if (swpUnitsVal) swpUnitsVal.textContent = `${result.remainingUnits.toFixed(2)} units`;
      if (swpNavVal) swpNavVal.textContent = `₹ ${result.latestNav.toFixed(2)}`;
      if (swpNetBenefitVal) swpNetBenefitVal.textContent = formatINR(result.netTotalBenefit);
      if (swpPayoutsCountVal) swpPayoutsCountVal.textContent = `${result.withdrawalsCount} payouts`;

      if (swpLegWithdrawn) swpLegWithdrawn.textContent = formatINR(result.totalWithdrawn);
      if (swpLegBalance) swpLegBalance.textContent = formatINR(result.remainingValuation);

      if (result.exhaustedAtMonth) {
        const depYears = (result.exhaustedAtMonth / 12).toFixed(1);
        if (swpHealthBadge) {
          swpHealthBadge.className = 'swp-status-pill warning';
          swpHealthBadge.textContent = `✦ Depleted in Year ${depYears}`;
        }
        if (swpSustainText) swpSustainText.textContent = 'Units fully liquidated before term end';
        if (swpBarWithdrawn) swpBarWithdrawn.style.width = '100%';
        if (swpBarRemaining) swpBarRemaining.style.width = '0%';
      } else {
        const isGrowing = result.remainingValuation >= initialCorpus;
        if (swpHealthBadge) {
          swpHealthBadge.className = 'swp-status-pill sustainable';
          swpHealthBadge.textContent = isGrowing ? '✦ Capital Intact (Growing)' : '✦ Cashflow Sustained';
        }
        if (swpSustainText) swpSustainText.textContent = isGrowing ? 'Portfolio NAV growth outpaced withdrawals' : 'Principal comfortably funded withdrawals';

        const totalPool = result.totalWithdrawn + result.remainingValuation;
        const withRatio = totalPool > 0 ? Math.round((result.totalWithdrawn / totalPool) * 100) : 50;
        const remRatio = 100 - withRatio;
        if (swpBarWithdrawn) swpBarWithdrawn.style.width = `${withRatio}%`;
        if (swpBarRemaining) swpBarRemaining.style.width = `${remRatio}%`;
      }
    }

    swpCorpusRange.addEventListener('input', recalculateSWP);
    swpWithdrawRange.addEventListener('input', recalculateSWP);
    swpHorizonRange.addEventListener('input', recalculateSWP);
    if (swpRateRange) swpRateRange.addEventListener('input', recalculateSWP);
    // Default to Real Historical NAV Data mode so live NAV data is visible on initial load
    if (swpBtnModeReal) {
      swpBtnModeReal.click();
    } else {
      recalculateSWP();
    }
  }

  // ——— 8. EDUCATION CALCULATOR ———
  const eduAgeRange = document.getElementById('edu-age-range');
  const eduCostRange = document.getElementById('edu-cost-range');
  const eduInfRange = document.getElementById('edu-inf-range');
  const eduRateRange = document.getElementById('edu-rate-range');
  const eduAgeVal = document.getElementById('edu-age-val');
  const eduCostVal = document.getElementById('edu-cost-val');
  const eduInfVal = document.getElementById('edu-inf-val');
  const eduRateVal = document.getElementById('edu-rate-val');
  const eduFutureCost = document.getElementById('edu-future-cost');
  const eduReqSip = document.getElementById('edu-req-sip');
  const eduTotalInvested = document.getElementById('edu-total-invested');
  const eduWealthGain = document.getElementById('edu-wealth-gain');
  const eduBadge = document.getElementById('edu-badge');
  const eduBarInvested = document.getElementById('edu-bar-invested');
  const eduBarGains = document.getElementById('edu-bar-gains');
  const eduLegInv = document.getElementById('edu-leg-inv');
  const eduLegGain = document.getElementById('edu-leg-gain');
  const eduRatioLbl = document.getElementById('edu-ratio-lbl');

  if (eduAgeRange && eduCostRange && eduInfRange && eduRateRange) {
    function calculateEducation() {
      const childAge = parseInt(eduAgeRange.value, 10);
      const yearsLeft = Math.max(1, 18 - childAge);
      const costToday = parseFloat(eduCostRange.value) * 100000;
      const infRate = parseFloat(eduInfRange.value) / 100;
      const growthRate = parseFloat(eduRateRange.value) / 100;
      const monthlyRate = growthRate / 12;
      const totalMonths = yearsLeft * 12;

      eduAgeVal.textContent = `${childAge} Year${childAge === 1 ? '' : 's'} Old`;
      eduCostVal.textContent = formatINR(costToday);
      eduInfVal.textContent = `${(infRate * 100).toFixed(1)}% p.a.`;
      eduRateVal.textContent = `${(growthRate * 100).toFixed(1)}% p.a.*`;
      if (eduBadge) eduBadge.textContent = `${yearsLeft} Years to College (Age 18)`;

      const futureCost = costToday * Math.pow(1 + infRate, yearsLeft);
      const reqSIP = (futureCost * monthlyRate) / ((Math.pow(1 + monthlyRate, totalMonths) - 1) * (1 + monthlyRate));
      const totalInvested = reqSIP * totalMonths;
      const wealthGain = Math.max(0, futureCost - totalInvested);

      if (eduFutureCost) eduFutureCost.textContent = formatINR(futureCost);
      if (eduReqSip) eduReqSip.textContent = `${formatINR(reqSIP)} / mo`;
      if (eduTotalInvested) eduTotalInvested.textContent = formatINR(totalInvested);
      if (eduWealthGain) eduWealthGain.textContent = formatINR(wealthGain);
      if (eduLegInv) eduLegInv.textContent = formatINR(totalInvested);
      if (eduLegGain) eduLegGain.textContent = formatINR(wealthGain);

      const invRatio = Math.round((totalInvested / futureCost) * 100);
      const gainRatio = 100 - invRatio;
      if (eduBarInvested) eduBarInvested.style.width = `${invRatio}%`;
      if (eduBarGains) eduBarGains.style.width = `${gainRatio}%`;
      if (eduRatioLbl) eduRatioLbl.textContent = `${gainRatio}% Growth : ${invRatio}% Parent Savings`;
    }

    eduAgeRange.addEventListener('input', calculateEducation);
    eduCostRange.addEventListener('input', calculateEducation);
    eduInfRange.addEventListener('input', calculateEducation);
    eduRateRange.addEventListener('input', calculateEducation);
    calculateEducation();
  }

  // ——— 9. MARRIAGE CALCULATOR ———
  const marHorizonRange = document.getElementById('mar-horizon-range');
  const marCostRange = document.getElementById('mar-cost-range');
  const marInfRange = document.getElementById('mar-inf-range');
  const marRateRange = document.getElementById('mar-rate-range');
  const marHorizonVal = document.getElementById('mar-horizon-val');
  const marCostVal = document.getElementById('mar-cost-val');
  const marInfVal = document.getElementById('mar-inf-val');
  const marRateVal = document.getElementById('mar-rate-val');
  const marFutureCost = document.getElementById('mar-future-cost');
  const marReqSip = document.getElementById('mar-req-sip');
  const marTotalInvested = document.getElementById('mar-total-invested');
  const marWealthGain = document.getElementById('mar-wealth-gain');
  const marBadge = document.getElementById('mar-badge');
  const marBarInvested = document.getElementById('mar-bar-invested');
  const marBarGains = document.getElementById('mar-bar-gains');
  const marLegInv = document.getElementById('mar-leg-inv');
  const marLegGain = document.getElementById('mar-leg-gain');
  const marRatioLbl = document.getElementById('mar-ratio-lbl');

  if (marHorizonRange && marCostRange && marInfRange && marRateRange) {
    function calculateMarriage() {
      const years = parseInt(marHorizonRange.value, 10);
      const costToday = parseFloat(marCostRange.value) * 100000;
      const infRate = parseFloat(marInfRange.value) / 100;
      const growthRate = parseFloat(marRateRange.value) / 100;
      const monthlyRate = growthRate / 12;
      const totalMonths = years * 12;

      marHorizonVal.textContent = `${years} Year${years > 1 ? 's' : ''}`;
      marCostVal.textContent = formatINR(costToday);
      marInfVal.textContent = `${(infRate * 100).toFixed(1)}% p.a.`;
      marRateVal.textContent = `${(growthRate * 100).toFixed(1)}% p.a.*`;
      if (marBadge) marBadge.textContent = `${years} Year Timeline`;

      const futureCost = costToday * Math.pow(1 + infRate, years);
      const reqSIP = (futureCost * monthlyRate) / ((Math.pow(1 + monthlyRate, totalMonths) - 1) * (1 + monthlyRate));
      const totalInvested = reqSIP * totalMonths;
      const wealthGain = Math.max(0, futureCost - totalInvested);

      if (marFutureCost) marFutureCost.textContent = formatINR(futureCost);
      if (marReqSip) marReqSip.textContent = `${formatINR(reqSIP)} / mo`;
      if (marTotalInvested) marTotalInvested.textContent = formatINR(totalInvested);
      if (marWealthGain) marWealthGain.textContent = formatINR(wealthGain);
      if (marLegInv) marLegInv.textContent = formatINR(totalInvested);
      if (marLegGain) marLegGain.textContent = formatINR(wealthGain);

      const invRatio = Math.round((totalInvested / futureCost) * 100);
      const gainRatio = 100 - invRatio;
      if (marBarInvested) marBarInvested.style.width = `${invRatio}%`;
      if (marBarGains) marBarGains.style.width = `${gainRatio}%`;
      if (marRatioLbl) marRatioLbl.textContent = `${gainRatio}% Growth : ${invRatio}% Savings`;
    }

    marHorizonRange.addEventListener('input', calculateMarriage);
    marCostRange.addEventListener('input', calculateMarriage);
    marInfRange.addEventListener('input', calculateMarriage);
    marRateRange.addEventListener('input', calculateMarriage);
    calculateMarriage();
  }

  // ——— 10. RETIREMENT CALCULATOR ———
  const retCurrAgeRange = document.getElementById('ret-currage-range');
  const retRetAgeRange = document.getElementById('ret-retage-range');
  const retExpenseRange = document.getElementById('ret-expense-range');
  const retInfRange = document.getElementById('ret-inf-range');
  const retPreRateRange = document.getElementById('ret-prerate-range');
  const retAgesVal = document.getElementById('ret-ages-val');
  const retExpenseVal = document.getElementById('ret-expense-val');
  const retInfVal = document.getElementById('ret-inf-val');
  const retPreRateVal = document.getElementById('ret-prerate-val');
  const retReqCorpus = document.getElementById('ret-req-corpus');
  const retReqSip = document.getElementById('ret-req-sip');
  const retFutureExpense = document.getElementById('ret-future-expense');
  const retTotalInvested = document.getElementById('ret-total-invested');
  const retBadge = document.getElementById('ret-badge');
  const retBarInvested = document.getElementById('ret-bar-invested');
  const retBarGains = document.getElementById('ret-bar-gains');
  const retLegInv = document.getElementById('ret-leg-inv');
  const retLegGain = document.getElementById('ret-leg-gain');
  const retRatioLbl = document.getElementById('ret-ratio-lbl');

  if (retCurrAgeRange && retRetAgeRange && retExpenseRange && retInfRange && retPreRateRange) {
    function calculateRetirement() {
      const currAge = parseInt(retCurrAgeRange.value, 10);
      const retAge = Math.max(currAge + 1, parseInt(retRetAgeRange.value, 10));
      const yearsToRet = retAge - currAge;
      const monthlyExp = parseFloat(retExpenseRange.value);
      const infRate = parseFloat(retInfRange.value) / 100;
      const preRate = parseFloat(retPreRateRange.value) / 100;

      if (retAgesVal) retAgesVal.textContent = `${currAge} Yrs / ${retAge} Yrs`;
      retExpenseVal.textContent = `${formatINR(monthlyExp)} / month`;
      retInfVal.textContent = `${(infRate * 100).toFixed(1)}% p.a.`;
      retPreRateVal.textContent = `${(preRate * 100).toFixed(1)}% p.a.*`;
      if (retBadge) retBadge.textContent = `${yearsToRet} Years to Retirement`;

      const futMonthlyExp = monthlyExp * Math.pow(1 + infRate, yearsToRet);
      const annualExpAtRet = futMonthlyExp * 12;

      // Real rate post-retirement (assumed 8.5% post-ret yield)
      const postRate = 0.085;
      const rReal = Math.max(0.015, (postRate - infRate) / (1 + infRate));
      const lifespanPostRet = 25;
      const corpusRequired = annualExpAtRet * ((1 - Math.pow(1 + rReal, -lifespanPostRet)) / rReal);

      const monthlyPreRate = preRate / 12;
      const totalMonths = yearsToRet * 12;
      const reqSIP = (corpusRequired * monthlyPreRate) / ((Math.pow(1 + monthlyPreRate, totalMonths) - 1) * (1 + monthlyPreRate));
      const totalInvested = reqSIP * totalMonths;
      const wealthGrowth = Math.max(0, corpusRequired - totalInvested);

      if (retReqCorpus) retReqCorpus.textContent = formatINR(corpusRequired);
      if (retReqSip) retReqSip.textContent = `${formatINR(reqSIP)} / mo`;
      if (retFutureExpense) retFutureExpense.textContent = `${formatINR(futMonthlyExp)} / mo`;
      if (retTotalInvested) retTotalInvested.textContent = formatINR(totalInvested);
      if (retLegInv) retLegInv.textContent = formatINR(totalInvested);
      if (retLegGain) retLegGain.textContent = formatINR(wealthGrowth);

      const invRatio = Math.round((totalInvested / corpusRequired) * 100);
      const gainRatio = 100 - invRatio;
      if (retBarInvested) retBarInvested.style.width = `${invRatio}%`;
      if (retBarGains) retBarGains.style.width = `${gainRatio}%`;
      if (retRatioLbl) retRatioLbl.textContent = `${gainRatio}% Compounding : ${invRatio}% Principal`;
    }

    retCurrAgeRange.addEventListener('input', calculateRetirement);
    retRetAgeRange.addEventListener('input', calculateRetirement);
    retExpenseRange.addEventListener('input', calculateRetirement);
    retInfRange.addEventListener('input', calculateRetirement);
    retPreRateRange.addEventListener('input', calculateRetirement);
    calculateRetirement();
  }

  // ——— 11. EMI CALCULATOR ———
  const emiLoanRange = document.getElementById('emi-loan-range');
  const emiRateRange = document.getElementById('emi-rate-range');
  const emiTenureRange = document.getElementById('emi-tenure-range');
  const emiLoanVal = document.getElementById('emi-loan-val');
  const emiRateVal = document.getElementById('emi-rate-val');
  const emiTenureVal = document.getElementById('emi-tenure-val');
  const emiMonthlyVal = document.getElementById('emi-monthly-val');
  const emiTotalInterest = document.getElementById('emi-total-interest');
  const emiTotalPayment = document.getElementById('emi-total-payment');
  const emiInterestRatio = document.getElementById('emi-interest-ratio');
  const emiBadge = document.getElementById('emi-badge');
  const emiBarPrincipal = document.getElementById('emi-bar-principal');
  const emiBarInterest = document.getElementById('emi-bar-interest');
  const emiLegPrincipal = document.getElementById('emi-leg-principal');
  const emiLegInterest = document.getElementById('emi-leg-interest');
  const emiRatioLbl = document.getElementById('emi-ratio-lbl');

  if (emiLoanRange && emiRateRange && emiTenureRange) {
    function calculateEMI() {
      const loanLakhs = parseFloat(emiLoanRange.value);
      const principal = loanLakhs * 100000;
      const annualRate = parseFloat(emiRateRange.value) / 100;
      const tenureYears = parseInt(emiTenureRange.value, 10);
      const monthlyRate = annualRate / 12;
      const totalMonths = tenureYears * 12;

      emiLoanVal.textContent = formatINR(principal);
      emiRateVal.textContent = `${(annualRate * 100).toFixed(1)}% p.a.`;
      emiTenureVal.textContent = `${tenureYears} Year${tenureYears > 1 ? 's' : ''}`;
      if (emiBadge) emiBadge.textContent = `${tenureYears}-Year Schedule`;

      // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
      const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
      const totalPayment = emi * totalMonths;
      const totalInterest = Math.max(0, totalPayment - principal);
      const ratio = ((totalInterest / principal) * 100).toFixed(1);

      if (emiMonthlyVal) emiMonthlyVal.textContent = `₹ ${Math.round(emi).toLocaleString('en-IN')}`;
      if (emiTotalInterest) emiTotalInterest.textContent = formatINR(totalInterest);
      if (emiTotalPayment) emiTotalPayment.textContent = formatINR(totalPayment);
      if (emiInterestRatio) emiInterestRatio.textContent = `${ratio}%`;
      if (emiLegPrincipal) emiLegPrincipal.textContent = formatINR(principal);
      if (emiLegInterest) emiLegInterest.textContent = formatINR(totalInterest);

      const princRatio = Math.round((principal / totalPayment) * 100);
      const intRatio = 100 - princRatio;
      if (emiBarPrincipal) emiBarPrincipal.style.width = `${princRatio}%`;
      if (emiBarInterest) emiBarInterest.style.width = `${intRatio}%`;
      if (emiRatioLbl) emiRatioLbl.textContent = `${intRatio}% Interest : ${princRatio}% Principal`;
    }

    emiLoanRange.addEventListener('input', calculateEMI);
    emiRateRange.addEventListener('input', calculateEMI);
    emiTenureRange.addEventListener('input', calculateEMI);
    calculateEMI();
  }

  // ——— 12. ASSET ALLOCATION SIMULATOR ———
  const allocInvRange = document.getElementById('alloc-inv-range');
  const allocRiskRange = document.getElementById('alloc-risk-range');
  const allocHorizonRange = document.getElementById('alloc-horizon-range');
  const allocInvVal = document.getElementById('alloc-inv-val');
  const allocRiskVal = document.getElementById('alloc-risk-val');
  const allocHorizonVal = document.getElementById('alloc-horizon-val');
  const allocProfBadge = document.getElementById('alloc-prof-badge');
  const allocExpReturn = document.getElementById('alloc-exp-return');
  const allocVolRisk = document.getElementById('alloc-vol-risk');
  const allocBarEquity = document.getElementById('alloc-bar-equity');
  const allocBarDebt = document.getElementById('alloc-bar-debt');
  const allocBarGold = document.getElementById('alloc-bar-gold');
  const allocBarAlt = document.getElementById('alloc-bar-alt');
  const allocEquityPct = document.getElementById('alloc-equity-pct');
  const allocEquityVal = document.getElementById('alloc-equity-val');
  const allocDebtPct = document.getElementById('alloc-debt-pct');
  const allocDebtVal = document.getElementById('alloc-debt-val');
  const allocGoldPct = document.getElementById('alloc-gold-pct');
  const allocGoldVal = document.getElementById('alloc-gold-val');
  const allocAltPct = document.getElementById('alloc-alt-pct');
  const allocAltVal = document.getElementById('alloc-alt-val');
  const allocProfDesc = document.getElementById('alloc-prof-desc');

  if (allocInvRange && allocRiskRange && allocHorizonRange) {
    const riskProfiles = {
      1: {
        badge: 'Capital Preservation Mandate',
        label: 'Conservative (Level 1)',
        rate: 8.8,
        volatility: 'Low (Defensive)',
        volColor: '#10b981',
        alloc: { equity: 15, debt: 65, gold: 15, alt: 5 },
        desc: 'Optimized for maximum capital stability and predictable liquidity with predominant allocation to AAA/Sovereign fixed income and sovereign gold hedging.'
      },
      2: {
        badge: 'Income & Stability Mandate',
        label: 'Moderate-Cons (Level 2)',
        rate: 10.4,
        volatility: 'Low-Moderate',
        volColor: '#38bdf8',
        alloc: { equity: 30, debt: 50, gold: 12, alt: 8 },
        desc: 'Balanced debt-tilted allocation providing recurring cash-flow and inflation hedging with measured participation in high-quality large-cap equities.'
      },
      3: {
        badge: 'Balanced Alpha Mandate',
        label: 'Balanced Growth (Level 3)',
        rate: 12.8,
        volatility: 'Moderate',
        volColor: '#60a5fa',
        alloc: { equity: 55, debt: 25, gold: 10, alt: 10 },
        desc: 'Strategic core-and-satellite asset allocation blending multi-cap equities, high-yield structured debt, physical gold, and real estate REITs for optimal risk-adjusted alpha.'
      },
      4: {
        badge: 'Capital Appreciation Mandate',
        label: 'Aggressive Growth (Level 4)',
        rate: 14.6,
        volatility: 'Moderate-High',
        volColor: '#f59e0b',
        alloc: { equity: 70, debt: 15, gold: 7, alt: 8 },
        desc: 'Growth-tilted equity mandate with dynamic mid/small-cap exposure, targeted private equity secondaries, and a tactical sovereign gold hedge against drawdowns.'
      },
      5: {
        badge: 'High-Alpha Growth Mandate',
        label: 'High Alpha (Level 5)',
        rate: 16.8,
        volatility: 'High (Aggressive Alpha)',
        volColor: '#f43f5e',
        alloc: { equity: 80, debt: 5, gold: 5, alt: 10 },
        desc: 'Concentrated wealth generation portfolio focused on high-conviction PMS equity strategies, thematic pre-IPO/AIF opportunities, and global asset hedges.'
      }
    };

    const horizonLabels = {
      1: '1-3 Years (Short-Term)',
      2: '3-5 Years (Medium-Term)',
      3: '7-10 Years (Long-Term)',
      4: '10+ Years (Multi-Gen)'
    };

    function calculateAssetAllocation() {
      const capitalLakhs = parseFloat(allocInvRange.value);
      const riskLevel = parseInt(allocRiskRange.value, 10);
      const horizonLevel = parseInt(allocHorizonRange.value, 10);
      const profile = riskProfiles[riskLevel] || riskProfiles[3];

      const totalCapital = capitalLakhs * 100000;

      if (allocInvVal) allocInvVal.textContent = formatINR(totalCapital);
      if (allocRiskVal) allocRiskVal.textContent = profile.label;
      if (allocHorizonVal) allocHorizonVal.textContent = horizonLabels[horizonLevel] || '7-10 Years';
      if (allocProfBadge) allocProfBadge.textContent = profile.badge;
      if (allocExpReturn) allocExpReturn.textContent = `${profile.rate.toFixed(1)}% p.a.*`;
      if (allocVolRisk) {
        allocVolRisk.textContent = profile.volatility;
        allocVolRisk.style.color = profile.volColor;
      }

      const eqVal = (profile.alloc.equity / 100) * totalCapital;
      const debtVal = (profile.alloc.debt / 100) * totalCapital;
      const goldVal = (profile.alloc.gold / 100) * totalCapital;
      const altVal = (profile.alloc.alt / 100) * totalCapital;

      if (allocBarEquity) allocBarEquity.style.width = `${profile.alloc.equity}%`;
      if (allocBarDebt) allocBarDebt.style.width = `${profile.alloc.debt}%`;
      if (allocBarGold) allocBarGold.style.width = `${profile.alloc.gold}%`;
      if (allocBarAlt) allocBarAlt.style.width = `${profile.alloc.alt}%`;

      if (allocEquityPct) allocEquityPct.textContent = `${profile.alloc.equity}%`;
      if (allocEquityVal) allocEquityVal.textContent = formatINR(eqVal);
      if (allocDebtPct) allocDebtPct.textContent = `${profile.alloc.debt}%`;
      if (allocDebtVal) allocDebtVal.textContent = formatINR(debtVal);
      if (allocGoldPct) allocGoldPct.textContent = `${profile.alloc.gold}%`;
      if (allocGoldVal) allocGoldVal.textContent = formatINR(goldVal);
      if (allocAltPct) allocAltPct.textContent = `${profile.alloc.alt}%`;
      if (allocAltVal) allocAltVal.textContent = formatINR(altVal);

      if (allocProfDesc) {
        allocProfDesc.innerHTML = `<strong>Strategic Thesis:</strong> ${profile.desc}`;
      }
    }

    allocInvRange.addEventListener('input', calculateAssetAllocation);
    allocRiskRange.addEventListener('input', calculateAssetAllocation);
    allocHorizonRange.addEventListener('input', calculateAssetAllocation);
    calculateAssetAllocation();
  }

  // ——— 13. FAMILY OFFICE DIAGNOSTIC AUDIT QUIZ ———
  const btnStartQuiz = document.getElementById('btn-start-quiz');
  const quizStartView = document.getElementById('quiz-start-view');
  const quizQuestionView = document.getElementById('quiz-question-view');
  const quizResultView = document.getElementById('quiz-result-view');
  const quizProgressBar = document.getElementById('quiz-progress-bar');
  const quizQNum = document.getElementById('quiz-q-num');
  const quizQTotal = document.getElementById('quiz-q-total');
  const quizProgressText = document.getElementById('quiz-progress-text');
  const quizQTitle = document.getElementById('quiz-q-title');
  const quizQDesc = document.getElementById('quiz-q-desc');
  const quizOptionsContainer = document.getElementById('quiz-options-container');
  const quizBtnPrev = document.getElementById('quiz-btn-prev');
  const quizBtnNext = document.getElementById('quiz-btn-next');

  const quizScoreNum = document.getElementById('quiz-score-num');
  const quizScoreBadge = document.getElementById('quiz-score-badge');
  const quizScoreTitle = document.getElementById('quiz-score-title');
  const quizScoreDesc = document.getElementById('quiz-score-desc');
  const quizDimGov = document.getElementById('quiz-dim-governance');
  const quizDimTax = document.getElementById('quiz-dim-tax');
  const quizDimAlloc = document.getElementById('quiz-dim-allocation');
  const quizDimRisk = document.getElementById('quiz-dim-risk');
  const quizTalkingPoints = document.getElementById('quiz-talking-points');
  const btnQuizCta = document.getElementById('btn-quiz-cta');
  const btnRetakeQuiz = document.getElementById('btn-retake-quiz');

  if (btnStartQuiz && quizQuestionView && quizResultView) {
    const quizQuestions = [
      {
        dim: 'governance',
        title: 'How is your family\'s primary wealth structured for asset protection and succession?',
        desc: 'Select the option that most accurately reflects your current estate and holding architecture.',
        options: [
          { text: 'Private Family Trust registered with institutional trustee bylaws & cross-generational succession', score: 20 },
          { text: 'Registered Wills executed, indexed, and periodically updated with trusted legal counsel', score: 15 },
          { text: 'Informal family understandings and joint bank/property nominations without executed trusts', score: 8 },
          { text: 'No formal will, trust, or estate succession mechanism established to date', score: 3 }
        ]
      },
      {
        dim: 'tax',
        title: 'How actively is tax drag harvested across your family balance sheet?',
        desc: 'Assesses optimization across LTCG, STCG, Section 54/54EC, HUF structures, and dividend yields.',
        options: [
          { text: 'Institutional tax harvesting across HUF, corporate balance sheets, and individual family slabs', score: 20 },
          { text: 'Standard tax filing with annual 80C deductions but without multi-entity capital gains sheltering', score: 14 },
          { text: 'Substantial gains idling in traditional taxable fixed deposits (>30% tax drag bracket)', score: 8 },
          { text: 'Unassessed high-gain real estate, business sale, or ESOP exercises with impending tax liabilities', score: 4 }
        ]
      },
      {
        dim: 'allocation',
        title: 'How is your total net worth distributed across asset classes?',
        desc: 'Evaluates portfolio diversification, liquidity corridors, and non-correlated downside hedges.',
        options: [
          { text: 'Calibrated multi-asset mix (Equity PMS/AIF, AAA Corporate Debt, Sovereign Gold, Global Assets)', score: 20 },
          { text: 'Primarily mutual funds and direct equities with ad-hoc periodic review meetings', score: 15 },
          { text: 'Heavy real estate concentration (>60% of family net worth) with illiquidity vulnerability', score: 8 },
          { text: 'Uncoordinated holdings scattered across multiple retail bank RM recommendations', score: 4 }
        ]
      },
      {
        dim: 'risk',
        title: 'What liquidity buffer and liability shields protect your family against emergencies?',
        desc: 'Measures treasury cash runway and ring-fencing against commercial or personal liabilities.',
        options: [
          { text: '6-12 months operating buffer in ultra-short funds plus dedicated high-coverage liability vaults', score: 20 },
          { text: '3-6 months cash in conventional savings accounts with adequate term health insurance', score: 14 },
          { text: 'Emergency liquidity reliant on liquidating equity holdings or short-term loan borrowing', score: 7 },
          { text: 'Limited cash runway with business operating cash and family wealth commingled', score: 3 }
        ]
      },
      {
        dim: 'governance',
        title: 'How is product due diligence and conflict of interest managed for your investments?',
        desc: 'Assesses fiduciary alignment, fee transparency, and whitelist product audits.',
        options: [
          { text: 'Independent fiduciary whitelist audit with zero commission bias and direct institutional access', score: 20 },
          { text: 'Self-researched mix of direct mutual funds and direct equity stock baskets', score: 14 },
          { text: 'Substantial holdings in traditional endowment policies or high-expense insurance ULIPs', score: 7 },
          { text: 'Heavy single-employer ESOP or promoter equity concentration with unhedged market exposure', score: 4 }
        ]
      }
    ];

    let currentQIndex = 0;
    let userAnswers = new Array(quizQuestions.length).fill(null);

    function renderQuestion(idx) {
      const q = quizQuestions[idx];
      if (!q) return;

      if (quizQNum) quizQNum.textContent = `${idx + 1}`;
      if (quizQTotal) quizQTotal.textContent = `${quizQuestions.length}`;
      const pct = Math.round(((idx + 1) / quizQuestions.length) * 100);
      if (quizProgressBar) quizProgressBar.style.width = `${pct}%`;
      if (quizProgressText) quizProgressText.textContent = `${pct}% Complete`;

      if (quizQTitle) quizQTitle.textContent = q.title;
      if (quizQDesc) quizQDesc.textContent = q.desc;

      if (quizOptionsContainer) {
        quizOptionsContainer.innerHTML = '';
        q.options.forEach((opt, oIdx) => {
          const optDiv = document.createElement('div');
          optDiv.className = `quiz-option-choice ${userAnswers[idx] === oIdx ? 'selected' : ''}`;
          optDiv.innerHTML = `
            <div class="quiz-opt-radio"></div>
            <div class="quiz-opt-text">${opt.text}</div>
          `;
          optDiv.addEventListener('click', () => {
            userAnswers[idx] = oIdx;
            quizOptionsContainer.querySelectorAll('.quiz-option-choice').forEach(el => el.classList.remove('selected'));
            optDiv.classList.add('selected');
            if (quizBtnNext) quizBtnNext.disabled = false;
          });
          quizOptionsContainer.appendChild(optDiv);
        });
      }

      if (quizBtnPrev) {
        quizBtnPrev.style.display = idx > 0 ? 'inline-flex' : 'none';
      }
      if (quizBtnNext) {
        quizBtnNext.textContent = idx === quizQuestions.length - 1 ? 'Generate Audit Scorecard ✦' : 'Next Question →';
        quizBtnNext.disabled = userAnswers[idx] === null;
      }
    }

    function calculateAndShowResults() {
      let totalScore = 0;
      const dimScores = { governance: 0, tax: 0, allocation: 0, risk: 0 };
      const dimMax = { governance: 40, tax: 20, allocation: 20, risk: 20 };

      quizQuestions.forEach((q, idx) => {
        const selOptIdx = userAnswers[idx] !== null ? userAnswers[idx] : 0;
        const score = q.options[selOptIdx].score;
        totalScore += score;
        dimScores[q.dim] += score;
      });

      const govPct = Math.min(100, Math.round((dimScores.governance / dimMax.governance) * 100));
      const taxPct = Math.min(100, Math.round((dimScores.tax / dimMax.tax) * 100));
      const allocPct = Math.min(100, Math.round((dimScores.allocation / dimMax.allocation) * 100));
      const riskPct = Math.min(100, Math.round((dimScores.risk / dimMax.risk) * 100));

      if (quizScoreNum) quizScoreNum.textContent = totalScore;
      if (quizDimGov) quizDimGov.textContent = `${govPct}%`;
      if (quizDimTax) quizDimTax.textContent = `${taxPct}%`;
      if (quizDimAlloc) quizDimAlloc.textContent = `${allocPct}%`;
      if (quizDimRisk) quizDimRisk.textContent = `${riskPct}%`;

      const govFill = document.querySelector('#quiz-tab .quiz-dimension-card:nth-child(1) .quiz-dim-fill');
      const taxFill = document.querySelector('#quiz-tab .quiz-dimension-card:nth-child(2) .quiz-dim-fill');
      const allocFill = document.querySelector('#quiz-tab .quiz-dimension-card:nth-child(3) .quiz-dim-fill');
      const riskFill = document.querySelector('#quiz-tab .quiz-dimension-card:nth-child(4) .quiz-dim-fill');

      if (govFill) govFill.style.width = `${govPct}%`;
      if (taxFill) taxFill.style.width = `${taxPct}%`;
      if (allocFill) allocFill.style.width = `${allocPct}%`;
      if (riskFill) riskFill.style.width = `${riskPct}%`;

      let tierBadge = 'Institutional Grade Resilience';
      let tierTitle = 'Exceptional Strategic Architecture';
      let tierDesc = 'Your family balance sheet exhibits superior risk governance, robust succession mechanisms, and strategic multi-asset allocation.';

      if (totalScore < 60) {
        tierBadge = 'Critical Governance Gaps Identified';
        tierTitle = 'High Vulnerability to Tax & Succession Drag';
        tierDesc = 'Significant exposure detected in estate succession, tax inefficiencies, or unhedged concentration risks. Immediate restructuring recommended.';
      } else if (totalScore < 80) {
        tierBadge = 'Strong Foundation (Optimization Required)';
        tierTitle = 'Solid Wealth Core with Strategic Gaps';
        tierDesc = 'Good discipline in asset accumulation, but opportunities exist to insulate gains under new tax rules and structure enduring family succession.';
      }

      if (quizScoreBadge) quizScoreBadge.textContent = tierBadge;
      if (quizScoreTitle) quizScoreTitle.textContent = tierTitle;
      if (quizScoreDesc) quizScoreDesc.textContent = tierDesc;

      if (quizTalkingPoints) {
        quizTalkingPoints.innerHTML = `
          <div class="quiz-talking-point">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span><strong>Fiduciary Portfolio Audit:</strong> Independent review of legacy mutual funds, direct stocks, and high-expense insurance holdings to eliminate underperforming drag.</span>
          </div>
          <div class="quiz-talking-point">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span><strong>Tax & Capital Gains Structuring:</strong> Multi-entity alignment under Section 54/54EC and HUF partitions to legally shield generational compounding.</span>
          </div>
          <div class="quiz-talking-point">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span><strong>Estate Succession Mandate:</strong> Tailored family trust constitution and private governance charter for frictionless legacy transfer.</span>
          </div>
        `;
      }

      if (btnQuizCta) {
        btnQuizCta.href = `contact.html?audit=scorecard&score=${totalScore}&gov=${govPct}&tax=${taxPct}&alloc=${allocPct}`;
      }

      if (quizQuestionView) quizQuestionView.style.display = 'none';
      if (quizResultView) {
        quizResultView.style.display = 'block';
        quizResultView.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    btnStartQuiz.addEventListener('click', () => {
      if (quizStartView) quizStartView.style.display = 'none';
      if (quizQuestionView) {
        quizQuestionView.style.display = 'block';
        currentQIndex = 0;
        renderQuestion(currentQIndex);
      }
    });

    if (quizBtnPrev) {
      quizBtnPrev.addEventListener('click', () => {
        if (currentQIndex > 0) {
          currentQIndex--;
          renderQuestion(currentQIndex);
        }
      });
    }

    if (quizBtnNext) {
      quizBtnNext.addEventListener('click', () => {
        if (userAnswers[currentQIndex] === null) return;
        if (currentQIndex < quizQuestions.length - 1) {
          currentQIndex++;
          renderQuestion(currentQIndex);
        } else {
          calculateAndShowResults();
        }
      });
    }

    if (btnRetakeQuiz) {
      btnRetakeQuiz.addEventListener('click', () => {
        userAnswers = new Array(quizQuestions.length).fill(null);
        currentQIndex = 0;
        if (quizResultView) quizResultView.style.display = 'none';
        if (quizQuestionView) quizQuestionView.style.display = 'none';
        if (quizStartView) quizStartView.style.display = 'block';
      });
    }
  }

  // ——— HOMEPAGE SERVICES CATEGORY FILTER TABS ———
  const homeFilterTabs = document.querySelectorAll('#home-services-filter .svc-tab-btn');
  const homeServiceCards = document.querySelectorAll('.service-card-white');
  if (homeFilterTabs.length && homeServiceCards.length) {
    homeFilterTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        homeFilterTabs.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const filter = btn.getAttribute('data-filter');

        homeServiceCards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.classList.remove('hidden-card');
            card.style.opacity = '0';
            card.style.transform = 'translateY(12px)';
            card.classList.add('visible');
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, 30);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(12px)';
            setTimeout(() => {
              card.classList.add('hidden-card');
            }, 250);
          }
        });
      });
    });
  }

  // ——— SERVICES PAGE CATEGORY FILTER TABS ———
  const filterPills = document.querySelectorAll('.filter-pill');
  const serviceDetails = document.querySelectorAll('.service-detail');
  if (filterPills.length && serviceDetails.length) {
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filter = pill.getAttribute('data-filter');

        serviceDetails.forEach(detail => {
          const category = detail.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            detail.style.display = 'block';
            detail.querySelectorAll('.reveal').forEach(r => r.classList.add('visible'));
            setTimeout(() => {
              detail.style.opacity = '1';
              detail.style.transform = 'translateY(0)';
            }, 30);
          } else {
            detail.style.opacity = '0';
            detail.style.transform = 'translateY(16px)';
            setTimeout(() => {
              detail.style.display = 'none';
            }, 250);
          }
        });
      });
    });
  }

  // ——— FAQ ACCORDION INTERACTION ———
  const faqButtons = document.querySelectorAll('.faq-question-btn');
  if (faqButtons.length) {
    faqButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');

        // Optional: close other open items for clean single-focus or allow multi-expand
        document.querySelectorAll('.faq-item').forEach(other => {
          if (other !== item) {
            other.classList.remove('open');
            const otherBtn = other.querySelector('.faq-question-btn');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        if (isOpen) {
          item.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // ——— LUXURY WHATSAPP ADVISOR CONCIERGE INTERACTION ———
  const waTrigger = document.getElementById('wa-floating-trigger');
  const waCard = document.getElementById('wa-chat-card');
  const waClose = document.getElementById('wa-close-btn');
  const waTeaser = document.getElementById('wa-teaser-pill');
  const waChips = document.querySelectorAll('.wa-chip');
  const waCustomForm = document.getElementById('wa-custom-input-form');
  const waCustomInput = document.getElementById('wa-custom-msg');

  const WA_BASE_PHONE = '911126521217';

  function openWaCard() {
    if (waCard) {
      waCard.classList.add('open');
      waCard.setAttribute('aria-hidden', 'false');
      if (waTrigger) waTrigger.setAttribute('aria-expanded', 'true');
      if (waTeaser) waTeaser.style.display = 'none';
      if (waCustomInput) setTimeout(() => waCustomInput.focus(), 200);
    }
  }

  function closeWaCard() {
    if (waCard) {
      waCard.classList.remove('open');
      waCard.setAttribute('aria-hidden', 'true');
      if (waTrigger) waTrigger.setAttribute('aria-expanded', 'false');
      if (waTeaser) waTeaser.style.display = 'flex';
    }
  }

  function openWhatsAppWithMessage(messageText) {
    const encoded = encodeURIComponent(messageText);
    const url = `https://wa.me/${WA_BASE_PHONE}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  if (waTrigger) {
    waTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (waCard && waCard.classList.contains('open')) {
        closeWaCard();
      } else {
        openWaCard();
      }
    });
  }

  if (waTeaser) {
    waTeaser.addEventListener('click', (e) => {
      e.stopPropagation();
      openWaCard();
    });
  }

  if (waClose) {
    waClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeWaCard();
    });
  }

  if (waCard) {
    waCard.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  document.addEventListener('click', (e) => {
    if (waCard && waCard.classList.contains('open') && !waCard.contains(e.target) && e.target !== waTrigger) {
      closeWaCard();
    }
  });

  if (waChips.length) {
    waChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const msg = chip.getAttribute('data-msg') || 'Hello Vintage Finvest, I would like to consult with an advisor.';
        openWhatsAppWithMessage(msg);
      });
    });
  }

  if (waCustomForm) {
    waCustomForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userText = waCustomInput ? waCustomInput.value.trim() : '';
      const fullMsg = userText 
        ? `Hello Vintage Finvest, I have a query: ${userText}`
        : 'Hello Vintage Finvest, I would like to schedule a private wealth consultation.';
      openWhatsAppWithMessage(fullMsg);
    });
  }

  // Gentle auto-teaser hint after 3.5s
  setTimeout(() => {
    if (waTeaser && (!waCard || !waCard.classList.contains('open'))) {
      waTeaser.style.transform = 'translateX(-4px)';
      setTimeout(() => { waTeaser.style.transform = 'translateX(0)'; }, 400);
    }
  }, 3500);

  // ——— BLOG / PERSPECTIVES ARTICLES DATASET ———
  const blogArticles = {
    'equity-volatility': {
      tag: 'Wealth Strategy',
      title: 'Navigating Equity Volatility: Fiduciary Wisdom for HNW Families',
      meta: 'By Ashwin Karmarkar • October 2026 • 5 min read',
      content: `
        <p>In three decades of managing high-net-worth family capital in New Delhi, we have navigated through the 1992 Harshad Mehta fallout, the 2000 Dot-com crash, the 2008 Global Financial Crisis, and the 2020 pandemic dislocation. In every episode, the fundamental principle that preserved and compounded wealth remained identical: <strong>disciplined fiduciary asset allocation always triumphs over reactive emotion.</strong></p>
        
        <h3>The Mathematics of Calm: Rebalancing in Drawdowns</h3>
        <p>When market turbulence arrives, retail investors often flee to cash at precisely the wrong moment, locking in nominal losses. Conversely, a structured wealth mandate uses mathematical rebalancing corridors. When equity weights compress due to market pullbacks, surplus liquidity from debt and arbitrage portfolios is systematically deployed into undervalued quality businesses.</p>
        
        <div class="blog-modal-takeaway">
          <h4>Core Fiduciary Takeaway</h4>
          <p>Volatility is not risk; permanent loss of capital through panic selling is. By maintaining a 3-year cash flow runway in fixed income, your long-term equity compounding remains untouched during market corrections.</p>
        </div>

        <h3>Three Actionable Rules for Family Offices</h3>
        <ul>
          <li><strong>Never confuse price with value:</strong> Quality businesses with high ROE and pricing power compound intrinsically regardless of short-term index gyrations.</li>
          <li><strong>Staggered Deployments:</strong> Utilize STP (Systematic Transfer Plans) from liquid arbitrage into equity over 6–12 month phases.</li>
          <li><strong>Whitelisted Manager Selection:</strong> Partner only with fund managers who have demonstrated multi-cycle downside protection rather than chasing 1-year momentum.</li>
        </ul>
      `
    },
    'family-trusts': {
      tag: 'Estate & Legacy',
      title: 'Structuring Private Family Trusts in India: A Multi-Generational Guide',
      meta: 'By Vikram Chandra • September 2026 • 7 min read',
      content: `
        <p>India is currently witnessing the largest inter-generational wealth transfer in its economic history. Over the next decade, an estimated $1.3 trillion will pass from patriarchs and matriarchs who founded enterprises in the post-1991 liberalization era to their second and third generations.</p>
        
        <h3>Why a Simple Will Is No Longer Sufficient</h3>
        <p>While a registered Will remains a cornerstone document, it carries significant vulnerabilities for substantial estates. In Indian jurisdictions, a Will often requires a lengthy court probate process (especially in presidential towns like Mumbai and Kolkata), during which assets can be frozen, public disputes can emerge, and liquidity can be severely constrained.</p>

        <div class="blog-modal-takeaway">
          <h4>The Power of an Irrevocable Discretionary Trust</h4>
          <p>A Private Family Trust provides immediate continuity of asset management upon the settlor's demise without requiring probate. Assets ring-fenced inside an irrevocable trust are also insulated against future business liabilities and matrimonial disputes.</p>
        </div>

        <h3>Key Elements of a Robust Succession Blueprint</h3>
        <ul>
          <li><strong>Family Business Constitution:</strong> Defines voting rights, board succession rules, and dispute resolution mechanisms for operating businesses.</li>
          <li><strong>Discretionary vs. Specific Trust Deeds:</strong> Customizing distribution covenants for education, healthcare, entrepreneurial ventures, and philanthropic goals.</li>
          <li><strong>Independent Protector:</strong> Appointing a trusted professional advisor or institutional co-trustee to ensure fiduciary fidelity across generations.</li>
        </ul>
      `
    },
    'tax-alpha': {
      tag: 'Tax Alpha',
      title: 'Capital Gains Harvesting & Section 54 Planning for High-Growth Dynasties',
      meta: 'By Vineet Bhasin • August 2026 • 6 min read',
      content: `
        <p>Tax drag is the silent compounder of wealth erosion. For promoter families executing large-scale stake sales, real estate monetization, or equity vesting events, tax structuring is not an afterthought—it is an integral part of asset management.</p>

        <h3>Optimizing Capital Gains Under Modern Slabs</h3>
        <p>With amendments to long-term capital gains tax rates and indexation provisions, families require proactive tax alpha harvesting. Strategically offsetting long-term gains against available capital loss carry-forwards, structuring Section 54 and 54EC exemption pipelines, and stagger-gifting across distinct family HUFs can preserve up to 15%–20% of net liquidity.</p>

        <div class="blog-modal-takeaway">
          <h4>Tax Alpha Principle</h4>
          <p>Gross returns create vanity; net-of-tax, inflation-adjusted post-distribution yield is the only reality that builds enduring family wealth.</p>
        </div>

        <h3>Strategic Pillars of Section 54 Governance</h3>
        <ul>
          <li><strong>Pre-Sale Planning Horizon:</strong> Initiating tax modeling at least 6 months prior to transaction execution.</li>
          <li><strong>Capital Gain Account Schemes (CGAS):</strong> Timely escrow utilization before the filing deadline to protect roll-over validity.</li>
          <li><strong>HUF Optimization:</strong> Leveraging Hindu Undivided Family accounts for tax-efficient multi-entity balance sheet distribution.</li>
        </ul>
      `
    },
    'treasury-liquidity': {
      tag: 'Treasury & Cash Flow',
      title: 'Tax Alpha & Arbitrage: Optimizing Corporate Treasury Liquidity',
      meta: 'By Ashwin Karmarkar • August 2026 • 6 min read',
      content: `
        <p>For corporate founders, CXOs, and SME promoters across Delhi NCR, treasury management has historically meant parking operating surplus in conventional bank fixed deposits. However, with post-tax real yields often failing to outpace inflation, modern corporate treasuries demand sophisticated, tax-efficient liquidity governance.</p>

        <h3>Beyond the Bank FD: The Tax Alpha Advantage</h3>
        <p>Corporate tax rates on standard bank interest can erode up to 25%–35% of nominal earnings with zero indexation. By utilizing strategic arbitrage funds, liquid overnight mandates, and target maturity sovereign bond ladders, corporate treasuries can achieve superior post-tax net realization with daily or T+1 liquidity.</p>

        <div class="blog-modal-takeaway">
          <h4>Treasury Governance Rule</h4>
          <p>Separate corporate surplus into distinct buckets: Operating Cash (0–3 months), Tactical Reserve (3–12 months), and Strategic Growth Surplus (>12 months). Match duration strictly with capital expenditure plans.</p>
        </div>

        <h3>Four Pillar Corporate Liquidity Framework</h3>
        <ul>
          <li><strong>Zero Credit Risk:</strong> Restricting deployment strictly to sovereign (G-Sec/SDL) and AAA-rated corporate debt instruments.</li>
          <li><strong>Arbitrage Tax Efficiency:</strong> Leveraging equity-arbitrage taxation for surplus cash held between 3 to 12 months.</li>
          <li><strong>Automated Sweep & Deployment:</strong> Eliminating idle current account balances through systematic daily sweeps.</li>
        </ul>
      `
    },
    'philanthropy-endowments': {
      tag: 'Philanthropy & Impact',
      title: 'Next-Gen Philanthropy: Structuring Endowments with ESG Governance',
      meta: 'By Raghav Singhania • July 2026 • 5 min read',
      content: `
        <p>Modern Indian wealth creators are increasingly looking beyond traditional transactional charity. The emerging generation of family enterprise leaders seeks to create perpetual philanthropic endowments with measurable societal return, fiduciary accountability, and ESG alignment.</p>

        <h3>Transitioning from Ad-Hoc Giving to Structured Endowments</h3>
        <p>Setting up dedicated Section 8 foundation entities or public charitable trusts with institutional investment policies ensures that corpus capital generates continuous compounding income while granting targeted disbursements to vetted impact initiatives.</p>

        <div class="blog-modal-takeaway">
          <h4>Legacy of Impact</h4>
          <p>A well-governed family foundation unites multi-generational family members around shared human values, preparing the next generation for broader fiduciary responsibility.</p>
        </div>

        <h3>Key Steps in Endowment Setup</h3>
        <ul>
          <li><strong>Investment Policy Statement (IPS):</strong> Defining capital preservation constraints and approved sustainable asset classes for foundation corpus.</li>
          <li><strong>Impact KPI Audits:</strong> Implementing milestone-based grant distribution to ensure tangible on-ground outcomes.</li>
          <li><strong>Section 80G & 12A Compliance:</strong> Maintaining seamless tax exemption status and regulatory filings.</li>
        </ul>
      `
    }
  };

  // ——— BLOG MODAL READER ———
  let blogModalEl = null;

  function openBlogModal(articleId) {
    const article = blogArticles[articleId];
    if (!article) return;

    if (!blogModalEl) {
      blogModalEl = document.getElementById('blog-article-modal');
      if (!blogModalEl) {
        blogModalEl = document.createElement('div');
        blogModalEl.id = 'blog-article-modal';
        blogModalEl.className = 'blog-modal';
        blogModalEl.innerHTML = `
          <div class="blog-modal-container" role="dialog" aria-modal="true">
            <button class="blog-modal-close" id="blog-modal-close" aria-label="Close article">&times;</button>
            <div class="blog-modal-tag" id="blog-modal-tag"></div>
            <h2 class="blog-modal-title" id="blog-modal-title"></h2>
            <div class="blog-modal-meta" id="blog-modal-meta"></div>
            <div class="blog-modal-body" id="blog-modal-body"></div>
            <div class="blog-modal-cta">
              <span style="color: #94A3B8; font-size: 0.85rem;">Discuss this advisory topic with our principals:</span>
              <a href="contact.html" class="btn btn-primary btn-sm">Schedule Advisory Consultation &rarr;</a>
            </div>
          </div>
        `;
        document.body.appendChild(blogModalEl);

        const closeBtn = blogModalEl.querySelector('#blog-modal-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', closeBlogModal);
        }

        blogModalEl.addEventListener('click', (e) => {
          if (e.target === blogModalEl) closeBlogModal();
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && blogModalEl.classList.contains('open')) {
            closeBlogModal();
          }
        });
      }
    }

    document.getElementById('blog-modal-tag').textContent = article.tag;
    document.getElementById('blog-modal-title').textContent = article.title;
    document.getElementById('blog-modal-meta').textContent = article.meta;
    document.getElementById('blog-modal-body').innerHTML = article.content;
    blogModalEl.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (window._blogCarouselPause) window._blogCarouselPause();
  }

  function closeBlogModal() {
    if (blogModalEl) {
      blogModalEl.classList.remove('open');
      document.body.style.overflow = '';
      if (window._blogCarouselResume) window._blogCarouselResume();
    }
  }

  // ——— 3D CURVED PERSPECTIVE BLOG CAROUSEL ———
  function initBlog3DCarousel() {
    const stage = document.getElementById('blog-carousel-stage');
    const track = document.getElementById('blog-carousel-track');
    if (!stage || !track) return;

    const cards = Array.from(track.querySelectorAll('.blog-card-3d'));
    if (!cards.length) return;

    const prevBtn = document.getElementById('blog-prev-btn');
    const nextBtn = document.getElementById('blog-next-btn');
    const stagePrevBtn = document.getElementById('blog-stage-prev');
    const stageNextBtn = document.getElementById('blog-stage-next');
    const dotsContainer = document.getElementById('blog-dots-container');
    const tickerCount = document.getElementById('blog-ticker-count');
    const tickerTitle = document.getElementById('blog-ticker-title');

    const N = cards.length;
    let activeIndex = 0;
    let autoPlayTimer = null;
    let isDragging = false;
    let startX = 0;
    let currentDragX = 0;
    let dragOffset = 0;
    let hasDragged = false;

    // Render pagination dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < N; i++) {
        const dot = document.createElement('button');
        dot.className = `blog-dot ${i === activeIndex ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Go to article ${i + 1} of ${N}`);
        dot.addEventListener('click', () => {
          goToIndex(i);
          resetAutoPlay();
        });
        dotsContainer.appendChild(dot);
      }
    }

    function updateCarousel() {
      const vw = window.innerWidth;
      const isMobile = vw < 768;
      const isTablet = vw >= 768 && vw < 1024;

      // Update dots
      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.blog-dot');
        dots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === activeIndex);
          dot.setAttribute('aria-current', idx === activeIndex ? 'true' : 'false');
        });
      }

      // Update Ticker Bar
      if (tickerCount) {
        tickerCount.textContent = `0${activeIndex + 1} / 0${N}`;
      }
      if (tickerTitle && cards[activeIndex]) {
        const activeTitleEl = cards[activeIndex].querySelector('.blog-card-title-3d');
        if (activeTitleEl) {
          tickerTitle.textContent = activeTitleEl.textContent;
        }
      }

      // Calculate clean, non-overlapping horizontal spacing with 3D perspective
      cards.forEach((card, idx) => {
        let offset = ((idx - activeIndex) % N);
        if (offset > N / 2) offset -= N;
        if (offset < -N / 2) offset += N;

        const isCenter = offset === 0;
        card.classList.toggle('active', isCenter);
        card.classList.toggle('side-left', offset < 0);
        card.classList.toggle('side-right', offset > 0);
        card.setAttribute('aria-hidden', isCenter ? 'false' : 'true');
        card.tabIndex = isCenter ? 0 : -1;

        let tx = 0;
        let tz = 0;
        let rotY = 0;
        let scale = 1;
        let opacity = 1;
        let zIndex = 10;
        let pointerEvents = 'auto';

        if (isMobile) {
          // Mobile: Center card prominent + visible peeking side cards
          const stepMob = Math.min(Math.max(vw * 0.62, 190), 240);
          if (offset === 0) {
            tx = 0;
            tz = 30;
            rotY = 0;
            scale = 1;
            opacity = 1;
            zIndex = 25;
          } else if (offset === -1) {
            tx = -stepMob;
            tz = -10;
            rotY = 10;
            scale = 0.88;
            opacity = 0.92;
            zIndex = 18;
          } else if (offset === 1) {
            tx = stepMob;
            tz = -10;
            rotY = -10;
            scale = 0.88;
            opacity = 0.92;
            zIndex = 18;
          } else if (offset === -2) {
            tx = -stepMob * 1.8;
            tz = -40;
            rotY = 16;
            scale = 0.76;
            opacity = 0.45;
            zIndex = 10;
          } else if (offset === 2) {
            tx = stepMob * 1.8;
            tz = -40;
            rotY = -16;
            scale = 0.76;
            opacity = 0.45;
            zIndex = 10;
          } else {
            tx = offset * stepMob;
            opacity = 0;
            zIndex = 2;
            pointerEvents = 'none';
          }
        } else if (isTablet) {
          // Tablet: Clean 3-card and 5-card non-overlapping perspective
          const stepTab = Math.min(Math.max(vw * 0.36, 260), 320);
          if (offset === 0) {
            tx = 0;
            tz = 50;
            rotY = 0;
            scale = 1.04;
            opacity = 1;
            zIndex = 25;
          } else if (offset === -1) {
            tx = -stepTab;
            tz = -15;
            rotY = 14;
            scale = 0.90;
            opacity = 0.95;
            zIndex = 18;
          } else if (offset === 1) {
            tx = stepTab;
            tz = -15;
            rotY = -14;
            scale = 0.90;
            opacity = 0.95;
            zIndex = 18;
          } else if (offset === -2) {
            tx = -stepTab * 1.85;
            tz = -60;
            rotY = 24;
            scale = 0.80;
            opacity = 0.78;
            zIndex = 12;
          } else if (offset === 2) {
            tx = stepTab * 1.85;
            tz = -60;
            rotY = -24;
            scale = 0.80;
            opacity = 0.78;
            zIndex = 12;
          } else {
            tx = offset * stepTab;
            opacity = 0;
            zIndex = 2;
            pointerEvents = 'none';
          }
        } else {
          // Desktop / Widescreen: Generous spacing ensuring ZERO card overlap & high legibility
          const stepX = vw >= 1440 ? 360 : (vw >= 1200 ? 330 : 300);
          
          if (offset === 0) {
            tx = 0;
            tz = 60;
            rotY = 0;
            scale = 1.05;
            opacity = 1;
            zIndex = 25;
          } else if (offset === -1) {
            tx = -stepX;
            tz = -15;
            rotY = 14;
            scale = 0.92;
            opacity = 0.96;
            zIndex = 20;
          } else if (offset === 1) {
            tx = stepX;
            tz = -15;
            rotY = -14;
            scale = 0.92;
            opacity = 0.96;
            zIndex = 20;
          } else if (offset === -2) {
            tx = -stepX * 1.85;
            tz = -60;
            rotY = 25;
            scale = 0.82;
            opacity = 0.82;
            zIndex = 14;
          } else if (offset === 2) {
            tx = stepX * 1.85;
            tz = -60;
            rotY = -25;
            scale = 0.82;
            opacity = 0.82;
            zIndex = 14;
          } else {
            tx = offset * stepX * 1.5;
            opacity = 0;
            zIndex = 2;
            pointerEvents = 'none';
          }
        }

        card.style.transform = `translate3d(calc(-50% + ${tx.toFixed(1)}px), -50%, ${tz.toFixed(1)}px) rotateY(${rotY.toFixed(1)}deg) scale(${scale.toFixed(2)})`;
        card.style.opacity = opacity;
        card.style.zIndex = zIndex;
        card.style.pointerEvents = pointerEvents;
        card.tabIndex = pointerEvents !== 'none' ? 0 : -1;
        card.setAttribute('aria-hidden', opacity === 0 ? 'true' : 'false');
      });
    }

    function goToIndex(newIndex) {
      activeIndex = (newIndex % N + N) % N;
      updateCarousel();
    }

    function nextSlide() {
      goToIndex(activeIndex + 1);
    }

    function prevSlide() {
      goToIndex(activeIndex - 1);
    }

    // Header Controls
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        prevSlide();
        resetAutoPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        nextSlide();
        resetAutoPlay();
      });
    }

    // Stage Floating Controls
    if (stagePrevBtn) {
      stagePrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        prevSlide();
        resetAutoPlay();
      });
    }

    if (stageNextBtn) {
      stageNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        nextSlide();
        resetAutoPlay();
      });
    }

    // Card click & keyboard behavior: clicking any card selects it and directly opens the article modal to view
    cards.forEach((card, idx) => {
      const activateCard = (e) => {
        if (hasDragged) return;
        const blogId = card.getAttribute('data-blog-id');
        goToIndex(idx);
        resetAutoPlay();
        if (blogId) {
          openBlogModal(blogId);
        }
      };

      card.addEventListener('click', activateCard);

      // Keyboard access on cards
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateCard(e);
        }
      });
    });

    // Also allow clicking the active ticker pill to open article modal
    if (tickerTitle) {
      const tickerPill = tickerTitle.closest('.blog-stage-ticker-pill') || document.getElementById('blog-stage-ticker');
      if (tickerPill) {
        tickerPill.setAttribute('role', 'button');
        tickerPill.setAttribute('tabindex', '0');
        tickerPill.setAttribute('title', 'Click to read full article');
        const handleTickerClick = () => {
          const currentActiveCard = cards[activeIndex];
          if (currentActiveCard) {
            const blogId = currentActiveCard.getAttribute('data-blog-id');
            if (blogId) openBlogModal(blogId);
          }
        };
        tickerPill.addEventListener('click', handleTickerClick);
        tickerPill.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTickerClick();
          }
        });
      }
    }

    // Touch & Pointer Drag Gestures
    function onPointerDown(e) {
      if (e.target.closest('.blog-stage-arrow') || e.target.closest('.blog-nav-btn')) return;
      isDragging = true;
      hasDragged = false;
      startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      currentDragX = startX;
      dragOffset = 0;
      stage.classList.add('is-dragging');
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      currentDragX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      dragOffset = currentDragX - startX;
      if (Math.abs(dragOffset) > 20) {
        hasDragged = true;
      }
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      stage.classList.remove('is-dragging');

      if (Math.abs(dragOffset) > 40) {
        if (dragOffset > 0) {
          prevSlide();
        } else {
          nextSlide();
        }
        resetAutoPlay();
      }

      setTimeout(() => {
        hasDragged = false;
      }, 100);
    }

    // Mouse drag listeners
    stage.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    // Touch swipe listeners
    stage.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp, { passive: true });

    // Keyboard navigation
    stage.setAttribute('tabindex', '0');
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
        resetAutoPlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
        resetAutoPlay();
      }
    });

    // Automatic Continuous 3D Rotation (rotates every 4.0 seconds)
    function startAutoPlay() {
      stopAutoPlay();
      autoPlayTimer = setInterval(() => {
        nextSlide();
      }, 4000);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    function resetAutoPlay() {
      stopAutoPlay();
      startAutoPlay();
    }

    // Expose lifecycle hooks for modal reader
    window._blogCarouselPause = stopAutoPlay;
    window._blogCarouselResume = startAutoPlay;

    // Pause on hover, resume on mouse leave
    stage.addEventListener('mouseenter', stopAutoPlay);
    stage.addEventListener('mouseleave', () => {
      if (!blogModalEl || !blogModalEl.classList.contains('open')) {
        startAutoPlay();
      }
    });

    // Pause when browser tab is inactive, resume when tab becomes active
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoPlay();
      } else if (!blogModalEl || !blogModalEl.classList.contains('open')) {
        startAutoPlay();
      }
    });

    // Window resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateCarousel, 100);
    }, { passive: true });

    // Initial render and immediate auto-rotation start
    updateCarousel();
    startAutoPlay();
  }

  // ——— BLOG DIRECTORY GRID & FILTER TABS ———
  function initBlogGrid() {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.blog-grid-card'));
    const tabButtons = Array.from(document.querySelectorAll('#blog-filter-tabs .blog-tab'));

    // Card clicks to open modal
    cards.forEach((card) => {
      const blogId = card.getAttribute('data-blog-id');
      card.addEventListener('click', (e) => {
        if (blogId) {
          openBlogModal(blogId);
        }
      });
      card.setAttribute('tabindex', '0');
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (blogId) openBlogModal(blogId);
        }
      });
    });

    // Tab filter handling
    tabButtons.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabButtons.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.getAttribute('data-filter');
        cards.forEach((card) => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // ——— BOOTSTRAP INITIALIZATION ———
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initBlog3DCarousel();
      initBlogGrid();
    });
  } else {
    initBlog3DCarousel();
    initBlogGrid();
  }

})();