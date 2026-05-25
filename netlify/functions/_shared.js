const { getStore } = require("@netlify/blobs");

const PRODUCTS_KEY = "products.json";
const FILES_STORE = "files";
const DATA_STORE = "data";

function getDataStore(context) {
  return getStore({ name: DATA_STORE, consistency: "strong", ...contextOpts(context) });
}

function getFilesStore(context) {
  return getStore({ name: FILES_STORE, consistency: "strong", ...contextOpts(context) });
}

function contextOpts(context) {
  if (context && context.siteID && context.token) {
    return { siteID: context.siteID, token: context.token };
  }
  return {};
}

async function getProducts(context) {
  try {
    const store = getDataStore(context);
    const data = await store.get(PRODUCTS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("getProducts error:", e.message);
    return [];
  }
}

async function saveProducts(products, context) {
  const store = getDataStore(context);
  await store.set(PRODUCTS_KEY, JSON.stringify(products));
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

function verifyAdmin(event) {
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  const auth = event.headers["authorization"] || event.headers["Authorization"] || "";
  const token = auth.replace("Bearer ", "").trim();
  return token === adminPass;
}

module.exports = {
  getDataStore,
  getFilesStore,
  getProducts,
  saveProducts,
  jsonResponse,
  slugify,
  verifyAdmin,
  FILES_STORE,
};
