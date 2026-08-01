const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const header = $("#header");
const nav = $("#nav");
const menu = $("#menu");
const authModal = $("#authModal");
const bookingModal = $("#bookingModal");
const toast = $("#toast");

const yearEl = $("#year");
if (yearEl) {
  yearEl.textContent = new Intl.DateTimeFormat("fa-IR", {
    year: "numeric"
  }).format(new Date());
}

if (header) {
  addEventListener("scroll", () => {
    header.classList.toggle("scrolled", scrollY > 20);
  });
}

if (menu && nav) {
  menu.addEventListener("click", () => {
    nav.classList.toggle("open");
    menu.textContent = nav.classList.contains("open") ? "×" : "☰";
  });
}

$$("a[href^='#']").forEach(link => {
  if (link.hasAttribute("data-auth")) return;
  
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = link.getAttribute("href");
    if (targetId === "#") return;
    
    const targetViewId = link.dataset.target;
    
    if (targetViewId) {
      $$(".page-view").forEach(view => view.classList.remove("active"));
      const targetView = $(`#${targetViewId}`);
      if (targetView) targetView.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    
    if (nav) nav.classList.remove("open");
    if (menu) menu.textContent = "☰";
  });
});

function openModal(modal) {
  if (!modal) return;
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
    if (nav) nav.classList.remove("open");
    if (menu) menu.textContent = "☰";
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
    const nameField = $("#nameField");
    const authName = $("#authName");
    const authTitle = $("#authTitle");
    const authSubmit = $("#authSubmit");

    if (nameField) nameField.hidden = !register;
    if (authName) authName.required = register;
    if (authTitle) authTitle.textContent = register ? "ثبت‌نام در یاشاییش" : "ورود به یاشاییش";
    if (authSubmit) authSubmit.textContent = register ? "ایجاد حساب کاربری" : "ورود به حساب";
  });
});

const authForm = $("#authForm");
if (authForm) {
  authForm.addEventListener("submit", event => {
    event.preventDefault();
    const phoneInput = $("#authPhone");
    if (!phoneInput) return;
    const phone = phoneInput.value.trim();

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
}

$$("[data-tab]").forEach(tab => {
  tab.addEventListener("click", () => {
    $$("[data-tab]").forEach(item => item.classList.remove("active"));
    $$("[data-panel]").forEach(panel => panel.classList.remove("active"));

    tab.classList.add("active");
    const panel = $(`[data-panel="${tab.dataset.tab}"]`);
    if (panel) panel.classList.add("active");
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
    const doctorSelected = $("#doctorSelected");
    if (doctorSelected) doctorSelected.textContent = button.dataset.book;
    if (bookingModal) bookingModal.dataset.doctor = button.dataset.book;
    openModal(bookingModal);
  });
});

const bookingForm = $("#bookingForm");
if (bookingForm) {
  bookingForm.addEventListener("submit", event => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const doctorName = bookingModal ? bookingModal.dataset.doctor || "نامشخص" : "نامشخص";
    
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
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = "✓ " + message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

const feedbackForm = $("#feedbackForm");
if (feedbackForm) {
  feedbackForm.addEventListener("submit", event => {
    event.preventDefault();

    const formData = new FormData(event.target);
    formData.append("form_type", "پیشنهاد و انتقاد");
    formData.append("access_key", "3a2da16a-b340-4801-8fc6-72bf7c74e5df");

    const data = Object.fromEntries(formData);

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
        showToast("پیام و پیشنهاد شما با موفقیت ارسال شد.");
        event.target.reset();
      } else {
        showToast("خطا در ارسال پیام، لطفاً دوباره تلاش کنید.");
      }
    })
    .catch(error => {
      console.error("Feedback Error:", error);
      showToast("خطا در ارتباط با سرور.");
    });
  });
}

// ====== بارگذاری خودکار مقالات وبلاگ ======
const blogContainer = document.getElementById("blogContainer");

if (blogContainer) {
  fetch("posts.json")
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then(posts => {
      blogContainer.innerHTML = "";
      
      posts.forEach(post => {
        let actionHtml = "";
        
        if (post.fileUrl && post.fileUrl.trim() !== "") {
          actionHtml = `
            <div class="download-box">
              <div>
                <strong>${post.fileName}</strong>
                <small>${post.fileMeta}</small>
              </div>
              <a href="${post.fileUrl}" download class="btn outline download-btn">دانلود فایل ↓</a>
            </div>
          `;
        } else {
          actionHtml = `<a href="#" class="read-more">ادامه مطلب ←</a>`;
        }

        const article = document.createElement("article");
        article.className = "blog-card";
        article.innerHTML = `
          <span class="blog-date">${post.date}</span>
          <h3>${post.title}</h3>
          <p class="blog-author">نویسنده: ${post.author}</p>
          <p class="blog-excerpt">${post.excerpt}</p>
          ${actionHtml}
        `;
        
        blogContainer.appendChild(article);
      });
    })
    .catch(error => {
      console.error("خطا در خواندن فایل مقالات:", error);
      blogContainer.innerHTML = "<p style='text-align:center; width:100%;'>در حال حاضر مقاله‌ای برای نمایش وجود ندارد.</p>";
    });
}
