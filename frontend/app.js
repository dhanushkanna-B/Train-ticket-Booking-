(function () {
  "use strict";

  const STORAGE_USERS = "users";
  const STORAGE_BOOKING = "currentBooking";
  const PAYMENT_DELAY_MS = 2800;

  const sections = {
    splash: document.getElementById("section-splash"),
    landing: document.getElementById("section-landing"),
    register: document.getElementById("section-register"),
    booking: document.getElementById("section-booking"),
    trainList: document.getElementById("section-train-list"),
    seats: document.getElementById("section-seats"),
    payment: document.getElementById("section-payment"),
    success: document.getElementById("section-success"),
  };

  function showSection(id) {
    Object.keys(sections).forEach(function (key) {
      var el = sections[key];
      if (el) el.classList.toggle("active", key === id);
    });
    updateGlobalBack(id);
    updateHamburger(id);
  }

  // Back button: only from train list onward (not on splash, landing, register, booking)
  function updateGlobalBack(activeSectionId) {
    var backBtn = document.getElementById("global-back");
    if (!backBtn) return;
    var showBack =
      activeSectionId === "trainList" ||
      activeSectionId === "seats" ||
      activeSectionId === "payment" ||
      activeSectionId === "success";
    if (showBack) {
      backBtn.classList.remove("hidden");
    } else {
      backBtn.classList.add("hidden");
    }
  }

  // Hamburger: only after login (booking, train list, seats, payment, success)
  function updateHamburger(activeSectionId) {
    var hamburger = document.getElementById("hamburger-btn");
    if (!hamburger) return;
    var show =
      activeSectionId === "booking" ||
      activeSectionId === "trainList" ||
      activeSectionId === "seats" ||
      activeSectionId === "payment" ||
      activeSectionId === "success";
    if (show) {
      hamburger.classList.remove("hidden");
    } else {
      hamburger.classList.add("hidden");
      var panel = document.getElementById("sidebar-panel");
      var overlay = document.getElementById("sidebar-overlay");
      if (panel) panel.classList.remove("open");
      if (overlay) overlay.classList.remove("visible");
      hamburger.classList.remove("open");
    }
  }

  function getBackTarget(sectionId) {
    switch (sectionId) {
      case "register":
        return "splash";
      case "landing":
        return "splash";
      case "trainList":
        return "booking";
      case "seats":
        return "trainList";
      case "payment":
        return "seats";
      case "success":
        return "booking";
      default:
        return "splash";
    }
  }

  function getUsers() {
    try {
      var raw = localStorage.getItem(STORAGE_USERS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveUser(user) {
    var users = getUsers();
    users.push(user);
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  }

  function getBooking() {
    try {
      var raw = sessionStorage.getItem(STORAGE_BOOKING);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setBooking(data) {
    sessionStorage.setItem(STORAGE_BOOKING, JSON.stringify(data));
  }

  function clearBooking() {
    sessionStorage.removeItem(STORAGE_BOOKING);
  }

  // Populate cities in From/To
  function initCities() {
    const fromSelect = document.getElementById("from");
    const toSelect = document.getElementById("to");

    if (!fromSelect || !toSelect) {
      console.error("From/To select not found in HTML");
      return;
    }

    fetch("http://127.0.0.1:8000/cities")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch cities");
        return res.json();
      })
      .then((cities) => {
        // Clear existing options
        fromSelect.innerHTML = '<option value="">Select city</option>';
        toSelect.innerHTML = '<option value="">Select city</option>';

        cities.forEach((city) => {
          const fromOpt = document.createElement("option");
          fromOpt.value = city;
          fromOpt.textContent = city;
          fromSelect.appendChild(fromOpt);

          const toOpt = document.createElement("option");
          toOpt.value = city;
          toOpt.textContent = city;
          toSelect.appendChild(toOpt);
        });
      })
      .catch((err) => {
        console.error("Failed to load cities:", err);
        alert("Failed to load cities. Check backend.");
      });
  }


  // Tabs: Login / Create account
  function initTabs() {
    var tabs = document.querySelectorAll(".auth-card .tab");
    var loginForm = document.getElementById("auth-login");
    var createForm = document.getElementById("auth-create");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var t = this.getAttribute("data-tab");
        tabs.forEach(function (x) {
          x.classList.remove("active");
        });
        this.classList.add("active");
        if (t === "login") {
          if (loginForm) loginForm.classList.add("active");
          if (createForm) createForm.classList.remove("active");
        } else {
          if (loginForm) loginForm.classList.remove("active");
          if (createForm) createForm.classList.add("active");
        }
      });
    });
  }

  // Login: user must enter email and password
  function initLogin() {
    var form = document.getElementById("form-login");
    var emailInput = document.getElementById("login-email");
    var passwordInput = document.getElementById("login-password");
    var errorEl = document.getElementById("login-error");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorEl.textContent = "";

      const payload = {
        email: emailInput.value.trim(),
        password: passwordInput.value,
      };

      fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Invalid login");
          return res.json();
        })
        .then((data) => {
          console.log("Login success:", data);
          showSection("booking"); // go to booking page
        })
        .catch(() => {
          errorEl.textContent = "Invalid email or password";
        });
    });
  }


  // Go to Register (from auth card Create account tab)
  var goRegister = document.getElementById("go-to-register");
  if (goRegister)
    goRegister.addEventListener("click", function () {
      showSection("register");
    });

  // Splash: Login → auth form (landing), Create account → register
  var splashLogin = document.getElementById("splash-login");
  var splashCreate = document.getElementById("splash-create");
  if (splashLogin) {
    splashLogin.addEventListener("click", function () {
      showSection("landing");
      var loginTab = document.querySelector(
        '.auth-card .tab[data-tab="login"]'
      );
      var createTab = document.querySelector(
        '.auth-card .tab[data-tab="create"]'
      );
      var loginForm = document.getElementById("auth-login");
      var createForm = document.getElementById("auth-create");
      if (loginTab) loginTab.classList.add("active");
      if (createTab) createTab.classList.remove("active");
      if (loginForm) loginForm.classList.add("active");
      if (createForm) createForm.classList.remove("active");
    });
  }
  if (splashCreate) {
    splashCreate.addEventListener("click", function () {
      showSection("register");
    });
  }
  var splashAbout = document.getElementById("splash-about");
  var modalAbout = document.getElementById("modal-about");
  if (splashAbout && modalAbout) {
    splashAbout.addEventListener("click", function () {
      modalAbout.removeAttribute("hidden");
      modalAbout.classList.add("visible");
    });
  }
  var splashLogo = document.getElementById("splash-logo");
  if (splashLogo) {
    splashLogo.addEventListener("click", function (e) {
      e.preventDefault();
      document
        .querySelector("#section-splash .splash-body")
        .scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Back to home (splash) from landing or register
  var landingBack = document.getElementById("landing-back-to-splash");
  var registerBack = document.getElementById("register-back-to-splash");
  if (landingBack)
    landingBack.addEventListener("click", function () {
      showSection("splash");
    });
  if (registerBack)
    registerBack.addEventListener("click", function () {
      showSection("splash");
    });

  // Register form
  function initRegister() {
    var form = document.getElementById("form-register");
    var successEl = document.getElementById("register-success");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (successEl) successEl.textContent = "";
        var name =
          (document.getElementById("reg-name") &&
            document.getElementById("reg-name").value) ||
          "";
        var phone =
          (document.getElementById("reg-phone") &&
            document.getElementById("reg-phone").value) ||
          "";
        var email =
          (document.getElementById("reg-email") &&
            document.getElementById("reg-email").value) ||
          "";
        var password =
          (document.getElementById("reg-password") &&
            document.getElementById("reg-password").value) ||
          "";
        if (!name.trim() || !phone.trim() || !email.trim() || !password) {
          if (successEl) successEl.textContent = "Please fill all fields.";
          successEl.style.color = "var(--error)";
          return;
        }
        fetch("http://127.0.0.1:8000/create_ac", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            phone_no: phone.trim(),
            email: email.trim(),
            password: password,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.message) {
              successEl.textContent =
                "✅ Your account was created successfully!";
              successEl.style.color = "green";

              // clear form fields
              form.reset();

              // move to login page after 2 seconds
              setTimeout(() => {
                showSection("landing");
                document.querySelector('[data-tab="login"]').click();
              }, 2000);
            } else {
              successEl.textContent = "❌ Account creation failed.";
              successEl.style.color = "red";
            }
          })

          .catch(() => {
            successEl.textContent = "Server error. Try again.";
            successEl.style.color = "var(--error)";
          });

      });
    }
  }

  // Booking search
  function initBooking() {
    const form = document.getElementById("form-booking");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const fromVal = document.getElementById("from").value;
      const toVal = document.getElementById("to").value;

      if (!fromVal || !toVal) return;
      if (fromVal === toVal) {
        alert("From and To must be different");
        return;
      }

      fetch(
        `http://127.0.0.1:8000/trains?from_city=${fromVal}&to_city=${toVal}`,
      )
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch trains");
          return res.json();
        })
        .then((trains) => {
          renderTrainList(trains, fromVal, toVal);
          showSection("trainList");
        })
        .catch((err) => {
          console.error("Train fetch error:", err);
          alert("Failed to load trains");
        });
    });
  }



 let selectedTrain = null;
 let selectedTicketType = null;

 function renderTrainList(trains) {
   const container = document.getElementById("train-list");
   container.innerHTML = "";

   if (!trains || trains.length === 0) {
     container.innerHTML = "<p>No trains found</p>";
     return;
   }

   trains.forEach((t) => {
     const div = document.createElement("div");
     div.className = "train-item";

     div.innerHTML = `
      <img src="${t.image_url || "assets/train.png"}" class="train-img" />

      <h3>${t.train_name} (${t.train_no})</h3>
      <p>${t.from_} → ${t.to_}</p>
      <p>Departure: ${t.departuretime}</p>
      <p>Available seats: ${t.no_of_seats}</p>

      <div class="price-row">
        <button class="btn btn-secondary ac-btn">AC ₹${t.ac_price}</button>
        <button class="btn btn-secondary nonac-btn">Non-AC ₹${t.non_ac_price}</button>
      </div>
    `;

     // AC button
     div.querySelector(".ac-btn").addEventListener("click", () => {
       selectTrain(t, "AC");
     });

     // Non-AC button
     div.querySelector(".nonac-btn").addEventListener("click", () => {
       selectTrain(t, "NON_AC");
     });

     container.appendChild(div);
   });
 }
 function selectTrain(train, ticketType) {
   selectedTrain = train;
   selectedTicketType = ticketType;

   const price = ticketType === "AC" ? train.ac_price : train.non_ac_price;

   setBooking({
     selectedTrain: train,
     ticketType: ticketType,
     pricePerSeat: price,
     from_city: train.from_,
     to_city: train.to_,
   });

   document.getElementById("selected-train-summary").innerHTML = `
    <strong>${train.train_name}</strong> (${train.train_no})<br>
    ${train.from_} → ${train.to_}<br>
    ${ticketType} Coach
  `;

   document.getElementById("selected-ticket-type").textContent =
     ticketType === "AC" ? "AC Coach" : "Non-AC Coach";

   showSection("seats");
 }





  function updateSeatTotal() {
    var booking = getBooking();
    var pricePerSeat =
      booking && booking.pricePerSeat != null ? booking.pricePerSeat : 0;
    var numSeats = document.getElementById("num-seats");
    var totalPrice = document.getElementById("total-price");
    if (!totalPrice) return;
    var n = parseInt(numSeats && numSeats.value ? numSeats.value : 1, 10) || 1;
    var price = pricePerSeat * n;
    totalPrice.textContent = "Total: ₹" + price;
  }

  function showSeatSection(train, ticketType, pricePerSeat) {
    const summary = document.getElementById("selected-train-summary");
    const typeEl = document.getElementById("selected-ticket-type");

    if (summary) {
      summary.innerHTML = `
      <strong>${train.train_name}</strong> (${train.train_no})<br>
      ${train.from_} → ${train.to_}<br>
      ₹${pricePerSeat} per seat
    `;
    }

    if (typeEl) {
      typeEl.textContent = ticketType === "AC" ? "AC Coach" : "Non-AC Coach";
    }

    updateSeatTotal();
  }


  // Seat form → payment
  function initSeats() {
    var numSeats = document.getElementById("num-seats");
    if (numSeats) numSeats.addEventListener("input", updateSeatTotal);
    var form = document.getElementById("form-seats");
    var backBtn = document.getElementById("back-to-trains");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var numSeats =
          parseInt(
            (document.getElementById("num-seats") &&
              document.getElementById("num-seats").value) ||
              1,
            10
          ) || 1;
        var booking = getBooking();
        var train = booking && booking.selectedTrain;
        var pricePerSeat =
          booking && booking.pricePerSeat != null ? booking.pricePerSeat : 0;
        if (!train) {
          showSection("trainList");
          return;
        }
        var total = pricePerSeat * numSeats;
        booking.numSeats = numSeats;
        booking.totalAmount = total;
        setBooking(booking);
        var amountEl = document.getElementById("payment-amount");
        var payAmountInput = document.getElementById("pay-amount");
        if (amountEl) amountEl.textContent = "Amount to pay: ₹" + total;
        if (payAmountInput) payAmountInput.value = total;
        showSection("payment");
      });
    }
    if (backBtn)
      backBtn.addEventListener("click", function () {
        showSection("trainList");
      });
  }

  // Payment method toggle
  var methodUpi = document.querySelector('input[name="method"][value="upi"]');
  var methodNet = document.querySelector(
    'input[name="method"][value="netbanking"]'
  );
  var upiFields = document.getElementById("upi-fields");
  var netFields = document.getElementById("netbanking-fields");
  function togglePaymentFields() {
    var isUpi = methodUpi && methodUpi.checked;
    if (upiFields) upiFields.classList.toggle("hidden", !isUpi);
    if (netFields) netFields.classList.toggle("hidden", isUpi);
  }
  if (methodUpi) methodUpi.addEventListener("change", togglePaymentFields);
  if (methodNet) methodNet.addEventListener("change", togglePaymentFields);
  togglePaymentFields();

  // Payment form → processing (takes some time) → success
 function initPayment() {
   const form = document.getElementById("form-payment");
   const errorEl = document.getElementById("payment-error");
   const payBtn = document.getElementById("pay-btn");
   const processingEl = document.getElementById("payment-processing");

   if (!form) return;

   form.addEventListener("submit", function (e) {
     e.preventDefault();
     if (errorEl) errorEl.textContent = "";

     const isUpi = methodUpi && methodUpi.checked;
     const upiId = document.getElementById("upi-id")?.value || "";
     const bank = document.getElementById("bank")?.value || "";

     if (isUpi && !upiId.trim()) {
       if (errorEl) errorEl.textContent = "Please enter your UPI ID.";
       return;
     }
     if (!isUpi && !bank) {
       if (errorEl) errorEl.textContent = "Please select a bank.";
       return;
     }

     // Show processing
     const card = form.closest(".form-card");
     if (card) card.classList.add("is-processing");
     form.classList.add("hidden");
     if (payBtn) {
       payBtn.disabled = true;
       payBtn.textContent = "Processing...";
     }
     if (processingEl) processingEl.classList.remove("hidden");

     setTimeout(() => {
       const booking = getBooking();
       if (!booking || !booking.selectedTrain) {
         alert("Booking session expired. Please select train again.");
         showSection("booking");
         return;
       }

       const train = booking.selectedTrain;
       const paymentMethod = document.querySelector(
         'input[name="method"]:checked',
       )?.value;
       if (!paymentMethod) {
         alert("Please select a payment method");
         showSection("payment");
         return;
       }

       const travelDate = document.getElementById("date")?.value;

       const bookingPayload = {
         user_id: 1,
         train_no: train.train_no.toString(),
         from_city: train.from_,
         to_city: train.to_,
         booked_date: new Date().toISOString().split("T")[0],
         travel_date: travelDate || null,
         total_seats: Number(document.getElementById("num-seats").value),
         total_price: Number(document.getElementById("pay-amount").value),
         payment_method: paymentMethod === "upi" ? "UPI" : "NETBANKING",
       };

       // Send to backend
       fetch("http://127.0.0.1:8000/bookings", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(bookingPayload),
       })
         .then(async (res) => {
           const text = await res.text();
           if (!res.ok) throw new Error(text);
           return JSON.parse(text);
         })
         .then((data) => {
           if (!data || !data.booking_id)
             throw new Error("booking_id missing in response");

           console.log("✅ Booking saved:", data);
           localStorage.setItem("booking_id", data.booking_id);

           // Save last booking for sidebar
           if (booking)
             localStorage.setItem("lastBooking", JSON.stringify(booking));

           showSection("success");
         })
         .catch((err) => {
           console.error("❌ Booking error:", err.message);
           alert("Booking failed. Check console for details.");
           showSection("seats");
         })
         .finally(() => {
           if (card) card.classList.remove("is-processing");
           form.classList.remove("hidden");
           if (payBtn) {
             payBtn.disabled = false;
             payBtn.textContent = "Pay";
           }
           if (processingEl) processingEl.classList.add("hidden");
         });
     }, PAYMENT_DELAY_MS);
   });
 }


  // Global back button click
  var globalBack = document.getElementById("global-back");
  if (globalBack) {
    globalBack.addEventListener("click", function () {
      var active = Object.keys(sections).find(function (key) {
        var el = sections[key];
        return el && el.classList.contains("active");
      });
      var target = getBackTarget(active);
      showSection(target);
    });
  }

  var bookAgain = document.getElementById("book-again");
  if (bookAgain)
    bookAgain.addEventListener("click", function () {
      showSection("booking");
    });
  

  // When section-seats is shown, ensure selected train summary and total are set
  function onShowSeats() {
    var booking = getBooking();
    var train = booking && booking.selectedTrain;
    var ticketType = booking && booking.ticketType;
    var pricePerSeat =
      booking && booking.pricePerSeat != null ? booking.pricePerSeat : 0;
    if (train) showSeatSection(train, ticketType || "nonac", pricePerSeat);
  }
  
  function updateLastBookingButton() {
    const historyBtn = document.getElementById("menu-history");
    if (!historyBtn) return;

    const lastBooking = JSON.parse(localStorage.getItem("lastBooking"));

    if (!lastBooking) {
      historyBtn.textContent = "No previous booking";
    } else {
      historyBtn.textContent = `${lastBooking.from_city || lastBooking.from_} → ${lastBooking.to_city || lastBooking.to_} | ${lastBooking.selectedTrain?.train_name || lastBooking.train_no}`;
    }
  }

  // Call this whenever sidebar opens
  function initHistoryButton() {
    const historyBtn = document.getElementById("menu-history");
    if (!historyBtn) return;

    historyBtn.addEventListener("click", () => {
      const lastBooking = JSON.parse(localStorage.getItem("lastBooking"));
     

      
      
    });
  }
  

  // Wire section visibility to refresh seat section
  var seatsSection = document.getElementById("section-seats");
  if (seatsSection) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (
          m.attributeName === "class" &&
          seatsSection.classList.contains("active")
        )
          onShowSeats();
      });
    });
    observer.observe(seatsSection, { attributes: true });
  }

  // Hamburger menu: three-line icon on the left → About, Help, Logout
  function initHamburger() {
    var btn = document.getElementById("hamburger-btn");
    var overlay = document.getElementById("sidebar-overlay");
    var panel = document.getElementById("sidebar-panel");
    function open() {
      if (btn) btn.classList.add("open");
      if (overlay) overlay.classList.add("visible");
      if (panel) panel.classList.add("open");

      // Update last booking button text
      updateLastBookingButton();
    }

    function open() {
      if (btn) btn.classList.add("open");
      if (overlay) overlay.classList.add("visible");
      if (panel) panel.classList.add("open");
    }
    function close() {
      if (btn) btn.classList.remove("open");
      if (overlay) overlay.classList.remove("visible");
      if (panel) panel.classList.remove("open");
    }
    if (btn)
      btn.addEventListener("click", function () {
        if (panel && panel.classList.contains("open")) close();
        else open();
      });
    if (overlay) overlay.addEventListener("click", close);
    // About
    var menuAbout = document.getElementById("menu-about");
    var modalAbout = document.getElementById("modal-about");
    var closeAbout = document.getElementById("close-about");
    if (menuAbout && modalAbout) {
      menuAbout.addEventListener("click", function () {
        close();
        modalAbout.removeAttribute("hidden");
        modalAbout.classList.add("visible");
      });
    }
    if (closeAbout && modalAbout) {
      closeAbout.addEventListener("click", function () {
        modalAbout.setAttribute("hidden", "");
        modalAbout.classList.remove("visible");
      });
    }
    // Help
    var menuHelp = document.getElementById("menu-help");
    var modalHelp = document.getElementById("modal-help");
    var closeHelp = document.getElementById("close-help");
    if (menuHelp && modalHelp) {
      menuHelp.addEventListener("click", function () {
        close();
        modalHelp.removeAttribute("hidden");
        modalHelp.classList.add("visible");
      });
    }
    if (closeHelp && modalHelp) {
      closeHelp.addEventListener("click", function () {
        modalHelp.setAttribute("hidden", "");
        modalHelp.classList.remove("visible");
      });
    }
    // Logout → go to landing
    var menuLogout = document.getElementById("menu-logout");
    if (menuLogout) {
      menuLogout.addEventListener("click", function () {
        close();
        showSection("landing");
      });
    }
  }

  // Popular routes from Chennai: fill From/To and focus search
  function initRouteChips() {
    document.querySelectorAll(".route-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var from = this.getAttribute("data-from");
        var to = this.getAttribute("data-to");
        var fromSelect = document.getElementById("from");
        var toSelect = document.getElementById("to");
        if (fromSelect && from) fromSelect.value = from;
        if (toSelect && to) toSelect.value = to;
      });
    });
  }

  const downloadBtn = document.getElementById("download-invoice");

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const bookingId = localStorage.getItem("booking_id");

      if (!bookingId || bookingId === "undefined") {
        alert("Booking not completed yet");
        return;
      }

      window.open(`http://127.0.0.1:8000/invoice/${bookingId}`, "_blank");
    });
  }

  const historyBtn = document.getElementById("menu-history");
  const modalHistory = document.getElementById("modal-history");
  const closeHistory = document.getElementById("close-history");
  const historyDetails = document.getElementById("history-details");

  if (historyBtn && modalHistory && historyDetails) {
    historyBtn.addEventListener("click", () => {
      const lastBooking = JSON.parse(localStorage.getItem("lastBooking"));
      if (!lastBooking) {
        historyDetails.innerHTML = "<p>No previous booking found.</p>";
      } else {
        historyDetails.innerHTML = `
        <p><strong>From:</strong> ${lastBooking.from_city || lastBooking.from_}</p>
        <p><strong>To:</strong> ${lastBooking.to_city || lastBooking.to_}</p>
        <p><strong>Train:</strong> ${lastBooking.selectedTrain?.train_name || lastBooking.train_no}</p>
        <p><strong>Seats:</strong> ${lastBooking.numSeats || lastBooking.total_seats}</p>
        <p><strong>Amount:</strong> ₹${lastBooking.totalAmount || lastBooking.total_price}</p>
      `;
      }
      modalHistory.removeAttribute("hidden");
      modalHistory.classList.add("visible");
    });
  }

  if (closeHistory && modalHistory) {
    closeHistory.addEventListener("click", () => {
      modalHistory.setAttribute("hidden", "");
      modalHistory.classList.remove("visible");
    });
  }




  initHamburger();
  initRouteChips();
  initCities();
  initTabs();
  initLogin();
  initRegister();
  initBooking();
  initSeats();
  initPayment();
  initHistoryButton();
  updateGlobalBack("splash");
  updateHamburger("splash");
})();