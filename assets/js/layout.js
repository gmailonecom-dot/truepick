/* TruePick — shared layout injection (header, drawer, footer, bottom tabs).
   Keeps every page consistent without copy-pasting chrome into each file. */
(function () {
  const ic = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5 12 3l9 7.5V21H3z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>'
  };
  const topNav = [['index.html', 'Home', 'home'], ['catalogue.html', 'Catalogue', 'catalogue'], ['blog.html', 'Blog', 'blog'], ['about.html', 'About us', 'about'], ['terms.html', 'Terms', 'terms']];
  const tabs = [['index.html', 'Home', 'home'], ['catalogue.html', 'Catalogue', 'catalogue'], ['wishlist.html', 'Wishlist', 'wishlist'], ['account.html', 'Account', 'account']];

  const header = `
  <div class="hdr"><div class="hdr-in">
    <a class="brand" href="index.html" aria-label="TruePick home"><img src="assets/img/logo.svg" alt="TruePick"></a>
    <span class="hdr-gap"></span>
    <nav class="nav-desk">${topNav.map(n => `<a href="${n[0]}" data-nav="${n[2]}">${n[1]}</a>`).join('')}</nav>
    <div class="search"><input type="search" placeholder="Search products, brands…" aria-label="Search"><span>${ic.search}</span><div class="search-results"></div></div>
    <button class="icon-btn" data-search aria-label="Search">${ic.search}</button>
    <button class="icon-btn" data-menu aria-label="Open menu">${ic.menu}</button>
  </div></div>`;

  const drawer = `
  <div class="drawer-bg"></div>
  <aside class="drawer" aria-label="Menu">
    <div class="drawer-h"><img src="assets/img/logo.svg" alt="TruePick"><button class="icon-btn" data-close aria-label="Close">${ic.close}</button></div>
    <nav>
      <div class="lbl">Shop</div>
      <a href="index.html">${ic.home} Home</a>
      <a href="catalogue.html">${ic.grid} Catalogue</a>
      <a href="wishlist.html">${ic.heart} Wishlist <span class="dot" data-wish-count style="display:none">0</span></a>
      <a href="account.html">${ic.user} Account</a>
      <div class="sep"></div>
      <div class="lbl">Explore</div>
      <a href="blog.html">Blog &amp; guides</a>
      <a href="about.html">About us</a>
      <a href="terms.html">Terms &amp; conditions</a>
    </nav>
    <div class="drawer-f">© <span data-year></span> TruePick — affiliate shopping, done honestly.</div>
  </aside>`;

  const footer = `
  <footer class="site"><div class="fin">
    <div>
      <div class="brandline"><img src="assets/img/logo.svg" alt="TruePick"></div>
      <p style="font-size:13.5px;max-width:34ch;color:#c7d2e4">We hand-pick products, check the price across stores, and send you straight to the store to buy. No middleman, no markup.</p>
    </div>
    <div><h4>Shop</h4>
      <a href="index.html">Home</a><a href="catalogue.html">Catalogue</a>
      <a href="wishlist.html">Wishlist</a><a href="account.html">Account</a></div>
    <div><h4>Company</h4>
      <a href="about.html">About us</a><a href="blog.html">Blog</a>
      <a href="terms.html">Terms &amp; conditions</a></div>
    <div><h4>Stores we link to</h4>
      <a href="https://www.amazon.in/" target="_blank" rel="noopener">Amazon</a>
      <a href="https://www.flipkart.com/" target="_blank" rel="noopener">Flipkart</a></div>
    <div class="legal" style="grid-column:1/-1">
      <span>© <span data-year></span> TruePick</span>
      <span>As an affiliate we may earn a commission from qualifying purchases — at no extra cost to you.</span>
    </div>
  </div></footer>`;

  const tabbar = `<nav class="tabs">${tabs.map(t => `<a href="${t[0]}" data-nav="${t[2]}">${ic[t[2]]}<span>${t[1]}</span><span class="cnt" data-wish-count style="display:none">0</span></a>`).join('')}</nav>`;

  window.TP = window.TP || {};
  window.TP.mountLayout = function (active) {
    const h = document.getElementById('tp-header');
    if (h) h.innerHTML = header;
    const f = document.getElementById('tp-footer');
    if (f) f.innerHTML = footer + tabbar;
    const d = document.getElementById('tp-drawer');
    if (d) d.innerHTML = drawer;
    window.TP.chrome(active);
  };
})();
