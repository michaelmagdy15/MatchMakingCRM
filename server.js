// server.ts
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var isDistDir = path.basename(__dirname) === "dist";
var rootPath = isDistDir ? path.join(__dirname, "..") : __dirname;
var distPath = isDistDir ? __dirname : path.join(__dirname, "dist");
dotenv.config({ path: path.join(rootPath, ".env") });
async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
  });
  app.get("/api/env-check", (req, res) => {
    res.json({
      status: "ok",
      NODE_ENV: process.env.NODE_ENV || "not-set",
      has_VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
      has_VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
      has_SUPABASE_URL: !!process.env.SUPABASE_URL,
      has_SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY
    });
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  const isProduction = isDistDir || process.env.NODE_ENV === "production" || fs.existsSync(path.join(distPath, "index.html"));
  if (!isProduction) {
    const vite = await createViteServer({
      root: rootPath,
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const htmlPath = path.join(distPath, "index.html");
      if (fs.existsSync(htmlPath)) {
        let html = fs.readFileSync(htmlPath, "utf8");
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
        html = html.replace("__VITE_SUPABASE_URL__", supabaseUrl);
        html = html.replace("__VITE_SUPABASE_ANON_KEY__", supabaseAnonKey);
        res.send(html);
      } else {
        res.status(404).send("Not Found");
      }
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
