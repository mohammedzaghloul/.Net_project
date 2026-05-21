/* api.js — DummyJSON wrapper (https://dummyjson.com)
   Swap API_BASE to point to a different backend with the same shape. */
const API_BASE = "https://dummyjson.com";

function buildUrl(path, params) {
  const url = new URL(API_BASE + path);
  if (params) Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  return url.toString();
}

async function request(path, { method = "GET", params, body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = localStorage.getItem("sh_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).message || ""; } catch {}
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

const Api = {
  products: {
    list: ({ limit = 20, skip = 0, sortBy, order } = {}) =>
      request("/products", { params: { limit, skip, sortBy, order } }),
    byCategory: (slug, { limit = 20, skip = 0, sortBy, order } = {}) =>
      request(`/products/category/${encodeURIComponent(slug)}`, { params: { limit, skip, sortBy, order } }),
    search: (q, { limit = 20, skip = 0 } = {}) =>
      request("/products/search", { params: { q, limit, skip } }),
    get: (id) => request(`/products/${id}`),
    categories: () => request("/products/categories"),
    add: (body) => request("/products/add", { method: "POST", body }),
    update: (id, body) => request(`/products/${id}`, { method: "PUT", body }),
    remove: (id) => request(`/products/${id}`, { method: "DELETE" }),
  },
  auth: {
    login: ({ username, password }) =>
      request("/auth/login", { method: "POST", body: { username, password, expiresInMins: 60 } }),
    me: () => request("/auth/me", { auth: true }),
  },
  users: {
    add: (body) => request("/users/add", { method: "POST", body }),
    get: (id) => request(`/users/${id}`),
  },
  carts: {
    forUser: (userId) => request(`/carts/user/${userId}`),
    add: (body) => request("/carts/add", { method: "POST", body }),
  },
};

window.Api = Api;
window.API_BASE = API_BASE;
