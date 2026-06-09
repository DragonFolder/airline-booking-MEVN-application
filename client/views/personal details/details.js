/* ============================================================
   CEBU PACIFIC – GUEST DETAILS FORM
   script.js
   ============================================================ */

'use strict';

/* ── UTILITIES ─────────────────────────────────────────────── */

/**
 * Show an error message below a field.
 * @param {string} id   – the <span class="error-msg"> element id
 * @param {string} msg  – message text; empty string clears it
 */
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  if (msg) {
    el.classList.add('visible');
  } else {
    el.classList.remove('visible');
  }
}

/**
 * Mark or un-mark an input / select as invalid.
 */
function setInvalid(el, invalid) {
  if (!el) return;
  if (invalid) {
    el.classList.add('is-invalid');
  } else {
    el.classList.remove('is-invalid');
  }
}

/** Convenience: clear a field's error state. */
function clearError(fieldEl, errorId) {
  setInvalid(fieldEl, false);
  showError(errorId, '');
}


/* ── LIVE CLEARING ──────────────────────────────────────────── */

// Clear validation state when the user starts correcting a field.
(function attachLiveClearing() {
  const pairs = [
    { fieldId: 'title',        errorId: 'title-error' },
    { fieldId: 'firstName',    errorId: 'firstName-error' },
    { fieldId: 'lastName',     errorId: 'lastName-error' },
    { fieldId: 'dobDay',       errorId: 'dobDay-error' },
    { fieldId: 'dobMonth',     errorId: 'dobMonth-error' },
    { fieldId: 'dobYear',      errorId: 'dobYear-error' },
    { fieldId: 'nationality',  errorId: 'nationality-error' },
    { fieldId: 'mobileNumber', errorId: 'mobileNumber-error' },
    { fieldId: 'email',        errorId: 'email-error' },
    { fieldId: 'retypeEmail',  errorId: 'retypeEmail-error' },
  ];

  pairs.forEach(({ fieldId, errorId }) => {
    const el = document.getElementById(fieldId);
    if (!el) return;
    const eventType = (el.tagName === 'SELECT') ? 'change' : 'input';
    el.addEventListener(eventType, () => clearError(el, errorId));
  });
})();


/* ── "NO FIRST NAME" TOGGLE ─────────────────────────────────── */

const noFirstNameCb  = document.getElementById('noFirstName');
const firstNameInput = document.getElementById('firstName');

noFirstNameCb.addEventListener('change', () => {
  if (noFirstNameCb.checked) {
    firstNameInput.value    = '';
    firstNameInput.disabled = true;
    firstNameInput.style.background = '#F4F6F9';
    clearError(firstNameInput, 'firstName-error');
  } else {
    firstNameInput.disabled = false;
    firstNameInput.style.background = '';
  }
});


/* ── "USE GUEST'S DETAILS" TOGGLE ───────────────────────────── */

const useGuestToggle   = document.getElementById('useGuestDetails');
const guestSelectField = document.getElementById('guestSelectField');

function syncGuestToggle() {
  guestSelectField.style.display = useGuestToggle.checked ? 'flex' : 'none';
}

useGuestToggle.addEventListener('change', syncGuestToggle);
syncGuestToggle(); // Run on load


/* ── VALIDATION HELPERS ─────────────────────────────────────── */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate the passenger section.
 * Returns true if all required fields pass.
 */
function validatePassenger() {
  let valid = true;

  // Title
  const title = document.getElementById('title');
  if (!title.value) {
    setInvalid(title, true);
    showError('title-error', 'Please select a title.');
    valid = false;
  }

  // First name (unless "no first name" checked)
  const firstName = document.getElementById('firstName');
  if (!noFirstNameCb.checked && !firstName.value.trim()) {
    setInvalid(firstName, true);
    showError('firstName-error', 'First name is required.');
    valid = false;
  }

  // Last name
  const lastName = document.getElementById('lastName');
  if (!lastName.value.trim()) {
    setInvalid(lastName, true);
    showError('lastName-error', 'Last name is required.');
    valid = false;
  }

  // Date of Birth – Day
  const dobDay = document.getElementById('dobDay');
  const dayVal = parseInt(dobDay.value, 10);
  if (!dobDay.value || dayVal < 1 || dayVal > 31) {
    setInvalid(dobDay, true);
    showError('dobDay-error', 'Enter a valid day (1–31).');
    valid = false;
  }

  // Date of Birth – Month
  const dobMonth = document.getElementById('dobMonth');
  if (!dobMonth.value) {
    setInvalid(dobMonth, true);
    showError('dobMonth-error', 'Select a month.');
    valid = false;
  }

  // Date of Birth – Year
  const dobYear  = document.getElementById('dobYear');
  const yearVal  = parseInt(dobYear.value, 10);
  const thisYear = new Date().getFullYear();
  if (!dobYear.value || yearVal < 1900 || yearVal > thisYear) {
    setInvalid(dobYear, true);
    showError('dobYear-error', `Enter a year between 1900 and ${thisYear}.`);
    valid = false;
  }

  // Cross-check: date must not be in the future (adult must be ≥1)
  if (dobDay.value && dobMonth.value && dobYear.value && yearVal >= 1900 && yearVal <= thisYear) {
    const dob = new Date(`${dobYear.value}-${dobMonth.value}-${String(dayVal).padStart(2,'0')}`);
    if (isNaN(dob.getTime())) {
      setInvalid(dobDay, true);
      showError('dobDay-error', 'The date of birth is not valid.');
      valid = false;
    } else if (dob > new Date()) {
      setInvalid(dobYear, true);
      showError('dobYear-error', 'Date of birth cannot be in the future.');
      valid = false;
    }
  }

  // Nationality
  const nationality = document.getElementById('nationality');
  if (!nationality.value) {
    setInvalid(nationality, true);
    showError('nationality-error', 'Please select a nationality.');
    valid = false;
  }

  return valid;
}

