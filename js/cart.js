/* cart.js — Client-side cart in localStorage. */
const CART_KEY = "sh_cart";

const Cart = {
  _read() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
    catch { return []; }
  },
  _write(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("cart:change", { detail: { items } }));
  },
  items() { return this._read(); },
  count() { return this._read().reduce((s, i) => s + i.quantity, 0); },
  subtotal() {
    return this._read().reduce((s, i) => s + i.price * i.quantity * (1 - (i.discountPercentage || 0) / 100), 0);
  },
  add(product, qty = 1) {
    const items = this._read();
    const found = items.find((i) => i.id === product.id);
    if (found) found.quantity += qty;
    else items.push({
      id: product.id,
      title: product.title,
      thumbnail: product.thumbnail,
      price: product.price,
      discountPercentage: product.discountPercentage || 0,
      stock: product.stock,
      brand: product.brand,
      quantity: qty,
    });
    this._write(items);
  },
  setQuantity(id, qty) {
    const items = this._read();
    const found = items.find((i) => i.id === id);
    if (!found) return;
    found.quantity = Math.max(1, qty);
    this._write(items);
  },
  remove(id) { this._write(this._read().filter((i) => i.id !== id)); },
  clear() { this._write([]); },
  totals(promoPct = 0, shipping = 0) {
    const sub = this.subtotal();
    const promo = sub * (promoPct / 100);
    const tax = (sub - promo) * 0.08;
    const total = sub - promo + tax + shipping;
    return { subtotal: sub, promo, tax, shipping, total };
  },
};

window.Cart = Cart;
