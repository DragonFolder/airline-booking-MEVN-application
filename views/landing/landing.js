// =============================================
// Sprint Airlines - Landing Page JavaScript
// =============================================

document.addEventListener("DOMContentLoaded", function () {

  // -----------------------------------------------
  // 1. TRIP TYPE TOGGLE (Round Trip / One Way)
  // -----------------------------------------------
  const tripButtons = document.querySelectorAll(".trip-toggle .btn");

  tripButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      tripButtons.forEach((b) => {
        b.classList.remove("btn-white", "shadow-sm", "fw-bold");
        b.classList.add("btn-light", "text-muted", "border-0");
      });
      this.classList.remove("btn-light", "text-muted", "border-0");
      this.classList.add("btn-white", "shadow-sm", "fw-bold");
    });
  });


  // -----------------------------------------------
  // 2. SWAP DEPARTURE & ARRIVAL CITIES
  // -----------------------------------------------
  const swapBtn = document.querySelector(".swap-btn");
  const fromInput = document.querySelector(".from-input");
  const toInput = document.querySelector(".to-input");

  if (swapBtn && fromInput && toInput) {
    swapBtn.addEventListener("click", function () {
      const temp = fromInput.value;
      fromInput.value = toInput.value;
      toInput.value = temp;

      // Animate the swap button
      this.style.transform = "rotate(180deg)";
      setTimeout(() => {
        this.style.transform = "rotate(0deg)";
      }, 300);
    });
  }


  // -----------------------------------------------
  // 3. SEARCH FLIGHTS BUTTON VALIDATION
  // -----------------------------------------------
  const searchBtn = document.querySelector(".search-btn");

  if (searchBtn) {
    searchBtn.addEventListener("click", function () {
      const from = fromInput ? fromInput.value.trim() : "";
      const to = toInput ? toInput.value.trim() : "";
      const departure = document.querySelector(".departure-input");
      const departureVal = departure ? departure.value.trim() : "";

      if (!from || !to) {
        alert("Please enter both departure and arrival cities.");
        return;
      }

      if (!departureVal) {
        alert("Please select a departure date.");
        return;
      }

      // Simulate search (replace with real routing/logic)
      console.log(`Searching flights from "${from}" to "${to}" on ${departureVal}`);
      alert(`Searching flights from ${from} to ${to} on ${departureVal}...`);
    });
  }


  // -----------------------------------------------
  // 4. DIRECT FLIGHTS TOGGLE FEEDBACK
  // -----------------------------------------------
  const directToggle = document.getElementById("directFlights");

  if (directToggle) {
    directToggle.addEventListener("change", function () {
      const label = document.querySelector('label[for="directFlights"]');
      if (label) {
        label.textContent = this.checked ? "Direct Flights" : "All Flights";
      }
      console.log("Direct flights only:", this.checked);
    });
  }


  // -----------------------------------------------
  // 5. PASSENGERS INPUT - INCREMENT/DECREMENT (if needed)
  // -----------------------------------------------
  const passengersInput = document.querySelector(".passengers-input");

  if (passengersInput) {
    passengersInput.addEventListener("focus", function () {
      this.select();
    });
  }


  // -----------------------------------------------
  // 6. DEPARTURE DATE - Default to Today if Empty
  // -----------------------------------------------
  const departureDateInput = document.querySelector(".departure-input");

  if (departureDateInput && !departureDateInput.value) {
    const today = new Date();
    const formatted = today.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
    departureDateInput.value = formatted;
  }


  // -----------------------------------------------
  // 7. ACTIVE NAVBAR LINK HIGHLIGHT
  // -----------------------------------------------
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

  navLinks.forEach((link) => {
    if (link.href === window.location.href) {
      link.classList.add("active");
    }
  });


  // -----------------------------------------------
  // 8. CAROUSEL AUTO-PAUSE ON HOVER
  // -----------------------------------------------
  const carouselEl = document.getElementById("carouselExampleCaptions");

  if (carouselEl) {
    const bsCarousel = bootstrap.Carousel.getOrCreateInstance(carouselEl, {
      interval: 4000,
      ride: "carousel",
    });

    carouselEl.addEventListener("mouseenter", () => bsCarousel.pause());
    carouselEl.addEventListener("mouseleave", () => bsCarousel.cycle());
  }


  // -----------------------------------------------
  // 9. SMOOTH SCROLL TO SEARCH CARD ON LOAD
  // -----------------------------------------------
  const heroHeading = document.querySelector("h1");
  if (heroHeading) {
    heroHeading.style.opacity = "0";
    heroHeading.style.transition = "opacity 0.8s ease";
    setTimeout(() => {
      heroHeading.style.opacity = "1";
    }, 200);
  }


  // -----------------------------------------------
  // 10. FOOTER - Dynamic Year
  // -----------------------------------------------
  const copyrightEl = document.querySelector("#footer div:last-child");
  if (copyrightEl) {
    const year = new Date().getFullYear();
    copyrightEl.textContent = `© ${year} All rights reserved.`;
  }

});