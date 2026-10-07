import PDFDocument from "pdfkit";
import { Response } from "express";

export function generateProjectPdf(res: Response) {
  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
    info: {
      Title: "VoxBridge - System Architecture & Modules Specification",
      Author: "VoxBridge Engineering Team",
      Subject: "Project Modules and Technology Stack Documentation",
      Keywords: "VoxBridge, AI, Multilingual, Voice, Gemini, TypeScript, PDF",
    },
  });

  // Set Response Headers for PDF Download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="VoxBridge_System_Architecture_and_Modules.pdf"'
  );

  doc.pipe(res);

  // Styling Palette
  const PRIMARY_COLOR = "#2563eb"; // Royal Blue
  const DARK_TEXT = "#0f172a"; // Slate 900
  const MUTED_TEXT = "#475569"; // Slate 600
  const LIGHT_BG = "#f8fafc"; // Slate 50
  const BORDER_COLOR = "#cbd5e1"; // Slate 300

  // Header Banner
  doc
    .rect(0, 0, doc.page.width, 110)
    .fill(PRIMARY_COLOR);

  doc
    .fillColor("#ffffff")
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("VoxBridge AI Customer Care Platform", 50, 28);

  doc
    .fontSize(12)
    .font("Helvetica")
    .text("System Architecture, Project Modules, & Technology Specification", 50, 62);

  doc
    .fontSize(9)
    .text(`Document Version: 1.0.0 | Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 50, 82);

  doc.y = 130;

  // Function to add Section Headings
  const addSectionHeading = (title: string) => {
    if (doc.y > 680) doc.addPage();
    doc
      .fillColor(PRIMARY_COLOR)
      .fontSize(15)
      .font("Helvetica-Bold")
      .text(title, 50, doc.y);

    doc
      .moveTo(50, doc.y + 4)
      .lineTo(doc.page.width - 50, doc.y + 4)
      .strokeColor(PRIMARY_COLOR)
      .lineWidth(1.5)
      .stroke();

    doc.y += 12;
  };

  // 1. Executive Summary
  addSectionHeading("1. Executive Vision & Core Value Proposition");
  doc
    .fillColor(DARK_TEXT)
    .fontSize(10)
    .font("Helvetica")
    .text(
      "VoxBridge is an enterprise-grade AI customer care platform enabling seamless real-time text and voice communication in any language. Driven by Google Gemini multimodal intelligence, VoxBridge automatically detects spoken or written languages, renders authentic native scripts, and provides instant, conversational ChatGPT-grade customer support with localized neural speech synthesis.",
      50,
      doc.y,
      { width: doc.page.width - 100, align: "justify", lineGap: 3 }
    );

  doc.y += 15;

  // 2. Project Modules
  addSectionHeading("2. Key Functional Modules");

  const modules = [
    {
      title: "Module 1: Real-Time Universal Multilingual Chat Engine",
      points: [
        "Sub-second automatic language identification across 100+ global languages.",
        "ChatGPT-grade conversational intelligence powered by Gemini 3.5 Flash.",
        "Dual-View Interface: Displays authentic native script alongside instant English business translation.",
        "Automatic Transliteration Converter: Automatically converts Romanized/transliterated input (e.g. Hindi, Telugu, Tamil, Gujarati) into its authentic native script.",
      ],
    },
    {
      title: "Module 2: Single-Pass Multilingual Voice Architecture",
      points: [
        "Single-Pass Processing: Unified audio-to-text-to-reply pipeline returning responses in ~1.5s.",
        "Dual-Engine Acoustics: High-speed Web Speech API live streaming (0ms) with Studio MediaRecorder fallback.",
        "Regional Accent Preservation: Native vocal playback for Telugu, Malayalam, Tamil, Kannada, Hindi, Korean, Japanese, Arabic, Bengali, Spanish, French, German, etc.",
        "Persistent Gender Personas: Female (👩) and Male (👨) voice personas with pitch tuning and localStorage retention.",
        "Instant Audio Cancellation: Immediate 'Stop Audio' execution with zero voice switching.",
      ],
    },
    {
      title: "Module 3: Enterprise CRM & Support Ticket Management",
      points: [
        "Ticket Creation & Reference: Generates unique tracking IDs (#VB-XXXXX) with Priority Levels (Normal, High, Urgent).",
        "Filtering & Search: Real-time search by ID/keyword and status filtering (All, Open, In Review, Resolved).",
        "Ticket Actions: One-click status updates (Mark Resolved, Reopen), Copy Reference ID, and Deletion (🗑️ Delete & 🗑️ Clear All).",
        "Tier-2 Escalation: Automatic ticket logging and dispatch into Tier-2 customer support queues.",
      ],
    },
    {
      title: "Module 4: Business Analytics & Real-Time Audio Visualizer",
      points: [
        "HTML5 Canvas Visualizer: Live Web Audio API frequency visualizer displaying microphone activity.",
        "CRM Session Store: Server-side logging of customer interactions, language metrics, and sentiment analysis.",
        "Transcript Export: Instant export of chat logs and support tickets for business compliance.",
      ],
    },
  ];

  modules.forEach((mod) => {
    if (doc.y > 660) doc.addPage();

    doc
      .fillColor(DARK_TEXT)
      .fontSize(10.5)
      .font("Helvetica-Bold")
      .text(mod.title, 50, doc.y);

    doc.y += 4;

    mod.points.forEach((pt) => {
      if (doc.y > 720) doc.addPage();
      doc
        .fillColor(MUTED_TEXT)
        .fontSize(9)
        .font("Helvetica")
        .text(`• ${pt}`, 65, doc.y, { width: doc.page.width - 130, lineGap: 2 });
      doc.y += 2;
    });

    doc.y += 6;
  });

  // 3. Technologies & Tools Stack
  addSectionHeading("3. Technologies & Tools Breakdown");

  const techStack = [
    { category: "Backend Runtime & Framework", tech: "Node.js (v22), Express.js, TypeScript (v5.7), TSX" },
    { category: "AI Core & Multimodal Engine", tech: "Google Gemini SDK (@google/genai) — gemini-3.5-flash-lite, gemini-3.8-flash" },
    { category: "Audio Acoustics & Speech-To-Text", tech: "Gemini Multilingual Audio Acoustic Model & Groq Whisper Large v3" },
    { category: "Text-To-Speech (TTS) Engine", tech: "Hybrid TTS (Browser Web Speech API SpeechSynthesis + Google Neural TTS API)" },
    { category: "Frontend Interface & Styling", tech: "HTML5, Vanilla JavaScript (ES6+ Modules), CSS3 with Tailwind CSS" },
    { category: "Web Audio & Canvas", tech: "Web Audio API (AudioContext, AnalyserNode, Canvas Visualizer)" },
    { category: "PDF Documentation Engine", tech: "PDFKit (pdfkit)" },
    { category: "Data Storage & Caching", tech: "LocalStorage Session Caching & Express In-Memory CRM Store" },
  ];

  techStack.forEach((item) => {
    if (doc.y > 700) doc.addPage();

    // Box row
    doc
      .rect(50, doc.y, doc.page.width - 100, 22)
      .fillAndStroke(LIGHT_BG, BORDER_COLOR);

    doc
      .fillColor(DARK_TEXT)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(item.category + ":", 60, doc.y - 16, { width: 170 });

    doc
      .fillColor(PRIMARY_COLOR)
      .font("Helvetica")
      .text(item.tech, 235, doc.y - 16, { width: doc.page.width - 295 });

    doc.y += 4;
  });

  doc.y += 12;

  // 4. Global Language Matrix
  addSectionHeading("4. Supported Languages Matrix");
  doc
    .fillColor(MUTED_TEXT)
    .fontSize(9)
    .font("Helvetica")
    .text(
      "VoxBridge provides full native text and voice support for 100+ languages, including Korean (한국어), Telugu (తెలుగు), Tamil (தமிழ்), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Hindi (हिन्दी), Bengali (বাংলা), Gujarati (ગુજરાતી), Marathi (मराठी), Punjabi (ਪੰਜਾਬੀ), Urdu (اردو), Japanese (日本語), Mandarin Chinese (中文), Arabic (العربية), Russian (Русский), Spanish (Español), French (Français), German (Deutsch), Italian (Italiano), Portuguese (Português), Turkish (Türkçe), Vietnamese (Tiếng Việt), Thai (ไทย), Indonesian, Swahili, English, and 75+ more.",
      50,
      doc.y,
      { width: doc.page.width - 100, align: "justify", lineGap: 3 }
    );

  // Footer
  doc.y += 20;
  doc
    .fontSize(8)
    .fillColor(MUTED_TEXT)
    .text(
      "VoxBridge System Architecture & Modules Specification | Confidential & Proprietary Document",
      50,
      doc.y,
      { align: "center", width: doc.page.width - 100 }
    );

  doc.end();
}
