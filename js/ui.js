/* ui.js — Shared header/footer renderer + toast + helpers.
   Each page calls UI.mount("page-name"). */
const UI = {
  mount(currentPage) {
    document.body.classList.add(`page-${currentPage}`);
    this.renderHeader(currentPage);
    this.renderFooter();
    this.bindSearch();
    this.refreshCartBadge();
    window.addEventListener("cart:change", () => this.refreshCartBadge());
  },

  renderHeader(currentPage) {
    const mount = document.getElementById("site-header");
    if (!mount) return;
    const user = Auth.user;
    const isActive = (p) => (currentPage === p ? "active" : "");
    mount.innerHTML = `
      <header class="site-header">
        <div class="container">
          <a href="index.html" class="brand" aria-label="ShopHub home">
            <span class="brand-mark">S</span>
            <span>ShopHub</span>
          </a>
          <nav class="nav">
            <a href="index.html" class="${isActive("home")}">Home</a>
            <a href="products.html" class="${isActive("products")}">Shop</a>
            <a href="products.html?category=smartphones" class="${isActive("electronics")}">Electronics</a>
            <a href="products.html?category=mens-shirts" class="${isActive("fashion")}">Fashion</a>
            <a href="products.html?category=groceries" class="${isActive("groceries")}">Groceries</a>
          </nav>
          <form class="search-form" role="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="search" name="q" placeholder="Search products, brands, categories…" />
          </form>
          <div class="header-actions">
            <a class="icon-btn" href="${user ? "account.html" : "login.html"}" title="${user ? "Account" : "Sign in"}" aria-label="Account">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </a>
            ${Auth.isAdmin() ? `
            <a class="icon-btn" href="admin.html" title="Admin" aria-label="Admin">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </a>` : ""}
            <a class="icon-btn" href="cart.html" title="Cart" aria-label="Cart" id="cart-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
              <span class="badge" id="cart-badge" hidden>0</span>
            </a>
          </div>
        </div>
      </header>
    `;
  },

  renderFooter() {
    const mount = document.getElementById("site-footer");
    if (!mount) return;
    mount.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <div class="brand" style="color:#fff;margin-bottom:12px;">
                <span class="brand-mark">S</span><span>ShopHub</span>
              </div>
              <p style="color:#94a3b8;max-width:320px;margin:0;font-size:14px;">
                Everything you love, in one place. Fast shipping, no-hassle returns, and a curated catalog across every category.
              </p>
            </div>
            <div>
              <h4>Shop</h4>
              <a href="products.html">All products</a>
              <a href="products.html?category=smartphones">Electronics</a>
              <a href="products.html?category=mens-shirts">Fashion</a>
              <a href="products.html?category=groceries">Groceries</a>
              <a href="products.html?category=furniture">Home</a>
            </div>
            <div>
              <h4>Account</h4>
              <a href="login.html">Sign in</a>
              <a href="register.html">Register</a>
              <a href="account.html">Orders</a>
              <a href="cart.html">Cart</a>
            </div>
            <div>
              <h4>Help</h4>
              <a href="#">Contact us</a>
              <a href="#">Shipping</a>
              <a href="#">Returns</a>
              <a href="#">Privacy</a>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${new Date().getFullYear()} ShopHub. Demo storefront.</span>
            <span>Data: <a href="https://dummyjson.com" target="_blank" rel="noopener" style="color:#94a3b8;">dummyjson.com</a></span>
          </div>
        </div>
      </footer>
    `;
  },

  bindSearch() {
    const form = document.querySelector(".search-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = new FormData(form).get("q").toString().trim();
      if (q) location.href = `products.html?q=${encodeURIComponent(q)}`;
    });
  },

  refreshCartBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge) return;
    const c = Cart.count();
    if (c > 0) { badge.hidden = false; badge.textContent = c > 99 ? "99+" : c; }
    else { badge.hidden = true; }
  },

  toast(message, type = "default") {
    let stack = document.getElementById("toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "toast-stack";
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(8px)"; }, 2200);
    setTimeout(() => el.remove(), 2700);
  },

  money(n) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  },

  formatPercent(n) {
    return `${Math.round(n)}%`;
  },

  stars(rating, max = 5) {
    const r = Math.round(rating);
    return "★".repeat(r) + "☆".repeat(max - r);
  },

  productCard(p) {
    const final = (p.price * (1 - (p.discountPercentage || 0) / 100));
    const tag = p.stock < 10
      ? `<span class="product-tag low">Only ${p.stock} left</span>`
      : (p.discountPercentage > 15
          ? `<span class="product-tag">${UI.formatPercent(p.discountPercentage)} off</span>`
          : "");
    return `
      <article class="product-card" data-id="${p.id}">
        <a href="product.html?id=${p.id}" class="product-thumb">
          ${tag}
          <img src="${p.thumbnail}" alt="${p.title}" loading="lazy" />
        </a>
        <div class="product-body">
          <span class="product-brand">${p.brand || p.category || ""}</span>
          <a href="product.html?id=${p.id}" class="product-name">${p.title}</a>
          <div class="product-rating"><span class="stars">${UI.stars(p.rating)}</span>${p.rating?.toFixed(1) || "—"} · ${p.reviews?.length || 0} reviews</div>
          <div class="product-price-row">
            <span class="product-price">${UI.money(final)}</span>
            ${p.discountPercentage ? `<span class="product-price-old">${UI.money(p.price)}</span>` : ""}
          </div>
          <button class="add-btn" type="button" data-add="${p.id}">Add to cart</button>
        </div>
      </article>
    `;
  },

  bindProductGrid(root, products) {
    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add]");
      if (!btn) return;
      e.preventDefault();
      const id = Number(btn.dataset.add);
      const p = products.find((x) => x.id === id);
      if (!p) return;
      Cart.add(p);
      UI.toast(`Added “${p.title}” to cart`, "success");
    });
  },

  getQuery() {
    return Object.fromEntries(new URLSearchParams(location.search));
  },

  setQuery(updates, replace = false) {
    const url = new URL(location.href);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    });
    history[replace ? "replaceState" : "pushState"]({}, "", url);
  },

  categoryIcon(slug) {
    const map = {
      smartphones: "📱", laptops: "💻", "mobile-accessories": "🎧",
      fragrances: "🌸", skincare: "🧴", "beauty": "💄",
      groceries: "🛒", "home-decoration": "🛋️", furniture: "🛏️", "kitchen-accessories": "🍳",
      tops: "👕", "womens-dresses": "👗", "womens-shoes": "👠", "mens-shirts": "👔", "mens-shoes": "👞", "mens-watches": "⌚", "womens-watches": "⌚", "womens-bags": "👜", "womens-jewellery": "💎", sunglasses: "🕶️",
      automotive: "🚗", motorcycle: "🏍️", lighting: "💡", "sports-accessories": "⚽", tablets: "📲", vehicle: "🚙"
    };
    return map[slug] || "🛍️";
  },
};

window.UI = UI;
