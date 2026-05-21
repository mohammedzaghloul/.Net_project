UI.mount("admin");

if (!Auth.requireLogin()) { /* redirected */ }

document.getElementById("admin-name").textContent = `${Auth.user?.firstName || ""} ${Auth.user?.lastName || ""}`.trim() || Auth.user?.username || "Admin";

let allProducts = [];
let search = "";
let localEdits = JSON.parse(localStorage.getItem("sh_admin_edits") || "{}"); // id -> {patch}
let localDeletes = JSON.parse(localStorage.getItem("sh_admin_deletes") || "[]");
let localAdds = JSON.parse(localStorage.getItem("sh_admin_adds") || "[]");

function persistEdits() {
  localStorage.setItem("sh_admin_edits", JSON.stringify(localEdits));
  localStorage.setItem("sh_admin_deletes", JSON.stringify(localDeletes));
  localStorage.setItem("sh_admin_adds", JSON.stringify(localAdds));
}

function applyLocalOverlays(products) {
  let merged = products
    .filter((p) => !localDeletes.includes(p.id))
    .map((p) => localEdits[p.id] ? { ...p, ...localEdits[p.id] } : p);
  merged = [...localAdds, ...merged];
  return merged;
}

async function init() {
  await load();
  bindControls();
}

async function load() {
  try {
    const { products } = await Api.products.list({ limit: 100 });
    allProducts = applyLocalOverlays(products);
    renderStats();
    renderRows();
  } catch (e) {
    document.getElementById("rows").innerHTML = `<tr><td colspan="8" class="muted" style="padding:24px;text-align:center;">Failed to load products.</td></tr>`;
  }
}

function renderStats() {
  const ps = allProducts;
  const total = ps.length;
  const value = ps.reduce((s, p) => s + p.price * p.stock, 0);
  const low = ps.filter((p) => p.stock < 10).length;
  const avgRating = ps.reduce((s, p) => s + (p.rating || 0), 0) / Math.max(1, ps.length);
  document.getElementById("stats").innerHTML = `
    <div class="stat-card"><div class="label">Total products</div><div class="value">${total}</div><div class="delta">+${localAdds.length} added locally</div></div>
    <div class="stat-card"><div class="label">Inventory value</div><div class="value">${UI.money(value)}</div><div class="delta">Wholesale @ stock × price</div></div>
    <div class="stat-card"><div class="label">Low stock</div><div class="value">${low}</div><div class="delta">< 10 units left</div></div>
    <div class="stat-card"><div class="label">Avg. rating</div><div class="value">${avgRating.toFixed(2)}</div><div class="delta">★ across catalog</div></div>
  `;
}

function renderRows() {
  const filtered = allProducts.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()));
  const rows = document.getElementById("rows");
  if (filtered.length === 0) {
    rows.innerHTML = `<tr><td colspan="8" class="muted" style="padding:24px;text-align:center;">No products match.</td></tr>`;
    return;
  }
  rows.innerHTML = filtered.map((p) => `
    <tr data-id="${p.id}">
      <td><div class="thumb"><img src="${p.thumbnail}" alt=""/></div></td>
      <td><b>${p.title}</b>${localEdits[p.id] ? ' <span class="product-tag" style="position:static;background:var(--primary);font-size:10px;padding:2px 6px;">edited</span>' : ""}${p.__new ? ' <span class="product-tag new" style="position:static;font-size:10px;padding:2px 6px;">new</span>' : ""}</td>
      <td style="text-transform:capitalize;">${(p.category || "").replaceAll("-", " ")}</td>
      <td>${p.brand || "—"}</td>
      <td>${UI.money(p.price)}</td>
      <td><span style="color:${p.stock < 10 ? "var(--danger)" : "var(--text)"};">${p.stock}</span></td>
      <td>${(p.rating || 0).toFixed(1)} ★</td>
      <td>
        <div class="row-actions" style="justify-content:flex-end;">
          <button class="edit" data-act="edit" data-id="${p.id}">Edit</button>
          <button class="del" data-act="delete" data-id="${p.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function bindControls() {
  document.getElementById("admin-search").addEventListener("input", (e) => {
    search = e.target.value;
    renderRows();
  });
  document.getElementById("add-product").addEventListener("click", () => openModal());
  document.getElementById("modal-close").onclick = closeModal;
  document.getElementById("modal-cancel").onclick = closeModal;
  document.getElementById("rows").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = isNaN(Number(btn.dataset.id)) ? btn.dataset.id : Number(btn.dataset.id);
    if (btn.dataset.act === "edit") openModal(allProducts.find((p) => p.id === id));
    if (btn.dataset.act === "delete") deleteProduct(id);
  });
  document.getElementById("product-form").addEventListener("submit", onSave);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });
}

function openModal(product) {
  const form = document.getElementById("product-form");
  document.getElementById("modal-title").textContent = product ? `Edit · ${product.title}` : "Add product";
  form.reset();
  if (product) {
    form.id.value = product.id;
    form.title.value = product.title || "";
    form.category.value = product.category || "";
    form.brand.value = product.brand || "";
    form.price.value = product.price || 0;
    form.discountPercentage.value = product.discountPercentage || 0;
    form.stock.value = product.stock || 0;
    form.rating.value = product.rating || 4.5;
    form.thumbnail.value = product.thumbnail || "";
    form.description.value = product.description || "";
  }
  document.getElementById("modal-backdrop").classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

async function onSave(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const payload = {
    title: data.title,
    category: data.category,
    brand: data.brand,
    price: Number(data.price),
    discountPercentage: Number(data.discountPercentage) || 0,
    stock: Number(data.stock),
    rating: Number(data.rating) || 0,
    thumbnail: data.thumbnail || "https://placehold.co/300x300?text=No+image",
    description: data.description || "",
  };
  const id = data.id;
  document.getElementById("modal-save").disabled = true;
  document.getElementById("modal-save").textContent = "Saving…";
  try {
    if (id) {
      // Try server, but also persist locally since DummyJSON simulates
      let updated;
      if (typeof allProducts.find((p) => p.id == id)?.__new === "boolean") {
        // local-only product
        localAdds = localAdds.map((p) => (String(p.id) === String(id) ? { ...p, ...payload } : p));
      } else {
        try { updated = await Api.products.update(Number(id), payload); } catch {}
        localEdits[id] = { ...(localEdits[id] || {}), ...payload };
      }
      UI.toast("Product updated", "success");
    } else {
      let created;
      try { created = await Api.products.add(payload); } catch {}
      const newProduct = {
        ...payload,
        id: created?.id ? `new-${Date.now()}` : `new-${Date.now()}`,
        __new: true,
        images: [payload.thumbnail],
        reviews: [],
      };
      localAdds.unshift(newProduct);
      UI.toast("Product created", "success");
    }
    persistEdits();
    closeModal();
    await load();
  } catch (err) {
    UI.toast(err.message || "Save failed", "error");
  } finally {
    document.getElementById("modal-save").disabled = false;
    document.getElementById("modal-save").textContent = "Save";
  }
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  try {
    if (allProducts.find((p) => p.id === id)?.__new) {
      localAdds = localAdds.filter((p) => p.id !== id);
    } else {
      try { await Api.products.remove(id); } catch {}
      localDeletes.push(id);
    }
    persistEdits();
    UI.toast("Product deleted", "success");
    await load();
  } catch (e) {
    UI.toast(e.message || "Delete failed", "error");
  }
}

init();
