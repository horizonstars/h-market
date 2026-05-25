// ===== H Market App.js =====

const API = "/.netlify/functions";

// ===== UTILITIES =====
function toast(msg, type = "info") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  el.innerHTML = `<span>${icons[type] || "ℹ️"}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.3s";
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

function renderStars(rating) {
  const r = Math.round(rating * 2) / 2;
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= r) stars += "★";
    else if (i - 0.5 === r) stars += "★";
    else stars += "☆";
  }
  return stars;
}

function getCategoryIcon(cat) {
  const icons = {
    Ilovalar: "📱",
    Saytlar: "🌐",
    Kitoblar: "📚",
    Jurnallar: "📰",
  };
  return icons[cat] || "📦";
}

function getCategoryPlaceholder(cat) {
  return getCategoryIcon(cat);
}

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    if (!text || text.trim() === "") {
      return { ok: false, status: res.status, data: { message: "Server bo'sh javob qaytardi" } };
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: "Server JSON emas javob qaytardi: " + text.substring(0, 100) };
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { message: "Tarmoq xatosi: " + err.message } };
  }
}

// ===== PRODUCT RENDERING =====
function renderProductCard(product) {
  const icon = getCategoryIcon(product.category);
  const imgHtml = product.imageKey
    ? `<img src="${API}/file?key=${encodeURIComponent(product.imageKey)}" alt="${product.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\"product-cover-placeholder\\">${icon}</div>'">`
    : `<div class="product-cover-placeholder">${icon}</div>`;

  return `
    <a class="product-card" href="/product/${product.slug}" data-id="${product.id}">
      <div class="product-cover">${imgHtml}</div>
      <div class="product-body">
        <span class="product-category-badge">${icon} ${product.category}</span>
        <div class="product-name">${product.name}</div>
        <div class="product-desc">${product.description || "Tavsif yo'q"}</div>
      </div>
      <div class="product-footer">
        <div class="product-rating">
          <span class="stars">${renderStars(product.rating || 0)}</span>
          <span>${(product.rating || 0).toFixed(1)}</span>
        </div>
        <span class="product-dl-btn">⬇ Yuklab olish</span>
      </div>
    </a>
  `;
}

function renderSkeletons(count = 8) {
  return Array(count)
    .fill(0)
    .map(
      () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line short"></div>
    </div>
  `
    )
    .join("");
}

// ===== HOME PAGE =====
async function initHomePage() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  updateActiveCatTab();

  if (grid) grid.innerHTML = renderSkeletons();

  const params = new URLSearchParams(window.location.search);
  const category = params.get("category") || "";
  const search = params.get("search") || "";

  let url = `${API}/products`;
  const q = new URLSearchParams();
  if (category) q.set("category", category);
  if (search) q.set("search", search);
  if (q.toString()) url += "?" + q.toString();

  const { ok, data } = await safeFetch(url);
  const products = ok && Array.isArray(data) ? data : Array.isArray(data) ? data : [];

  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1">
        <div class="empty-icon">📦</div>
        <div class="empty-title">Mahsulotlar topilmadi</div>
        <div class="empty-text">Hozircha bu kategoriyada mahsulot yo'q. Admin panel orqali qo'shing.</div>
      </div>`;
    return;
  }

  grid.innerHTML = products.map(renderProductCard).join("");

  // Update category counts
  updateCategoryCounts(products, category);
}

function updateActiveCatTab() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("category") || "";
  document.querySelectorAll(".cat-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.cat === cat);
  });
}

function updateCategoryCounts(products, activeCat) {
  document.querySelectorAll(".cat-card-count").forEach((el) => {
    const catName = el.dataset.cat;
    if (catName) {
      const count = products.filter((p) => p.category === catName).length;
      el.textContent = count + " ta mahsulot";
    }
  });
}

