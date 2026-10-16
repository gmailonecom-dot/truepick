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
      : `<div class="empty" style="grid-column:1/-1"><div class="ic">${ic.bag}</div><p>No products here yet.</p></div>`;
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


  /* ---------- icon set: inline SVG, never emoji ---------- */
  const ic = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21.5z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.7h.01"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M6 8h12l1.2 12H4.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke-linecap="round"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M10.6 5.2h2.8" stroke-linecap="round"/></svg>',
    laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="4" y="5" width="16" height="10.5" rx="1.6"/><path d="M2.5 18.5h19" stroke-linecap="round"/></svg>',
    headphones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.6" y="13" width="4.4" height="7" rx="2"/><rect x="17" y="13" width="4.4" height="7" rx="2"/></svg>',
    droplet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3.5s6 6.6 6 10.8a6 6 0 0 1-12 0C6 10.1 12 3.5 12 3.5z"/></svg>',
    shirt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M9 3.5 4 6l-1.5 5L6 12.5 7.5 11v9.5h9V11l1.5 1.5 3.5-1.5L20 6l-5-2.5a3 3 0 0 1-6 0z"/></svg>',
    watch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="6.5" y="6" width="11" height="12" rx="3.4"/><path d="M9 6V3.5h6V6M9 18v2.5h6V18" stroke-linecap="round"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3.5 12.4 12 3.9h7.6V11.5L11.1 19.9a1.6 1.6 0 0 1-2.3 0l-5.3-5.2a1.6 1.6 0 0 1 0-2.3z"/><circle cx="16.3" cy="7.7" r="1.3"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2.4"/><circle cx="8.5" cy="10" r="1.7"/><path d="m4 17 4.8-4.6L13 16l2.6-2.3L20 17.5"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M14.5 5.5 18.5 9.5"/></svg>',
    cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 3.2v2.2M12 18.6v2.2M4.8 12H2.6M21.4 12h-2.2M6.9 6.9 5.4 5.4M18.6 18.6l-1.5-1.5M17.1 6.9l1.5-1.5M5.4 18.6l1.5-1.5"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H10"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H10"/><path d="M15 8l4 4-4 4M19 12H9"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg>',
  };
  const CAT_ICON = { 'Phones':'phone','iPads':'phone','Laptops':'laptop','Audio':'headphones','Skincare':'droplet','Clothing':'shirt','Wearables':'watch' };
  const catIcon = c => ic[CAT_ICON[c] || 'tag'];

  return { ic, catIcon, api, inr, pct, esc, stars, wishlist, chrome, card, renderGrid, bindFavs, banner, speak, toast, paintTabCount };
})();
