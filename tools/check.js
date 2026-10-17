#!/usr/bin/env node
/* TruePick — dependency-free sanity check. Run it any time:   node tools/check.js
   It catches the boring-but-embarrassing problems: missing images, dead internal
   links, broken JSON, products with no illustration, duplicate ids, bad prices. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const problems = [];
const ok = [];
const rel = p => path.relative(ROOT, p).replace(/\\/g, '/');
const exists = p => fs.existsSync(p);

function readJSON(relPath) {
  const p = path.join(ROOT, relPath);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { problems.push(`[HIGH]  ${relPath} is not valid JSON — ${e.message}`); return null; }
}

/* ---- 1. data files ---- */
const products = readJSON('assets/data/products.json') || [];
const banners = readJSON('assets/data/banners.json') || [];
const blogs = readJSON('assets/data/blogs.json') || [];
ok.push(`${products.length} products, ${banners.length} banners, ${blogs.length} posts`);

/* ---- 2. products: required fields, unique ids, sane prices, image present ---- */
const seen = new Set();
for (const p of products) {
  const id = p.id || '(no id)';
  if (!p.id) problems.push('[HIGH]  a product has no "id"');
  if (seen.has(p.id)) problems.push(`[HIGH]  duplicate product id: ${p.id}`);
  seen.add(p.id);
  if (!p.name) problems.push(`[MED]   ${id}: no name`);
  if (!p.category) problems.push(`[MED]   ${id}: no category`);
  if (typeof p.price !== 'number' || p.price <= 0) problems.push(`[MED]   ${id}: price looks wrong (${p.price})`);
  if (typeof p.mrp === 'number' && p.mrp < p.price) problems.push(`[MED]   ${id}: MRP (${p.mrp}) is lower than price (${p.price})`);
  if (!p.image) problems.push(`[HIGH]  ${id}: no image`);
  else if (!exists(path.join(ROOT, p.image.replace(/^\//, '')))) problems.push(`[HIGH]  ${id}: image file missing -> ${p.image}`);
  if (!Array.isArray(p.buttons) || !p.buttons.length) problems.push(`[MED]   ${id}: no affiliate buy buttons`);
  (p.videos || []).forEach((v, i) => {
    if (!/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))[A-Za-z0-9_-]{11}/.test(v.url || ''))
      problems.push(`[MED]   ${id}: video ${i + 1} is not a valid YouTube link (${v.url})`);
    if (v.rating && (Number(v.rating) < 0 || Number(v.rating) > 5)) problems.push(`[MED]   ${id}: video ${i + 1} rating must be 0–5`);
  });
  (p.buttons || []).forEach((b, i) => {
    if (!/^https?:\/\//.test(b.url || '')) problems.push(`[MED]   ${id}: button ${i + 1} has no valid link (${b.url})`);
    if (b.logo && !exists(path.join(ROOT, b.logo.replace(/^\//, '')))) problems.push(`[MED]   ${id}: button ${i + 1} logo missing -> ${b.logo}`);
  });
}

/* ---- 3. banners & blogs: images + the product a banner points at ---- */
for (const b of banners) {
  if (b.image && !exists(path.join(ROOT, b.image.replace(/^\//, '')))) problems.push(`[HIGH]  banner "${b.title}": image missing -> ${b.image}`);
  if (b.productId && !seen.has(b.productId)) problems.push(`[HIGH]  banner "${b.title}": links to unknown product "${b.productId}"`);
}
for (const b of blogs) {
  if (b.cover && !exists(path.join(ROOT, b.cover.replace(/^\//, '')))) problems.push(`[HIGH]  post "${b.title}": cover missing -> ${b.cover}`);
  if (!Array.isArray(b.body) || !b.body.length) problems.push(`[MED]   post "${b.title}": empty body`);
}

/* ---- 4. every internal link and local asset in every page resolves ---- */
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
for (const page of pages) {
  // ignore anything inside <script> (JS template literals are not links)
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '');
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  for (const r of refs) {
    if (/^(https?:|mailto:|tel:|data:|#|\/\/)/.test(r)) continue;
    if (r.includes('${')) continue;
    const target = r.split('?')[0].split('#')[0];
    if (!target) continue;
    if (!exists(path.join(ROOT, target))) problems.push(`[HIGH]  ${page}: broken link -> ${r}`);
  }
}
ok.push(`${pages.length} pages scanned for dead links`);

/* ---- report ---- */
console.log('\nTruePick check\n' + '='.repeat(46));
ok.forEach(l => console.log('  ok    ' + l));
if (!problems.length) {
  console.log('\n  All clear — no problems found.\n');
  process.exit(0);
}
const order = { '[HIGH]': 0, '[MED]': 1, '[LOW]': 2 };
problems.sort((a, b) => (order[a.slice(0, 6)] ?? 9) - (order[b.slice(0, 6)] ?? 9));
console.log('\n  ' + problems.length + ' problem(s):');
problems.forEach(p => console.log('   ' + p));
console.log('');
process.exit(1);
