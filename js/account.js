UI.mount("account");

if (!Auth.requireLogin()) {
  // requireLogin redirects.
} else {
  const tab = UI.getQuery().tab || "overview";
  render(tab);
}

function render(tab) {
  const u = Auth.user;
  const initials = `${(u.firstName || "?")[0]}${(u.lastName || "")[0]}`;
  const root = document.getElementById("account-root");
  root.innerHTML = `
    <div class="account-layout">
      <aside class="account-nav">
        <div class="account-user">
          <div class="avatar">${initials}</div>
          <div><b>${u.firstName} ${u.lastName}</b></div>
          <div class="muted" style="font-size:13px;">@${u.username}</div>
        </div>
        ${navLink("overview", "Overview", "🏠", tab)}
        ${navLink("orders", "My orders", "📦", tab)}
        ${navLink("addresses", "Addresses", "📍", tab)}
        ${navLink("settings", "Settings", "⚙️", tab)}
        <button class="btn block secondary" id="logout" style="margin-top:10px;">Sign out</button>
      </aside>
      <section id="account-content"></section>
    </div>
  `;
  document.getElementById("logout").onclick = () => {
    Auth.logout();
    location.href = "index.html";
  };
  document.querySelectorAll(".account-nav a").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    const t = new URL(a.href).searchParams.get("tab") || "overview";
    UI.setQuery({ tab: t });
    render(t);
  }));
  renderTab(tab);
}

function navLink(slug, label, icon, current) {
  return `<a href="?tab=${slug}" class="${current === slug ? "active" : ""}">${icon} <span style="margin-left:6px;">${label}</span></a>`;
}

function renderTab(tab) {
  const root = document.getElementById("account-content");
  if (tab === "overview") return renderOverview(root);
  if (tab === "orders") return renderOrders(root);
  if (tab === "addresses") return renderAddresses(root);
  if (tab === "settings") return renderSettings(root);
}

function renderOverview(root) {
  const u = Auth.user;
  const orders = JSON.parse(localStorage.getItem("sh_orders") || "[]");
  const cartCount = Cart.count();
  root.innerHTML = `
    <h2 style="margin-top:0;">Hi ${u.firstName} 👋</h2>
    <p class="muted">Here's a quick look at your account.</p>
    <div class="admin-stats" style="margin-top:24px;">
      <div class="stat-card"><div class="label">Orders placed</div><div class="value">${orders.length}</div><div class="delta">Across all time</div></div>
      <div class="stat-card"><div class="label">In cart</div><div class="value">${cartCount}</div><div class="delta">Items waiting</div></div>
      <div class="stat-card"><div class="label">Member tier</div><div class="value">Gold</div><div class="delta">Free shipping unlocked</div></div>
      <div class="stat-card"><div class="label">Reward points</div><div class="value">${(orders.length * 120).toLocaleString()}</div><div class="delta">Redeem at checkout</div></div>
    </div>
    <div style="margin-top:32px;display:grid;gap:16px;">
      <div class="step-card">
        <h3>Recent activity</h3>
        ${orders.length === 0
          ? `<p class="muted">No orders yet. <a href="products.html">Start shopping →</a></p>`
          : orders.slice(0, 3).map((o) => orderCard(o, true)).join("")}
      </div>
    </div>
  `;
}

function renderOrders(root) {
  const orders = JSON.parse(localStorage.getItem("sh_orders") || "[]");
  if (orders.length === 0) {
    root.innerHTML = `
      <div class="empty-state">
        <h3>No orders yet</h3>
        <p>Looks like you haven't placed any orders.</p>
        <a class="btn" href="products.html">Browse products</a>
      </div>`;
    return;
  }
  root.innerHTML = `
    <h2 style="margin-top:0;">My orders</h2>
    <div class="orders-list">${orders.map((o) => orderCard(o)).join("")}</div>
  `;
}

function orderCard(o, compact = false) {
  return `
    <article class="order-card">
      <div class="order-head">
        <div>
          <b>Order ${o.id}</b>
          <div class="muted" style="font-size:13px;">${new Date(o.createdAt).toLocaleString()}</div>
        </div>
        <span class="status ${o.status === "Pending" ? "pending" : ""}">${o.status}</span>
      </div>
      <div class="order-items">
        ${o.items.slice(0, 8).map((i) => `<a href="product.html?id=${i.id}" class="thumb" title="${i.title}"><img src="${i.thumbnail}" alt=""/></a>`).join("")}
      </div>
      <div class="order-foot">
        <span>${o.items.length} item${o.items.length === 1 ? "" : "s"} · Shipping to ${o.shipping.city || ""}, ${o.shipping.country || ""}</span>
        <b>${UI.money(o.totals.total)}</b>
      </div>
    </article>
  `;
}

function renderAddresses(root) {
  const u = Auth.user;
  const a = u.address || {};
  root.innerHTML = `
    <h2 style="margin-top:0;">Addresses</h2>
    <div class="step-card">
      <h3>Default shipping address</h3>
      <p class="muted" style="margin:0 0 16px;">Edit isn't persisted in the demo backend, but your latest order's address is reused at checkout.</p>
      <div class="form-row">
        <div class="form-group"><label>Street</label><input value="${a.address || ""}"/></div>
        <div class="form-group"><label>City</label><input value="${a.city || ""}"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>State</label><input value="${a.state || ""}"/></div>
        <div class="form-group"><label>Postal code</label><input value="${a.postalCode || ""}"/></div>
      </div>
      <button class="btn" id="save-addr">Save (demo)</button>
    </div>
  `;
  document.getElementById("save-addr").onclick = () => UI.toast("Saved locally — backend is read-only", "success");
}

function renderSettings(root) {
  const u = Auth.user;
  root.innerHTML = `
    <h2 style="margin-top:0;">Settings</h2>
    <div class="step-card">
      <h3>Profile</h3>
      <div class="form-row">
        <div class="form-group"><label>First name</label><input value="${u.firstName || ""}"/></div>
        <div class="form-group"><label>Last name</label><input value="${u.lastName || ""}"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Email</label><input value="${u.email || ""}"/></div>
        <div class="form-group"><label>Phone</label><input value="${u.phone || ""}"/></div>
      </div>
      <button class="btn" onclick="UI.toast('Saved locally — demo backend is read-only', 'success')">Save changes</button>
    </div>
    <div class="step-card">
      <h3>Notifications</h3>
      <label style="display:flex;align-items:center;gap:10px;padding:6px 0;font-size:14px;"><input type="checkbox" checked/> Order updates by email</label>
      <label style="display:flex;align-items:center;gap:10px;padding:6px 0;font-size:14px;"><input type="checkbox" checked/> Deals & promotions</label>
      <label style="display:flex;align-items:center;gap:10px;padding:6px 0;font-size:14px;"><input type="checkbox"/> SMS notifications</label>
    </div>
    <div class="step-card" style="border-color:#fee2e2;">
      <h3 style="color:var(--danger);">Danger zone</h3>
      <p class="muted">Deleting your account is permanent (in this demo, it just signs you out).</p>
      <button class="btn danger" id="delete-account">Delete my account</button>
    </div>
  `;
  document.getElementById("delete-account").onclick = () => {
    if (!confirm("Are you sure? This signs you out and clears local data.")) return;
    Auth.logout();
    localStorage.removeItem("sh_orders");
    location.href = "index.html";
  };
}
