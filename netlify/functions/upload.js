const { getFilesStore, jsonResponse, verifyAdmin } = require("./_shared");

const MAX_SIZE = 4 * 1024 * 1024; // 4MB

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, { ok: true });
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { message: "Faqat POST qo'llab-quvvatlanadi" });
  }

  if (!verifyAdmin(event)) {
    return jsonResponse(401, { message: "Ruxsat yo'q. Admin paroli xato." });
  }

  try {
    const ctx = {
      siteID: process.env.SITE_ID || context?.clientContext?.custom?.netlify?.site_id,
      token: process.env.NETLIFY_BLOBS_TOKEN || context?.clientContext?.identity?.token,
    };

    const params = event.queryStringParameters || {};
    const fileType = params.type || "file"; // "image" or "file"
    const fileName = params.name || "upload-" + Date.now();
    const mimeType = params.mime || "application/octet-stream";

    // Check encoding header from client
    const encoding = (event.headers["x-file-encoding"] || "").toLowerCase();

    let buffer;
    if (!event.body) {
      return jsonResponse(400, { message: "Fayl bo'sh" });
    }

    if (encoding === "base64" || event.isBase64Encoded) {
      // Client sent base64 string body
      try {
        buffer = Buffer.from(event.body, "base64");
      } catch (e) {
        return jsonResponse(400, { message: "Base64 decode xatosi: " + e.message });
      }
    } else {
      buffer = Buffer.from(event.body, "utf8");
    }

    if (buffer.length === 0) {
      return jsonResponse(400, { message: "Fayl bo'sh" });
    }

    if (buffer.length > MAX_SIZE) {
      return jsonResponse(413, {
        message: `Fayl hajmi ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Maksimal ruxsat: 4MB`,
      });
    }

    const store = getFilesStore(ctx);
    const key = `${fileType}/${Date.now()}-${slugifyFileName(fileName)}`;

    await store.set(key, buffer, {
      metadata: { mimeType, originalName: fileName },
    });

    return jsonResponse(200, {
      message: "Fayl yuklandi",
      key,
      url: `/.netlify/functions/file?key=${encodeURIComponent(key)}`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return jsonResponse(500, { message: "Yuklash xatosi: " + err.message });
  }
};

function slugifyFileName(name) {
  return name
    .toString()
    .replace(/\s+/g, "_")
    .replace(/[^\w\.\-]+/g, "")
    .substring(0, 100);
}