/**
 * Validate the contact-information section.
 * Returns true if all required fields pass.
 */
function validateContact() {
  let valid = true;

  // Mobile number
  const mobile   = document.getElementById('mobileNumber');
  const mobileRaw = mobile.value.replace(/\s/g, '');
  if (!mobileRaw) {
    setInvalid(mobile, true);
    showError('mobileNumber-error', 'Mobile number is required.');
    valid = false;
  } else if (!/^\d{7,12}$/.test(mobileRaw)) {
    setInvalid(mobile, true);
    showError('mobileNumber-error', 'Enter a valid mobile number (digits only).');
    valid = false;
  }

  // Email
  const email = document.getElementById('email');
  if (!email.value.trim()) {
    setInvalid(email, true);
    showError('email-error', 'Email address is required.');
    valid = false;
  } else if (!emailRegex.test(email.value.trim())) {
    setInvalid(email, true);
    showError('email-error', 'Please enter a valid email address.');
    valid = false;
  }

  // Retype email
  const retypeEmail = document.getElementById('retypeEmail');
  if (!retypeEmail.value.trim()) {
    setInvalid(retypeEmail, true);
    showError('retypeEmail-error', 'Please confirm your email address.');
    valid = false;
  } else if (retypeEmail.value.trim() !== email.value.trim()) {
    setInvalid(retypeEmail, true);
    showError('retypeEmail-error', 'Email addresses do not match.');
    valid = false;
  }

  // Privacy consent
  const privacy = document.getElementById('privacyConsent');
  if (!privacy.checked) {
    showError('privacy-error', 'You must agree to the Privacy Policy to continue.');
    valid = false;
  } else {
    showError('privacy-error', '');
  }

  return valid;
}


/* ── BUTTON HANDLERS ────────────────────────────────────────── */

document.getElementById('continueBtn').addEventListener('click', () => {
  const passengerOk = validatePassenger();
  const contactOk   = validateContact();

  if (passengerOk && contactOk) {
    // All good – show a success state (in a real app you'd navigate)
    showSuccessToast();
  } else {
    // Scroll to the first error
    const firstError = document.querySelector('.is-invalid, .error-msg.visible');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
});

document.getElementById('backBtn').addEventListener('click', () => {
  // In a real multi-step flow this would navigate back.
  showToast('Navigating back…', 'info');
});


/* ── TOAST NOTIFICATION ─────────────────────────────────────── */

function showToast(message, type = 'success') {
  // Remove any existing toast
  const existing = document.getElementById('cp-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'cp-toast';
  toast.setAttribute('role', 'alert');
  toast.style.cssText = `
    position: fixed;
    bottom: 32px;
    right: 32px;
    background: ${type === 'success' ? '#0099D4' : '#1A1A2E'};
    color: #fff;
    padding: 14px 22px;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(0,0,0,.18);
    z-index: 9999;
    opacity: 0;
    transform: translateY(16px);
    transition: opacity .3s, transform .3s;
    max-width: 360px;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
  });

  // Auto-dismiss after 3.5 s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(16px)';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

function showSuccessToast() {
  showToast('✓ Details saved! Proceeding to Add-ons…', 'success');
}


/* ── PHONE FORMAT HINT ──────────────────────────────────────── */

// Auto-format the mobile number field as the user types.
document.getElementById('mobileNumber').addEventListener('input', function () {
  // Allow only digits and spaces
  this.value = this.value.replace(/[^\d\s]/g, '');
});


/* ── PASSPORT EXPIRY VALIDATION (soft) ─────────────────────── */

const expYear = document.getElementById('expYear');
expYear.addEventListener('blur', () => {
  const v = parseInt(expYear.value, 10);
  const now = new Date().getFullYear();
  if (expYear.value && (v < now)) {
    expYear.title = '⚠ This passport appears to be expired.';
    expYear.style.borderColor = '#F59E0B'; // amber warning
  } else {
    expYear.title = '';
    expYear.style.borderColor = '';
  }
});


/* ── ACCESSIBILITY: keyboard submit ─────────────────────────── */

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
    document.getElementById('continueBtn').click();
  }
});