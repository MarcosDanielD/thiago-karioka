(() => {
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Split headings into words ---------- */
  function splitWords(el) {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const wi = document.createElement('span');
            wi.className = 'wi';
            wi.style.setProperty('--i', i++);
            wi.textContent = part;
            w.appendChild(wi);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
    el.classList.add('split');
  }
  document.querySelectorAll('.h-display, .h-section').forEach(splitWords);

  /* ---------- 2. Reveal variants ---------- */
  const variant = (sel, type) => document.querySelectorAll(sel).forEach((el) => el.setAttribute('data-reveal', type));
  variant('.mockup', 'clip');
  variant('.about__img', 'clip');
  variant('.compare', 'scale');
  variant('.contact .form', 'right');
  variant('.timeline', 'left');

  // Stagger grid children automatically
  document.querySelectorAll('.grid-3, .proof-grid, .services').forEach((grid) => {
    [...grid.children].forEach((c, idx) => c.style.setProperty('--d', idx));
  });

  /* ---------- 3. Marquee: duplicate track for seamless loop ---------- */
  const track = document.getElementById('strip-track');
  if (track) track.innerHTML += track.innerHTML;

  /* ---------- 4. Intro loader ---------- */
  const count = document.getElementById('loader-count');
  const bar = document.getElementById('loader-bar');
  const seen = sessionStorage.getItem('tk-intro');
  const minTime = reduced ? 0 : seen ? 900 : 2200;
  const start = performance.now();
  let pageReady = document.readyState === 'complete';
  window.addEventListener('load', () => { pageReady = true; });

  function tick(now) {
    const t = Math.min((now - start) / minTime, 1);
    // ease-out progress, holds at 92% until page is loaded
    let p = 1 - Math.pow(1 - t, 3);
    if (!pageReady) p = Math.min(p, 0.92);
    count.textContent = Math.round(p * 100) + '%';
    bar.style.transform = `scaleX(${p})`;
    if (p >= 1 || minTime === 0) finishIntro();
    else requestAnimationFrame(tick);
  }

  let started = false;
  function finishIntro() {
    if (started) return;
    started = true;
    sessionStorage.setItem('tk-intro', '1');
    body.classList.add('loaded');
    window.scrollTo(0, 0);
    setTimeout(() => {
      body.classList.remove('is-loading');
      startReveals();
    }, reduced ? 0 : 650);
    setTimeout(() => document.getElementById('loader')?.remove(), 1800);
  }
  requestAnimationFrame(tick);
  setTimeout(() => { pageReady = true; }, 5000); // safety net

  /* ---------- 5. Scroll reveals ---------- */
  function startReveals() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  }

  /* ---------- 6. Scroll-linked: progress bar, nav, parallax, mobile CTA ---------- */
  const progress = document.getElementById('progress');
  const nav = document.querySelector('.nav');
  const hero = document.querySelector('.hero');
  const contact = document.getElementById('contato');
  const mobileCta = document.getElementById('mobile-cta');
  const parallax = [...document.querySelectorAll('.mockup, .about__img')];
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('scrolled', y > 8);

    if (!reduced) {
      parallax.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const center = r.top + r.height / 2 - vh / 2;
        const shift = Math.max(-1, Math.min(1, center / vh)) * -(r.height * (el.classList.contains('mockup') ? 0.03 : 0.05));
        el.style.setProperty('--py', shift.toFixed(1) + 'px');
      });
    }

    if (mobileCta && hero && contact) {
      const pastHero = hero.getBoundingClientRect().bottom < 80;
      const atContact = contact.getBoundingClientRect().top < vh * 0.85;
      mobileCta.classList.toggle('show', pastHero && !atContact);
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- 7. Active nav link ---------- */
  const navLinks = [...document.querySelectorAll('.nav__links a')];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  /* ---------- 8. Mobile menu ---------- */
  const toggle = document.getElementById('nav-toggle');
  const setMenu = (open) => {
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  toggle.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  navLinks.forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });

  /* ---------- 9. Contact form (demo) ---------- */
  const form = document.getElementById('contact-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.classList.add('sent');
    form.reset();
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
