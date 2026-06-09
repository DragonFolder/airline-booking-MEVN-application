(() => {
  // ── Helpers ──────────────────────────────────────────────────────────────

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function setError(input, message) {
    const field = input.closest(".field");
    let errEl = field.querySelector(".error-msg");
    if (!errEl) {
      errEl = document.createElement("span");
      errEl.className = "error-msg";
      errEl.setAttribute("role", "alert");
      field.appendChild(errEl);
    }
    errEl.textContent = message;
    input.setAttribute("aria-invalid", "true");
    field.classList.add("has-error");
  }

  function clearError(input) {
    const field = input.closest(".field");
    const errEl = field.querySelector(".error-msg");
    if (errEl) errEl.textContent = "";
    input.removeAttribute("aria-invalid");
    field.classList.remove("has-error");
  }

  function clearAllErrors() {
    $$(".field").forEach((field) => {
      const errEl = field.querySelector(".error-msg");
      if (errEl) errEl.textContent = "";
      const input = field.querySelector("input");
      if (input) input.removeAttribute("aria-invalid");
      field.classList.remove("has-error");
    });
  }

  // ── Validators ───────────────────────────────────────────────────────────

  const validators = {
    fullname(value) {
      if (!value.trim()) return "Full name is required.";
      if (value.trim().length < 2) return "Full name must be at least 2 characters.";
      if (!/^[a-zA-Z\s'\-]+$/.test(value.trim()))
        return "Full name may only contain letters, spaces, hyphens, and apostrophes.";
      return null;
    },

    email(value) {
      if (!value.trim()) return "Email is required.";
      // RFC-ish basic check
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()))
        return "Please enter a valid email address.";
      return null;
    },

    username(value) {
      if (!value.trim()) return "Username is required.";
      if (value.trim().length < 3) return "Username must be at least 3 characters.";
      if (value.trim().length > 20) return "Username must be 20 characters or fewer.";
      if (!/^[a-zA-Z0-9_]+$/.test(value.trim()))
        return "Username may only contain letters, numbers, and underscores.";
      return null;
    },

    password(value) {
      if (!value) return "Password is required.";
      if (value.length < 8) return "Password must be at least 8 characters.";
      if (!/[A-Z]/.test(value)) return "Password must include at least one uppercase letter.";
      if (!/[0-9]/.test(value)) return "Password must include at least one number.";
      return null;
    },

    confirmPassword(value, password) {
      if (!value) return "Please confirm your password.";
      if (value !== password) return "Passwords do not match.";
      return null;
    },
  };

  // ── Password strength meter ───────────────────────────────────────────────

  function passwordStrength(value) {
    let score = 0;
    if (value.length >= 8)  score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score; // 0–5
  }

  function renderStrengthMeter(input) {
    const field = input.closest(".field");
    let meter = field.querySelector(".strength-meter");
    if (!meter) {
      meter = document.createElement("div");
      meter.className = "strength-meter";
      meter.setAttribute("aria-label", "Password strength");
      meter.innerHTML = `
        <div class="strength-bar"><span></span></div>
        <span class="strength-label"></span>`;
      // Insert before any error message
      const errEl = field.querySelector(".error-msg");
      errEl ? field.insertBefore(meter, errEl) : field.appendChild(meter);
    }

    const score = passwordStrength(input.value);
    const bar   = meter.querySelector(".strength-bar span");
    const label = meter.querySelector(".strength-label");
    const levels = ["", "Weak", "Fair", "Good", "Strong", "Very strong"];
    const colors = ["", "#e55353", "#f0a500", "#f0c040", "#4caf50", "#2196f3"];

    bar.style.width  = `${(score / 5) * 100}%`;
    bar.style.background = colors[score] || "transparent";
    label.textContent = input.value ? levels[score] || "Very weak" : "";
    label.style.color = colors[score] || "";
  }

  // ── Live validation (on blur & input) ────────────────────────────────────

  function attachLiveValidation(form) {
    const inputs = {
      fullname:        $("#fullname", form),
      email:           $("#email", form),
      username:        $("#username", form),
      password:        $("#password", form),
      confirmPassword: $("#confirm-password", form),
    };

    // Blur → validate the touched field
    Object.entries(inputs).forEach(([key, input]) => {
      if (!input) return;

      input.addEventListener("blur", () => {
        const err =
          key === "confirmPassword"
            ? validators.confirmPassword(input.value, inputs.password?.value ?? "")
            : validators[key]?.(input.value);
        err ? setError(input, err) : clearError(input);
      });

      // Re-validate on every keystroke once the field has been touched
      input.addEventListener("input", () => {
        if (!input.getAttribute("aria-invalid") && !input.closest(".field").classList.contains("has-error")) return;
        const err =
          key === "confirmPassword"
            ? validators.confirmPassword(input.value, inputs.password?.value ?? "")
            : validators[key]?.(input.value);
        err ? setError(input, err) : clearError(input);
      });
    });

    // Password strength meter
    if (inputs.password) {
      inputs.password.addEventListener("input", () => renderStrengthMeter(inputs.password));
    }

    // Re-check confirm-password whenever password changes
    if (inputs.password && inputs.confirmPassword) {
      inputs.password.addEventListener("input", () => {
        if (inputs.confirmPassword.getAttribute("aria-invalid") || inputs.confirmPassword.value) {
          const err = validators.confirmPassword(inputs.confirmPassword.value, inputs.password.value);
          err ? setError(inputs.confirmPassword, err) : clearError(inputs.confirmPassword);
        }
      });
    }

    return inputs;
  }

  // ── Submit handler ────────────────────────────────────────────────────────

  function handleSubmit(e, form, inputs) {
    e.preventDefault();
    clearAllErrors();

    const errors = [];

    const fields = [
      { key: "fullname",        input: inputs.fullname },
      { key: "email",           input: inputs.email },
      { key: "username",        input: inputs.username },
      { key: "password",        input: inputs.password },
      { key: "confirmPassword", input: inputs.confirmPassword },
    ];

    fields.forEach(({ key, input }) => {
      if (!input) return;
      const err =
        key === "confirmPassword"
          ? validators.confirmPassword(input.value, inputs.password?.value ?? "")
          : validators[key]?.(input.value);
      if (err) {
        setError(input, err);
        errors.push({ input, err });
      }
    });

    if (errors.length) {
      // Focus first invalid field
      errors[0].input.focus();
      return;
    }

    // ── Success path ─────────────────────────────────────────────────────
    const btn = form.querySelector(".btn-register");
    btn.textContent = "Registering…";
    btn.disabled = true;

    // Simulate async registration (replace with real fetch/XHR call)
    setTimeout(() => {
      showSuccessToast("Account created! Welcome to Sprint Airlines ✈️");
      form.reset();
      $$(".strength-meter", form).forEach((m) => m.remove());
      clearAllErrors();
      btn.textContent = "Register";
      btn.disabled = false;
    }, 1500);
  }

  // ── Toast notification ────────────────────────────────────────────────────

  function showSuccessToast(message) {
    let toast = document.getElementById("sa-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "sa-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      Object.assign(toast.style, {
        position:     "fixed",
        bottom:       "1.5rem",
        left:         "50%",
        transform:    "translateX(-50%) translateY(2rem)",
        background:   "#1a1a2e",
        color:        "#fff",
        padding:      "0.75rem 1.5rem",
        borderRadius: "0.5rem",
        boxShadow:    "0 4px 20px rgba(0,0,0,.35)",
        fontSize:     "0.9rem",
        opacity:      "0",
        transition:   "opacity .3s, transform .3s",
        zIndex:       "9999",
        whiteSpace:   "nowrap",
      });
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    // Trigger reflow before animating
    void toast.offsetWidth;
    toast.style.opacity   = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";

    setTimeout(() => {
      toast.style.opacity   = "0";
      toast.style.transform = "translateX(-50%) translateY(2rem)";
    }, 3500);
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    const form = $("form");
    if (!form) return;

    const inputs = attachLiveValidation(form);
    form.addEventListener("submit", (e) => handleSubmit(e, form, inputs));
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();