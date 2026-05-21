UI.mount("product");

const params = UI.getQuery();
const id = Number(params.id);
const mount = document.getElementById("pd-content");

if (!id) {
  mount.innerHTML = `<div class="empty-state"><h3>Product not found</h3><a class="btn secondary" href="products.html">Back to shop</a></div>`;
} else {
  mount.innerHTML = `
    <div class="pd">
      <div class="pd-gallery">
        <div class="main skeleton" style="aspect-ratio:1;border-radius:16px;"></div>
        <div class="thumbs"></div>
      </div>
      <div class="pd-info">
        <div class="skeleton" style="width:120px;height:14px;"></div>
        <div class="skeleton" style="width:80%;height:32px;"></div>
        <div class="skeleton" style="width:50%;height:18px;"></div>
        <div class="skeleton" style="width:200px;height:42px;"></div>
        <div class="skeleton" style="width:100%;height:60px;"></div>
      </div>
    </div>`;
  load();
}

let currentQty = 1;
let product = null;

async function load() {
  try {
    product = await Api.products.get(id);
    render(product);
    loadRelated(product.category, product.id);
  } catch (e) {
    mount.innerHTML = `<div class="empty-state"><h3>Couldn't load this product</h3><p class="muted">${e.message}</p><a class="btn secondary" href="products.html">Back to shop</a></div>`;
  }
}

function render(p) {
  document.title = `${p.title} · ShopHub`;
  const final = p.price * (1 - (p.discountPercentage || 0) / 100);
  const images = p.images && p.images.length ? p.images : [p.thumbnail];
  const inStock = p.stock > 0;
  mount.innerHTML = `
    <div class="pd">
      <div class="pd-gallery">
        <div class="main"><img id="main-img" src="${images[0]}" alt="${p.title}"/></div>
        <div class="thumbs">
          ${images.slice(0, 5).map((src, i) => `
            <button data-img="${src}" class="${i === 0 ? "active" : ""}"><img src="${src}" alt=""/></button>
          `).join("")}
        </div>
      </div>
      <div class="pd-info">
        <div class="pd-breadcrumb">
          <a href="products.html">Shop</a> /
          <a href="products.html?category=${encodeURIComponent(p.category)}">${p.category.replaceAll("-", " ")}</a> /
          ${p.title}
        </div>
        <h1>${p.title}</h1>
        <div class="pd-meta">
          <span class="review-stars">${UI.stars(p.rating)}</span>
          <span>${p.rating?.toFixed(1) || "—"} (${p.reviews?.length || 0} reviews)</span>
          <span>·</span>
          <span>${p.brand || p.category}</span>
          <span>·</span>
          <span style="color:${inStock ? "var(--success)" : "var(--danger)"};font-weight:600;">${inStock ? `${p.stock} in stock` : "Out of stock"}</span>
        </div>
        <div class="pd-price">
          <span class="now">${UI.money(final)}</span>
          ${p.discountPercentage ? `<span class="was">${UI.money(p.price)}</span><span class="save">Save ${UI.formatPercent(p.discountPercentage)}</span>` : ""}
        </div>
        <p class="pd-description">${p.description || ""}</p>
        <div class="pd-actions">
          <div class="qty" role="group" aria-label="Quantity">
            <button id="qty-dec" aria-label="Decrease">−</button>
            <span id="qty-val">1</span>
            <button id="qty-inc" aria-label="Increase">+</button>
          </div>
          <button class="btn lg" id="add-cart" ${inStock ? "" : "disabled"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
            Add to cart
          </button>
          <button class="btn lg accent" id="buy-now" ${inStock ? "" : "disabled"}>Buy now</button>
        </div>
        <div class="pd-specs">
          <div><b>SKU</b><br><span>${p.sku || p.id}</span></div>
          <div><b>Weight</b><br><span>${p.weight || "—"} kg</span></div>
          <div><b>Warranty</b><br><span>${p.warrantyInformation || "1 year limited"}</span></div>
          <div><b>Shipping</b><br><span>${p.shippingInformation || "Ships in 1–3 days"}</span></div>
          <div><b>Return policy</b><br><span>${p.returnPolicy || "30-day returns"}</span></div>
          <div><b>Min. order</b><br><span>${p.minimumOrderQuantity || 1}</span></div>
        </div>
      </div>
    </div>

    <section class="section">
      <div class="section-head"><h2>Reviews (${p.reviews?.length || 0})</h2></div>
      <div class="reviews-list">
        ${(p.reviews || []).map((r) => `
          <div class="review">
            <div class="review-head"><b>${r.reviewerName}</b><span>${new Date(r.date).toLocaleDateString()}</span></div>
            <div class="review-stars">${UI.stars(r.rating)}</div>
            <p style="margin:8px 0 0;color:var(--text);">${r.comment}</p>
          </div>`).join("") || `<p class="muted">No reviews yet.</p>`}
      </div>
    </section>
  `;

  bindControls(p);
}

function bindControls(p) {
  document.querySelectorAll(".thumbs button").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".thumbs button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    document.getElementById("main-img").src = b.dataset.img;
  }));
  const qtyVal = document.getElementById("qty-val");
  document.getElementById("qty-dec").onclick = () => { currentQty = Math.max(1, currentQty - 1); qtyVal.textContent = currentQty; };
  document.getElementById("qty-inc").onclick = () => { currentQty = Math.min(p.stock || 99, currentQty + 1); qtyVal.textContent = currentQty; };
  document.getElementById("add-cart").onclick = () => {
    Cart.add(p, currentQty);
    UI.toast(`Added ${currentQty} × ${p.title} to cart`, "success");
  };
  document.getElementById("buy-now").onclick = () => {
    Cart.add(p, currentQty);
    location.href = "checkout.html";
  };
}

async function loadRelated(category, excludeId) {
  try {
    const { products } = await Api.products.byCategory(category, { limit: 8 });
    const list = products.filter((p) => p.id !== excludeId).slice(0, 4);
    if (!list.length) return;
    document.getElementById("related-section").hidden = false;
    const root = document.getElementById("related");
    root.innerHTML = list.map(UI.productCard).join("");
    UI.bindProductGrid(root, list);
  } catch {}
}
