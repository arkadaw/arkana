/* آرکا دکور — اسکریپت سبک (بدون کتابخانه)
   ۱) منوی دسته‌ها: هایلایت دسته فعال هنگام اسکرول
   ۲) نمایشگر تصویر: swipe، زوم (دوبار لمس / دو انگشت)، دکمه برگشت گوشی
   عکس‌هایی که از پنل اضافه می‌شوند خودکار پشتیبانی می‌شوند (event delegation). */
(() => {
  'use strict';

  /* ---------- منوی دسته‌ها ---------- */
  const chipLinks = Array.from(document.querySelectorAll('.chips a'));
  const cats = Array.from(document.querySelectorAll('.cat'));
  if ('IntersectionObserver' in window && cats.length) {
    const byId = new Map(chipLinks.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        chipLinks.forEach(a => a.removeAttribute('aria-current'));
        const a = byId.get(e.target.id);
        if (a) {
          a.setAttribute('aria-current', 'true');
          const bar = a.parentElement.parentElement;
          bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
        }
      }
    }, { rootMargin: '-35% 0px -60% 0px' });
    cats.forEach(c => io.observe(c));
  }

  /* ---------- نمایشگر تصویر ---------- */
  const lb = document.getElementById('lb');
  if (!lb) return;
  const img = document.getElementById('lb-img');
  const cap = document.getElementById('lb-cap');
  const count = document.getElementById('lb-count');
  const ttl = document.getElementById('lb-title');
  const stage = document.getElementById('lb-stage');
  const closeBtn = document.getElementById('lb-close');
  const root = document.documentElement;

  let list = [], idx = 0, lastFocus = null;
  let sc = 1, tx = 0, ty = 0;

  const apply = () => { img.style.transform = `translate3d(${tx}px,${ty}px,0) scale(${sc})`; };
  const reset = (snap) => {
    img.classList.toggle('snap', !!snap);
    sc = 1; tx = 0; ty = 0; apply();
  };

  function show(n) {
    if (n < 0 || n >= list.length) return false;
    idx = n;
    const el = list[n];
    img.classList.remove('snap');
    img.src = el.currentSrc || el.src;
    img.alt = el.alt || '';
    cap.textContent = el.alt || '';
    count.textContent = (n + 1) + ' / ' + list.length;
    reset();
    // پیش‌بارگذاری همسایه‌ها
    [n - 1, n + 1].forEach(k => { if (list[k]) new Image().src = list[k].currentSrc || list[k].src; });
    return true;
  }

  function open(gallery, el) {
    list = Array.from(gallery.querySelectorAll('img'));
    const h = gallery.previousElementSibling;
    ttl.textContent = (h && (h.dataset.title || h.textContent) || '').trim();
    lastFocus = document.activeElement;
    lb.hidden = false;
    root.classList.add('lb-open');
    history.pushState({ lb: 1 }, '');
    show(list.indexOf(el));
    closeBtn.focus({ preventScroll: true });
  }

  function close(fromPop) {
    if (lb.hidden) return;
    lb.hidden = true;
    root.classList.remove('lb-open');
    img.removeAttribute('src');
    if (!fromPop && history.state && history.state.lb) history.back();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('click', e => {
    const t = e.target;
    if (t.tagName === 'IMG' && t.parentElement && t.parentElement.classList.contains('gallery')) open(t.parentElement, t);
  });
  document.addEventListener('keydown', e => {
    if (lb.hidden) {
      const t = e.target;
      if ((e.key === 'Enter' || e.key === ' ') && t.tagName === 'IMG' && t.parentElement.classList.contains('gallery')) { e.preventDefault(); open(t.parentElement, t); }
      return;
    }
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
  // دسترس‌پذیری: عکس‌ها با کیبورد قابل باز شدن باشند
  document.querySelectorAll('.gallery img').forEach(i => { i.tabIndex = 0; i.setAttribute('role', 'button'); });

  closeBtn.addEventListener('click', () => close());
  document.getElementById('lb-prev').addEventListener('click', () => show(idx - 1));
  document.getElementById('lb-next').addEventListener('click', () => show(idx + 1));
  window.addEventListener('popstate', () => close(true));

  /* ---------- حرکات لمسی ---------- */
  const ptrs = new Map();
  let start = null, pinch = null, lastTap = 0, moved = false;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function limitPan() {
    const mx = Math.max(0, (img.clientWidth * sc - stage.clientWidth) / 2);
    const my = Math.max(0, (img.clientHeight * sc - stage.clientHeight) / 2);
    tx = clamp(tx, -mx, mx); ty = clamp(ty, -my, my);
  }

  stage.addEventListener('pointerdown', e => {
    stage.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    img.classList.remove('snap');
    moved = false;
    if (ptrs.size === 1) start = { x: e.clientX, y: e.clientY, tx, ty, t: Date.now() };
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), sc };
      start = null;
    }
  });

  stage.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2 && pinch) {
      const [a, b] = [...ptrs.values()];
      sc = clamp(pinch.sc * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, 1, 4);
      limitPan(); apply(); moved = true;
    } else if (start && ptrs.size === 1) {
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (sc > 1) { tx = start.tx + dx; ty = start.ty + dy; limitPan(); }
      else { tx = dx; ty = dy > 0 ? dy * .6 : dy * .25; }
      apply();
    }
  });

  function end(e) {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if (pinch) { if (ptrs.size < 2) pinch = null; if (sc < 1.05) reset(true); return; }
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y, s = start;
    start = null;
    if (sc === 1) {
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        if (!show(idx + (dx < 0 ? 1 : -1))) reset(true);   // swipe چپ = بعدی
        return;
      }
      if (dy > 110 && dy > Math.abs(dx)) { close(); return; } // swipe به پایین = بستن
      reset(true);
    }
    // دوبار لمس = زوم
    if (!moved && Date.now() - s.t < 300) {
      const now = Date.now();
      if (now - lastTap < 320) {
        img.classList.add('snap');
        if (sc > 1) { reset(true); } else { sc = 2.5; tx = ty = 0; apply(); }
        lastTap = 0;
      } else lastTap = now;
    }
  }
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    sc = clamp(sc + (e.deltaY < 0 ? .25 : -.25), 1, 4);
    limitPan(); apply();
  }, { passive: false });
})();
