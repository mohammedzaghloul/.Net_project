UI.mount("checkout");

const root = document.getElementById("checkout-root");

let promo = {};
try { promo = JSON.parse(sessionStorage.getItem("sh_promo") || "{}"); } catch {}
if (!promo || typeof promo.pct !== "number") promo = { code: "", pct: 0 };

let payment = "card";

if (Cart.items().length === 0) {
  root.innerHTML = `
    <div class="empty-state">
      <h3>Your cart is empty</h3>
      <p>Add a few products before checking out.</p>
      <a class="btn" href="products.html">Browse products</a>
    </div>`;
} else {
  renderCheckout();
}

function renderCheckout() {
  const user = Auth.user;
  root.innerHTML = `
    <div class="checkout">
      <form id="checkout-form">
        <div class="step-card">
          <h3><span class="step-num">1</span> Contact</h3>
          <div class="form-row">
            <div class="form-group"><label>First name</label><input name="firstName" value="${user?.firstName || ""}" required/></div>
            <div class="form-group"><label>Last name</label><input name="lastName" value="${user?.lastName || ""}" required/></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Email</label><input name="email" type="email" value="${user?.email || ""}" required/></div>
            <div class="form-group"><label>Phone</label><input name="phone" type="tel" value="${user?.phone || ""}" required/></div>
          </div>
        </div>

        <div class="step-card">
          <h3><span class="step-num">2</span> Shipping address</h3>
          <div class="form-group"><label>Street address</label><input name="street" required/></div>
          <div class="form-row">
            <div class="form-group"><label>City</label><input name="city" required/></div>
            <div class="form-group"><label>State / Region</label><input name="state" required/></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Postal code</label><input name="zip" required/></div>
            <div class="form-group">
              <label>Country</label>
              <select name="country" required>
                <option>United States</option><option>Canada</option><option>United Kingdom</option><option>Egypt</option><option>Saudi Arabia</option><option>United Arab Emirates</option><option>Germany</option><option>France</option><option>Australia</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label>Delivery notes (optional)</label><textarea name="notes" placeholder="Gate code, drop-off instructions, etc."></textarea></div>
        </div>

        <div class="step-card">
          <h3><span class="step-num">3</span> Payment</h3>
          <div class="pay-grid">
            <label class="pay-option active" data-pay="card">
              <input type="radio" name="pay" value="card" hidden checked/>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              <b>Credit card</b>
            </label>
            <label class="pay-option" data-pay="paypal">
              <input type="radio" name="pay" value="paypal" hidden/>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11h7a4 4 0 0 0 0-8H8L5 21h4"/><path d="M9 17h6a4 4 0 0 0 0-8"/></svg>
              <b>PayPal</b>
            </label>
            <label class="pay-option" data-pay="cod">
              <input type="radio" name="pay" value="cod" hidden/>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M16 9.5a3.5 2.5 0 0 0-3.5-2.5h-1a3.5 2.5 0 0 0 0 5h1a3.5 2.5 0 0 1 0 5h-1A3.5 2.5 0 0 1 8 14.5"/></svg>
              <b>Cash on delivery</b>
            </label>
          </div>
          <div id="card-fields" style="margin-top:14px;">
            <div class="form-group"><label>Card number</label><input name="card" placeholder="1234 5678 9012 3456" inputmode="numeric"/></div>
            <div class="form-row">
              <div class="form-group"><label>Expiry</label><input name="exp" placeholder="MM/YY"/></div>
              <div class="form-group"><label>CVC</label><input name="cvc" placeholder="123" inputmode="numeric"/></div>
            </div>
          </div>
        </div>

        <button class="btn lg block" id="place-order" type="submit">
          Place order — <span id="place-amount"></span>
        </button>
      </form>

      <aside class="summary" id="checkout-summary"></aside>
    </div>
  `;

  bindPaymentSwitch();
  renderSummary();
  document.getElementById("checkout-form").addEventListener("submit", onPlaceOrder);
}

function bindPaymentSwitch() {
  document.querySelectorAll(".pay-option").forEach((opt) => opt.addEventListener("click", () => {
    document.querySelectorAll(".pay-option").forEach((o) => o.classList.remove("active"));
    opt.classList.add("active");
    payment = opt.dataset.pay;
    opt.querySelector("input").checked = true;
    document.getElementById("card-fields").style.display = payment === "card" ? "" : "none";
  }));
}

