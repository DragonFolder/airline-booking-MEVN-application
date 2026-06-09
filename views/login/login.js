// Sprint Airlines — Login Page Script

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberCheckbox = document.querySelector('input[name="remember"]');

  // ── Restore remembered username ──────────────────────────────────────────
  const savedUsername = localStorage.getItem("rememberedUsername");
  if (savedUsername) {
    usernameInput.value = savedUsername;
    rememberCheckbox.checked = true;
  }

  // ── Inline validation helpers ────────────────────────────────────────────
  function setError(input, message) {
    clearError(input);
    input.classList.add("input-error");

    const error = document.createElement("span");
    error.className = "error-msg";
    error.textContent = message;
    error.setAttribute("role", "alert");
    input.parentNode.appendChild(error);
  }

  function clearError(input) {
    input.classList.remove("input-error");
    const existing = input.parentNode.querySelector(".error-msg");
    if (existing) existing.remove();
  }

  function validateUsername() {
    const value = usernameInput.value.trim();
    if (!value) {
      setError(usernameInput, "Username is required.");
      return false;
    }
    clearError(usernameInput);
    return true;
  }

  function validatePassword() {
    const value = passwordInput.value;
    if (!value) {
      setError(passwordInput, "Password is required.");
      return false;
    }
    if (value.length < 6) {
      setError(passwordInput, "Password must be at least 6 characters.");
      return false;
    }
    clearError(passwordInput);
    return true;
  }

  // ── Live validation on blur ──────────────────────────────────────────────
  usernameInput.addEventListener("blur", validateUsername);
  passwordInput.addEventListener("blur", validatePassword);

  // Clear error as soon as the user starts correcting
  usernameInput.addEventListener("input", () => clearError(usernameInput));
  passwordInput.addEventListener("input", () => clearError(passwordInput));

  // ── Form submit ──────────────────────────────────────────────────────────
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const usernameOk = validateUsername();
    const passwordOk = validatePassword();

    if (!usernameOk || !passwordOk) return;

    // Persist or clear remembered username
    if (rememberCheckbox.checked) {
      localStorage.setItem("rememberedUsername", usernameInput.value.trim());
    } else {
      localStorage.removeItem("rememberedUsername");
    }

    // Simulate login (replace with real fetch/XHR call as needed)
    simulateLogin(usernameInput.value.trim(), passwordInput.value);
  });

  // ── Simulated login request ──────────────────────────────────────────────
  function simulateLogin(username, password) {
    const btn = form.querySelector(".btn-login");
    btn.disabled = true;
    btn.textContent = "Signing in…";

    // Replace the setTimeout block below with an actual API call, e.g.:
    // fetch("/api/login", { method: "POST", body: JSON.stringify({ username, password }) })
    //   .then(res => res.json())
    //   .then(data => { ... })
    //   .catch(() => showFormError("Network error. Please try again."));

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = "Sign In";

      // Demo: treat "admin / password" as valid
      if (username === "admin" && password === "password") {
        window.location.href = "../dashboard/dashboard.html";
      } else {
        showFormError("Invalid username or password. Please try again.");
      }
    }, 1200);
  }

  // ── Form-level error banner ──────────────────────────────────────────────
  function showFormError(message) {
    let banner = form.querySelector(".form-error-banner");
    if (!banner) {
      banner = document.createElement("p");
      banner.className = "form-error-banner";
      banner.setAttribute("role", "alert");
      form.prepend(banner);
    }
    banner.textContent = message;
  }

  // ── Password visibility toggle ───────────────────────────────────────────
  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "toggle-password";
  toggleBtn.setAttribute("aria-label", "Show password");
  toggleBtn.textContent = "Show";

  passwordInput.parentNode.style.position = "relative";
  passwordInput.parentNode.appendChild(toggleBtn);

  toggleBtn.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    toggleBtn.textContent = isHidden ? "Hide" : "Show";
    toggleBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });
});