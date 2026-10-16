/* TruePick storefront — shared logic. Vanilla JS, no build step.
   Data comes from the /api endpoint when the site is deployed on Netlify
   (private repo), and falls back to the bundled JSON files otherwise. */
window.TP = (() => {
  const KEY = { wish: 'tp_wishlist', myrate: 'tp_myrating' };
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  async function api(name) {
    try {
      const r = await fetch('/api/' + name, { headers: { 'accept': 'application/json' } });
      if (r.ok) { const j = await r.json(); if (j && !j.error) return j; }
    } catch (e) { /* no functions — static mode */ }
    try { const r = await fetch('/assets/data/' + name + '.json'); if (r.ok) return await r.json(); } catch (e) {}
    return [];
  }

  const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN');
  const pct = (mrp, price) => mrp > price ? Math.round((1 - price / mrp) * 100) : 0;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stars = r => { const f = Math.round(r); return '★'.repeat(f) + '☆'.repeat(5 - f); };

  const wishlist = {
    all: () => read(KEY.wish, []),
    has: id => read(KEY.wish, []).includes(id),
    toggle(id) {
      const w = read(KEY.wish, []);
      const i = w.indexOf(id);
      if (i > -1) w.splice(i, 1); else w.push(id);
      write(KEY.wish, w); paintTabCount(); return i === -1;
    }
  };

  function paintTabCount() {
    const n = wishlist.all().length;
    document.querySelectorAll('[data-wish-count]').forEach(el => {
      el.textContent = n; el.style.display = n ? '' : 'none';
    });
  }

  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 1800);
  }

  /* ---------- chrome ---------- */
  function chrome(active) {
    // drawer
    const bg = document.querySelector('.drawer-bg'), dr = document.querySelector('.drawer');
    const open = () => { bg.classList.add('on'); dr.classList.add('on'); };
    const close = () => { bg.classList.remove('on'); dr.classList.remove('on'); };
    document.querySelectorAll('[data-menu]').forEach(b => b.addEventListener('click', open));
    bg && bg.addEventListener('click', close);
    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));

    // search
    const box = document.querySelector('.search'), inp = box && box.querySelector('input');
    const res = document.querySelector('.search-results');
    document.querySelectorAll('[data-search]').forEach(b => b.addEventListener('click', () => { box.classList.toggle('open'); inp && inp.focus(); }));
    if (inp) {
      let products = [];
      api('products').then(p => products = Array.isArray(p) ? p : []);
      inp.addEventListener('input', () => {
        const q = inp.value.trim().toLowerCase();
        if (!q) { res.classList.remove('on'); return; }
        const hits = products.filter(p => (p.name + ' ' + p.category + ' ' + (p.brand || '')).toLowerCase().includes(q)).slice(0, 6);
        res.innerHTML = hits.length ? hits.map(p => `<a href="product.html?id=${encodeURIComponent(p.id)}">
            <img src="${esc(p.image)}" alt=""><span><b>${esc(p.name)}</b><br><small>${esc(p.category)} · ${inr(p.price)}</small></span></a>`).join('')
          : `<div style="padding:14px;color:var(--muted);font-size:13.5px">No matches</div>`;
        res.classList.add('on');
      });
      document.addEventListener('click', e => { if (!box.contains(e.target) && !res.contains(e.target)) res.classList.remove('on'); });
    }

    // active tab / nav
    document.querySelectorAll('[data-nav]').forEach(a => { if (a.dataset.nav === active) a.classList.add('on'); });
    paintTabCount();

    // footer year
    document.querySelectorAll('[data-year]').forEach(e => e.textContent = new Date().getFullYear());
  }

  /* ---------- product card ---------- */
  function card(p) {
    const off = pct(p.mrp, p.price);
    const fav = wishlist.has(p.id) ? 'on' : '';
    return `<a class="card" href="product.html?id=${encodeURIComponent(p.id)}">
      <div class="thumb">
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">
        ${p.badge ? `<span class="badge ${esc(p.badgeTone || '')}">${esc(p.badge)}</span>` : ''}
        <button class="fav ${fav}" data-fav="${esc(p.id)}" aria-label="Wishlist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></svg>
        </button>
      </div>
      <div class="body">
        <span class="cat">${esc(p.category)}</span>
        <span class="name">${esc(p.name)}</span>
        <span class="stars"><span class="st">${stars(p.rating)}</span><b>${p.rating}</b> (${Number(p.ratingCount || 0).toLocaleString('en-IN')})</span>
        <span class="price"><b>${inr(p.price)}</b>${off ? `<s>${inr(p.mrp)}</s><span class="off">${off}% off</span>` : ''}</span>
      </div>
    </a>`;
  }

  function bindFavs(root) {
    (root || document).querySelectorAll('[data-fav]').forEach(b => b.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const on = wishlist.toggle(b.dataset.fav);
      b.classList.toggle('on', on);
      toast(on ? 'Saved to wishlist' : 'Removed from wishlist');
    }));
  }

  function renderGrid(el, list) {
    if (!el) return;
    el.innerHTML = list.length ? list.map(card).join('')
      : `<div class="empty" style="grid-column:1/-1"><div class="ic">🛍️</div><p>No products here yet.</p></div>`;
    bindFavs(el);
  }

  function banner(b) {
    const href = b.productId ? `product.html?id=${encodeURIComponent(b.productId)}` : (b.link || '#');
    return `<a class="banner" href="${esc(href)}" ${b.external ? 'target="_blank" rel="noopener"' : ''}>
      ${b.image ? `<img class="bimg" src="${esc(b.image)}" alt="">` : ''}
      <span class="shade"></span>
      <span class="bin">
        ${b.tag ? `<span class="tag">${esc(b.tag)}</span>` : ''}
        <h3>${esc(b.title)}</h3>
        ${b.subtitle ? `<p>${esc(b.subtitle)}</p>` : ''}
        <span class="cta">${esc(b.cta || 'Shop now')} →</span>
      </span>
    </a>`;
  }

  /* ---------- blog read-aloud (text to speech) ---------- */
  function speak(btn, text) {
    if (!('speechSynthesis' in window)) { toast('Read-aloud not supported on this browser'); return; }
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); btn.classList.remove('on'); btn.querySelector('span').textContent = 'Listen to this article'; return; }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.98; u.pitch = 1;
    u.onend = () => { btn.classList.remove('on'); btn.querySelector('span').textContent = 'Listen to this article'; };
    speechSynthesis.speak(u);
    btn.classList.add('on'); btn.querySelector('span').textContent = 'Stop listening';
  }

  return { api, inr, pct, esc, stars, wishlist, chrome, card, renderGrid, bindFavs, banner, speak, toast, paintTabCount };
})();
