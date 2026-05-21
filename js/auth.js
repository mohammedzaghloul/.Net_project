/* auth.js — Auth state via localStorage. DummyJSON demo creds:
   username: emilys / password: emilyspass  (https://dummyjson.com/docs/auth) */
const Auth = {
  get user() {
    try { return JSON.parse(localStorage.getItem("sh_user") || "null"); }
    catch { return null; }
  },
  get token() { return localStorage.getItem("sh_token"); },
  get isLoggedIn() { return !!this.token; },
  isAdmin() {
    const u = this.user;
    return !!u && (u.role === "admin" || u.username === "emilys");
  },
  async login(username, password) {
    const data = await Api.auth.login({ username, password });
    localStorage.setItem("sh_token", data.accessToken || data.token);
    if (data.refreshToken) localStorage.setItem("sh_refresh", data.refreshToken);
    const { accessToken, token, refreshToken, ...userOnly } = data;
    localStorage.setItem("sh_user", JSON.stringify(userOnly));
    return userOnly;
  },
  logout() {
    localStorage.removeItem("sh_token");
    localStorage.removeItem("sh_refresh");
    localStorage.removeItem("sh_user");
  },
  /** Register simulated via DummyJSON /users/add — server returns user but does not persist. */
  async register(payload) {
    const created = await Api.users.add(payload);
    // For demo purposes, immediately mark user as "registered" but require login
    return created;
  },
  requireLogin(redirect = "login.html") {
    if (!this.isLoggedIn) {
      const next = encodeURIComponent(location.pathname.split("/").pop() + location.search);
      location.href = `${redirect}?next=${next}`;
      return false;
    }
    return true;
  },
};

window.Auth = Auth;
