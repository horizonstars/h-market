const { getFilesStore, verifyAdmin } = require("./_shared");

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return jsonErr(405, "Faqat GET qo'llab-quvvatlanadi");
  }

  const params = event.queryStringParameters || {};
  const key = params.key;

  if (!key) {
    return jsonErr(400, "key parametri kerak");
  }

  try {
    const ctx = {
      siteID: process.env.SITE_ID || context.clientContext?.custom?.netlify?.site_id,
      token: process.env.NETLIFY_BLOBS_TOKEN || context.clientContext?.identity?.token,
    };

    const store = getFilesStore(ctx);
    const blob = await store.getWithMetadata(key, { type: "arrayBuffer" });

    if (!blob || blob.data === null) {
      return jsonErr(404, "Fayl topilmadi");
    }

    const mimeType = blob.metadata?.mimeType || "application/octet-stream";
    const originalName = blob.metadata?.originalName || key.split("/").pop() || "download";

    const isDownload = params.download === "1";
    const disposition = isDownload
      ? `attachment; filename="${originalName}"`
      : `inline; filename="${originalName}"`;

    const buffer = Buffer.from(blob.data);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": disposition,
        "Content-Length": buffer.length.toString(),
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("File serve error:", err);
    return jsonErr(500, "Fayl ochishda xato: " + err.message);
  }
};

function jsonErr(status, message) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ message }),
  };
}
