import dotenv from "dotenv";
dotenv.config({ override: true });
import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  processChatMessage,
  translateText,
  LANGUAGE_REGISTRY,
  generateNeuralTTS,
  transcribeAudio,
} from "./src/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = "0.0.0.0";

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Lightweight In-Memory Rate Limiter for Public Endpoints (60 requests/min per IP)
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitBucket>();

function apiRateLimiter(maxRequests = 60, windowMs = 60000) {
  return (req: Request, res: Response, next: () => void) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const key = String(ip);
    const now = Date.now();

    let bucket = rateLimitStore.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 1, resetAt: now + windowMs };
      rateLimitStore.set(key, bucket);
    } else {
      bucket.count += 1;
    }

    if (bucket.count > maxRequests) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "Too many requests. Please wait a moment before sending another message.",
        retryAfterSeconds: retryAfter,
      });
    }

    next();
  };
}

// Cleanup rate limiter every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (now > bucket.resetAt) rateLimitStore.delete(key);
  }
}, 300000);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health Check Endpoint for Cloud Run, Docker, and Monitoring Probes
app.get(["/health", "/api/health"], (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: "voxbridge-multilingual-core",
    memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  });
});

// Serve static assets from /static
const rootDir = process.cwd();
app.use("/static", express.static(path.join(rootDir, "static")));

// Serve public directory
app.use(express.static(path.join(rootDir, "public")));

// Home route
app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(rootDir, "public", "index.html"));
});

// Chat endpoint (with rate limiter and input validation)
app.post("/chat", apiRateLimiter(60, 60000), async (req: Request, res: Response) => {
  const userMessage = (req.body?.message || "").trim();
  const customerName = (req.body?.name || "").trim();
  const preferredLang = (req.body?.lang || "").trim();
  const contextLang = (req.body?.context_lang || req.body?.contextLang || "").trim();

  if (!userMessage) {
    return res.status(400).json({ error: "Empty message" });
  }

  if (userMessage.length > 4000) {
    return res.status(413).json({ error: "Message exceeds 4000 characters limit." });
  }

  try {
    const result = await processChatMessage(userMessage, customerName, preferredLang, contextLang);
    return res.json({
      reply: result.reply,
      translation: result.translation,
      language: result.language,
      lang_code: result.lang_code,
      detected_language: result.detected_language,
      intent: result.intent,
      sentiment: result.sentiment,
      suggestions: result.suggestions,
      latencyMs: result.latencyMs,
      cached: result.cached,
    });
  } catch (error) {
    console.error("Error during message processing in server.ts:", error);
    return res.status(500).json({
      error: "Something went wrong processing your message.",
    });
  }
});

// Translate endpoint (with rate limiter & bounds check)
app.post(["/translate", "/api/translate"], apiRateLimiter(80, 60000), async (req: Request, res: Response) => {
  const text = (req.body?.text || "").trim();
  const targetLang = (req.body?.targetLang || "en").trim();

  if (!text) {
    return res.status(400).json({ error: "Empty text to translate" });
  }

  if (text.length > 5000) {
    return res.status(413).json({ error: "Text exceeds 5000 characters limit." });
  }

  try {
    const result = await translateText(text, targetLang);
    return res.json(result);
  } catch (error) {
    console.error("Translation error:", error);
    return res.status(500).json({ error: "Translation failed" });
  }
});

// Supported languages endpoint
app.get("/languages", (_req: Request, res: Response) => {
  res.json({ languages: Object.values(LANGUAGE_REGISTRY) });
});

