import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import queueRoutes from "./routes/queueRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const requiredAuthConfig = ["ADMIN_USERNAME", "ADMIN_PASSWORD", "JWT_SECRET"];

for (const name of requiredAuthConfig) {
  if (!process.env[name]) {
    throw new Error(`${name} belum diatur. Periksa file backend/.env`);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET harus memiliki sedikitnya 32 karakter.");
}

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", message: "QueueEase API dan PostgreSQL terhubung." });
  } catch {
    res.status(500).json({ status: "error", message: "Database tidak dapat diakses." });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/queue", queueRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Terjadi kesalahan pada server." });
});

app.listen(PORT, () => {
  console.log(`QueueEase API berjalan di http://localhost:${PORT}`);
});
