// server.js — نسخة محسّنة للنشر على Vercel
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ========== إعداد CORS ==========
const allowedOrigin = process.env.ALLOWED_ORIGIN || "https://shop2like.vercel.app";
app.use(
  cors({
    origin: allowedOrigin,
  })
);

// ========== Rate Limiting ==========
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 دقيقة
  max: 50, // أقصى عدد طلبات لكل IP في الدقيقة
  message: { error: "تم تجاوز الحد المسموح من الطلبات. حاول لاحقاً." },
});
app.use(limiter);

// ========== API Key Middleware ==========
const API_KEY = process.env.API_KEY || "default_secret_key";
app.use((req, res, next) => {
  const clientKey = req.headers["x-api-key"];
  if (!clientKey || clientKey !== API_KEY) {
    return res.status(403).json({ error: "مفتاح API غير صالح أو مفقود" });
  }
  next();
});

// ========== إعدادات ==========
const PORT = process.env.PORT || 3000;

// صحة السيرفر
app.get("/health", (req, res) => {
  res.json({ ok: true, pid: process.pid, envPort: process.env.PORT || null });
});

// ملفات ثابتة
app.use(express.static(path.join(__dirname, "FF0001")));

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "FF0001", "FFH32", "FFH00.HTML"));
});

// fetch مع مهلة
async function fetchWithTimeout(url, opts = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return r;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// 🔥 Route للحصول على AccountName
app.get("/player-info", async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });

  const region = "me";
  const apiUrl = `https://shop2like-major-login.vercel.app/player-info?region=${region}&uid=${uid}`;

  try {
    const upstreamRes = await fetchWithTimeout(apiUrl);
    const data = await upstreamRes.json();

    const accountName =
      data?.AccountInfo?.AccountName ||
      data?.captainBasicInfo?.nickname ||
      null;

    return res.json({ uid, region, AccountName: accountName, raw: data });
  } catch (err) {
    console.error("[player-info] error:", err);
    if (err.name === "AbortError")
      return res.status(504).json({ error: "انتهت مهلة الاتصال" });
    return res
      .status(502)
      .json({ error: "فشل الاتصال بالـ API", details: String(err) });
  }
});

// أخطاء غير متوقعة
process.on("uncaughtException", (err) =>
  console.error("UNCAUGHT EXCEPTION:", err)
);
process.on("unhandledRejection", (reason) =>
  console.error("UNHANDLED REJECTION:", reason)
);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} — pid=${process.pid}`);
});
