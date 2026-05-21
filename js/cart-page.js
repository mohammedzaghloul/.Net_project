UI.mount("cart");

let promo = { code: "", pct: 0 };

function render() {
  const items = Cart.items();
  const root = document.getElementById("cart-items");
  if (items.length === 0) {
    root.innerHTML = `
      <div class="cart-empty">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
        <h3>Your cart is empty</h3>
        <p>Add a few products to get started.</p>
        <a class="btn" href="products.html">Browse products</a>
      </div>`;
    document.getElementById("summary").innerHTML = "";
    return;
  }
  root.innerHTML = items.map(itemRow).join("");
  renderSummary();
  bindRows();
}

function itemRow(i) {
  const final = i.price * (1 - (i.discountPercentage || 0) / 100);
  return `
    <div class="cart-row" data-id="${i.id}">
      <a href="product.html?id=${i.id}" class="thumb"><img src="${i.thumbnail}" alt=""/></a>
      <div>
        <a href="product.html?id=${i.id}" class="name">${i.title}</a>
        <div class="meta">${i.brand || ""} · ${UI.money(final)} ea</div>
        <div class="qty" style="margin-top:8px;">
          <button data-act="dec" data-id="${i.id}" aria-label="Decrease">−</button>
          <span>${i.quantity}</span>
          <button data-act="inc" data-id="${i.id}" aria-label="Increase">+</button>
        </div>
      </div>
      <div class="price">${UI.money(final * i.quantity)}</div>
      <button class="remove" data-act="remove" data-id="${i.id}" aria-label="Remove">Remove</button>
    </div>
  `;
}

function bindRows() {
  document.getElementById("cart-items").onclick = (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const item = Cart.items().find((i) => i.id === id);
    if (!item) return;
    if (btn.dataset.act === "inc") Cart.setQuantity(id, item.quantity + 1);
    else if (btn.dataset.act === "dec") {
      if (item.quantity <= 1) Cart.remove(id);
      else Cart.setQuantity(id, item.quantity - 1);
    }
    else if (btn.dataset.act === "remove") Cart.remove(id);
    render();
  };
}

function renderSummary() {
  const t = Cart.totals(promo.pct, Cart.subtotal() > 50 ? 0 : 4.99);
  document.getElementById("summary").innerHTML = `
    <h3>Order summary</h3>
    <div class="summary-row"><span>Subtotal</span><span>${UI.money(t.subtotal)}</span></div>
    ${t.promo > 0 ? `<div class="summary-row"><span>Promo (${promo.code})</span><span style="color:var(--success);">−${UI.money(t.promo)}</span></div>` : ""}
    <div class="summary-row"><span>Shipping</span><span>${t.shipping === 0 ? "Free" : UI.money(t.shipping)}</span></div>
    <div class="summary-row"><span>Tax (8%)</span><span>${UI.money(t.tax)}</span></div>
    <div class="summary-row total"><span>Total</span><span>${UI.money(t.total)}</span></div>

    <div style="margin: 16px 0 8px;">
      <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Promo code</label>
      <div style="display:flex;gap:8px;">
        <input id="promo-input" placeholder="SAVE20" value="${promo.code}"/>
        <button class="btn secondary sm" id="apply-promo" type="button">Apply</button>
      </div>
      ${promo.pct ? `<p class="help" style="color:var(--success);">${promo.pct}% applied — code ${promo.code}</p>` : `<p class="help">Try <b>SAVE20</b> for 20% off or <b>WELCOME10</b> for 10%.</p>`}
    </div>

    <a class="btn block lg" href="checkout.html" style="margin-top:14px;">Checkout →</a>
    <a class="btn block secondary" href="products.html" style="margin-top:8px;">Continue shopping</a>
  `;
  document.getElementById("apply-promo").onclick = () => {
    const code = document.getElementById("promo-input").value.trim().toUpperCase();
    const codes = { SAVE20: 20, WELCOME10: 10, SHOPHUB5: 5 };
    if (codes[code]) {
      promo = { code, pct: codes[code] };
      UI.toast(`Promo applied — ${codes[code]}% off`, "success");
    } else {
      promo = { code: "", pct: 0 };
      UI.toast("Invalid promo code", "error");
    }
    sessionStorage.setItem("sh_promo", JSON.stringify(promo));
    renderSummary();
  };
}

// Restore promo from session if set
try { promo = JSON.parse(sessionStorage.getItem("sh_promo") || "{}"); } catch {}
if (!promo || typeof promo.pct !== "number") promo = { code: "", pct: 0 };

render();
window.addEventListener("cart:change", render);
