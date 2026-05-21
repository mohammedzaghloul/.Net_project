UI.mount("products");

const PAGE_SIZE = 12;
let state = {
  category: "",
  q: "",
  sortBy: "",
  order: "",
  minPrice: null,
  maxPrice: null,
  minRating: 0,
  inStock: false,
  page: 1,
  total: 0,
  products: [],
};

function parseQuery() {
  const q = UI.getQuery();
  state.category = q.category || "";
  state.q = q.q || "";
  state.minPrice = q.min ? Number(q.min) : null;
  state.maxPrice = q.max ? Number(q.max) : null;
  state.minRating = q.rating ? Number(q.rating) : 0;
  state.inStock = q.stock === "1";
  state.page = q.page ? Number(q.page) : 1;
  if (q.sortBy && q.order) {
    state.sortBy = q.sortBy; state.order = q.order;
  }
}

function syncControls() {
  const minEl = document.getElementById("min-price");
  const maxEl = document.getElementById("max-price");
  if (minEl) minEl.value = state.minPrice ?? "";
  if (maxEl) maxEl.value = state.maxPrice ?? "";
  document.getElementById("in-stock").checked = state.inStock;
  document.querySelectorAll('input[name="rating"]').forEach((r) => {
    r.checked = String(state.minRating || "") === r.value;
  });
  const sortKey = state.sortBy ? `${state.sortBy}-${state.order}` : "";
  const sortEl = document.getElementById("sort");
  if (sortEl) sortEl.value = sortKey;
  // search input from header
  const headerSearch = document.querySelector('.search-form input[name="q"]');
  if (headerSearch) headerSearch.value = state.q;
}

async function loadCategories() {
  try {
    const cats = await Api.products.categories();
    const mount = document.getElementById("cat-filter");
    mount.innerHTML = `
      <label><input type="radio" name="cat" value="" ${!state.category ? "checked" : ""}/> All categories</label>
      ${cats.map((c) => {
        const slug = c.slug || c;
        const name = (c.name || c).replaceAll("-", " ");
        return `<label><input type="radio" name="cat" value="${slug}" ${state.category === slug ? "checked" : ""}/> ${name}</label>`;
      }).join("")}
    `;
    mount.addEventListener("change", (e) => {
      if (e.target.name === "cat") {
        state.category = e.target.value;
        state.page = 1;
        applyState();
      }
    });
  } catch (e) {
    document.getElementById("cat-filter").innerHTML = `<p class="muted">Failed to load.</p>`;
  }
}

function skeletonGrid(n) {
  return Array.from({ length: n }).map(() => `
    <article class="product-card loading">
      <div class="product-thumb"></div>
      <div class="product-body">
        <span class="product-brand">Loading</span>
        <span class="product-name">Loading product title here</span>
        <div class="product-rating">★★★★★</div>
        <div class="product-price-row"><span class="product-price">$00.00</span></div>
      </div>
    </article>`).join("");
}

async function fetchProducts() {
  // Fetch up to a generous chunk so we can apply price / rating / stock client-side
  // (DummyJSON doesn't expose those filters directly).
  const params = { limit: 200, skip: 0 };
  if (state.sortBy) { params.sortBy = state.sortBy; params.order = state.order; }

  if (state.q) return Api.products.search(state.q, params);
  if (state.category) return Api.products.byCategory(state.category, params);
  return Api.products.list(params);
}

function applyClientFilters(products) {
  return products.filter((p) => {
    if (state.minPrice != null && p.price < state.minPrice) return false;
    if (state.maxPrice != null && p.price > state.maxPrice) return false;
    if (state.minRating && p.rating < state.minRating) return false;
    if (state.inStock && p.stock <= 0) return false;
    return true;
  });
}

