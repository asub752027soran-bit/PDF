var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var app = (0, import_express.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(import_express.default.json({ limit: "100mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "100mb" }));
var TEMP_DIR = import_path.default.join(process.cwd(), "tmp_uploads");
if (!import_fs.default.existsSync(TEMP_DIR)) {
  import_fs.default.mkdirSync(TEMP_DIR, { recursive: true });
}
var CLEANUP_INTERVAL = 10 * 60 * 1e3;
setInterval(() => {
  try {
    const now = Date.now();
    const files = import_fs.default.readdirSync(TEMP_DIR);
    for (const file of files) {
      const filePath = import_path.default.join(TEMP_DIR, file);
      const stats = import_fs.default.statSync(filePath);
      if (now - stats.mtimeMs > 15 * 60 * 1e3) {
        import_fs.default.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.error("Error in temp file cleanup:", err);
  }
}, CLEANUP_INTERVAL);
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "DocuShift",
    version: "1.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    privacyNotice: "Uploaded temporary processing files are purged automatically within 15 minutes."
  });
});
app.get("/robots.txt", (_req, res) => {
  res.type("text/plain");
  res.send(
    `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${process.env.APP_URL || `http://localhost:${PORT}`}/sitemap.xml`
  );
});
app.get("/sitemap.xml", (_req, res) => {
  res.type("application/xml");
  const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  const tools = [
    "edit-pdf",
    "merge-pdf",
    "split-pdf",
    "compress-pdf",
    "rotate-pdf",
    "watermark-pdf",
    "lock-pdf",
    "unlock-pdf",
    "pdf-to-word",
    "word-to-pdf",
    "pdf-to-excel",
    "excel-to-pdf",
    "pdf-to-image",
    "image-to-pdf",
    "image-converter",
    "image-compressor",
    "image-resizer",
    "ocr-reader",
    "universal-converter"
  ];
  const pages = ["", "about", "privacy", "terms", "disclaimer", "contact", "faq", "blog"];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  pages.forEach((p) => {
    xml += `  <url>
    <loc>${baseUrl}/${p}</loc>
    <changefreq>weekly</changefreq>
    <priority>${p === "" ? "1.0" : "0.8"}</priority>
  </url>
`;
  });
  tools.forEach((t) => {
    xml += `  <url>
    <loc>${baseUrl}/#tool/${t}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;
  });
  xml += `</urlset>`;
  res.send(xml);
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DocuShift server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
