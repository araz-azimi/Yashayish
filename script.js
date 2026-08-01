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

  const data = Object.fromEntries(new FormData(event.target));
  const doctorName = bookingModal.dataset.doctor || "نامشخص";
  
  const reservations = JSON.parse(
    localStorage.getItem("yashayishReservations") || "[]"
  );

  reservations.push({
    ...data,
    doctor: doctorName,
    createdAt: new Date().toISOString()
  });

  localStorage.setItem(
    "yashayishReservations",
    JSON.stringify(reservations)
  );

  // ==========================================
  // ارسال اطلاعات به تلگرام
  // ==========================================
  const botToken = '8773033120:AAG8VClhmScLNwxUxCRamQG_pSYw_rk3dOg';
  const chatId = '1048228960';

  const telegramMessage = `🔔 رزرو وقت جدید در سایت یاشاییش:\n\n` +
                          `👨‍⚕️ درمانگر: ${doctorName}\n` +
                          `👤 نام کاربر: ${data.name || data.fullName || 'ثبت نشده'}\n` +
                          `📞 شماره تماس: ${data.phone || 'ثبت نشده'}\n` +
                          `📅 تاریخ انتخابی: ${data.date || 'ثبت نشده'}\n` +
                          `📝 توضیحات: ${data.details || data.message || 'ندارد'}`;

  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(telegramMessage)}`;

  fetch(telegramUrl)
    .then(response => {
      if (!response.ok) {
        console.error("خطا در ارسال پیام به تلگرام");
      }
    })
    .catch(error => {
      console.error("Telegram Error:", error);
    });
  // ==========================================

  event.target.reset();
  closeModals();
  showToast("درخواست رزرو ثبت شد؛ برای نهایی‌سازی با شما تماس می‌گیریم.");
});

function showToast(message) {
  toast.textContent = "✓ " + message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}
