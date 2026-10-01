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
    const topBarH = topBar ? topBar.offsetHeight : 0;
    const scrolled = window.scrollY > 60;
    if (scrolled) {
      nav.classList.add('scrolled');
      if (topBar) nav.style.top = '0';
    } else {
      nav.classList.remove('scrolled');
      if (topBar) nav.style.top = topBarH + 'px';
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

  // ——— HERO CANVAS: Ambient Gold Particles ———
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], mouse = { x: -9999, y: -9999 };
    const PARTICLE_COUNT = window.innerWidth < 768 ? 30 : 60;

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function createParticle() {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const size = Math.random() * 1.8 + 0.5;
      const speedX = (Math.random() - 0.5) * 0.25;
      const speedY = -Math.random() * 0.4 - 0.1;
      const life = Math.random() * 200 + 100;
      const alpha = Math.random() * 0.6 + 0.2;
      return { x, y, size, speedX, speedY, life, maxLife: life, alpha };
    }

    function init() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = createParticle();
        p.life = Math.random() * p.maxLife;
        particles.push(p);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const force = (180 - dist) / 180 * 0.012;
          p.x += dx * force;
          p.y += dy * force;
        }
        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;

        const progress = p.life / p.maxLife;
        const fadeAlpha = p.alpha * (progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 169, 110, ${fadeAlpha})`;
        ctx.fill();

        if (p.life <= 0) {
          particles[i] = createParticle();
          particles[i].x = Math.random() * W;
          particles[i].y = H * 0.8 + Math.random() * H * 0.2;
        }
      }
      requestAnimationFrame(draw);
    }

    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });

    window.addEventListener('resize', () => { resize(); init(); }, { passive: true });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      resize();
      init();
      draw();
    }
  }

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
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

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

  // ——— VIDEO FALLBACK for prefers-reduced-motion ———
  const heroVideo = document.getElementById('hero-video');
  const heroPoster = document.getElementById('hero-poster');
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

  // ——— INTERACTIVE PORTFOLIO STUDIO ———
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

    function formatCurrency(lakhs) {
      if (lakhs >= 100) {
        const cr = (lakhs / 100).toFixed(2).replace(/\.00$/, '');
        return `₹ ${cr} Crore`;
      }
      return `₹ ${lakhs} Lakhs`;
    }

    function calculate() {
      const corpusLakhs = parseFloat(corpusRange.value);
      const years = parseInt(horizonRange.value, 10);
      const strat = strategies[currentStrategy];

      corpusVal.textContent = formatCurrency(corpusLakhs);
      horizonVal.textContent = `${years} Year${years > 1 ? 's' : ''}`;
      if (strategyBadge) strategyBadge.textContent = strat.name;

      const corpusRupees = corpusLakhs * 100000;
      const futureWealthRupees = corpusRupees * Math.pow(1 + strat.rate, years);
      const wealthGainRupees = futureWealthRupees - corpusRupees;

      const futureCrores = (futureWealthRupees / 10000000).toFixed(2);
      const gainCrores = (wealthGainRupees / 10000000).toFixed(2);

      if (projWealth) projWealth.textContent = `₹ ${futureCrores} Cr`;
      if (projGain) projGain.textContent = `+₹ ${gainCrores} Cr`;

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

    corpusRange.addEventListener('input', calculate);
    horizonRange.addEventListener('input', calculate);

    strategyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        strategyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentStrategy = btn.getAttribute('data-strategy');
        calculate();
      });
    });

    calculate();
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

})();
