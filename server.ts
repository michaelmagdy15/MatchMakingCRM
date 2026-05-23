import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we are running from within dist or project root
const isDistDir = path.basename(__dirname) === "dist";
const rootPath = isDistDir ? path.join(__dirname, "..") : __dirname;
const distPath = isDistDir ? __dirname : path.join(__dirname, "dist");

// Load environment variables from the project's .env file (fallback to project root)
dotenv.config({ path: path.join(rootPath, ".env") });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Security headers for Firebase Auth popups
  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
  });

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Determine if we are running in production mode
  const isProduction = isDistDir || process.env.NODE_ENV === "production" || fs.existsSync(path.join(distPath, "index.html"));

  if (!isProduction) {
    const vite = await createViteServer({
      root: rootPath,
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const htmlPath = path.join(distPath, "index.html");
      if (fs.existsSync(htmlPath)) {
        let html = fs.readFileSync(htmlPath, "utf8");
        const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
        
        // Dynamically inject variables into the script block
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
