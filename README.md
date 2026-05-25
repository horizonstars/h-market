# H Market — Deploy Yo'riqnomasi

## Loyiha haqida
H Market — Netlify Functions va Netlify Blobs asosida qurilgan mini Play Market.

---

## 🚀 Netlify'da Deploy Qilish

### 1-usul: Drag & Drop (Eng oson)

1. **Loyihani ZIP qiling:**
   ```
   h-market/ papkasini ZIP arxiviga aylantiring
   ```

2. **Netlify.com'ga kiring** → [netlify.com](https://netlify.com)

3. **"Add new site" → "Deploy manually"** tugmasini bosing

4. **ZIP faylni drag & drop qiling** yoki "Browse to upload" bosing

5. **Deploy tugadi!** ✅

---

### 2-usul: GitHub orqali (Tavsiya etiladi)

1. **GitHub repo yarating** va kodlarni push qiling:
   ```bash
   git init
   git add .
   git commit -m "H Market initial commit"
   git remote add origin https://github.com/USERNAME/h-market.git
   git push -u origin main
   ```

2. **Netlify.com'ga kiring** → "Add new site" → "Import an existing project"

3. **GitHub** tanlang → repo tanlang

4. **Build settings:**
   - Build command: (bo'sh qoldiring)
   - Publish directory: `.`
   - Functions directory: `netlify/functions`

5. **Deploy** bosing ✅

---

## ⚙️ Netlify sozlamalari

### Environment Variables (muhim!)

**Site settings → Environment variables** ga kiring va qo'shing:

| Variable | Value | Izoh |
|----------|-------|------|
| `ADMIN_PASSWORD` | `your_secret_password` | Admin panel paroli |

> Default parol: `admin123` — albatta o'zgartiring!

### Netlify Blobs
Netlify Blobs avtomatik ishlaydi — hech qanday qo'shimcha sozlama kerak emas.
Faqat Netlify Pro yoki Team rejimida deploy qilsangiz to'liq ishlaydi.
Free rejimda ham ishlaydi, lekin ba'zi limitlar bo'lishi mumkin.

---

## 📁 Fayl Tuzilmasi

```
h-market/
├── index.html          # Bosh sahifa
├── product.html        # Mahsulot detail sahifasi
├── admin.html          # Admin panel (faqat /admin orqali)
├── styles.css          # Barcha stillar
├── app.js              # Frontend JavaScript
├── package.json        # Node.js dependencies
├── netlify.toml        # Netlify konfiguratsiyasi
└── netlify/
    └── functions/
        ├── _shared.js  # Umumiy utility funksiyalar
        ├── products.js # Mahsulotlar CRUD API
        ├── upload.js   # Fayl yuklash API
        └── file.js     # Fayl ko'rsatish API
```

---

## 🌐 Sahifalar

| URL | Tavsif |
|-----|--------|
| `/` | Bosh sahifa |
| `/admin` | Admin panel (yashirin) |
| `/product/mahsulot-slug` | Mahsulot detail |
| `/.netlify/functions/products` | API — barcha mahsulotlar |
| `/.netlify/functions/upload` | API — fayl yuklash |
| `/.netlify/functions/file?key=...` | API — fayl ko'rsatish |

---

## 🔧 Local Test (ixtiyoriy)

```bash
# Dependencies o'rnating
npm install

# Netlify CLI o'rnating
npm install -g netlify-cli

# Netlify'ga login qiling
netlify login

# Local server ishga tushiring
netlify dev
```

---

## ❗ Muhim Eslatmalar

1. **Fayl limiti:** Netlify Functions 4MB gacha qabul qiladi (biz ham 4MB limit qo'ydik)
2. **Blobs:** Mahsulotlar va fayllar Netlify Blobs'da saqlanadi — sayt o'chirilsa ham saqlanadi
3. **Admin:** `/admin` URL'ini hech kimga bermang, faqat siz ishlating
4. **Parol:** `ADMIN_PASSWORD` env variable orqali o'zgartiring

---

## 🆘 Muammolar va Yechimlar

**"Unexpected end of JSON" xatosi:**
→ Barcha functions har doim JSON qaytaradi. Agar ko'rsangiz, Netlify Functions loglarini tekshiring.

**Fayl yuklanmayapti:**
→ Fayl 4MB dan kichik ekanligini tekshiring
→ Admin panelda aniq xato xabari chiqadi

**Admin panel ochilmayapti:**
→ `/admin` URL'ini to'g'ri kiriting
→ Netlify redirects ishlayotganini tekshiring (netlify.toml)

**Mahsulotlar ko'rinmayapti:**
→ Netlify Blobs ulangan-ulganmasligini tekshiring
→ Demo mahsulotlar fallback sifatida chiqadi

---

Muvaffaqiyatli deploy! 🎉
