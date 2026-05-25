const API = "/.netlify/functions";

function toast(message, type = "info") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .25s ease";
    setTimeout(() => el.remove(), 260);
  }, 3600);
}

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { message: err.message } };
  }
}

function categoryAccent(category) {
  return {
    Ilovalar: "cat-green",
    Saytlar: "cat-blue",
    Kitoblar: "cat-purple",
    Jurnallar: "cat-orange",
  }[category] || "cat-blue";
}

function categoryIcon(category) {
  return {
    Ilovalar: "icon-grid",
    Saytlar: "icon-globe",
    Kitoblar: "icon-book",
    Jurnallar: "icon-doc",
  }[category] || "icon-grid";
}

function hLogoMarkup() {
  return `<span class="h-logo"><span></span></span>`;
}

function renderStars(rating = 0) {
  return `${Number(rating || 0).toFixed(1)} / 5`;
}

function fileUrlFor(product) {
  if (product.fileUrl) return product.fileUrl;
  if (product.fileKey) return `${API}/file?key=${encodeURIComponent(product.fileKey)}&download=1`;
  return "";
}

function renderProductCard(product) {
  const accent = categoryAccent(product.category);
  const icon = categoryIcon(product.category);
  const image = product.imageKey
    ? `<img src="${API}/file?key=${encodeURIComponent(product.imageKey)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.parentElement.innerHTML='${hLogoMarkup().replace(/'/g, "&apos;")}'">`
    : hLogoMarkup();

  const hasFile = Boolean(fileUrlFor(product));
  return `
    <a class="product-card" href="/product/${encodeURIComponent(product.slug)}">
      <div class="product-cover ${accent}">
        <div class="product-cover-placeholder">${image}</div>
      </div>
      <div class="product-body">
        <span class="product-category-badge">${escapeHtml(product.category || "Mahsulot")}</span>
        <div class="product-name">${escapeHtml(product.name || "Nomsiz mahsulot")}</div>
        <div class="product-desc">${escapeHtml(product.description || "Tavsif qo'shilmagan.")}</div>
      </div>
      <div class="product-footer">
        <div class="product-rating">${renderStars(product.rating)}</div>
        <span class="product-dl-btn">${hasFile ? "Yuklab olish" : "Ko'rish"}</span>
      </div>
    </a>`;
}

function renderLoading() {
  return `<div class="loading-state">Yuklanmoqda...</div>`;
}

function renderEmpty(text) {
  return `<div class="empty-state">${escapeHtml(text)}</div>`;
}

async function initHomePage() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;
  grid.innerHTML = renderLoading();
  updateActiveTabs();

  const params = new URLSearchParams(location.search);
  const category = params.get("category") || "";
  const search = params.get("search") || "";
  const q = new URLSearchParams();
  if (category) q.set("category", category);
  if (search) q.set("search", search);

  const { ok, data } = await safeFetch(`${API}/products${q.toString() ? `?${q}` : ""}`);
  const products = ok && Array.isArray(data) ? data : [];
  updateCounts(products);

  const title = document.getElementById("products-title");
  if (title) {
    if (category) title.textContent = category;
    if (search) title.textContent = `"${search}" natijalari`;
  }

  if (!products.length) {
    grid.innerHTML = renderEmpty("Hozircha mahsulot yo'q. Admin paneldan yangi mahsulot qo'shing.");
    return;
  }
  grid.innerHTML = products.slice().reverse().map(renderProductCard).join("");
}

