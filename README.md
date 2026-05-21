# ShopHub — Frontend Ecommerce Demo

A complete multi-page storefront built with **plain HTML, CSS, and JavaScript** (no framework, no build step). The catalog, auth, and cart operations are wired to the public [DummyJSON](https://dummyjson.com) API.

## Pages

| Page | Path | Description |
| ---- | ---- | ----------- |
| Home | `index.html` | Hero, categories, featured & top-rated products, promo banner |
| Shop | `products.html` | Listing with category, price, rating, stock filters + search + sort + pagination |
| Product | `product.html?id={id}` | Gallery, qty selector, add to cart, reviews, related products |
| Cart | `cart.html` | Line items, qty controls, promo codes, totals |
| Checkout | `checkout.html` | Contact + shipping + payment, order confirmation |
| Sign in | `login.html` | DummyJSON auth (demo creds prefilled) |
| Register | `register.html` | Simulated user creation |
| Account | `account.html` | Profile, orders, addresses, settings (requires login) |
| Admin | `admin.html` | Product CRUD with stats dashboard (requires login) |

## Running locally

It's static — open `index.html` directly, or serve over HTTP:

```bash
python3 -m http.server 8080
# or
npx serve .
```

Then visit <http://localhost:8080>.

## Demo credentials

```
username: emilys
password: emilyspass
```

Any [DummyJSON user](https://dummyjson.com/users) works. Registration calls `/users/add`, which is read-only in the upstream API — the demo cache locally then routes you to the login page.

## Promo codes

| Code | Discount |
| ---- | -------- |
| `SAVE20` | 20% off |
| `WELCOME10` | 10% off |
| `SHOPHUB5` | 5% off |

## Swapping the backend

The API base lives in [`js/api.js`](js/api.js):

```js
const API_BASE = "https://dummyjson.com";
```

Point it at any backend that exposes the same endpoint shape (`/products`, `/auth/login`, `/users/add`, `/carts/...`).

## File layout

```
index.html              products.html       product.html
cart.html               checkout.html       login.html
register.html           account.html        admin.html
css/styles.css
js/
├── api.js              DummyJSON wrapper
├── auth.js             Login/logout state in localStorage
├── cart.js             Cart state in localStorage
├── ui.js               Shared header, footer, toast, product card
├── home.js
├── products.js
├── product.js
├── cart-page.js
├── checkout.js
├── login.js
├── register.js
├── account.js
└── admin.js
assets/favicon.svg
```

## Notes

- Cart and order history persist in `localStorage` (per-browser).
- Admin edits/adds/deletes are persisted in `localStorage` as overlays because DummyJSON simulates writes without persisting them.
- No build, no install, no server required.
