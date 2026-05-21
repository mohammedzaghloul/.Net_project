UI.mount("home");

async function init() {
  loadCategories();
  loadFeatured();
  loadTopRated();
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

async function loadCategories() {
  const mount = document.getElementById("categories");
  mount.innerHTML = Array.from({ length: 12 }).map(() => `<div class="category-card"><div class="icon skeleton" style="width:48px;height:48px;"></div><span class="skeleton" style="width:60px;height:14px;display:block;">&nbsp;</span></div>`).join("");
  try {
    const cats = await Api.products.categories();
    const top = cats.slice(0, 12);
    mount.innerHTML = top.map((c) => {
      const slug = c.slug || c;
      const name = c.name || c;
      return `<a class="category-card" href="products.html?category=${encodeURIComponent(slug)}">
        <div class="icon">${UI.categoryIcon(slug)}</div>
        <span>${name.replaceAll("-", " ")}</span>
      </a>`;
    }).join("");
  } catch (e) {
    mount.innerHTML = `<p class="muted">Failed to load categories.</p>`;
  }
}

async function loadFeatured() {
  const mount = document.getElementById("featured");
  mount.innerHTML = skeletonGrid(8);
  try {
    const { products } = await Api.products.list({ limit: 8, skip: 4 });
    mount.innerHTML = products.map(UI.productCard).join("");
    UI.bindProductGrid(mount, products);
  } catch (e) {
    mount.innerHTML = `<p class="muted">Failed to load products.</p>`;
  }
}

async function loadTopRated() {
  const mount = document.getElementById("top-rated");
  mount.innerHTML = skeletonGrid(8);
  try {
    const { products } = await Api.products.list({ limit: 8, sortBy: "rating", order: "desc" });
    mount.innerHTML = products.map(UI.productCard).join("");
    UI.bindProductGrid(mount, products);
  } catch (e) {
    mount.innerHTML = `<p class="muted">Failed to load products.</p>`;
  }
}

init();
