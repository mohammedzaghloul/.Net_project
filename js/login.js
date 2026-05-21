UI.mount("login");

const form = document.getElementById("login-form");
const submit = document.getElementById("submit");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submit.disabled = true;
  submit.textContent = "Signing in…";
  const data = Object.fromEntries(new FormData(form));
  try {
    const user = await Auth.login(data.username, data.password);
    UI.toast(`Welcome back, ${user.firstName}!`, "success");
    const next = UI.getQuery().next || "account.html";
    setTimeout(() => { location.href = next; }, 400);
  } catch (err) {
    UI.toast(err.message || "Invalid credentials", "error");
    submit.disabled = false;
    submit.textContent = "Sign in";
  }
});

// Already logged in? Forward to account.
if (Auth.isLoggedIn) {
  const next = UI.getQuery().next || "account.html";
  location.replace(next);
}
