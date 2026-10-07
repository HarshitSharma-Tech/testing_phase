// ============================================================
// VINTAGE FINVEST — main.js
// Clean, Fast, High-Performance Interactive Engine
// ============================================================

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
  // ============================================================
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
        var fadeIn  = Math.min(1, p.y / 40);
        var fadeOut = Math.min(1, (H - p.y) / 40);
        var fade    = Math.max(0, Math.min(fadeIn, fadeOut));
        var tw      = 0.76 + 0.24 * Math.sin(ts * 0.0007 * p.twF * 60 + p.twP);
        var a       = p.a * fade * tw;
        if (a > 0.008) drawP(p, a);
        if (p.y > H + 22 || p.x > W + 60 || p.x < -60) rain[i] = mkRain(false);
      }

      for (var j = clicks.length - 1; j >= 0; j--) {
        var c = clicks[j];
        c.swP += c.swF;
        c.x   += c.vx + Math.sin(c.swP) * c.swA;
        c.y   += c.vy;
        c.rot += c.rotV;
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

  if (calcTabs.length && calcPanels.length) {
    calcTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        calcTabs.forEach(t => t.classList.remove('active'));
        calcPanels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }

  // Currency helper (Indian Lakhs / Crores)
  function formatINR(val) {
    if (val >= 10000000) {
      const cr = (val / 10000000).toFixed(2).replace(/\.00$/, '');
      return `₹ ${cr} Cr`;
    } else if (val >= 100000) {
      const lk = (val / 100000).toFixed(2).replace(/\.00$/, '');
      return `₹ ${lk} Lakhs`;
    }
    return `₹ ${Math.round(val).toLocaleString('en-IN')}`;
  }

  // ——— 1. BASIC SIP CALCULATOR ———
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

  if (sipBasicMonthlyRange && sipBasicRateRange && sipBasicHorizonRange) {
    function calculateBasicSIP() {
      const monthly = parseFloat(sipBasicMonthlyRange.value);
      const rate = parseFloat(sipBasicRateRange.value) / 100;
      const years = parseInt(sipBasicHorizonRange.value, 10);
      const monthlyRate = rate / 12;
      const months = years * 12;

      sipBasicMonthlyVal.textContent = `${formatINR(monthly)} / month`;
      sipBasicRateVal.textContent = `${(rate * 100).toFixed(1)}% p.a.*`;
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

    sipBasicMonthlyRange.addEventListener('input', calculateBasicSIP);
    sipBasicRateRange.addEventListener('input', calculateBasicSIP);
    sipBasicHorizonRange.addEventListener('input', calculateBasicSIP);
    calculateBasicSIP();
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
  const lsTotalWealth = document.getElementById('ls-total-wealth');
  const lsTotalGain = document.getElementById('ls-total-gain');
  const lsTotalInvested = document.getElementById('ls-total-invested');
  const lsLumpGrowVal = document.getElementById('ls-lump-grow-val');
  const lsBarInvested = document.getElementById('ls-bar-invested');
  const lsBarGains = document.getElementById('ls-bar-gains');
  const lsLegInv = document.getElementById('ls-leg-inv');
  const lsLegGain = document.getElementById('ls-leg-gain');
  const lsRatioLbl = document.getElementById('ls-ratio-lbl');

  if (lsLumpRange && lsSipRange && lsHorizonRange && lsRateRange) {
    function calculateLumpsumSIP() {
      const lump = parseFloat(lsLumpRange.value);
      const sip = parseFloat(lsSipRange.value);
      const years = parseInt(lsHorizonRange.value, 10);
      const rate = parseFloat(lsRateRange.value) / 100;
      const monthlyRate = rate / 12;
      const months = years * 12;

      lsLumpVal.textContent = formatINR(lump);
      lsSipVal.textContent = `${formatINR(sip)} / month`;
      lsHorizonVal.textContent = `${years} Year${years > 1 ? 's' : ''}`;
      lsRateVal.textContent = `${(rate * 100).toFixed(1)}% p.a.*`;

      const lumpFV = lump * Math.pow(1 + rate, years);
      const sipFV = sip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
      const totalInvested = lump + (sip * months);
      const totalWealth = lumpFV + sipFV;
      const totalGain = Math.max(0, totalWealth - totalInvested);

      if (lsTotalWealth) lsTotalWealth.textContent = formatINR(totalWealth);
      if (lsTotalGain) lsTotalGain.textContent = `+${formatINR(totalGain)}`;
      if (lsTotalInvested) lsTotalInvested.textContent = formatINR(totalInvested);
      if (lsLumpGrowVal) lsLumpGrowVal.textContent = formatINR(lumpFV);
      if (lsLegInv) lsLegInv.textContent = formatINR(totalInvested);
      if (lsLegGain) lsLegGain.textContent = formatINR(totalGain);

      const invRatio = Math.round((totalInvested / totalWealth) * 100);
      const gainRatio = 100 - invRatio;
      if (lsBarInvested) lsBarInvested.style.width = `${invRatio}%`;
      if (lsBarGains) lsBarGains.style.width = `${gainRatio}%`;
      if (lsRatioLbl) lsRatioLbl.textContent = `${gainRatio}% Growth : ${invRatio}% Capital`;
    }

    lsLumpRange.addEventListener('input', calculateLumpsumSIP);
    lsSipRange.addEventListener('input', calculateLumpsumSIP);
    lsHorizonRange.addEventListener('input', calculateLumpsumSIP);
    lsRateRange.addEventListener('input', calculateLumpsumSIP);
    calculateLumpsumSIP();
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
  const sipTotalWealth = document.getElementById('sip-total-wealth');
  const sipTotalGain = document.getElementById('sip-total-gain');
  const sipTotalInvested = document.getElementById('sip-total-invested');
  const sipAdvantage = document.getElementById('sip-advantage');
  const sipBadge = document.getElementById('sip-badge');
  const sipBarInvested = document.getElementById('sip-bar-invested');
  const sipBarGains = document.getElementById('sip-bar-gains');
  const sipLegInv = document.getElementById('sip-leg-inv');
  const sipLegGain = document.getElementById('sip-leg-gain');
  const sipRatioLbl = document.getElementById('sip-ratio-lbl');

  if (sipMonthlyRange && sipStepupRange && sipHorizonRange && sipRateRange) {
    function calculateSIP() {
      const initialMonthly = parseFloat(sipMonthlyRange.value);
      const stepUpPercent = parseFloat(sipStepupRange.value) / 100;
      const years = parseInt(sipHorizonRange.value, 10);
      const annualRate = parseFloat(sipRateRange.value) / 100;
      const monthlyRate = annualRate / 12;

      sipMonthlyVal.textContent = `${formatINR(initialMonthly)} / month`;
      sipStepupVal.textContent = stepUpPercent === 0 ? '0% (Flat SIP)' : `${(stepUpPercent * 100).toFixed(0)}% per year`;
      sipHorizonVal.textContent = `${years} Year${years > 1 ? 's' : ''}`;
      sipRateVal.textContent = `${(annualRate * 100).toFixed(1)}% p.a.*`;
      if (sipBadge) sipBadge.textContent = stepUpPercent === 0 ? 'Regular Flat SIP' : `+${(stepUpPercent * 100).toFixed(0)}% Annual Step-Up`;

      let totalInvested = 0;
      let futureValue = 0;
      const totalMonths = years * 12;

      for (let m = 1; m <= totalMonths; m++) {
        const yearIndex = Math.floor((m - 1) / 12);
        const currentMonthly = initialMonthly * Math.pow(1 + stepUpPercent, yearIndex);
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

      const invRatio = Math.round((totalInvested / futureValue) * 100);
      const gainRatio = 100 - invRatio;
      if (sipBarInvested) sipBarInvested.style.width = `${invRatio}%`;
      if (sipBarGains) sipBarGains.style.width = `${gainRatio}%`;
      if (sipRatioLbl) sipRatioLbl.textContent = `${gainRatio}% Growth : ${invRatio}% Capital`;
    }

    sipMonthlyRange.addEventListener('input', calculateSIP);
    sipStepupRange.addEventListener('input', calculateSIP);
    sipHorizonRange.addEventListener('input', calculateSIP);
    sipRateRange.addEventListener('input', calculateSIP);
    calculateSIP();
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

  // ——— 6. STP CALCULATOR ———
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

  if (stpSourceRange && stpTransferRange && stpHorizonRange && stpSourceRateRange && stpTargetRateRange) {
    function calculateSTP() {
      const sourceCorpus = parseFloat(stpSourceRange.value);
      const transferMonthly = parseFloat(stpTransferRange.value);
      const years = parseInt(stpHorizonRange.value, 10);
      const sourceRate = parseFloat(stpSourceRateRange.value) / 100;
      const targetRate = parseFloat(stpTargetRateRange.value) / 100;
      const sourceMonthlyRate = sourceRate / 12;
      const targetMonthlyRate = targetRate / 12;
      const months = years * 12;

      stpSourceVal.textContent = formatINR(sourceCorpus);
      stpTransferVal.textContent = `${formatINR(transferMonthly)} / month`;
      stpHorizonVal.textContent = `${years} Year${years > 1 ? 's' : ''}`;
      if (stpRatesVal) stpRatesVal.textContent = `${(sourceRate * 100).toFixed(1)}% / ${(targetRate * 100).toFixed(1)}% p.a.*`;

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

    stpSourceRange.addEventListener('input', calculateSTP);
    stpTransferRange.addEventListener('input', calculateSTP);
    stpHorizonRange.addEventListener('input', calculateSTP);
    stpSourceRateRange.addEventListener('input', calculateSTP);
    stpTargetRateRange.addEventListener('input', calculateSTP);
    calculateSTP();
  }

  // ——— 7. SWP CALCULATOR ———
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

  if (swpCorpusRange && swpWithdrawRange && swpHorizonRange && swpRateRange) {
    function calculateSWP() {
      const corpusLakhs = parseFloat(swpCorpusRange.value);
      const initialCorpus = corpusLakhs * 100000;
      const monthlyWithdraw = parseFloat(swpWithdrawRange.value);
      const years = parseInt(swpHorizonRange.value, 10);
      const annualRate = parseFloat(swpRateRange.value) / 100;
      const monthlyRate = annualRate / 12;

      swpCorpusVal.textContent = formatINR(initialCorpus);
      swpWithdrawVal.textContent = `${formatINR(monthlyWithdraw)} / month`;
      swpHorizonVal.textContent = `${years} Year${years > 1 ? 's' : ''}`;
      swpRateVal.textContent = `${(annualRate * 100).toFixed(1)}% p.a.*`;

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
          swpHealthBadge.textContent = `⚠️ Depletes in ${depYears} Yrs`;
        }
        if (swpSustainText) swpSustainText.textContent = `Withdrawal rate exceeds portfolio yield`;
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

    swpCorpusRange.addEventListener('input', calculateSWP);
    swpWithdrawRange.addEventListener('input', calculateSWP);
    swpHorizonRange.addEventListener('input', calculateSWP);
    swpRateRange.addEventListener('input', calculateSWP);
    calculateSWP();
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
  const corpusRange = document.getElementById('corpus-range');
  const horizonRange = document.getElementById('horizon-range');
  const corpusVal = document.getElementById('corpus-val');
  const horizonVal = document.getElementById('horizon-val');
  const strategyBadge = document.getElementById('strategy-badge');
  const projWealth = document.getElementById('projected-wealth');
  const projGain = document.getElementById('projected-gain');
  const strategyBtns = document.querySelectorAll('.strategy-pill');
  
  const sliceEq = document.querySelector('.alloc-slice.equity');
  const sliceDebt = document.querySelector('.alloc-slice.debt');
  const sliceAif = document.querySelector('.alloc-slice.aif');
  const sliceGold = document.querySelector('.alloc-slice.gold');

  const legEq = document.getElementById('leg-eq');
  const legDebt = document.getElementById('leg-debt');
  const legAif = document.getElementById('leg-aif');
  const legGold = document.getElementById('leg-gold');

  if (corpusRange && horizonRange) {
    const strategies = {
      conservative: {
        name: 'Capital Preservation Mandate',
        rate: 0.095,
        allocation: { equity: 25, debt: 55, aif: 10, gold: 10 }
      },
      balanced: {
        name: 'Balanced Growth Mandate',
        rate: 0.132,
        allocation: { equity: 50, debt: 25, aif: 15, gold: 10 }
      },
      aggressive: {
        name: 'High-Alpha Equity Mandate',
        rate: 0.168,
        allocation: { equity: 70, debt: 10, aif: 15, gold: 5 }
      }
    };

    let currentStrategy = 'balanced';

    function calculateAlloc() {
      const corpusLakhs = parseFloat(corpusRange.value);
      const years = parseInt(horizonRange.value, 10);
      const strat = strategies[currentStrategy];

      corpusVal.textContent = formatINR(corpusLakhs * 100000);
      horizonVal.textContent = `${years} Year${years > 1 ? 's' : ''}`;
      if (strategyBadge) strategyBadge.textContent = strat.name;

      const corpusRupees = corpusLakhs * 100000;
      const futureWealthRupees = corpusRupees * Math.pow(1 + strat.rate, years);
      const wealthGainRupees = futureWealthRupees - corpusRupees;

      if (projWealth) projWealth.textContent = formatINR(futureWealthRupees);
      if (projGain) projGain.textContent = `+${formatINR(wealthGainRupees)}`;

      const alloc = strat.allocation;
      if (sliceEq) sliceEq.style.width = `${alloc.equity}%`;
      if (sliceDebt) sliceDebt.style.width = `${alloc.debt}%`;
      if (sliceAif) sliceAif.style.width = `${alloc.aif}%`;
      if (sliceGold) sliceGold.style.width = `${alloc.gold}%`;

      if (legEq) legEq.textContent = `${alloc.equity}%`;
      if (legDebt) legDebt.textContent = `${alloc.debt}%`;
      if (legAif) legAif.textContent = `${alloc.aif}%`;
      if (legGold) legGold.textContent = `${alloc.gold}%`;
    }

    corpusRange.addEventListener('input', calculateAlloc);
    horizonRange.addEventListener('input', calculateAlloc);

    strategyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!btn.hasAttribute('data-strategy')) return;
        strategyBtns.forEach(b => { if (b.hasAttribute('data-strategy')) b.classList.remove('active'); });
        btn.classList.add('active');
        currentStrategy = btn.getAttribute('data-strategy');
        calculateAlloc();
      });
    });

    calculateAlloc();
  }

  // ——— TAB 4: FINANCIAL PLANNING DIAGNOSTIC QUIZ ———
  const quizQ1Btns = document.querySelectorAll('#quiz-q1 .quiz-opt-btn');
  const quizQ2Btns = document.querySelectorAll('#quiz-q2 .quiz-opt-btn');
  const quizQ3Btns = document.querySelectorAll('#quiz-q3 .strategy-pill');

  const quizMandateBadge = document.getElementById('quiz-mandate-badge');
  const quizMandateTitle = document.getElementById('quiz-mandate-title');
  const quizMandateDesc = document.getElementById('quiz-mandate-desc');
  const quizPoint1 = document.getElementById('quiz-point-1');
  const quizPoint2 = document.getElementById('quiz-point-2');
  const quizPoint3 = document.getElementById('quiz-point-3');
  const btnQuizBook = document.getElementById('btn-quiz-book');

  if (quizQ1Btns.length && quizQ2Btns.length) {
    let selQ1 = 'cxo';
    let selQ2 = 'growth';
    let selQ3 = '2cr-10cr';

    const diagnosticMatrix = {
      'cxo_growth': {
        badge: 'Executive Alpha Mandate',
        title: 'High-Alpha PMS & Tax Optimization for CxOs',
        desc: 'Focus on diversifying concentrated employer equity/ESOPs into institutional PMS and AIFs while building tax-advantaged passive income.',
        p1: 'White-list portfolio audit of existing direct stocks and mutual funds.',
        p2: 'Tax-efficient capital gains management under new LTCG rules.',
        p3: 'Structuring an emergency liquidity treasury buffer.'
      },
      'cxo_tax': {
        badge: 'Tax Alpha Structuring',
        title: 'Personal Tax & Liability Governance',
        desc: 'Comprehensive restructuring of your assets to eliminate tax drag, optimize deductions, and protect high-bracket salary streams.',
        p1: 'Full tax-drag assessment across all fixed income and equity instruments.',
        p2: 'Structuring Section 54/54EC capital gains shelters.',
        p3: 'Integrating family member tax slabs for legal wealth distribution.'
      },
      'business_treasury': {
        badge: 'Corporate Treasury Governance',
        title: 'SME & Corporate Treasury Liquidity Mandate',
        desc: 'Deploying surplus operating cash into ultra-short duration and arbitrage funds to generate superior post-tax yield without locking liquidity.',
        p1: 'Cash-flow modeling to align with tax advance and vendor payout schedules.',
        p2: 'Zero-credit-risk corporate debt and arbitrage selection.',
        p3: 'Ring-fencing business liabilities from personal family assets.'
      },
      'family_estate': {
        badge: 'Multi-Gen Family Office Mandate',
        title: 'Private Family Trust & Legacy Succession',
        desc: 'Creating an enduring multi-generational estate structure with bespoke family trust deeds, asset ring-fencing, and next-gen stewardship.',
        p1: 'Drafting private family trust constitution and governance bylaws.',
        p2: 'Seamless cross-generational transfer without probate delays.',
        p3: 'Consolidated family balance sheet reporting across all entities.'
      },
      'retiree_tax': {
        badge: 'Capital Preservation & SWP Yield',
        title: 'Retirement Cash-Flow & Capital Protection',
        desc: 'Constructing a resilient SWP portfolio with monthly income guarantees, inflation-hedged equity exposure, and medical safety vaults.',
        p1: 'Structuring monthly tax-efficient SWP payouts.',
        p2: 'Insulating retirement corpus against deep equity market drawdowns.',
        p3: 'Optimizing healthcare liquidity and nomination succession.'
      }
    };

    function updateQuiz() {
      const key = `${selQ1}_${selQ2}`;
      const data = diagnosticMatrix[key] || {
        badge: 'Bespoke Wealth Management Mandate',
        title: 'Holistic Wealth Stewardship & Planning',
        desc: `Customized strategy tailored for your ${selQ3} portfolio to maximize risk-adjusted growth, tax efficiency, and long-term security.`,
        p1: 'Fiduciary audit of existing mutual fund, debt, and PMS holdings.',
        p2: 'Strategic multi-asset allocation tailored to your specific timeline.',
        p3: 'Tax-optimized wealth succession and family legacy protection.'
      };

      if (quizMandateBadge) quizMandateBadge.textContent = data.badge;
      if (quizMandateTitle) quizMandateTitle.textContent = data.title;
      if (quizMandateDesc) quizMandateDesc.textContent = data.desc;
      if (quizPoint1) quizPoint1.textContent = data.p1;
      if (quizPoint2) quizPoint2.textContent = data.p2;
      if (quizPoint3) quizPoint3.textContent = data.p3;

      if (btnQuizBook) {
        btnQuizBook.href = `contact.html?audit=requested&profile=${encodeURIComponent(selQ1)}&priority=${encodeURIComponent(selQ2)}&scale=${encodeURIComponent(selQ3)}`;
      }
    }

    quizQ1Btns.forEach(b => {
      b.addEventListener('click', () => {
        quizQ1Btns.forEach(btn => btn.classList.remove('active'));
        b.classList.add('active');
        selQ1 = b.getAttribute('data-q1');
        updateQuiz();
      });
    });

    quizQ2Btns.forEach(b => {
      b.addEventListener('click', () => {
        quizQ2Btns.forEach(btn => btn.classList.remove('active'));
        b.classList.add('active');
        selQ2 = b.getAttribute('data-q2');
        updateQuiz();
      });
    });

    quizQ3Btns.forEach(b => {
      b.addEventListener('click', () => {
        quizQ3Btns.forEach(btn => btn.classList.remove('active'));
        b.classList.add('active');
        selQ3 = b.getAttribute('data-q3');
        updateQuiz();
      });
    });

    updateQuiz();
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