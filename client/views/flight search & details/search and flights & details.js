/* =========================================
   SPRINT AIRLINES — script.js
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------
     UTILITY: PAGE NAVIGATION
  ------------------------------------------ */
  const pageSearch = document.getElementById('page-search');
  const pageBundle = document.getElementById('page-bundle');

  function showPage(incoming, outgoing) {
    // Slide out current
    outgoing.classList.add('slide-out');

    setTimeout(() => {
      outgoing.classList.remove('active', 'slide-out');
      outgoing.style.display = 'none';

      // Prepare incoming
      incoming.style.display = 'block';
      incoming.classList.add('slide-in-from-right');

      // Force reflow
      void incoming.offsetWidth;

      incoming.classList.remove('slide-in-from-right');
      incoming.classList.add('active');

      // Animate bundle cards if going to bundle page
      if (incoming === pageBundle) {
        animateBundleCards();
      }
      // Reset scroll
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 320);
  }

  function animateBundleCards() {
    const cards = document.querySelectorAll('.bundle-card');
    cards.forEach(c => c.classList.remove('visible'));
    setTimeout(() => {
      cards.forEach(c => c.classList.add('visible'));
    }, 50);
  }


  /* ------------------------------------------
     1. DATE CARD SELECTION
  ------------------------------------------ */
  const dateCards = document.querySelectorAll('.date-card');

  dateCards.forEach(card => {
    card.addEventListener('click', () => {
      dateCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      updateResultCount(card.dataset.date);
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });

  function updateResultCount(date) {
    const countEl = document.querySelector('.result-count');
    countEl.style.opacity = '0';
    countEl.style.transition = 'opacity 0.2s';
    setTimeout(() => {
      const counts = { 'OCT 22': 68, 'OCT 23': 72, 'OCT 24': 55, 'OCT 25': 81, 'OCT 26': 60 };
      countEl.textContent = `${counts[date] || 72} results found`;
      countEl.style.opacity = '1';
    }, 200);
  }


  /* ------------------------------------------
     2. FILTER CHIP — REMOVE DIRECT FILTER
  ------------------------------------------ */
  const chipClose = document.querySelector('.chip-close');
  if (chipClose) {
    chipClose.addEventListener('click', (e) => {
      e.stopPropagation();
      const chip = chipClose.closest('.chip');
      chip.style.transition = 'all 0.25s ease';
      chip.style.opacity = '0';
      chip.style.transform = 'scale(0.85)';
      setTimeout(() => chip.remove(), 260);
      const countEl = document.querySelector('.result-count');
      if (countEl) countEl.textContent = '132 results found';
    });
  }


  /* ------------------------------------------
     3. SELECT BUTTON → NAVIGATE TO BUNDLE PAGE
  ------------------------------------------ */
  const selectBtns = document.querySelectorAll('.btn-select');

  selectBtns.forEach(btn => {
    btn.addEventListener('click', function (e) {
      // Ripple
      createRipple(btn, e);

      // Get flight info from parent card
      const card = btn.closest('.flight-card');
      const flightInfo = card?.dataset.flight || '';
      const flightPrice = card?.dataset.price || '';

      // Update bundle page info bar
      const infoEl  = document.getElementById('selected-flight-info');
      const priceEl = document.getElementById('selected-flight-price');
      if (infoEl)  infoEl.textContent  = flightInfo;
      if (priceEl) priceEl.textContent = flightPrice;

      // Brief feedback then navigate
      const original = btn.textContent;
      btn.textContent = '✓ Selected';
      btn.style.background = '#2a6041';

      setTimeout(() => {
        btn.textContent = original;
        btn.style.background = '';
        showPage(pageBundle, pageSearch);
      }, 700);
    });
  });


  /* ------------------------------------------
     4. BUNDLE BUTTON → CONFIRMATION TOAST
  ------------------------------------------ */
  const bundleBtns = document.querySelectorAll('.btn-bundle:not(:disabled)');

  bundleBtns.forEach(btn => {
    btn.addEventListener('click', function (e) {
      createRipple(btn, e);

      const bundle = btn.dataset.bundle;
      const labels = {
        basic: 'GO Basic selected! No extra charges.',
        easy:  'GO Easy selected! Great choice for savings.',
      };
      showToast(labels[bundle] || 'Bundle selected!', '#2a6041');

      // Visual feedback
      const originalText = btn.textContent;
      btn.textContent = '✓ Added';
      setTimeout(() => { btn.textContent = originalText; }, 1600);
    });
  });


  /* ------------------------------------------
     5. BACK BUTTON → RETURN TO SEARCH
  ------------------------------------------ */
  const backBtn = document.getElementById('btn-back-to-search');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      showPage(pageSearch, pageBundle);
    });
  }


  /* ------------------------------------------
     6. BOTTOM NAV — ACTIVE STATE
  ------------------------------------------ */
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });


  /* ------------------------------------------
     7. PRICE CHIP — DROPDOWN TOGGLE
  ------------------------------------------ */
  const priceChip = document.querySelector('.chip:not(.chip-active)');
  if (priceChip) {
    let dropdownVisible = false;

    priceChip.addEventListener('click', () => {
      dropdownVisible = !dropdownVisible;
      const existing = document.getElementById('price-dropdown');
      if (existing) existing.remove();

      if (dropdownVisible) {
        const dropdown = document.createElement('div');
        dropdown.id = 'price-dropdown';
        dropdown.innerHTML = `
          <div class="dd-item dd-active">Price: Low to High</div>
          <div class="dd-item">Price: High to Low</div>
          <div class="dd-item">Duration</div>
        `;

        const ddStyle = document.createElement('style');
        ddStyle.textContent = `
          #price-dropdown { position:absolute; background:#fff; border:1.5px solid #e4e7ef; border-radius:12px; box-shadow:0 8px 24px rgba(13,31,78,0.12); z-index:200; min-width:180px; overflow:hidden; animation:fadeDown 0.2s ease forwards; }
          @keyframes fadeDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
          #price-dropdown .dd-item { padding:11px 18px; font-size:13px; font-family:'DM Sans',sans-serif; cursor:pointer; color:#1a1e2e; transition:background 0.15s; }
          #price-dropdown .dd-item:hover { background:#f0f2f7; }
          #price-dropdown .dd-active { color:#0d1f4e; font-weight:600; }
        `;
        document.head.appendChild(ddStyle);

        const chipRect = priceChip.getBoundingClientRect();
        dropdown.style.top  = `${chipRect.bottom + window.scrollY + 6}px`;
        dropdown.style.left = `${chipRect.left + window.scrollX}px`;
        document.body.appendChild(dropdown);

        setTimeout(() => {
          document.addEventListener('click', function handler(ev) {
            if (!dropdown.contains(ev.target) && ev.target !== priceChip) {
              dropdown.remove();
              dropdownVisible = false;
              document.removeEventListener('click', handler);
            }
          });
        }, 10);

        dropdown.querySelectorAll('.dd-item').forEach(item => {
          item.addEventListener('click', () => {
            dropdown.querySelectorAll('.dd-item').forEach(i => i.classList.remove('dd-active'));
            item.classList.add('dd-active');
            dropdown.remove();
            dropdownVisible = false;
          });
        });
      }
    });
  }


  /* ------------------------------------------
     8. VIEW FARE RULES — MODAL
  ------------------------------------------ */
  document.querySelectorAll('.view-fare-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const card = link.closest('.bundle-card');
      const title = card?.querySelector('.bundle-title')?.textContent || 'Fare Rules';
      showFareModal(title);
    });
  });

  function showFareModal(title) {
    // Remove existing
    document.getElementById('fare-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'fare-modal';
    modal.innerHTML = `
      <div class="fmodal-backdrop"></div>
      <div class="fmodal-box">
        <div class="fmodal-head">
          <strong>${title} — Fare Rules</strong>
          <button class="fmodal-close">&#10005;</button>
        </div>
        <div class="fmodal-body">
          <p>Changes: Permitted before departure with applicable fees.</p>
          <p>Cancellations: Non-refundable except for ${title === 'GO Flexi' ? 'GO Flexi credits' : 'tax amounts'}.</p>
          <p>No-show: Full ticket value forfeited.</p>
          <p>Seat selection: ${title === 'GO Basic' ? 'Random seat — assigned at check-in.' : 'Preferred seat selection included.'}</p>
          <p>Baggage: ${title === 'GO Basic' ? '7kg hand carry only.' : '7kg hand carry + 20kg checked baggage.'}</p>
        </div>
        <button class="fmodal-ok">Got it</button>
      </div>
    `;

    const style = document.createElement('style');
    style.id = 'fmodal-style';
    style.textContent = `
      #fare-modal { position:fixed; inset:0; z-index:500; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s ease; }
      @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      .fmodal-backdrop { position:absolute; inset:0; background:rgba(13,31,78,0.4); backdrop-filter:blur(3px); }
      .fmodal-box { position:relative; background:#fff; border-radius:16px; padding:24px; max-width:420px; width:90%; box-shadow:0 12px 40px rgba(13,31,78,0.2); }
      .fmodal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; font-size:15px; font-family:'Sora',sans-serif; color:#0d1f4e; }
      .fmodal-close { font-size:14px; color:#6b7280; padding:4px 8px; border-radius:6px; transition:background 0.15s; }
      .fmodal-close:hover { background:#f0f2f7; }
      .fmodal-body { display:flex; flex-direction:column; gap:10px; margin-bottom:20px; }
      .fmodal-body p { font-size:13px; color:#374151; line-height:1.5; padding-left:12px; border-left:3px solid #4a9fd4; }
      .fmodal-ok { width:100%; padding:12px; background:#0d1f4e; color:#fff; border-radius:10px; font-size:14px; font-weight:700; font-family:'DM Sans',sans-serif; transition:background 0.2s; }
      .fmodal-ok:hover { background:#1a3270; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(modal);

    const closeModal = () => { modal.remove(); style.remove(); };
    modal.querySelector('.fmodal-close').addEventListener('click', closeModal);
    modal.querySelector('.fmodal-ok').addEventListener('click', closeModal);
    modal.querySelector('.fmodal-backdrop').addEventListener('click', closeModal);
  }


  /* ------------------------------------------
     HELPERS
  ------------------------------------------ */
  function createRipple(btn, e) {
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      position:absolute; width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
      background:rgba(255,255,255,0.28); border-radius:50%;
      transform:scale(0); animation:rippleAnim 0.55s ease-out forwards;
      pointer-events:none;
    `;
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 560);
  }

  // Inject ripple keyframe once
  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `@keyframes rippleAnim { to { transform:scale(2.8); opacity:0; } }`;
  document.head.appendChild(rippleStyle);

  function showToast(message, color = '#0d1f4e') {
    document.getElementById('sa-toast')?.remove();
    const toast = document.createElement('div');
    toast.id = 'sa-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position:fixed; bottom:84px; left:50%; transform:translateX(-50%) translateY(10px);
      background:${color}; color:#fff; padding:12px 24px; border-radius:30px;
      font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif;
      box-shadow:0 6px 20px rgba(0,0,0,0.2); z-index:400;
      opacity:0; transition:all 0.3s ease; white-space:nowrap;
    `;
    document.body.appendChild(toast);
    void toast.offsetWidth;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  }

});