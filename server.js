// server.js — جاهز للنشر على Vercel
import express from "express";
import fetch from "node-fetch"; // node-fetch v3 يستخدم import
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// ✅ مفتاح API خاص بك
const API_KEY = process.env.MY_API_KEY || "HSFDASIMSGFAYISGFDSYAUGSFDSYAGFDSYISHFGDISHGDUYDGDJSJKDGFHDKDSJUDGFJDKDJFHFIKDKDHFJDLDKFHFKKDGHSOSJWUYQRQRFAUSOCPDJDMCBDHSISHCGVDHJSDKDHFGEJUWYHWRTEUDKDBDHGFUIDEKDHCDGFHDKDKJDHFGFHDKJSKJDJFDLDK"; // ضع المفتاح في Vercel Environment Variables

// Middleware للتحقق من مفتاح API
function apiKeyMiddleware(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized: invalid API key" });
  }
  next();
}

// صحة السيرفر
app.get("/health", (req, res) => {
  res.json({ ok: true, pid: process.pid, envPort: process.env.PORT || null });
});

// الملفات الثابتة
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

// 🔥 Route للحصول على AccountName مع حماية مفتاح API
app.get("/player-info", apiKeyMiddleware, async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });

  const region = "me";
  const apiUrl = `https://shop2like-major-login.vercel.app/player-info?region=${region}&uid=${uid}`;

  try {
    const upstreamRes = await fetchWithTimeout(apiUrl);
    if (!upstreamRes.ok) throw new Error(`Upstream HTTP ${upstreamRes.status}`);

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
    return res.status(502).json({ error: "فشل الاتصال بالـ API", details: String(err) });
  }
});

// أخطاء غير متوقعة
process.on("uncaughtException", (err) => console.error("UNCAUGHT EXCEPTION:", err));
process.on("unhandledRejection", (reason) => console.error("UNHANDLED REJECTION:", reason));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} — pid=${process.pid}`);
});