function render() {
  document.getElementById("listing-title").textContent = state.category
    ? state.category.replaceAll("-", " ").replace(/\b\w/g, l => l.toUpperCase())
    : (state.q ? `Search: "${state.q}"` : "All products");
  const grid = document.getElementById("grid");
  const filtered = applyClientFilters(state.products);
  state.total = filtered.length;
  const start = (state.page - 1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);
  document.getElementById("listing-count").textContent = `${state.total} product${state.total === 1 ? "" : "s"}`;
  if (slice.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h3>No products match</h3>
        <p>Try a different category, price range, or search query.</p>
      </div>`;
    document.getElementById("pagination").innerHTML = "";
    return;
  }
  grid.innerHTML = slice.map(UI.productCard).join("");
  UI.bindProductGrid(grid, slice);
  renderPagination();
}

function renderPagination() {
  const pages = Math.max(1, Math.ceil(state.total / PAGE_SIZE));
  const cur = state.page;
  const items = [];
  items.push(`<button ${cur <= 1 ? "disabled" : ""} data-page="${cur - 1}">‹</button>`);
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const show = new Set();
  range(1, Math.min(2, pages)).forEach((p) => show.add(p));
  range(Math.max(1, cur - 1), Math.min(pages, cur + 1)).forEach((p) => show.add(p));
  range(Math.max(1, pages - 1), pages).forEach((p) => show.add(p));
  const sorted = [...show].sort((a, b) => a - b);
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) items.push(`<button disabled>…</button>`);
    items.push(`<button class="${p === cur ? "active" : ""}" data-page="${p}">${p}</button>`);
    prev = p;
  }
  items.push(`<button ${cur >= pages ? "disabled" : ""} data-page="${cur + 1}">›</button>`);
  const mount = document.getElementById("pagination");
  mount.innerHTML = items.join("");
  mount.onclick = (e) => {
    const b = e.target.closest("[data-page]");
    if (!b || b.disabled) return;
    state.page = Number(b.dataset.page);
    UI.setQuery({ page: state.page });
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
}

async function applyState() {
  syncQueryFromState();
  document.getElementById("grid").innerHTML = skeletonGrid(PAGE_SIZE);
  try {
    const { products } = await fetchProducts();
    state.products = products;
    render();
  } catch (e) {
    document.getElementById("grid").innerHTML = `<p class="muted">Failed to load products.</p>`;
  }
}

function syncQueryFromState() {
  UI.setQuery({
    category: state.category || null,
    q: state.q || null,
    min: state.minPrice ?? null,
    max: state.maxPrice ?? null,
    rating: state.minRating || null,
    stock: state.inStock ? 1 : null,
    sortBy: state.sortBy || null,
    order: state.order || null,
    page: state.page > 1 ? state.page : null,
  });
}

function bindControls() {
  document.getElementById("sort").addEventListener("change", (e) => {
    const v = e.target.value;
    if (v) {
      const [sortBy, order] = v.split("-");
      state.sortBy = sortBy; state.order = order;
    } else { state.sortBy = ""; state.order = ""; }
    state.page = 1;
    applyState();
  });
  document.getElementById("apply-price").addEventListener("click", () => {
    state.minPrice = Number(document.getElementById("min-price").value) || null;
    state.maxPrice = Number(document.getElementById("max-price").value) || null;
    state.page = 1;
    syncQueryFromState();
    render();
  });
  document.querySelectorAll('input[name="rating"]').forEach((r) => r.addEventListener("change", () => {
    state.minRating = Number(document.querySelector('input[name="rating"]:checked').value) || 0;
    state.page = 1;
    syncQueryFromState();
    render();
  }));
  document.getElementById("in-stock").addEventListener("change", (e) => {
    state.inStock = e.target.checked;
    state.page = 1;
    syncQueryFromState();
    render();
  });
  document.getElementById("clear-filters").addEventListener("click", () => {
    state = { ...state, category: "", q: "", sortBy: "", order: "", minPrice: null, maxPrice: null, minRating: 0, inStock: false, page: 1 };
    syncControls();
    applyState();
  });
  window.addEventListener("popstate", () => { parseQuery(); syncControls(); applyState(); });
}

async function init() {
  parseQuery();
  syncControls();
  bindControls();
  loadCategories();
  await applyState();
}

init();
