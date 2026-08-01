const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const header = $("#header");
const nav = $("#nav");
const menu = $("#menu");
const authModal = $("#authModal");
const bookingModal = $("#bookingModal");
const toast = $("#toast");

$("#year").textContent = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric"
}).format(new Date());

addEventListener("scroll", () => {
  header.classList.toggle("scrolled", scrollY > 20);
});

menu.addEventListener("click", () => {
  nav.classList.toggle("open");
  menu.textContent = nav.classList.contains("open") ? "×" : "☰";
});

$$("a[href^='#']").forEach(link => {
  if (link.hasAttribute("data-auth")) return;
  
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = link.getAttribute("href");
    if (targetId === "#") return;
    
    const targetViewId = link.dataset.target;
    
    if (targetViewId) {
      $$(".page-view").forEach(view => view.classList.remove("active"));
      $(`#${targetViewId}`).classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    
    nav.classList.remove("open");
    menu.textContent = "☰";
  });
});

function openModal(modal) {
  modal.classList.add("open");
  document.body.classList.add("lock");
}

function closeModals() {
  $$(".modal").forEach(modal => modal.classList.remove("open"));
  document.body.classList.remove("lock");
}

$$("[data-close]").forEach(button => {
  button.addEventListener("click", closeModals);
});

$$(".modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModals();
  });
});

addEventListener("keydown", event => {
  if (event.key === "Escape") closeModals();
});

$$("[data-auth]").forEach(button => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(authModal);
    nav.classList.remove("open");
    menu.textContent = "☰";
  });
});

let authMode = "login";

$$("[data-auth-tab]").forEach(tab => {
  tab.addEventListener("click", () => {
    authMode = tab.dataset.authTab;

    $$("[data-auth-tab]").forEach(item => {
      item.classList.toggle("active", item === tab);
    });

    const register = authMode === "register";
    $("#nameField").hidden = !register;
    $("#authName").required = register;
    $("#authTitle").textContent = register
      ? "ثبت‌نام در یاشاییش"
      : "ورود به یاشاییش";
    $("#authSubmit").textContent = register
      ? "ایجاد حساب کاربری"
      : "ورود به حساب";
  });
});

$("#authForm").addEventListener("submit", event => {
  event.preventDefault();
  const phone = $("#authPhone").value.trim();

  if (!/^۰?۹|^09/.test(phone)) {
    showToast("شماره موبایل واردشده را بررسی کنید.");
    return;
  }

  showToast(
    authMode === "register"
      ? "حساب کاربری شما ایجاد شد."
      : "ورود با موفقیت انجام شد."
  );

  event.target.reset();
  closeModals();
});

$$("[data-tab]").forEach(tab => {
  tab.addEventListener("click", () => {
    $$("[data-tab]").forEach(item => item.classList.remove("active"));
    $$("[data-panel]").forEach(panel => panel.classList.remove("active"));

    tab.classList.add("active");
    $(`[data-panel="${tab.dataset.tab}"]`).classList.add("active");
  });
});

function createPersianDates() {
  const select = $("#dates");
  if (!select) return;
  const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  for (let i = 1; i <= 21; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    if (date.getDay() === 5) continue;

    const option = document.createElement("option");
    option.value = date.toISOString().split("T")[0];
    option.textContent = formatter.format(date);
    select.appendChild(option);
  }
}

createPersianDates();

$$("[data-book]").forEach(button => {
  button.addEventListener("click", () => {
    $("#doctorSelected").textContent = button.dataset.book;
    bookingModal.dataset.doctor = button.dataset.book;
    openModal(bookingModal);
  });
});

$("#bookingForm").addEventListener("submit", event => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const doctorName = bookingModal.dataset.doctor || "نامشخص";
  
  formData.append("doctor", doctorName);
  formData.append("access_key", "3a2da16a-b340-4801-8fc6-72bf7c74e5df");

  const data = Object.fromEntries(formData);
  
  const reservations = JSON.parse(
    localStorage.getItem("yashayishReservations") || "[]"
  );

  reservations.push({
    ...data,
    createdAt: new Date().toISOString()
  });

  localStorage.setItem(
    "yashayishReservations",
    JSON.stringify(reservations)
  );

  fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(data)
  })
  .then(async (response) => {
    if (response.ok) {
      showToast("درخواست رزرو با موفقیت ثبت و ارسال شد.");
    } else {
      showToast("رزرو در حافظه ثبت شد، اما ارسال آنلاین با خطا روبرو شد.");
    }
  })
  .catch(error => {
    console.error("Submission Error:", error);
    showToast("درخواست رزرو ثبت شد.");
  });

  event.target.reset();
  closeModals();
});

function showToast(message) {
  toast.textContent = "✓ " + message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

