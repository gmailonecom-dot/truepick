# TruePick — affiliate storefront

TruePick is a **fully virtual affiliate shopping site**. You add products with affiliate
links (Amazon, Flipkart, anything), the site shows them, and every "Buy" button sends the
visitor straight to the store. This is the **storefront** — no login, no admin; anyone can
browse it.

> Need the WordPress-style admin panel (login, drag-and-drop editor, product manager)?
> That lives in the separate **`truepick-admin`** repository, which is a clone of this one
> with the admin and backend added.

---

## Pages

- **Home** — scrolling banners, category row, "Picked for you" grid, blog teasers.
- **Catalogue** — all products, filter by category, sort by price or rating.
- **Product page** — gallery, price + discount, rating, and:
  - a **"This product is good for these people"** block,
  - a **plus-icon accordion** (e.g. *"How to identify your skin type"* — tap `+` to open),
  - a **callout** ("Does this suit your skin type?"),
  - **alternatives / pills** ("If it doesn't suit you, try these instead"),
  - a **product-details** accordion, and a **rate-this-product** widget.
- **Blog** — posts with a **"Listen to this article"** button (reads the post aloud).
- **Wishlist**, **Account**, **About us**, **Terms & conditions**.

A **banner links straight to a product page** — tap the banner, land on the product.
Affiliate **buy buttons carry an image + text** (logo + label).

---

## Run it locally

It's plain HTML/CSS/JS — no build step. Just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deploy to Netlify

1. Push this repo to GitHub and connect it to **Netlify** (Add new site → Import from GitHub).
2. Publish directory: `.` — nothing else to configure (see `netlify.toml`).

## Editing the catalogue

Products, banners and blog posts live in `assets/data/*.json`:

| File | What it holds |
|---|---|
| `assets/data/products.json` | every product, its buy buttons and content blocks |
| `assets/data/banners.json` | the homepage carousel |
| `assets/data/blogs.json` | blog posts |

Each product looks like this (trimmed):

```json
{
  "id": "my-product",
  "name": "My Product",
  "category": "Skincare",
  "price": 399, "mrp": 599,
  "rating": 4.6, "ratingCount": 1200,
  "image": "assets/img/p/my-product.svg",
  "goodFor": { "title": "…", "items": ["…"] },
  "blocks": [
    { "type": "accordion", "title": "How to identify your skin type",
      "items": [ { "q": "If your skin is oily", "a": "…" } ] },
    { "type": "callout", "title": "Does this suit your skin type?", "text": "…" },
    { "type": "pills", "title": "Alternatives", "items": [ { "label": "…", "href": "…" } ] }
  ],
  "buttons": [
    { "platform": "Amazon", "label": "Buy on Amazon", "sub": "Free delivery",
      "url": "https://www.amazon.in/…", "logo": "assets/img/brands/amazon.svg", "color": "#FF9900" }
  ]
}
```

Add as many products as you like — there is no limit.

---

## License

MIT — see `LICENSE`.