function setupSearch() {
  const inputs = document.querySelectorAll(".search-input");
  inputs.forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const q = input.value.trim();
        window.location.href = q ? `/?search=${encodeURIComponent(q)}` : "/";
      }
    });
  });

  const btns = document.querySelectorAll(".search-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.closest("form, .hero-search, .nav-search")?.querySelector("input");
      if (!input) return;
      const q = input.value.trim();
      window.location.href = q ? `/?search=${encodeURIComponent(q)}` : "/";
    });
  });

  // Pre-fill search
  const params = new URLSearchParams(window.location.search);
  const s = params.get("search");
  if (s) inputs.forEach((i) => (i.value = s));
}

function setupMobileMenu() {
  const btn = document.querySelector(".hamburger");
  const links = document.querySelector(".nav-links");
  if (!btn || !links) return;
  btn.addEventListener("click", () => links.classList.toggle("open"));
  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove("open");
    }
  });
}

// ===== PRODUCT DETAIL PAGE =====
async function initProductPage() {
  const container = document.getElementById("product-detail");
  if (!container) return;

  const slug = window.location.pathname.replace("/product/", "").replace(/\/$/, "");
  if (!slug) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><div class="empty-title">Noto'g'ri havola</div></div>`;
    return;
  }

  container.innerHTML = `<div style="text-align:center;padding:80px"><div class="spinner"></div><p style="color:var(--text-muted);margin-top:16px">Yuklanmoqda...</p></div>`;

  const { ok, data } = await safeFetch(`${API}/products?slug=${encodeURIComponent(slug)}`);

  if (!ok || !data || !data.name) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">😕</div>
        <div class="empty-title">Mahsulot topilmadi</div>
        <div class="empty-text">Ushbu mahsulot mavjud emas yoki o'chirilgan.</div>
        <a href="/" style="display:inline-block;margin-top:24px;background:var(--gradient);color:white;padding:12px 28px;border-radius:var(--radius-pill);text-decoration:none;font-weight:700">Bosh sahifaga qaytish</a>
      </div>`;
    return;
  }

  const p = data;
  const icon = getCategoryIcon(p.category);
  const imgHtml = p.imageKey
    ? `<img src="${API}/file?key=${encodeURIComponent(p.imageKey)}" alt="${p.name}" class="product-detail-img" onerror="this.outerHTML='<div class=\\"product-detail-placeholder\\">${icon}</div>'">`
    : `<div class="product-detail-placeholder">${icon}</div>`;

  const dlBtn = p.fileKey
    ? `<a href="${API}/file?key=${encodeURIComponent(p.fileKey)}&download=1" class="btn-download" download>⬇ Yuklab olish</a>`
    : `<button class="btn-download disabled" disabled title="Fayl mavjud emas">📁 Fayl yuklanmagan</button>`;

  document.title = `${p.name} — H Market`;

  container.innerHTML = `
    <div class="product-detail-grid">
      <div class="product-detail-cover">${imgHtml}</div>
      <div class="product-detail-info">
        <span class="product-category-badge" style="font-size:0.85rem;padding:6px 16px">${icon} ${p.category}</span>
        <h1 class="product-detail-title">${p.name}</h1>
        <div class="product-detail-rating">
          <span class="stars" style="font-size:1.2rem">${renderStars(p.rating || 0)}</span>
          <span style="font-weight:700;font-size:1rem">${(p.rating || 0).toFixed(1)} / 5.0</span>
        </div>
        <p class="product-detail-desc">${p.description || "Tavsif mavjud emas."}</p>
        <div class="product-detail-meta">
          <div class="meta-item"><span class="meta-label">Kategoriya</span><span class="meta-val">${p.category}</span></div>
          <div class="meta-item"><span class="meta-label">Qo'shilgan sana</span><span class="meta-val">${new Date(p.createdAt).toLocaleDateString("uz-UZ")}</span></div>
        </div>
        <div class="product-detail-actions">${dlBtn}</div>
      </div>
    </div>`;
}

// ===== PAGE INIT =====
document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupSearch();

  const page = document.body.dataset.page;
  if (page === "home") initHomePage();
  if (page === "product") initProductPage();
});
