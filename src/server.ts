import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config.js";
import { pool } from "./db/client.js";
import { exportRouter } from "./routes/export.js";
import { syncRouter } from "./routes/sync.js";

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");

app.use(express.static(publicDir));

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use("/sync", syncRouter);
app.use("/export", exportRouter);

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({
    error: error.message,
  });
});

app.listen(env.PORT, () => {
  console.log(`Hostaway collector listening on port ${env.PORT}`);
});
