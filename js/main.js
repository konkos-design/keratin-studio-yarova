(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- theme ---------- */
  const toggle = document.querySelector('.theme-t');
  const setTheme = (t) => {
    root.dataset.theme = t;
    store.set('ks-theme', t);
    if (toggle) toggle.setAttribute('aria-label', t === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = t === 'dark' ? '#0f0e0d' : '#f6f2ec';
  };
  setTheme(root.dataset.theme || 'light');
  if (toggle) toggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduce) { setTheme(next); return; }
    const vt = document.startViewTransition(() => setTheme(next));
    vt.ready.then(() => {
      root.animate(
        { clipPath: ['polygon(0 0, 0 0, -30% 100%, -30% 100%)', 'polygon(0 0, 130% 0, 100% 100%, -30% 100%)'] },
        { duration: 900, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
  });

  /* ---------- header + progress ---------- */
  const hdr = document.querySelector('.hdr');
  const bar = document.querySelector('.progress');
  let lastY = 0, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('scrolled', y > 20);
    hdr.classList.toggle('hide', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
    lastY = y;
    if (bar) {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h) : 0})`;
    }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  const burger = document.querySelector('.burger');
  if (burger) {
    const close = () => { document.body.classList.remove('menu-open', 'no-scroll'); burger.setAttribute('aria-expanded', 'false'); };
    burger.addEventListener('click', () => {
      const open = !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open);
      document.body.classList.toggle('no-scroll', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('.mnav a').forEach(a => a.addEventListener('click', close));
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  document.querySelectorAll('.rv, .img-rv').forEach(el => io.observe(el));

  /* ---------- reviews: every card reacts to the mouse ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('.review').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
        card.style.transform = `translateY(-6px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 7}deg)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- price explorer + illustrated hair ---------- */
  const explorer = document.querySelector('[data-explorer]');
  if (explorer) {
    const NS = 'http://www.w3.org/2000/svg';
    const btns = [...explorer.querySelectorAll('.lengths button')];
    const items = [...explorer.querySelectorAll('.live-list li')];
    const hair = explorer.querySelector('.hair');
    const hairClip = explorer.querySelector('.hair-clip');
    const hairShadow = explorer.querySelector('.hair-shadow');
    const strandsG = explorer.querySelector('.strands');
    const marker = explorer.querySelector('.marker');
    const rulerMarks = [...explorer.querySelectorAll('.ruler g[data-y]')];
    const rows = document.querySelectorAll('.pt tbody tr');
    const lenName = explorer.querySelector('[data-len-name]');
    const lenCm = explorer.querySelector('[data-len-cm]');
    const ends = [176, 206, 240, 286, 340, 386, 440, 488, 526];
    const fmt = n => n.toLocaleString('uk-UA').replace(/ /g, ' ');
    const CX = 150;
    const halfW = (y, L) => {
      let w;
      if (y < 105) w = 33 + Math.max(0, y - 96) * 0.33;
      else if (y < 178) w = 36 + (y - 105) * 0.13;
      else w = Math.max(41, 45.5 - (y - 178) * 0.012);
      if (L !== undefined) { const t = (L - y) / 40; if (t < 1) w *= 0.86 + 0.14 * t; }
      return w;
    };
    const rnd = (i) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };
    const hairPath = (L) => {
      const left = [], right = [];
      for (let y = 96; y <= L - 8; y += 5) { const w = halfW(y, L); left.push([CX - w, y]); right.push([CX + w, y]); }
      let d = `M${CX - 33} 96 C${CX - 36} 42 ${CX + 36} 42 ${CX + 33} 96`;
      right.forEach(p => { d += ` L${p[0].toFixed(1)} ${p[1]}`; });
      const lr = right[right.length - 1], ll = left[left.length - 1];
      d += ` C${lr[0].toFixed(1)} ${L + 2} ${(CX + 16).toFixed(1)} ${L + 6} ${CX} ${L + 6}`;
      d += ` C${(CX - 16).toFixed(1)} ${L + 6} ${ll[0].toFixed(1)} ${L + 2} ${ll[0].toFixed(1)} ${ll[1]}`;
      for (let i = left.length - 1; i >= 0; i--) d += ` L${left[i][0].toFixed(1)} ${left[i][1]}`;
      return d + ' Z';
    };
    const palette = ['#4b2b19', '#5c3520', '#3b2215', '#6a3d24'];
    const N = 34;
    const strandEls = [];
    for (let i = 0; i < N; i++) {
      const p = document.createElementNS(NS, 'path');
      const light = i % 4 === 1;
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', light ? '#a8703f' : palette[i % palette.length]);
      p.setAttribute('stroke-width', light ? (0.7 + rnd(i) * 0.8).toFixed(2) : (1.5 + rnd(i) * 3).toFixed(2));
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('opacity', light ? (0.18 + rnd(i + 1) * 0.22).toFixed(2) : (0.3 + rnd(i + 3) * 0.35).toFixed(2));
      strandsG.appendChild(p); strandEls.push(p);
    }
    // glossy shine band (keratin effect)
    const shine = document.createElementNS(NS, 'path');
    shine.setAttribute('fill', 'url(#shineGrad)');
    strandsG.appendChild(shine);
    const strandPath = (i, L) => {
      const u = -0.95 + (1.9 * i) / (N - 1) + (rnd(i + 9) - 0.5) * 0.05;
      const xAt = (y) => CX + u * halfW(y, L) * 0.97;
      const y0 = 50 + Math.pow(Math.abs(u), 2) * 46;
      const ys = [y0, 105, 178, (178 + L) / 2, L + 6];
      let d = `M${xAt(ys[0]).toFixed(1)} ${ys[0].toFixed(1)}`;
      for (let k = 1; k < ys.length; k++) {
        const ya = ys[k - 1], yb = ys[k];
        const xa = xAt(ya), xb = xAt(Math.min(yb, L)) + (k > 2 ? Math.sin(yb / 37 + i) * 1.2 : 0);
        d += ` C${xa.toFixed(1)} ${(ya + (yb - ya) / 2).toFixed(1)} ${xb.toFixed(1)} ${(yb - (yb - ya) / 2).toFixed(1)} ${xb.toFixed(1)} ${yb.toFixed(1)}`;
      }
      return d;
    };
    let curL = ends[2];
    const draw = (L) => {
      const d = hairPath(L);
      hair.setAttribute('d', d); hairClip.setAttribute('d', d);
      hairShadow.setAttribute('d', d); hairShadow.setAttribute('transform', 'translate(0 5)');
      strandEls.forEach((p, i) => p.setAttribute('d', strandPath(i, L)));
      shine.setAttribute('d', d);
      const my = Math.min(L, 532);
      marker.setAttribute('y1', my); marker.setAttribute('y2', my);
      rulerMarks.forEach(g => g.classList.toggle('on', Math.abs(+g.dataset.y - L) < 26));
    };
    const tweenTo = (L) => {
      if (reduce) { curL = L; draw(L); return; }
      const from = curL, t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / 750), e = 1 - Math.pow(1 - k, 3);
        curL = from + (L - from) * e; draw(curL);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const pick = (i, scroll) => {
      btns.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
      lenName.textContent = btns[i].querySelector('span').textContent;
      lenCm.textContent = btns[i].querySelector('small').textContent;
      items.forEach(li => {
        const target = li.dataset.prices.split(',').map(Number)[i];
        const el = li.querySelector('.num');
        const start = Number(el.dataset.v || target);
        el.dataset.v = target;
        if (reduce || start === target) { el.textContent = fmt(target); return; }
        li.classList.add('flash');
        const t0 = performance.now();
        const step = (t) => {
          const k = Math.min(1, (t - t0) / 650), e = 1 - Math.pow(1 - k, 3);
          el.textContent = fmt(Math.round((start + (target - start) * e) / 10) * 10);
          if (k < 1) requestAnimationFrame(step); else { el.textContent = fmt(target); li.classList.remove('flash'); }
        };
        requestAnimationFrame(step);
      });
      tweenTo(ends[i]);
      rows.forEach((r, j) => r.classList.toggle('hl', j === i));
      if (scroll) {
        const wrap = explorer.querySelector('.lengths'), bt = btns[i];
        wrap.scrollTo({ left: bt.offsetLeft - wrap.clientWidth / 2 + bt.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
      }
    };
    btns.forEach((b, i) => b.addEventListener('click', () => pick(i, true)));
    draw(curL);
    pick(2, false);
  }

  /* ---------- steps: golden thread through the icons (cut out around them, never on top) ---------- */
  const stepsWrap = document.querySelector('.steps-wrap');
  if (stepsWrap) {
    const svg = stepsWrap.querySelector('.steps-line');
    const path = svg.querySelector('path');
    const holes = svg.querySelector('#stepHoles');
    const layout = () => {
      const box = stepsWrap.getBoundingClientRect();
      const nums = [...stepsWrap.querySelectorAll('.step .num')];
      if (getComputedStyle(svg).display === 'none' || nums.length < 2) return;
      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      svg.style.height = box.height + 'px';
      // positions from layout boxes (offsetLeft/Top ignore transforms, so reveal animations do not shift them)
      const pts = nums.map(n => {
        let x = n.offsetWidth / 2, y = n.offsetHeight / 2, el = n;
        while (el && el !== stepsWrap) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
        return [x, y];
      });
      const r = nums[0].offsetWidth / 2 + 4;
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let k = 1; k < pts.length; k++) {
        const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], dx = (x1 - x0) / 3, bend = k % 2 ? -34 : 34;
        d += ` C${x0 + dx} ${y0 + bend} ${x1 - dx} ${y1 - bend} ${x1} ${y1}`;
      }
      path.setAttribute('d', d);
      holes.innerHTML = `<rect width="${box.width}" height="${box.height}" fill="#fff"/>` + pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="#000"/>`).join('');
      path.dataset.len = path.getTotalLength();
    };
    layout();
    addEventListener('resize', layout);
    if (document.fonts) document.fonts.ready.then(layout);
    stepsWrap.layoutThread = layout;
  }

  /* ---------- blog filters ---------- */
  const filters = document.querySelector('.filters');
  if (filters) {
    filters.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      filters.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const f = b.dataset.f;
      document.querySelectorAll('.posts .post').forEach(p => p.classList.toggle('hidden', !(f === 'all' || p.dataset.cat === f)));
    });
  }

  /* ---------- article TOC ---------- */
  const tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length) {
    const map = new Map([...tocLinks].map(a => [a.getAttribute('href').slice(1), a]));
    const tio = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { tocLinks.forEach(a => a.classList.remove('on')); const a = map.get(e.target.id); if (a) a.classList.add('on'); } });
    }, { rootMargin: '-20% 0px -70% 0px' });
    map.forEach((a, id) => { const h = document.getElementById(id); if (h) tio.observe(h); });
  }

  /* ---------- GSAP layer (no pinning: scroll is never blocked) ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add({ wide: '(min-width: 1021px)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      const { wide, reduce: r } = ctx.conditions;
      if (r) return;

      const h1 = document.querySelector('.hero h1, .phead h1');
      if (h1 && window.SplitText) {
        gsap.set(h1, { autoAlpha: 0 });
        (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
          const split = new SplitText(h1, { type: 'lines', linesClass: 'ln', mask: 'lines' });
          gsap.set(h1, { autoAlpha: 1 });
          gsap.from(split.lines, { yPercent: 110, duration: 1.2, ease: 'power4.out', stagger: 0.09, delay: 0.05 });
        });
      }

      // hero photos drift at different speeds
      document.querySelectorAll('.stage [data-speed]').forEach(el => {
        gsap.to(el, { yPercent: +el.dataset.speed, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      });
      gsap.utils.toArray('.strand-bg path').forEach((p, i) => {
        const len = p.getTotalLength();
        gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.4, delay: 0.3 + i * 0.15, ease: 'power2.inOut' });
      });

      // the golden thread connecting the four steps draws itself while scrolling
      const sl = document.querySelector('.steps-line path');
      if (sl && wide && sl.getAttribute('d')) {
        const len = sl.getTotalLength();
        gsap.fromTo(sl, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.steps-wrap', start: 'top 85%', end: 'bottom 60%', scrub: 0.8 } });
      }

      const am = document.querySelector('.about-media .main img');
      if (am) gsap.fromTo(am, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });

      gsap.utils.toArray('.wm').forEach(w => {
        gsap.fromTo(w, { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: w.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      gsap.utils.toArray('.cta svg.bgline path').forEach((p, i) => {
        const len = p.getTotalLength();
        gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.6, delay: i * 0.18, ease: 'power2.inOut', scrollTrigger: { trigger: p.closest('.cta'), start: 'top 85%', toggleActions: 'play none none none' } });
      });

      if (finePointer) {
        document.querySelectorAll('.btn').forEach(b => {
          const xTo = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' });
          const yTo = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
          b.addEventListener('mousemove', e => { const rc = b.getBoundingClientRect(); xTo((e.clientX - rc.left - rc.width / 2) * 0.18); yTo((e.clientY - rc.top - rc.height / 2) * 0.3); });
          b.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
        });
      }
    });
  }
})();