// Server-Side Text-To-Speech (TTS) Streaming Route
app.get(["/api/tts", "/tts"], async (req: Request, res: Response) => {
  const text = ((req.query?.text as string) || "").trim();
  const rawLang = ((req.query?.lang as string) || "en").trim().toLowerCase();
  const shortCode = rawLang.split("-")[0] || "en";
  const gender = ((req.query?.gender as string) || "female").trim().toLowerCase() as "female" | "male";

  if (!text) {
    return res.status(400).json({ error: "Missing text parameter" });
  }

  // Clean text and split/encode
  const clean = text.replace(/[*_#`~[\]]/g, " ").replace(/\s+/g, " ").trim();

  // Try high-fidelity neural TTS with Gemini 3.8 first
  try {
    const neuralBuffer = await generateNeuralTTS(clean, gender, rawLang);
    if (neuralBuffer) {
      res.set({
        "Content-Type": "audio/wav",
        "Content-Length": neuralBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400",
      });
      return res.send(neuralBuffer);
    }
  } catch (err) {
    console.error("Neural TTS failed, falling back to Translate:", err);
  }

  // Fallback to Google Translate TTS
  const encoded = encodeURIComponent(clean.substring(0, 200));
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${shortCode}&q=${encoded}`;

  try {
    const ttsResponse = await fetch(ttsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
    });

    if (!ttsResponse.ok) {
      return res.status(ttsResponse.status).send("TTS generation failed");
    }

    const arrayBuffer = await ttsResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=86400",
    });

    return res.send(buffer);
  } catch (error) {
    console.error("TTS fetch error:", error);
    return res.status(500).json({ error: "TTS audio streaming error" });
  }
});

// Server-Side Audio Transcription (Speech-To-Text) Route (with rate limiter & size guard)
app.post("/api/transcribe", apiRateLimiter(45, 60000), async (req: Request, res: Response) => {
  const { audio, mimeType } = req.body;

  if (!audio) {
    return res.status(400).json({ error: "Missing audio parameter (base64 string)" });
  }

  if (typeof audio === "string" && audio.length > 25 * 1024 * 1024) {
    return res.status(413).json({ error: "Audio payload exceeds maximum 20MB limit." });
  }

  try {
    const text = await transcribeAudio(audio, mimeType || "audio/webm");
    return res.json({ text: text || "" });
  } catch (err) {
    console.error("Transcription endpoint error:", err);
    return res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

// Company CRM & Analytics Session Store
interface CompanySessionRecord {
  id: string;
  customerName: string;
  timestamp: string;
  detectedLanguage: string;
  langCode: string;
  intent: string;
  sentiment: string;
  userMessage: string;
  botReply: string;
  englishTranslation: string;
  turns: number;
}

const companySessionsStore: CompanySessionRecord[] = [
  {
    id: "sess_demo_1",
    customerName: "Elena Rostova",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    detectedLanguage: "Russian",
    langCode: "ru-RU",
    intent: "API Integration",
    sentiment: "Positive",
    userMessage: "Здравствуйте! Как подключить VoxBridge к нашей CRM-системе?",
    botReply: "Здравствуйте, Elena! VoxBridge предоставляет вебхуки в реальном времени и REST API для интеграции с Salesforce, Zendesk и HubSpot.",
    englishTranslation: "Hello, Elena! VoxBridge provides real-time webhooks and REST APIs to sync directly into Salesforce, Zendesk, and HubSpot.",
    turns: 4,
  },
  {
    id: "sess_demo_2",
    customerName: "Carlos Mendez",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    detectedLanguage: "Spanish",
    langCode: "es-ES",
    intent: "Enterprise Pricing",
    sentiment: "Neutral",
    userMessage: "¿Cuál es el costo del servicio para atención en múltiples idiomas?",
    botReply: "¡Hola Carlos! Nuestros planes empresariales incluyen soporte multilingüe ilimitado en texto y voz con analíticas automáticas.",
    englishTranslation: "Hello Carlos! Our enterprise plans include unlimited multilingual voice and text support with automated business analytics.",
    turns: 3,
  },
  {
    id: "sess_demo_3",
    customerName: "Priya Sharma",
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    detectedLanguage: "Tamil",
    langCode: "ta-IN",
    intent: "Order Tracking",
    sentiment: "Urgent",
    userMessage: "என் ஆர்டர் நிலை என்ன? இன்னும் வரவில்லை.",
    botReply: "வணக்கம் Priya! உங்கள் ஆர்டர் விபரங்களை உடனடியாக சரிபார்த்து வாடிக்கையாளர் ஆதரவு குழுவிடம் சமர்ப்பிக்கிறேன்.",
    englishTranslation: "Hello Priya! I am verifying your order details immediately and submitting the request to our customer dispatch team.",
    turns: 5,
  }
];

// Record incoming interaction to company session store
function logCompanyInteraction(
  name: string,
  userMessage: string,
  result: {
    reply: string;
    translation: string;
    language: string;
    lang_code: string;
    intent: string;
    sentiment: string;
  }
) {
  const existing = companySessionsStore.find(
    (s) => s.customerName.toLowerCase() === (name || "Customer").toLowerCase()
  );

  if (existing) {
    existing.turns += 1;
    existing.userMessage = userMessage;
    existing.botReply = result.reply;
    existing.englishTranslation = result.translation;
    existing.detectedLanguage = result.language;
    existing.langCode = result.lang_code;
    existing.intent = result.intent;
    existing.sentiment = result.sentiment;
    existing.timestamp = new Date().toISOString();
  } else {
    companySessionsStore.unshift({
      id: "sess_" + Date.now(),
      customerName: name || "Customer",
      timestamp: new Date().toISOString(),
      detectedLanguage: result.language,
      langCode: result.lang_code,
      intent: result.intent,
      sentiment: result.sentiment,
      userMessage,
      botReply: result.reply,
      englishTranslation: result.translation,
      turns: 1,
    });
  }

  // Keep store capped at 200 records
  if (companySessionsStore.length > 200) {
    companySessionsStore.pop();
  }
}

// Update /chat route to log company interaction
app.post("/chat", async (req: Request, res: Response) => {
  const userMessage = (req.body?.message || "").trim();
  const customerName = (req.body?.name || "").trim();
  const preferredLang = (req.body?.lang || "").trim();

  if (!userMessage) {
    return res.status(400).json({ error: "Empty message" });
  }

  try {
    const result = await processChatMessage(userMessage, customerName, preferredLang);
    logCompanyInteraction(customerName, userMessage, result);

    return res.json({
      reply: result.reply,
      translation: result.translation,
      language: result.language,
      lang_code: result.lang_code,
      detected_language: result.detected_language,
      user_query_native: result.user_query_native || userMessage,
      intent: result.intent,
      sentiment: result.sentiment,
      suggestions: result.suggestions,
    });
  } catch (error) {
    console.error("Error during message processing:", error);
    return res.status(500).json({
      error: "Something went wrong processing your message.",
    });
  }
});

// Company API: GET /api/company/sessions
app.get("/api/company/sessions", (_req: Request, res: Response) => {
  res.json({
    total: companySessionsStore.length,
    sessions: companySessionsStore,
  });
});

// Company API: GET /api/company/stats
app.get("/api/company/stats", (_req: Request, res: Response) => {
  const languageCounts: Record<string, number> = {};
  const intentCounts: Record<string, number> = {};
  const sentimentCounts: Record<string, number> = {};
  let totalTurns = 0;

  companySessionsStore.forEach((s) => {
    languageCounts[s.detectedLanguage] = (languageCounts[s.detectedLanguage] || 0) + 1;
    intentCounts[s.intent] = (intentCounts[s.intent] || 0) + 1;
    sentimentCounts[s.sentiment] = (sentimentCounts[s.sentiment] || 0) + 1;
    totalTurns += s.turns;
  });

  res.json({
    totalSessions: companySessionsStore.length,
    totalTurns,
    avgTurnsPerSession: companySessionsStore.length ? (totalTurns / companySessionsStore.length).toFixed(1) : "0",
    languages: languageCounts,
    intents: intentCounts,
    sentiments: sentimentCounts,
  });
});

// Company API: GET /api/company/export.csv
app.get("/api/company/export.csv", (_req: Request, res: Response) => {
  let csv = "Customer Name,Timestamp,Detected Language,Lang Code,Intent,Sentiment,Turns,Customer Message,Bot Reply,English Translation\n";

  companySessionsStore.forEach((s) => {
    const escapeCsv = (str: string) => `"${(str || "").replace(/"/g, '""')}"`;
    csv += [
      escapeCsv(s.customerName),
      escapeCsv(s.timestamp),
      escapeCsv(s.detectedLanguage),
      escapeCsv(s.langCode),
      escapeCsv(s.intent),
      escapeCsv(s.sentiment),
      s.turns,
      escapeCsv(s.userMessage),
      escapeCsv(s.botReply),
      escapeCsv(s.englishTranslation),
    ].join(",") + "\n";
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="voxbridge_company_leads.csv"');
  res.send(csv);
});

