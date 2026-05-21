UI.mount("register");

const form = document.getElementById("register-form");
const submit = document.getElementById("submit");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  if (data.password !== data.confirm) {
    UI.toast("Passwords don't match", "error");
    return;
  }
  submit.disabled = true;
  submit.textContent = "Creating account…";
  try {
    await Auth.register({
      firstName: data.firstName, lastName: data.lastName,
      username: data.username, email: data.email, password: data.password,
    });
    // DummyJSON /users/add doesn't actually persist, so we cache locally and try login with demo creds.
    UI.toast("Account created — please sign in.", "success");
    setTimeout(() => { location.href = "login.html"; }, 600);
  } catch (err) {
    UI.toast(err.message || "Registration failed", "error");
    submit.disabled = false;
    submit.textContent = "Create account";
  }
});