function renderSummary() {
  const items = Cart.items();
  const t = Cart.totals(promo.pct, Cart.subtotal() > 50 ? 0 : 4.99);
  document.getElementById("checkout-summary").innerHTML = `
    <h3>Your order</h3>
    <div style="display:grid;gap:10px;margin:14px 0;max-height:300px;overflow:auto;">
      ${items.map((i) => {
        const final = i.price * (1 - (i.discountPercentage || 0) / 100);
        return `
          <div style="display:flex;gap:10px;align-items:center;">
            <div style="position:relative;width:48px;height:48px;background:var(--bg-muted);border-radius:10px;padding:4px;display:grid;place-items:center;flex-shrink:0;">
              <img src="${i.thumbnail}" alt="" style="max-width:100%;max-height:100%;object-fit:contain;"/>
              <span style="position:absolute;top:-6px;right:-6px;background:var(--text);color:white;border-radius:999px;min-width:20px;height:20px;font-size:11px;font-weight:700;display:grid;place-items:center;padding:0 4px;">${i.quantity}</span>
            </div>
            <div style="flex:1;font-size:13px;">${i.title}</div>
            <div style="font-weight:600;font-size:13px;">${UI.money(final * i.quantity)}</div>
          </div>`;
      }).join("")}
    </div>
    <div class="summary-row"><span>Subtotal</span><span>${UI.money(t.subtotal)}</span></div>
    ${t.promo > 0 ? `<div class="summary-row"><span>Promo (${promo.code})</span><span style="color:var(--success);">−${UI.money(t.promo)}</span></div>` : ""}
    <div class="summary-row"><span>Shipping</span><span>${t.shipping === 0 ? "Free" : UI.money(t.shipping)}</span></div>
    <div class="summary-row"><span>Tax (8%)</span><span>${UI.money(t.tax)}</span></div>
    <div class="summary-row total"><span>Total</span><span>${UI.money(t.total)}</span></div>
  `;
  document.getElementById("place-amount").textContent = UI.money(t.total);
}

function onPlaceOrder(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  if (payment === "card" && (!data.card || !data.exp || !data.cvc)) {
    UI.toast("Please complete card details", "error");
    return;
  }
  // Generate an order locally and persist to localStorage as "my orders"
  const items = Cart.items();
  const t = Cart.totals(promo.pct, Cart.subtotal() > 50 ? 0 : 4.99);
  const order = {
    id: "SH-" + Math.floor(Math.random() * 900000 + 100000),
    createdAt: new Date().toISOString(),
    status: "Pending",
    items,
    totals: t,
    promo,
    shipping: {
      name: `${data.firstName} ${data.lastName}`,
      street: data.street, city: data.city, state: data.state, zip: data.zip, country: data.country,
      email: data.email, phone: data.phone, notes: data.notes,
    },
    payment,
  };
  const list = JSON.parse(localStorage.getItem("sh_orders") || "[]");
  list.unshift(order);
  localStorage.setItem("sh_orders", JSON.stringify(list));
  // Also call DummyJSON carts/add to simulate server-side ack (best-effort, ignore errors)
  Api.carts.add({ userId: Auth.user?.id || 1, products: items.map((i) => ({ id: i.id, quantity: i.quantity })) }).catch(() => {});
  Cart.clear();
  sessionStorage.removeItem("sh_promo");
  renderSuccess(order);
}

function renderSuccess(order) {
  root.innerHTML = `
    <div style="max-width:560px;margin:64px auto;text-align:center;background:var(--bg-elev);border:1px solid var(--border);border-radius:18px;padding:48px 32px;">
      <div style="width:72px;height:72px;border-radius:50%;background:#dcfce7;color:#10b981;display:grid;place-items:center;margin:0 auto 16px;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2>Order placed!</h2>
      <p class="muted">Your order <b style="color:var(--text);">${order.id}</b> has been received.</p>
      <p class="muted" style="margin-bottom:24px;">A confirmation has been sent to <b>${order.shipping.email}</b>.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <a class="btn" href="account.html?tab=orders">View my orders</a>
        <a class="btn secondary" href="products.html">Continue shopping</a>
      </div>
    </div>
  `;
}
