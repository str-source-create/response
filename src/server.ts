import path from "node:path";
import express from "express";
import { config } from "./config";
import { syncRouter } from "./routes/sync";
import { exportRouter } from "./routes/export";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "hostaway-neon-sync" });
});

app.use("/sync", syncRouter);
app.use("/export", exportRouter);

const publicDir = path.resolve(process.cwd(), "src/public");
app.use(express.static(publicDir));
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ ok: false, error: err.message || "Internal server error" });
});

app.listen(config.PORT, () => {
  console.log(`hostaway-neon-sync running at http://localhost:${config.PORT}`);
});