async function initProductPage() {
  const container = document.getElementById("product-detail");
  if (!container) return;
  container.innerHTML = renderLoading();

  const slug = decodeURIComponent(location.pathname.replace("/product/", "").replace(/\/$/, ""));
  const { ok, data } = await safeFetch(`${API}/products?slug=${encodeURIComponent(slug)}`);
  if (!ok || !data || !data.name) {
    container.innerHTML = renderEmpty("Mahsulot topilmadi.");
    return;
  }

  const product = data;
  const accent = categoryAccent(product.category);
  const image = product.imageKey
    ? `<img src="${API}/file?key=${encodeURIComponent(product.imageKey)}" alt="${escapeHtml(product.name)}" class="product-detail-img">`
    : `<div class="product-detail-placeholder ${accent}">${hLogoMarkup()}</div>`;
  const downloadUrl = fileUrlFor(product);
  const fileSize = product.fileSizeMb ? `${product.fileSizeMb} MB gacha` : "Hajm ko'rsatilmagan";

  document.title = `${product.name} - H Market`;
  container.innerHTML = `
    <div class="product-detail-grid">
      <div class="product-detail-cover">${image}</div>
      <div>
        <span class="product-category-badge">${escapeHtml(product.category || "Mahsulot")}</span>
        <h1 class="product-detail-title">${escapeHtml(product.name)}</h1>
        <p class="product-detail-desc">${escapeHtml(product.description || "Tavsif qo'shilmagan.")}</p>
        <div class="product-detail-meta">
          <div class="meta-item"><span class="meta-label">Reyting</span><span class="meta-val">${renderStars(product.rating)}</span></div>
          <div class="meta-item"><span class="meta-label">Fayl hajmi</span><span class="meta-val">${escapeHtml(fileSize)}</span></div>
          <div class="meta-item"><span class="meta-label">Yuklash turi</span><span class="meta-val">${product.fileUrl ? "HTTPS havola" : "H Market storage"}</span></div>
        </div>
        ${
          downloadUrl
            ? `<button class="btn-download js-safe-download" type="button" data-url="${escapeAttr(downloadUrl)}" data-name="${escapeAttr(product.name)}">Xavfsiz yuklab olish</button>`
            : `<button class="btn-download disabled" type="button" disabled>Fayl qo'shilmagan</button>`
        }
      </div>
    </div>`;
}

function setupSearch() {
  const inputs = document.querySelectorAll(".search-input");
  inputs.forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const value = input.value.trim();
        location.href = value ? `/?search=${encodeURIComponent(value)}` : "/";
      }
    });
  });
  document.querySelectorAll(".search-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.closest(".hero-search")?.querySelector("input") || document.querySelector(".search-input");
      const value = input?.value.trim() || "";
      location.href = value ? `/?search=${encodeURIComponent(value)}` : "/";
    });
  });
}

function setupMobileMenu() {
  const button = document.getElementById("hamburger");
  const links = document.getElementById("nav-links");
  if (!button || !links) return;
  button.addEventListener("click", () => links.classList.toggle("open"));
}

function setupConsentPanel() {
  const panel = document.getElementById("consent-panel");
  if (!panel || localStorage.getItem("hm_consent_done") === "1") return;
  panel.hidden = false;

  document.getElementById("cookie-accept")?.addEventListener("click", () => {
    localStorage.setItem("hm_cookies", "accepted");
    localStorage.setItem("hm_consent_done", "1");
    panel.hidden = true;
    toast("Cookie ruxsati saqlandi", "success");
  });

  document.getElementById("notify-ask")?.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      toast("Bu brauzer bildirishnomani qo'llab-quvvatlamaydi", "error");
      return;
    }
    const result = await Notification.requestPermission();
    localStorage.setItem("hm_notifications", result);
    toast(result === "granted" ? "Bildirishnoma ruxsati berildi" : "Bildirishnoma rad etildi", result === "granted" ? "success" : "info");
  });

  document.getElementById("consent-close")?.addEventListener("click", () => {
    localStorage.setItem("hm_consent_done", "1");
    panel.hidden = true;
  });
}

function setupSafeDownloads() {
  const modal = document.getElementById("download-modal");
  const confirm = document.getElementById("download-confirm");
  const text = document.getElementById("download-text");
  const close = () => {
    if (modal) modal.hidden = true;
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".js-safe-download");
    if (!button) return;
    const url = button.dataset.url || "";
    if (!url) return;
    const isHttps = url.startsWith("https://") || url.startsWith("/.netlify/");
    if (!isHttps) {
      toast("Faqat xavfsiz HTTPS fayllarni yuklab olish mumkin", "error");
      return;
    }
    if (confirm && modal) {
      confirm.href = url;
      confirm.target = url.startsWith("http") ? "_blank" : "_self";
      if (text) text.textContent = `"${button.dataset.name || "Fayl"}" xavfsiz havola orqali ochiladi. 500 MB gacha katta fayllarda yuklash vaqt olishi mumkin.`;
      modal.hidden = false;
    }
  });

  document.getElementById("download-close")?.addEventListener("click", close);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
}

function updateActiveTabs() {
  const params = new URLSearchParams(location.search);
  const active = params.get("category") || "";
  document.querySelectorAll(".cat-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.cat === active);
  });
}

function updateCounts(products) {
  const all = Array.isArray(products) ? products : [];
  document.querySelectorAll("[data-count]").forEach((el) => {
    const category = el.dataset.count;
    el.textContent = `${all.filter((item) => item.category === category).length} ta`;
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value = "") {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupSearch();
  setupConsentPanel();
  setupSafeDownloads();

  if (document.body.dataset.page === "home") initHomePage();
  if (document.body.dataset.page === "product") initProductPage();
});