// Company API: POST /api/company/webhook-test
app.post("/api/company/webhook-test", async (req: Request, res: Response) => {
  const webhookUrl = (req.body?.webhookUrl || "").trim();

  const samplePayload = {
    event: "voxbridge.interaction.completed",
    timestamp: new Date().toISOString(),
    company_id: "voxbridge-tenant-01",
    customer: {
      name: "Demo Customer",
      detected_language: "Spanish",
      lang_code: "es-ES",
      sentiment: "Positive",
      primary_intent: "Product Inquiry",
    },
    conversation: {
      transcript_original: "Hola, ¿tienen soporte para empresas internacionales?",
      transcript_english: "Hello, do you support international enterprise businesses?",
      bot_response_original: "¡Hola! Sí, VoxBridge está diseñado específicamente para atención global multilingüe.",
      bot_response_english: "Hello! Yes, VoxBridge is designed specifically for global multilingual customer care.",
    },
    integration: {
      crm_target: "Salesforce / Zendesk / HubSpot",
      status: "delivered",
    },
  };

  if (!webhookUrl) {
    return res.json({
      success: true,
      simulated: true,
      message: "Simulated webhook test dispatched successfully (No custom URL provided).",
      payload: samplePayload,
    });
  }

  try {
    const testRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "VoxBridge-Webhook/2.0" },
      body: JSON.stringify(samplePayload),
      signal: AbortSignal.timeout(5000),
    });

    return res.json({
      success: testRes.ok,
      status: testRes.status,
      message: testRes.ok ? "Live Webhook delivered successfully!" : `Webhook returned HTTP status ${testRes.status}`,
      payload: samplePayload,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      message: `Failed to reach webhook URL: ${err.message || "Network error"}`,
      payload: samplePayload,
    });
  }
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

if (process.env.VERCEL !== "1") {
  app.listen(PORT, HOST, () => {
    console.log(`VoxBridge server running at http://${HOST}:${PORT}`);
  });
}

export default app;
