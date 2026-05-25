const { getProducts, saveProducts, jsonResponse, slugify, verifyAdmin } = require("./_shared");

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, { ok: true });
  }

  const ctx = {
    siteID: process.env.SITE_ID || context.clientContext?.custom?.netlify?.site_id,
    token: process.env.NETLIFY_BLOBS_TOKEN || context.clientContext?.identity?.token,
  };

  // GET - list all products (with optional category/search filter)
  if (event.httpMethod === "GET") {
    try {
      const products = await getProducts(ctx);
      const params = event.queryStringParameters || {};
      let filtered = [...products];

      if (params.category) {
        filtered = filtered.filter(
          (p) => p.category && p.category.toLowerCase() === params.category.toLowerCase()
        );
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q))
        );
      }
      if (params.slug) {
        const found = products.find((p) => p.slug === params.slug);
        if (!found) return jsonResponse(404, { message: "Mahsulot topilmadi" });
        return jsonResponse(200, found);
      }

      return jsonResponse(200, filtered);
    } catch (err) {
      console.error("GET products error:", err);
      // Return demo products as fallback
      return jsonResponse(200, getDemoProducts());
    }
  }

  // POST - add product (admin only)
  if (event.httpMethod === "POST") {
    if (!verifyAdmin(event)) {
      return jsonResponse(401, { message: "Ruxsat yo'q. Admin paroli xato." });
    }
    try {
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return jsonResponse(400, { message: "JSON format xato" });
      }

      const { name, category, description, rating, imageKey, fileKey } = body;
      if (!name || !category) {
        return jsonResponse(400, { message: "Nom va kategoriya majburiy" });
      }

      const products = await getProducts(ctx);
      const slug = slugify(name) + "-" + Date.now();
      const product = {
        id: Date.now().toString(),
        slug,
        name,
        category,
        description: description || "",
        rating: parseFloat(rating) || 0,
        imageKey: imageKey || null,
        fileKey: fileKey || null,
        createdAt: new Date().toISOString(),
      };

      products.push(product);
      await saveProducts(products, ctx);
      return jsonResponse(201, { message: "Mahsulot qo'shildi", product });
    } catch (err) {
      console.error("POST products error:", err);
      return jsonResponse(500, { message: "Server xatosi: " + err.message });
    }
  }

  // DELETE - remove product (admin only)
  if (event.httpMethod === "DELETE") {
    if (!verifyAdmin(event)) {
      return jsonResponse(401, { message: "Ruxsat yo'q. Admin paroli xato." });
    }
    try {
      const params = event.queryStringParameters || {};
      const id = params.id;
      if (!id) return jsonResponse(400, { message: "id parametri kerak" });

      const products = await getProducts(ctx);
      const idx = products.findIndex((p) => p.id === id);
      if (idx === -1) return jsonResponse(404, { message: "Mahsulot topilmadi" });

      products.splice(idx, 1);
      await saveProducts(products, ctx);
      return jsonResponse(200, { message: "Mahsulot o'chirildi" });
    } catch (err) {
      console.error("DELETE products error:", err);
      return jsonResponse(500, { message: "Server xatosi: " + err.message });
    }
  }

  return jsonResponse(405, { message: "Method not allowed" });
};

function getDemoProducts() {
  return [
    {
      id: "demo1",
      slug: "demo-ilova",
      name: "Demo Ilova",
      category: "Ilovalar",
      description: "Bu demo mahsulot. Netlify Blobs ulangandan keyin haqiqiy mahsulotlar ko'rinadi.",
      rating: 4.5,
      imageKey: null,
      fileKey: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo2",
      slug: "demo-kitob",
      name: "Demo Kitob",
      category: "Kitoblar",
      description: "Demo kitob. Admin paneldan yangi mahsulotlar qo'shing.",
      rating: 4.0,
      imageKey: null,
      fileKey: null,
      createdAt: new Date().toISOString(),
    },
  ];
}
