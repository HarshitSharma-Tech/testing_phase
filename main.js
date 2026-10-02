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

  // ——— TAB 1: ASSET ALLOCATION SIMULATOR ———
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

  // ——— TAB 2: STEP-UP SIP CALCULATOR ———
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

      // Flat SIP comparison
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
      if (sipRatioLbl) sipRatioLbl.textContent = `${gainRatio}% Gains : ${invRatio}% Principal`;
    }

    sipMonthlyRange.addEventListener('input', calculateSIP);
    sipStepupRange.addEventListener('input', calculateSIP);
    sipHorizonRange.addEventListener('input', calculateSIP);
    sipRateRange.addEventListener('input', calculateSIP);

    calculateSIP();
  }

  // ——— TAB 3: SWP RETIREMENT PLANNER ———
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
          totalWithdrawn += (monthlyWithdraw + currentBalance); // partial
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

})();
